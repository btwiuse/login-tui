// ═══════════════════════════════════════════════════════════════════════
//  Public entry point
//  Host files (cli.ts, xterm.ts, wterm.ts) import exclusively from here.
//  Internal module structure is an implementation detail.
// ═══════════════════════════════════════════════════════════════════════

// TEA types
export type { Model, KeyEvent, Msg } from './model.ts';

// TEA functions
export { init }                    from './init.ts';
export { update }                  from './update.ts';
export { view, type ViewOptions }  from './view.ts';

// Input parser
export { parseMsg } from './keys.ts';

// ANSI utilities needed by hosts for terminal lifecycle management
export { showCursor, cls } from './ansi.ts';
