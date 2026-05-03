// ═══════════════════════════════════════════════════════════════════════
//  Layer 3 — Terminal host (xterm.js)
//  Drives the TEA loop: wires I/O events → update → view → terminal.
//  No TUI / rendering logic lives here.
// ═══════════════════════════════════════════════════════════════════════

import "@xterm/xterm/css/xterm.css"
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { parseMsg, createAppStore, LoginModel, SGR_MOUSE_ENABLE } from './app/index.ts';

const term = new Terminal({
  cursorBlink: true,
  theme: { background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#d4d4d4' },
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal')!);
fitAddon.fit();

const { store, dispatch } = createAppStore(LoginModel.create(term.cols, term.rows));

// Enable SGR mouse tracking, then render the first frame
term.write(SGR_MOUSE_ENABLE + store.getState().model.view());

// Re-render whenever the model changes
store.subscribe((state, prev) => {
  if (state.model !== prev.model) term.write(state.model.view());
});

// xterm.js delivers mouse events as raw SGR sequences through onData.
// parseMsg handles the SGR pattern and returns a MousePress Msg (or null).
// Keyboard events are handled separately via onKey which provides the full
// DOM event — no need to re-parse them from raw bytes here.
term.onData(data => {
  const msg = parseMsg(data);
  if (msg?.type === 'MousePress') dispatch(msg);
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
