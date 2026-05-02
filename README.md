# login-tui

A fully-interactive TUI login form written in TypeScript.  
Runs in **three modes** from the same core logic:

| Mode | Host | How to run |
|------|------|-----------|
| Browser (xterm.js) | xterm.js via `xterm.html` | `bun dev:xterm` |
| Browser (wterm) | @wterm/dom via `wterm.html` | `bun dev:wterm` |
| Terminal (CLI) | Bun raw-mode stdin | `bun dev:cli` |

---

## Architecture

The app is built on **The Elm Architecture (TEA)** and split into three layers so that all
rendering logic is completely decoupled from the runtime environment.

### The Elm Architecture

```mermaid
flowchart LR
    init["init(cols, rows)\n─────────────\nreturns the\ninitial Model"]
    Model(["Model\n─────────────\nplain data record\ndescribing the\nfull app state"])
    Msg(["Msg\n─────────────\ndiscriminated union\nof all possible\nevents"])
    update["update(msg, model)\n─────────────\nMsg × Model → Model\npure · same ref\nwhen unchanged"]
    view["view(model)\n─────────────\nModel → string\npure · returns\nfull ANSI frame"]
    terminal[/"terminal.write(frame)"/]

    init --> Model
    Msg  --> update
    Model --> update
    update --> |"Model'"| view
    view --> terminal
    terminal -.->|next event| Msg
```

| TEA concept | Implementation in `app/` |
|-------------|--------------------------|
| **Model**   | `app/model.ts` — `Model` interface, plain data record holding all app state |
| **Msg**     | `app/model.ts` — `Msg` discriminated union — `Resize \| MousePress \| Key` |
| **init**    | `app/init.ts` — `init(cols, rows): Model` — returns the initial model |
| **update**  | `app/update.ts` — `update(msg, model): Model` — pure function; returns the same reference when nothing changes |
| **view**    | `app/view.ts` — `view(model): string` — pure function that produces the full ANSI frame |

Each host file owns a tiny `dispatch` loop:

```ts
let model = init(cols, rows);
terminal.write(view(model, { enableMouse: true }));  // first frame enables mouse tracking

function dispatch(msg: Msg): void {
  const next = update(msg, model);
  if (next === model) return;   // nothing changed → skip re-render
  model = next;
  terminal.write(view(model));
}
```

### Layers

```mermaid
graph TD
    A["Layer 1 — app/ansi.ts\nPure ANSI escape-sequence helpers\nand layout constants.\nNo xterm / DOM / Bun dependency."]
    B["Layer 2 — app/model.ts · init.ts · update.ts · view.ts\nTEA core: Model / Msg / init / update / view.\nZero xterm / DOM / runtime dependency."]
    K["Layer 2 — app/keys.ts  (input parser)\nparseMsg.\nConverts raw byte sequences → Msg.\nShared by all terminal hosts."]
    IDX["app/index.ts\nPublic barrel entry point.\nHosts import everything from here."]
    C["Layer 3 — xterm.ts\nxterm.js host (xterm.html).\nOwns the TEA loop;\ntranslates xterm events → Msg."]
    D["Layer 3 — wterm.ts\n@wterm/dom host (wterm.html).\nOwns the TEA loop;\ntranslates wterm events → Msg."]
    E["Layer 3 — cli.ts\nBun raw-mode stdin host.\nOwns the TEA loop;\ntranslates stdin chunks → Msg."]

    A -->|imported by| B
    A -->|imported by| K
    B --> IDX
    K --> IDX
    IDX -->|browser xterm.js| C
    IDX -->|browser wterm| D
    IDX -->|CLI| E
```

### Files

| File | Purpose |
|------|---------|
| `app/ansi.ts` | ANSI escape helpers (`goto`, `cls`, `bold`, `rev`, `fg`, …) and box layout constants |
| `app/model.ts` | TEA types — `Model` (state record), `KeyEvent`, `Msg` (event union) |
| `app/init.ts` | TEA `init(cols, rows): Model` — returns the initial model |
| `app/update.ts` | TEA `update(msg, model): Model` — pure state transition; all input logic |
| `app/view.ts` | TEA `view(model): string` — pure ANSI frame renderer |
| `app/keys.ts` | Shared input parser — `parseMsg`; used by all hosts |
| `app/geom.ts` | Internal geometry helpers shared by `update` and `view` (not in public API) |
| `app/index.ts` | Public barrel entry point — hosts import everything from here |
| `xterm.ts` | xterm.js host; owns the TEA loop (served via `xterm.html`) |
| `wterm.ts` | @wterm/dom host; owns the TEA loop (served via `wterm.html`) |
| `cli.ts` | Bun raw-mode CLI host; owns the TEA loop |
| `xterm.html` | Entry point for the xterm.js browser mode |
| `wterm.html` | Entry point for the @wterm/dom browser mode |
| `package.json` | Dependencies and scripts |

---

## Usage

### Dev

```bash
bun xterm.html   # browser (xterm.js)
bun wterm.html   # browser (wterm)
bun cli.ts       # CLI (requires TTY; Ctrl-C / Ctrl-D to exit)
```

Open http://localhost:3000/ for browser modes.

### Build

```bash
bun build:xterm   # browser (xterm.js)
bun build:wterm   # browser (wterm)
bun build:cli     # standalone CLI
make build        # everything above
```

Outputs are written to `dist/` (HTML entry points, hashed JS/CSS assets, and the standalone `cli` binary).

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
