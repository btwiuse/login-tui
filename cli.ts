#!/usr/bin/env bun

// ═══════════════════════════════════════════════════════════════════════
//  Layer 3 — CLI host (Bun)
//  Replaces xterm.js with raw-mode stdin and process.stdout.
//  No TUI / rendering logic lives here.
// ═══════════════════════════════════════════════════════════════════════

import { showCursor, cls } from './ansi.ts';
import { LoginApp, type KeyEvent } from './app.ts';

function write(s: string): void {
  process.stdout.write(s);
}

function termSize(): { cols: number; rows: number } {
  return {
    cols: process.stdout.columns ?? 80,
    rows: process.stdout.rows    ?? 24,
  };
}

/** Parse a raw stdin chunk into a key string + KeyEvent, or null for unrecognised sequences. */
function parseKey(data: string): { key: string; event: KeyEvent } | null {
  const noop = (): void => {};
  const base = (): KeyEvent => ({
    key: '', shiftKey: false, ctrlKey: false, altKey: false, metaKey: false,
    preventDefault: noop,
  });

  // Ignore SGR mouse sequences — handled separately
  if (data.startsWith('\x1b[<')) return null;

  if (data === '\r' || data === '\n') return { key: '\r',   event: { ...base(), key: 'Enter' } };
  if (data === '\t')                  return { key: '\t',   event: { ...base(), key: 'Tab' } };
  if (data === '\x1b[Z')             return { key: data,   event: { ...base(), key: 'Tab', shiftKey: true } };
  if (data === '\x7f' || data === '\x08')
                                      return { key: '\x7f', event: { ...base(), key: 'Backspace' } };

  if (data === '\x1b[A') return { key: data, event: { ...base(), key: 'ArrowUp' } };
  if (data === '\x1b[B') return { key: data, event: { ...base(), key: 'ArrowDown' } };
  if (data === '\x1b[C') return { key: data, event: { ...base(), key: 'ArrowRight' } };
  if (data === '\x1b[D') return { key: data, event: { ...base(), key: 'ArrowLeft' } };

  // Printable character
  if (data.length === 1 && data >= ' ') {
    return { key: data, event: { ...base(), key: data } };
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
const app = new LoginApp(cols, rows);

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

write(app.init());

const SGR_MOUSE = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;

process.stdin.on('data', (chunk: string) => {
  // Ctrl+C / Ctrl+D → exit
  if (chunk === '\x03' || chunk === '\x04') exitClean();

  // SGR mouse press?
  const m = SGR_MOUSE.exec(chunk);
  if (m) {
    const btn = parseInt(m[1], 10), col = parseInt(m[2], 10), row = parseInt(m[3], 10);
    if (btn === 0 && m[4] === 'M') {
      const out = app.mousePress(row, col);
      if (out) write(out);
    }
    return;
  }

  const parsed = parseKey(chunk);
  if (!parsed) return;

  const out = app.key(parsed.key, parsed.event);
  if (out) write(out);
});

// Terminal resize
process.on('SIGWINCH', () => {
  const { cols, rows } = termSize();
  write(app.resize(cols, rows));
});

// Clean exit on SIGTERM
process.on('SIGTERM', () => exitClean());
