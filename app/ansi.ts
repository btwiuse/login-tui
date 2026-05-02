// ═══════════════════════════════════════════════════════════════════════
//  Layer 1 — ANSI helpers and layout constants
//  Pure string utilities; no dependency on xterm or the DOM.
// ═══════════════════════════════════════════════════════════════════════

export const ESC        = '\x1b';
export const hideCursor = ESC + '[?25l';
export const showCursor = ESC + '[?25h';
export const goto = (row: number, col: number): string => `${ESC}[${row};${col}H`;
export const cls  = `${ESC}[2J${ESC}[H`;
export const bold = (s: string): string => `${ESC}[1m${s}${ESC}[0m`;
export const rev  = (s: string): string => `${ESC}[7m${s}${ESC}[0m`;
export const fg   = (n: number, s: string): string => `${ESC}[${n}m${s}${ESC}[0m`;

export const BOX_W      = 44;   // total box width including borders
export const BOX_H      = 11;   // rows occupied by the box
export const INPUT_W    = 20;   // visible width of each input field
export const LABEL_USER = '  Username: ';
export const LABEL_PASS = '  Password: ';
export const INNER      = BOX_W - 2;  // visible columns inside box borders

// SGR mouse protocol (both directions of the protocol live together here)
export const SGR_MOUSE_ENABLE  = `${ESC}[?1000h${ESC}[?1006h`;  // enable SGR mouse tracking (written to terminal on startup)
export const SGR_MOUSE_DISABLE = `${ESC}[?1000l${ESC}[?1006l`;  // disable SGR mouse tracking (written on teardown)
export const SGR_MOUSE_RE      = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;  // regex matching incoming SGR mouse event sequences
