// ═══════════════════════════════════════════════════════════════════════
//  TEA — framework types
//  The Elm Architecture core abstractions.
//  Analogous to charm.land/bubbletea/v2's Model, Cmd, and Msg.
// ═══════════════════════════════════════════════════════════════════════

/** Subset of the DOM KeyboardEvent interface used by the app. */
export interface KeyEvent {
  key:            string;
  shiftKey:       boolean;
  ctrlKey:        boolean;
  altKey:         boolean;
  metaKey:        boolean;
  preventDefault(): void;
}

/** Discriminated union of all events the app can receive. */
export type Msg =
  | { type: 'Resize';     cols: number; rows: number }
  | { type: 'MousePress'; row: number; col: number }
  | { type: 'Key';        key: string; event: KeyEvent };

/**
 * IO operation that produces a Msg when complete.
 * null is treated as a no-op (equivalent to returning nil Cmd in bubbletea).
 */
export type Cmd = (() => Msg | Promise<Msg>) | null;

/**
 * TEA Model interface — analogous to bubbletea's tea.Model.
 *
 *   init()   — returns an optional initial command (null = no-op)
 *   update() — receives a Msg; returns the next Model and an optional Cmd
 *   view()   — pure render; returns the full ANSI frame string
 */
export interface Model {
  init(): Cmd;
  update(msg: Msg): [Model, Cmd];
  view(): string;
}
