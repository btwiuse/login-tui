// ═══════════════════════════════════════════════════════════════════════
//  Layer 3 (wterm) — Terminal host
//  Drives the TEA loop: wires I/O events → update → view → terminal.
//  No TUI / rendering logic lives here.
// ═══════════════════════════════════════════════════════════════════════

import '@wterm/dom/css';
import { WTerm } from '@wterm/dom';
import { init, update, view, type Msg, parseMsg } from './app/index.ts';

let cols = 80;
let rows = 24;
let model = init(cols, rows);
let dispatch: (msg: Msg) => void = () => {};

const el = document.getElementById('terminal')!;

const term = new WTerm(el, {
  cursorBlink: true,
  autoResize: true,
  onData(data) {
    const msg = parseMsg(data);
    if (msg) dispatch(msg);
  },
  onResize(c, r) {
    cols = c;
    rows = r;
    dispatch({ type: 'Resize', cols: c, rows: r });
  },
});

await term.init();

model = init(cols, rows);
term.write(view(model, { enableMouse: true }));

dispatch = (msg: Msg) => {
  const next = update(msg, model);
  if (next === model) return;
  model = next;
  term.write(view(model));
};
