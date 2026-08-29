import { spawn, execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = 9229;
const ROOT = process.cwd();

function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const candidates = [
    "google-chrome-stable",
    "google-chrome",
    "chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ];
  for (const c of candidates) {
    try {
      execSync(`"${c}" --version`, { stdio: "ignore" });
      return c;
    } catch { /* try next */ }
  }
  throw new Error("No Chrome found. Set CHROME_BIN.");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(findChrome(), [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "chroma-smoke-"))}`,
  `file://${join(ROOT, "index.html")}`
], { stdio: "ignore" });

let ws;
async function connect() {
  for (let i = 0; i < 40; i++) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = tabs.find((t) => t.type === "page");
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
        return;
      }
    } catch { /* not ready yet */ }
    await sleep(500);
  }
  throw new Error("Chrome CDP never became available");
}

let id = 0;
const pending = new Map();
const exceptions = [];

function onMessage(e) {
  const msg = JSON.parse(e.data);
  if (msg.method === "Runtime.exceptionThrown") {
    exceptions.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  }
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
}

async function send(method, params = {}) {
  const mid = ++id;
  const promise = new Promise((res) => pending.set(mid, res));
  ws.send(JSON.stringify({ id: mid, method, params }));
  const out = await promise;
  if (out.error) throw new Error(out.error.message);
  return out.result;
}

async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}

function assert(cond, label) {
  if (!cond) {
    console.error(`FAIL: ${label}`);
    console.error("exceptions:", exceptions);
    chrome.kill();
    process.exit(1);
  }
  console.log(`ok: ${label}`);
}

try {
  await connect();
  ws.addEventListener("message", onMessage);
  await send("Runtime.enable");
  await sleep(800);

  assert(await evaluate(`!!document.getElementById('wheelCanvas')`), "wheel canvas exists");
  assert(await evaluate(`(() => {
    const cv = document.getElementById('wheelCanvas');
    const d = cv.getContext('2d').getImageData(cv.width / 2, 3, 1, 1).data;
    return d[0] > 200 && d[1] < 60 && d[2] < 60;
  })()`), "wheel painted (top pixel is red)");
  assert(await evaluate(`document.getElementById('harmRow').children.length >= 2`), "harmony cards render");
  assert(await evaluate(`document.getElementById('shadeRow').children.length === 7`), "7 shades render");
  assert(await evaluate(`document.getElementById('ratioVal').textContent.includes(': 1')`), "contrast ratio renders");
  assert(await evaluate(`document.getElementById('presetRow').children.length >= 6`), "presets render");
  assert(await evaluate(`(() => {
    const s = document.getElementById('harmMode');
    s.value = 'tetradic'; s.dispatchEvent(new Event('change'));
    const n = document.getElementById('harmRow').children.length;
    s.value = 'triadic'; s.dispatchEvent(new Event('change'));
    return n === 4;
  })()`), "harmony mode switch works");
  assert(await evaluate(`(() => {
    document.querySelector('.tabs button[data-mode="gradient"]').click();
    return [...document.querySelectorAll('.stop')].length >= 2;
  })()`), "gradient stops render");
  assert(await evaluate(`document.getElementById('cssCode').textContent.includes('gradient')`), "css output present");
  assert(await evaluate(`(() => {
    const t = document.getElementById('smoothToggle');
    const before = document.getElementById('cssCode').textContent.length;
    t.checked = true; t.dispatchEvent(new Event('change'));
    const after = document.getElementById('cssCode').textContent.length;
    t.checked = false; t.dispatchEvent(new Event('change'));
    return after > before;
  })()`), "OKLab smooth expands CSS output");

  await sleep(300);
  assert(exceptions.length === 0, "no page exceptions");

  console.log("SMOKE PASS");
  chrome.kill();
  process.exit(0);
} catch (err) {
  console.error("FAIL:", err.message);
  console.error("exceptions:", exceptions);
  chrome.kill();
  process.exit(1);
}
