// ═══════════════════════════════════════════════════════════════════════
//  Layer 1 — ANSI helpers and layout constants
//  Pure string utilities; no dependency on xterm or the DOM.
// ═══════════════════════════════════════════════════════════════════════

import styles from 'ansi-styles';

// Cursor visibility — matches ansi-escapes cursorHide / cursorShow
const _ESC = '\u001B[';
export const hideCursor = _ESC + '?25l';
export const showCursor = _ESC + '?25h';

// Clear screen and home cursor — matches ansi-escapes clearViewport
export const cls = _ESC + '2J' + _ESC + 'H';

// Cursor positioning — matches ansi-escapes cursorTo(col-1, row-1)
export const goto = (row: number, col: number): string =>
  `${_ESC}${row};${col}H`;

// Text styling via ansi-styles
export const bold = (s: string): string => styles.bold.open + s + styles.bold.close;
export const rev  = (s: string): string => styles.inverse.open + s + styles.inverse.close;
export const fg   = (n: number, s: string): string => styles.color.ansi(n) + s + styles.color.close;

export const BOX_W      = 44;   // total box width including borders
export const BOX_H      = 11;   // rows occupied by the box
export const INPUT_W    = 20;   // visible width of each input field
export const LABEL_USER = '  Username: ';
export const LABEL_PASS = '  Password: ';
export const INNER      = BOX_W - 2;  // visible columns inside box borders

// SGR mouse protocol — not provided by ansi-escapes or ansi-styles
const ESC = '\x1b';
export const SGR_MOUSE_ENABLE  = `${ESC}[?1000h${ESC}[?1006h`;  // enable SGR mouse tracking (written to terminal on startup)
export const SGR_MOUSE_DISABLE = `${ESC}[?1006l${ESC}[?1000l`;  // disable SGR mouse tracking (written to terminal on exit)
export const SGR_MOUSE_RE      = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;  // regex matching incoming SGR mouse event sequences
