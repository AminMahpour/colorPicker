# Chroma — Color & Gradient Picker

A beautiful, dependency-free color and gradient picker that lives in a single HTML file. No build step, no frameworks, no network requests — just open it in a browser.

Try it live: see the GitHub Pages deployment below.

## Quick start

```bash
open index.html
```

or serve it statically:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Features

### Color tab
- **Color wheel** — hue around the circle (red at top), saturation from center to edge; keyboard-accessible (arrow keys, Shift for bigger steps)
- **Harmony modes** — complementary, analogous, split-complementary, tetradic, triadic, and monochromatic. The harmony is drawn on the wheel as a polygon + dots and as clickable color cards (click any card to adopt it)
- **Shades & tints** — 7 swatches mixing the current color toward white/black; click to adopt, copy all
- **Named color hint** — shows the nearest CSS color name (e.g. `≈ tomato`)
- **Value & alpha sliders** — the wheel dims to match the selected value (exact via `brightness()` filter)
- **Contrast checker** — WCAG ratio with AA / AA-Large / AAA pass-fail badges; pick text/background colors or set the background to the current color
- **Synced inputs** — HEX, RGB, and HSL fields stay in sync, alpha-aware (`#RRGGBBAA`, `rgba()`, `hsla()`)
- **Eyedropper** — native `EyeDropper` API on supported browsers (Chrome/Edge)
- **History & palettes** — copied colors are collected; save any harmony as a named palette (persisted)
- **Random color** — click, spacebar, or the button

### Gradient tab
- **Types** — linear, radial (circle/ellipse + position), conic
- **Angle dial** — drag directly on the preview, or use the slider
- **Multi-stop editor** — up to 8 stops: click the bar to add (color interpolated), drag to move, double-click to remove; per-stop color, hex, position, and alpha
- **Smooth (OKLab) interpolation** — perceptual stop blending to avoid muddy midtones, emitted as extra CSS stops
- **Presets** — six curated starting gradients
- **Exports** — copyable CSS, PNG download (canvas), SVG download

### Everywhere
- **Persistence** — state, history, palettes, and contrast setup survive reloads via `localStorage`
- **Shareable URLs** — 🔗 Share encodes the full app state in the URL hash
- **Keyboard shortcuts** — `1`/`2` switch tabs, `Space` picks a random color, `C` copies the hex
- **Design** — dark glassmorphism UI, ambient glow tracking the active color, fully responsive, touch-friendly (Pointer Events)
- **Zero dependencies** — plain HTML, CSS, and JavaScript in one file

## Project structure

```
colorPicker/
├── index.html              # the entire app (markup + styles + logic)
├── tests/smoke.mjs         # headless-Chrome smoke test over CDP
└── .github/workflows/
    ├── ci.yml              # syntax check + smoke test
    └── pages.yml           # deploy to GitHub Pages
```

## GitHub Pages

Every push to `main` deploys the app via the `Deploy Pages` workflow (static file, no build). The workflow auto-enables Pages on first run; to host on a custom domain, set it under Repo → Settings → Pages.

## Tech notes

- Vanilla JS in a single IIFE, no external code
- Color math: HSV ↔ RGB ↔ HEX ↔ HSL, OKLab (for smooth gradients), WCAG luminance, nearest CSS-named-color lookup
- The wheel is a canvas painted once at full value; value is applied with a GPU `brightness()` filter (exact for HSV)
- The harmony overlay is an SVG polygon + dots in percentage coordinates
- Gradient stops use pointer capture for smooth desktop + touch dragging
- CI runs `node --check` on the inline script plus `tests/smoke.mjs`, which drives a headless Chrome via the DevTools Protocol

## Testing

```bash
node tests/smoke.mjs
```

Requires Google Chrome or Chromium locally; CI uses the Chrome preinstalled on GitHub runners.
