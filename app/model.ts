// ═══════════════════════════════════════════════════════════════════════
//  TEA — Model, Msg, KeyEvent
//  Plain data types that describe the app state and all possible events.
//  No logic; no dependencies.
// ═══════════════════════════════════════════════════════════════════════

/** Focused element in the login form. */
export const enum Focus {
  Username = 0,
  Password = 1,
  Login    = 2,
  Cancel   = 3,
}

/** Full application state. */
export interface Model {
  username: string;
  password: string;
  focus:    Focus;
  message:  string;
  done:     boolean;
  cols:     number;
  rows:     number;
}

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
