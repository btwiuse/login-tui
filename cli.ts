#!/usr/bin/env bun

// ═══════════════════════════════════════════════════════════════════════
//  Layer 3 — CLI host (Bun)
//  Drives the TEA loop: wires I/O events → update → view → stdout.
//  No TUI / rendering logic lives here.
// ═══════════════════════════════════════════════════════════════════════

import { showCursor, cls, SGR_MOUSE_DISABLE, view, parseMsg, createAppStore } from './app/index.ts';

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
  write(SGR_MOUSE_DISABLE);          // disable mouse tracking
  write(showCursor);                 // ensure cursor is visible
  write(cls);                        // clear screen
  process.exit(code);
}

// ── Main ─────────────────────────────────────────────────────────────

const { cols, rows } = termSize();
const store = createAppStore(cols, rows);
const { dispatch } = store.getState();

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

write(view(store.getState().model, { enableMouse: true }));

// Re-render whenever the model changes
store.subscribe((state, prev) => {
  if (state.model !== prev.model) write(view(state.model));
});

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
