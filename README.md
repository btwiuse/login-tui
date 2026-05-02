# login-app

A fully-interactive TUI login form written in TypeScript.  
Runs in **two modes** from the same core logic:

| Mode | Host | How to run |
|------|------|-----------|
| Browser | xterm.js via `index.html` | `bun index.html` |
| Terminal (CLI) | Bun raw-mode stdin | `bun cli.ts` |

---

## Architecture

The code is split into three layers so that all rendering logic is completely
decoupled from the runtime environment:

```
┌─────────────────────────────────────────────────┐
│  Layer 1 — ansi.ts                              │
│  Pure ANSI escape-sequence helpers and layout   │
│  constants.  No xterm / DOM / Bun dependency.   │
└────────────────────┬────────────────────────────┘
                     │ imported by
┌────────────────────▼────────────────────────────┐
│  Layer 2 — app.ts  (LoginApp)                   │
│  Owns all TUI state and rendering logic.        │
│  Each public method returns an ANSI string      │
│  to write, or ''.  Zero xterm / DOM dependency. │
└──────────┬──────────────────────┬───────────────┘
           │ browser              │ CLI
┌──────────▼──────────┐  ┌───────▼───────────────┐
│  Layer 3 — browser.ts│  │  Layer 3 — cli.ts     │
│  xterm.js host.     │  │  Bun raw-mode stdin    │
│  Served by          │  │  host.  Translates     │
│  bun index.html.    │  │  stdin chunks into     │
│  Translates xterm   │  │  KeyEvents for         │
│  events for LoginApp│  │  LoginApp.             │
└─────────────────────┘  └───────────────────────┘
```

### Files

| File | Purpose |
|------|---------|
| `ansi.ts` | ANSI escape helpers (`goto`, `cls`, `bold`, `rev`, `fg`, …) and box layout constants |
| `app.ts` | `LoginApp` class — all state and rendering, runtime-agnostic |
| `browser.ts` | xterm.js host wired to `LoginApp` |
| `cli.ts` | Bun raw-mode CLI host wired to `LoginApp` |
| `index.html` | Single-file entry point for the browser mode; includes an importmap so xterm packages are loaded from CDN without `bun install` |
| `package.json` | Dev-time type declarations for `@xterm/xterm` and `@xterm/addon-fit` |

---

## Usage

### Browser mode

Requires [Bun](https://bun.sh) ≥ 1.0.

```bash
bun install
bun dev
# DEV  Bun v… ready — open http://localhost:3000/
```

Open <http://localhost:3000/> in any modern browser.  

### CLI mode

```bash
bun cli.ts
```

Requires a real TTY (raw mode).  Press **Ctrl-C** or **Ctrl-D** to exit.

---

## Controls

| Action | Keyboard | Mouse |
|--------|----------|-------|
| Move focus forward | `Tab` / `↓` | Click field or button |
| Move focus backward | `Shift-Tab` / `↑` | — |
| Type into field | Any printable key | — |
| Delete last character | `Backspace` | — |
| Confirm / activate | `Enter` | Click **Login** / **Cancel** |
| Reset after submit | `R` | — |
| Quit (CLI only) | `Ctrl-C` / `Ctrl-D` | — |

Focus order: **Username → Password → Login → Cancel** (wraps).

---

## Features

- Centered box that **reflows on terminal resize** (browser and CLI)
- **Password masking** — input echoed as `*`
- **SGR mouse tracking** — click to focus any field or button
- Inline **validation messages** (missing username / password)
- Success banner on login; press `R` to reset the form
- Pure ANSI rendering — no canvas, no DOM manipulation outside xterm
