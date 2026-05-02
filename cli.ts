#!/usr/bin/env bun

// ═══════════════════════════════════════════════════════════════════════
//  Layer 3 — CLI host (Bun)
//  Drives the TEA loop: wires I/O events → update → view → stdout.
//  No TUI / rendering logic lives here.
// ═══════════════════════════════════════════════════════════════════════

import { showCursor, cls, init, update, view, type Msg, SGR_MOUSE_ENABLE, parseMsg } from './app/index.ts';

function write(s: string): void {
  process.stdout.write(s);
}

function termSize(): { cols: number; rows: number } {
  return {
    cols: process.stdout.columns ?? 80,
    rows: process.stdout.rows    ?? 24,
  };
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
