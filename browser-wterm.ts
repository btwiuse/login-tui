// ═══════════════════════════════════════════════════════════════════════
//  Layer 3 (wterm) — Terminal host
//  Sets up @wterm/dom, wires I/O events to LoginApp, writes output back.
//  No TUI / rendering logic lives here.
// ═══════════════════════════════════════════════════════════════════════

import '@wterm/dom/css';
import { WTerm } from '@wterm/dom';
import { LoginApp, type KeyEvent } from './app.ts';

const SGR_MOUSE = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;

/** Map a raw terminal input sequence to a { key, event } pair for LoginApp. */
function parseInput(data: string): { key: string; event: KeyEvent } | null {
  const base = {
    shiftKey: false, ctrlKey: false, altKey: false, metaKey: false,
    preventDefault() {},
  };

  switch (data) {
    case '\r':     return { key: '\r',        event: { ...base, key: 'Enter' } };
    case '\t':     return { key: '\t',        event: { ...base, key: 'Tab' } };
    case '\x1b[Z': return { key: '\t',        event: { ...base, key: 'Tab', shiftKey: true } };
    case '\x7f':   return { key: 'Backspace', event: { ...base, key: 'Backspace' } };
    case '\x1b[A': return { key: 'ArrowUp',   event: { ...base, key: 'ArrowUp' } };
    case '\x1b[B': return { key: 'ArrowDown', event: { ...base, key: 'ArrowDown' } };
    case '\x1b[C': return { key: 'ArrowRight', event: { ...base, key: 'ArrowRight' } };
    case '\x1b[D': return { key: 'ArrowLeft', event: { ...base, key: 'ArrowLeft' } };
  }

  // Printable character
  if (data.length === 1 && data >= ' ') {
    return { key: data, event: { ...base, key: data } };
  }

  return null;
}

let cols = 80;
let rows = 24;
let app: LoginApp | null = null;

const el = document.getElementById('terminal')!;

const term = new WTerm(el, {
  cursorBlink: true,
  autoResize: true,
  onData(data) {
    if (!app) return;

    // SGR mouse press: ESC [ < btn ; col ; row M
    const m = SGR_MOUSE.exec(data);
    if (m) {
      const btn = parseInt(m[1], 10), col = parseInt(m[2], 10), row = parseInt(m[3], 10);
      if (btn === 0 && m[4] === 'M') {
        const out = app.mousePress(row, col);
        if (out) term.write(out);
      }
      return;
    }

    // Keyboard input
    const parsed = parseInput(data);
    if (parsed) {
      const out = app.key(parsed.key, parsed.event);
      if (out) term.write(out);
    }
  },
  onResize(c, r) {
    cols = c;
    rows = r;
    if (app) term.write(app.resize(c, r));
  },
});

await term.init();

app = new LoginApp(cols, rows);
term.write(app.init());
