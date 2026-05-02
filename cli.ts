#!/usr/bin/env bun

// ═══════════════════════════════════════════════════════════════════════
//  Layer 3 — CLI host (Bun)
//  Drives the TEA loop: wires I/O events → update → view → stdout.
//  No TUI / rendering logic lives here.
// ═══════════════════════════════════════════════════════════════════════

import { showCursor, cls } from './ansi.ts';
import { init, update, view, type Msg, type KeyEvent } from './app.ts';

const SGR_MOUSE_ENABLE = '\x1b[?1000h\x1b[?1006h';
const SGR_MOUSE        = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;

function write(s: string): void {
  process.stdout.write(s);
}

function termSize(): { cols: number; rows: number } {
  return {
    cols: process.stdout.columns ?? 80,
    rows: process.stdout.rows    ?? 24,
  };
}

/** Parse a raw stdin chunk into a Msg, or null for unrecognised sequences. */
function parseMsg(data: string): Msg | null {
  const noop = (): void => {};
  const base = (): KeyEvent => ({
    key: '', shiftKey: false, ctrlKey: false, altKey: false, metaKey: false,
    preventDefault: noop,
  });

  // SGR mouse sequences
  if (data.startsWith('\x1b[<')) {
    const m = SGR_MOUSE.exec(data);
    if (!m) return null;
    const btn = parseInt(m[1], 10), col = parseInt(m[2], 10), row = parseInt(m[3], 10);
    if (btn === 0 && m[4] === 'M') return { type: 'MousePress', row, col };
    return null;
  }

  if (data === '\r' || data === '\n') return { type: 'Key', key: '\r',   event: { ...base(), key: 'Enter' } };
  if (data === '\t')                  return { type: 'Key', key: '\t',   event: { ...base(), key: 'Tab' } };
  if (data === '\x1b[Z')             return { type: 'Key', key: data,   event: { ...base(), key: 'Tab', shiftKey: true } };
  if (data === '\x7f' || data === '\x08')
                                      return { type: 'Key', key: '\x7f', event: { ...base(), key: 'Backspace' } };

  if (data === '\x1b[A') return { type: 'Key', key: data, event: { ...base(), key: 'ArrowUp' } };
  if (data === '\x1b[B') return { type: 'Key', key: data, event: { ...base(), key: 'ArrowDown' } };
  if (data === '\x1b[C') return { type: 'Key', key: data, event: { ...base(), key: 'ArrowRight' } };
  if (data === '\x1b[D') return { type: 'Key', key: data, event: { ...base(), key: 'ArrowLeft' } };

  // Printable character
  if (data.length === 1 && data >= ' ') {
    return { type: 'Key', key: data, event: { ...base(), key: data } };
  }

  return null;
}

/** Restore terminal and exit cleanly. */
function exitClean(code = 0): never {
  write('\x1b[?1000l\x1b[?1006l');  // disable SGR mouse tracking
  write(showCursor);                 // ensure cursor is visible
  write(cls);                        // clear screen
  process.exit(code);
}

// ── Main ─────────────────────────────────────────────────────────────

const { cols, rows } = termSize();
let model = init(cols, rows);

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

write(SGR_MOUSE_ENABLE + view(model));

function dispatch(msg: Msg): void {
  const next = update(msg, model);
  if (next === model) return;
  model = next;
  write(view(model));
}

process.stdin.on('data', (chunk: string) => {
  // Ctrl+C / Ctrl+D → exit
  if (chunk === '\x03' || chunk === '\x04') exitClean();

  const msg = parseMsg(chunk);
  if (msg) dispatch(msg);
});

// Terminal resize
process.on('SIGWINCH', () => {
  const { cols, rows } = termSize();
  dispatch({ type: 'Resize', cols, rows });
});

// Clean exit on SIGTERM
process.on('SIGTERM', () => exitClean());
