// ═══════════════════════════════════════════════════════════════════════
//  The Elm Architecture — LoginApp
//  Pure Model / Msg / init / update / view.  Zero xterm / DOM / I/O dependency.
//
//  Model  — plain data record describing the full app state
//  Msg    — discriminated union of all possible events
//  init   — returns the initial Model
//  update — (Msg, Model) → Model  (pure; returns same ref when unchanged)
//  view   — Model → string        (pure; returns full ANSI frame)
// ═══════════════════════════════════════════════════════════════════════

import {
  hideCursor, showCursor, goto, cls, bold, rev, fg,
  BOX_W, BOX_H, INPUT_W, LABEL_USER, LABEL_PASS, INNER,
} from './ansi.ts';

// ── Model ────────────────────────────────────────────────────────────────

export interface Model {
  username: string;
  password: string;
  focus:    number;  // 0 = username  1 = password  2 = login  3 = cancel
  message:  string;
  done:     boolean;
  cols:     number;
  rows:     number;
}

// ── Messages ─────────────────────────────────────────────────────────────

/** Subset of the DOM KeyboardEvent interface used by the app. */
export interface KeyEvent {
  key:            string;
  shiftKey:       boolean;
  ctrlKey:        boolean;
  altKey:         boolean;
  metaKey:        boolean;
  preventDefault(): void;
}

export type Msg =
  | { type: 'Resize';     cols: number; rows: number }
  | { type: 'MousePress'; row: number; col: number }
  | { type: 'Key';        key: string; event: KeyEvent };

// ── Init ──────────────────────────────────────────────────────────────────

export function init(cols: number, rows: number): Model {
  return { username: '', password: '', focus: 0, message: '', done: false, cols, rows };
}

// ── Update ────────────────────────────────────────────────────────────────

/** Pure update function.  Returns the same reference when nothing changed. */
export function update(msg: Msg, model: Model): Model {
  switch (msg.type) {
    case 'Resize':
      return { ...model, cols: msg.cols, rows: msg.rows };
    case 'MousePress':
      return _handleMousePress(msg.row, msg.col, model);
    case 'Key':
      return _handleKey(msg.key, msg.event, model);
  }
}

// ── View ──────────────────────────────────────────────────────────────────

/** Pure view function.  Returns the full ANSI frame for the given model. */
export function view(model: Model): string {
  return _render(model);
}

// ── private helpers ──────────────────────────────────────────────────────

function _handleMousePress(row: number, col: number, model: Model): Model {
  const hit = _hitTest(row, col, model);
  if (hit === null) return model;

  if (hit === 0 || hit === 1) {
    return { ...model, focus: hit };
  }
  if (!model.done) {
    return _activateFocus({ ...model, focus: hit });
  }
  return model;
}

function _handleKey(key: string, event: KeyEvent, model: Model): Model {
  if (model.done) {
    if (event.key === 'r' || event.key === 'R') {
      return { ...model, username: '', password: '', focus: 0, message: '', done: false };
    }
    return model;
  }

  const k = event.key;
  if (k === 'Tab') {
    event.preventDefault();
    return { ...model, focus: event.shiftKey ? (model.focus + 3) % 4 : (model.focus + 1) % 4 };
  }
  if (k === 'ArrowDown') return { ...model, focus: (model.focus + 1) % 4 };
  if (k === 'ArrowUp')   return { ...model, focus: (model.focus + 3) % 4 };
  if (k === 'Backspace') {
    if (model.focus === 0 && model.username.length > 0)
      return { ...model, username: model.username.slice(0, -1) };
    if (model.focus === 1 && model.password.length > 0)
      return { ...model, password: model.password.slice(0, -1) };
    return model;
  }
  if (k === 'Enter') return _activateFocus(model);
  if (key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
    if (model.focus === 0 && model.username.length < INPUT_W)
      return { ...model, username: model.username + key };
    if (model.focus === 1 && model.password.length < INPUT_W)
      return { ...model, password: model.password + key };
  }
  return model;
}

function _activateFocus(model: Model): Model {
  if (model.focus === 3) {
    return { ...model, username: '', password: '', focus: 0,
      message: 'Cancelled. Fill in the form and try again.' };
  }
  if (model.focus === 0) return { ...model, focus: 1 };
  if (!model.username)   return { ...model, message: 'Username is required.', focus: 0 };
  if (!model.password)   return { ...model, message: 'Password is required.', focus: 1 };
  return { ...model, done: true,
    message: `Welcome, ${model.username}! Login successful ✓  (press R to reset)` };
}

function _layout(model: Model): { ROW0: number; COL0: number } {
  const blockH = BOX_H + 3;
  const ROW0 = Math.max(1, Math.floor((model.rows - blockH) / 2) + 1);
  const COL0 = Math.max(1, Math.floor((model.cols - BOX_W)  / 2) + 1);
  return { ROW0, COL0 };
}

function _center(s: string, w: number): string {
  const pad = Math.max(0, w - s.length);
  const l   = Math.floor(pad / 2);
  return ' '.repeat(l) + s + ' '.repeat(pad - l);
}

function _boxRow(row: number, col0: number, inner: string): string {
  return goto(row, col0) + '│' + inner + '│';
}

function _renderInput(value: string, focused: boolean, isPassword: boolean): string {
  const display = isPassword ? '*'.repeat(value.length) : value;
  const padded  = display.padEnd(INPUT_W).slice(0, INPUT_W);
  return focused ? rev(padded) : '[' + padded + ']';
}

function _inputVW(focused: boolean): number { return focused ? INPUT_W : INPUT_W + 2; }

function _renderBtn(label: string, focused: boolean): string {
  return focused ? rev(' ' + label + ' ') : '[ ' + label + ' ]';
}

function _btnVW(label: string, focused: boolean): number {
  return focused ? label.length + 2 : label.length + 4;
}

function _hitTest(row: number, col: number, model: Model): number | null {
  const { ROW0, COL0 } = _layout(model);

  if (row === ROW0 + 4) {
    const start = COL0 + 1 + LABEL_USER.length;
    const end   = start + _inputVW(model.focus === 0);
    if (col >= start && col < end) return 0;
  }

  if (row === ROW0 + 6) {
    const start = COL0 + 1 + LABEL_PASS.length;
    const end   = start + _inputVW(model.focus === 1);
    if (col >= start && col < end) return 1;
  }

  if (row === ROW0 + 8) {
    const totalVW     = _btnVW('Login', model.focus === 2) + 4 + _btnVW('Cancel', model.focus === 3);
    const padL        = Math.floor((INNER - totalVW) / 2);
    const loginStart  = COL0 + 1 + padL;
    const loginEnd    = loginStart + _btnVW('Login', model.focus === 2);
    const cancelStart = loginEnd + 4;
    const cancelEnd   = cancelStart + _btnVW('Cancel', model.focus === 3);
    if (col >= loginStart  && col < loginEnd)   return 2;
    if (col >= cancelStart && col < cancelEnd)  return 3;
  }

  return null;
}

function _render(model: Model): string {
  const { ROW0, COL0 } = _layout(model);
  let o = cls + hideCursor;

  // header
  const title    = 'xterm.js TUI Demo — Pure Frontend Login';
  const titleCol = Math.max(1, Math.floor((model.cols - title.length) / 2) + 1);
  o += goto(Math.max(1, ROW0 - 1), titleCol) + fg(36, bold(title));

  // box
  o += goto(ROW0,     COL0) + '┌' + '─'.repeat(BOX_W - 2) + '┐';
  o += _boxRow(ROW0 + 1, COL0, bold(_center('Login', INNER)));
  o += goto(ROW0 + 2, COL0) + '├' + '─'.repeat(BOX_W - 2) + '┤';
  o += _boxRow(ROW0 + 3, COL0, ' '.repeat(INNER));

  // username row
  {
    const foc   = model.focus === 0;
    const field = _renderInput(model.username, foc, false);
    const rest  = INNER - LABEL_USER.length - _inputVW(foc);
    o += _boxRow(ROW0 + 4, COL0, LABEL_USER + field + ' '.repeat(Math.max(0, rest)));
  }

  o += _boxRow(ROW0 + 5, COL0, ' '.repeat(INNER));

  // password row
  {
    const foc   = model.focus === 1;
    const field = _renderInput(model.password, foc, true);
    const rest  = INNER - LABEL_PASS.length - _inputVW(foc);
    o += _boxRow(ROW0 + 6, COL0, LABEL_PASS + field + ' '.repeat(Math.max(0, rest)));
  }

  o += _boxRow(ROW0 + 7, COL0, ' '.repeat(INNER));

  // buttons row
  {
    const loginBtn  = _renderBtn('Login',  model.focus === 2);
    const cancelBtn = _renderBtn('Cancel', model.focus === 3);
    const totalVW   = _btnVW('Login', model.focus === 2) + 4 + _btnVW('Cancel', model.focus === 3);
    const padL      = Math.floor((INNER - totalVW) / 2);
    const padR      = INNER - padL - totalVW;
    o += _boxRow(ROW0 + 8, COL0,
      ' '.repeat(padL) + loginBtn + '    ' + cancelBtn + ' '.repeat(Math.max(0, padR)));
  }

  o += _boxRow(ROW0 + 9, COL0, ' '.repeat(INNER));
  o += goto(ROW0 + 10, COL0) + '└' + '─'.repeat(BOX_W - 2) + '┘';

  // message
  if (model.message) {
    o += goto(ROW0 + 12, COL0) + fg(model.done ? 32 : 33, '  ' + model.message);
  }

  // hint
  const hint    = '  Click to focus  •  Tab/↑↓ to navigate  •  Enter to confirm  •  Backspace to delete';
  const hintCol = Math.max(1, Math.floor((model.cols - hint.length) / 2) + 1);
  o += goto(ROW0 + 13, hintCol) + fg(90, hint);

  // cursor — only shown inside active text field
  if (!model.done && model.focus <= 1) {
    o += showCursor;
    const label = model.focus === 0 ? LABEL_USER : LABEL_PASS;
    const row   = model.focus === 0 ? ROW0 + 4 : ROW0 + 6;
    const col   = COL0 + 1 + label.length +
      (model.focus === 0 ? model.username : model.password).length;
    o += goto(row, col);
  }

  return o;
}
