// ═══════════════════════════════════════════════════════════════════════
//  Layer 3 — Terminal host
//  Sets up xterm.js, wires I/O events to LoginApp, writes output back.
//  No TUI / rendering logic lives here.
// ═══════════════════════════════════════════════════════════════════════

import "@xterm/xterm/css/xterm.css"
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { LoginApp } from './app.ts';

const term = new Terminal({
  cursorBlink: true,
  theme: { background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#d4d4d4' },
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal')!);
fitAddon.fit();

const app = new LoginApp(term.cols, term.rows);

// Startup: enable SGR mouse tracking + initial frame
term.write(app.init());

// SGR mouse press: ESC [ < btn ; col ; row M
const SGR_MOUSE = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;

term.onData(data => {
  const m = SGR_MOUSE.exec(data);
  if (!m) return;
  const btn = parseInt(m[1], 10), col = parseInt(m[2], 10), row = parseInt(m[3], 10);
  if (btn !== 0 || m[4] !== 'M') return;  // left-button press only
  const out = app.mousePress(row, col);
  if (out) term.write(out);
});

term.onKey(({ key, domEvent }) => {
  const out = app.key(key, domEvent);
  if (out) term.write(out);
});

// Debounced resize
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer!);
  resizeTimer = setTimeout(() => {
    fitAddon.fit();
    term.write(app.resize(term.cols, term.rows));
  }, 50);
});
