// ═══════════════════════════════════════════════════════════════════════
//  Layer 3 — Terminal host (ghostty-web)
//  Drives the TEA loop: wires I/O events → update → view → terminal.
//  No TUI / rendering logic lives here.
// ═══════════════════════════════════════════════════════════════════════

import { init, Terminal, FitAddon } from 'ghostty-web';
import { view, parseMsg, createAppStore } from './app/index.ts';

await init();

const term = new Terminal({
  cursorBlink: true,
  theme: { background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#d4d4d4' },
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal')!);
fitAddon.fit();

const { store, dispatch } = createAppStore(term.cols, term.rows);

// Startup: enable SGR mouse tracking + initial frame
term.write(view(store.getState().model, { enableMouse: true }));

// Re-render whenever the model changes
store.subscribe((state, prev) => {
  if (state.model !== prev.model) term.write(view(state.model));
});

// ghostty-web delivers mouse events as raw SGR sequences through onData.
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
  if (resizeTimer !== null) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    fitAddon.fit();
    dispatch({ type: 'Resize', cols: term.cols, rows: term.rows });
  }, 50);
});
