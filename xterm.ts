// ═══════════════════════════════════════════════════════════════════════
//  Layer 3 — Terminal host (xterm.js)
//  Drives the TEA loop: wires I/O events → update → view → terminal.
//  No TUI / rendering logic lives here.
// ═══════════════════════════════════════════════════════════════════════

import "@xterm/xterm/css/xterm.css"
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { init, update, view, type Msg } from './app.ts';

const SGR_MOUSE_ENABLE = '\x1b[?1000h\x1b[?1006h';
const SGR_MOUSE        = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;

const term = new Terminal({
  cursorBlink: true,
  theme: { background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#d4d4d4' },
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal')!);
fitAddon.fit();

let model = init(term.cols, term.rows);

// Startup: enable SGR mouse tracking + initial frame
term.write(SGR_MOUSE_ENABLE + view(model));

function dispatch(msg: Msg): void {
  const next = update(msg, model);
  if (next === model) return;
  model = next;
  term.write(view(model));
}

// SGR mouse press: ESC [ < btn ; col ; row M
term.onData(data => {
  const m = SGR_MOUSE.exec(data);
  if (!m) return;
  const btn = parseInt(m[1], 10), col = parseInt(m[2], 10), row = parseInt(m[3], 10);
  if (btn !== 0 || m[4] !== 'M') return;  // left-button press only
  dispatch({ type: 'MousePress', row, col });
});

term.onKey(({ key, domEvent }) => {
  dispatch({ type: 'Key', key, event: domEvent });
});

// Debounced resize
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer!);
  resizeTimer = setTimeout(() => {
    fitAddon.fit();
    dispatch({ type: 'Resize', cols: term.cols, rows: term.rows });
  }, 50);
});
