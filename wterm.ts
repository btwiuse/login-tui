// ═══════════════════════════════════════════════════════════════════════
//  Layer 3 (wterm) — Terminal host
//  Drives the TEA loop: wires I/O events → update → view → terminal.
//  No TUI / rendering logic lives here.
// ═══════════════════════════════════════════════════════════════════════

import '@wterm/dom/css';
import { WTerm } from '@wterm/dom';
import { view, parseMsg, createAppStore } from './app/index.ts';

const { store, dispatch } = createAppStore(80, 24);

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

dispatch({ type: 'Resize', cols: term.cols, rows: term.rows });
term.write(view(store.getState().model, { enableMouse: true }));

// Re-render whenever the model changes
store.subscribe((state, prev) => {
  if (state.model !== prev.model) term.write(view(state.model));
});
