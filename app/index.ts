// ═══════════════════════════════════════════════════════════════════════
//  Public entry point
//  Host files (cli.ts, xterm.ts, wterm.ts) import exclusively from here.
//  Internal module structure is an implementation detail.
// ═══════════════════════════════════════════════════════════════════════

// TEA types
export type { Model, KeyEvent, Msg } from './model.ts';

// TEA functions
export { init }   from './init.ts';
export { update } from './update.ts';
export { view }   from './view.ts';

// Input parser
export { SGR_MOUSE_ENABLE, SGR_MOUSE, parseMsg } from './keys.ts';

// ANSI utilities (hosts may need these for terminal housekeeping)
export { showCursor, cls } from './ansi.ts';
