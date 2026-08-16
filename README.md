# Chroma — Color & Gradient Picker

A beautiful, dependency-free color and gradient picker that lives in a single HTML file. No build step, no frameworks, no network requests — just open it in a browser.

## Quick start

```bash
open index.html
```

or serve it statically:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Deep links: `index.html#color` and `index.html#gradient` open the respective tab.

## Features

### Color tab
- **Color wheel** — hue around the circle (red at top), saturation from center to edge, with a draggable knob
- **Triad overlay** — a live triangle + marker dots on the wheel showing the current color's triadic harmonies (h, h+120°, h+240°); fades out near zero saturation
- **Value & alpha sliders** — the wheel dims to match the selected value
- **Synced inputs** — HEX, RGB, and HSL fields are all editable and keep each other in sync (alpha-aware: `#RRGGBBAA`, `rgba()`, `hsla()`)
- **Copy buttons** — copy as HEX, RGB, HSL, or a ready-to-paste `background:` CSS declaration
- **Color triads** — the three triad colors as cards: click one to make it the new base color, or "Copy all" to copy the full set
- **History** — copied/saved colors are collected in a clickable strip (deduped, max 18)
- **Random color** button

### Gradient tab
- **Types** — linear, radial, and conic
- **Controls** — angle (linear/conic), shape circle/ellipse (radial), and position
- **Multi-stop editor** — up to 8 stops:
  - click the bar to add a stop (color interpolated between neighbors)
  - drag a stop to reposition
  - double-click a stop (or use the button) to remove
  - edit the selected stop's color, hex, and position
- **Generated CSS** — live `background: linear-gradient(...)` output with one-click copy

### Design
- Dark glassmorphism UI with an ambient background glow that tracks the active color
- Touch and mouse support via Pointer Events
- Fully responsive (desktop, tablet, mobile)
- Zero dependencies — plain HTML, CSS, and JavaScript in one file

## Project structure

```
colorPicker/
└── index.html   # the entire app (markup + styles + logic)
```

## Tech notes

- Vanilla JS, single IIFE, no external code
- Color math: HSV ↔ RGB ↔ HEX ↔ HSL conversions in pure JS
- The wheel is a canvas painted once at full value; the current value is applied with a CSS `brightness()` filter (exact for HSV, GPU-accelerated, no repaints)
- The triad triangle is an SVG overlay positioned in percentage coordinates
- Gradient stops use pointer capture for smooth dragging on both desktop and touch
