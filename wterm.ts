// ═══════════════════════════════════════════════════════════════════════
//  Layer 3 (wterm) — Terminal host
//  Drives the TEA loop: wires I/O events → update → view → terminal.
//  No TUI / rendering logic lives here.
// ═══════════════════════════════════════════════════════════════════════

import '@wterm/dom/css';
import { WTerm } from '@wterm/dom';
import { init, update, view, type Msg, type KeyEvent } from './app.ts';

const SGR_MOUSE_ENABLE = '\x1b[?1000h\x1b[?1006h';
const SGR_MOUSE        = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;

/** Map a raw terminal input sequence to a Msg for the TEA loop. */
function parseMsg(data: string): Msg | null {
  const base: Omit<KeyEvent, 'key'> = {
    shiftKey: false, ctrlKey: false, altKey: false, metaKey: false,
    preventDefault() {},
  };

  switch (data) {
    case '\r':     return { type: 'Key', key: '\r',        event: { ...base, key: 'Enter' } };
    case '\t':     return { type: 'Key', key: '\t',        event: { ...base, key: 'Tab' } };
    case '\x1b[Z': return { type: 'Key', key: '\t',        event: { ...base, key: 'Tab', shiftKey: true } };
    case '\x7f':   return { type: 'Key', key: 'Backspace', event: { ...base, key: 'Backspace' } };
    case '\x1b[A': return { type: 'Key', key: 'ArrowUp',   event: { ...base, key: 'ArrowUp' } };
    case '\x1b[B': return { type: 'Key', key: 'ArrowDown', event: { ...base, key: 'ArrowDown' } };
    case '\x1b[C': return { type: 'Key', key: 'ArrowRight', event: { ...base, key: 'ArrowRight' } };
    case '\x1b[D': return { type: 'Key', key: 'ArrowLeft', event: { ...base, key: 'ArrowLeft' } };
  }

  // Printable character
  if (data.length === 1 && data >= ' ') {
    return { type: 'Key', key: data, event: { ...base, key: data } };
  }

  const m = SGR_MOUSE.exec(data);
  if (m) {
    const button = parseInt(m[1], 10), col = parseInt(m[2], 10), row = parseInt(m[3], 10);
    if (button === 0 && m[4] === 'M') return { type: 'MousePress', row, col };
  }

  return null;
}

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
term.write(SGR_MOUSE_ENABLE + view(model));

dispatch = (msg: Msg) => {
  const next = update(msg, model);
  if (next === model) return;
  model = next;
  term.write(view(model));
};
