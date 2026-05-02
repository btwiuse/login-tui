// ═══════════════════════════════════════════════════════════════════════
//  TEA — Model, Msg, KeyEvent
//  Plain data types that describe the app state and all possible events.
//  No logic; no dependencies.
// ═══════════════════════════════════════════════════════════════════════

/** Full application state. */
export interface Model {
  username: string;
  password: string;
  focus:    number;  // 0 = username  1 = password  2 = login  3 = cancel
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
