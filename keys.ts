// ═══════════════════════════════════════════════════════════════════════
//  Layer 2 — Raw input parser
//  Shared by all terminal hosts (cli, xterm, wterm).
//  Converts raw byte sequences into typed Msg values.
// ═══════════════════════════════════════════════════════════════════════

import { type Msg, type KeyEvent } from './app.ts';

export const SGR_MOUSE_ENABLE = '\x1b[?1000h\x1b[?1006h';
export const SGR_MOUSE        = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;

/** Parse a raw terminal input sequence into a Msg, or null for unrecognised sequences. */
export function parseMsg(data: string): Msg | null {
  const base: Omit<KeyEvent, 'key'> = {
    shiftKey: false, ctrlKey: false, altKey: false, metaKey: false,
    preventDefault() {},
  };

  switch (data) {
    case '\r':
    case '\n':     return { type: 'Key', key: data,   event: { ...base, key: 'Enter' } };
    case '\t':     return { type: 'Key', key: data,   event: { ...base, key: 'Tab' } };
    case '\x1b[Z': return { type: 'Key', key: data,   event: { ...base, key: 'Tab', shiftKey: true } };
    case '\x7f':
    case '\x08':   return { type: 'Key', key: data,   event: { ...base, key: 'Backspace' } };
    case '\x1b[A': return { type: 'Key', key: data,   event: { ...base, key: 'ArrowUp' } };
    case '\x1b[B': return { type: 'Key', key: data,   event: { ...base, key: 'ArrowDown' } };
    case '\x1b[C': return { type: 'Key', key: data,   event: { ...base, key: 'ArrowRight' } };
    case '\x1b[D': return { type: 'Key', key: data,   event: { ...base, key: 'ArrowLeft' } };
  }

  // Printable character
  if (data.length === 1 && data >= ' ') {
    return { type: 'Key', key: data, event: { ...base, key: data } };
  }

  // SGR mouse press: ESC [ < btn ; col ; row M
  const m = SGR_MOUSE.exec(data);
  if (m) {
    const btn = parseInt(m[1], 10), col = parseInt(m[2], 10), row = parseInt(m[3], 10);
    if (btn === 0 && m[4] === 'M') return { type: 'MousePress', row, col };
  }

  return null;
}
