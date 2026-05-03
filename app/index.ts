// ═══════════════════════════════════════════════════════════════════════
//  Public entry point
//  Host files (cli.ts, xterm.ts, wterm.ts) import exclusively from here.
//  Internal module structure is an implementation detail.
// ═══════════════════════════════════════════════════════════════════════

// TEA framework types
export type { Model, Cmd, Msg, KeyEvent } from './tea.ts';

// Concrete model
export { LoginModel }                      from './model.ts';

// Input parser
export { parseMsg }                        from './keys.ts';

// ANSI utilities needed by hosts for terminal lifecycle management
export { showCursor, cls, SGR_MOUSE_ENABLE, SGR_MOUSE_DISABLE } from './ansi.ts';

// Zustand store factory
export { createAppStore, type AppState }   from './store.ts';
