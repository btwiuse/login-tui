// ═══════════════════════════════════════════════════════════════════════
//  Layer 3 (wterm) — Terminal host
//  Drives the TEA loop: wires I/O events → update → view → terminal.
//  No TUI / rendering logic lives here.
// ═══════════════════════════════════════════════════════════════════════

import '@wterm/dom/css';
import { WTerm } from '@wterm/dom';
import { parseMsg, createAppStore, LoginModel, SGR_MOUSE_ENABLE } from './app/index.ts';

const el = document.getElementById('terminal')!;

const term = new WTerm(el, {
  cursorBlink: true,
  autoResize: true,
  onData(data) {
    const msg = parseMsg(data);
    if (msg) dispatch(msg);
  },
  onResize(c, r) {
    dispatch({ type: 'Resize', cols: c, rows: r });
  },
});

await term.init();

const { store, dispatch } = createAppStore(LoginModel.create(term.cols, term.rows));

// Enable SGR mouse tracking, then render the first frame
term.write(SGR_MOUSE_ENABLE + store.getState().model.view());

// Re-render whenever the model changes
store.subscribe((state, prev) => {
  if (state.model !== prev.model) term.write(state.model.view());
});
