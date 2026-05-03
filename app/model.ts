// ═══════════════════════════════════════════════════════════════════════
//  TEA — LoginModel
//  Concrete Model implementation for the login form.
//  Implements the Model interface (init / update / view).
// ═══════════════════════════════════════════════════════════════════════

import type { Msg, Cmd, KeyEvent } from './tea.ts';
import type { Model } from './tea.ts';
import {
  hideCursor, showCursor, goto, cls, bold, rev, fg,
  BOX_W, INPUT_W, LABEL_USER, LABEL_PASS, INNER,
} from './ansi.ts';
import { layout, inputVW, btnVW } from './geom.ts';

// ── Internal state ───────────────────────────────────────────────────

/** Focused element in the login form. */
const enum Focus {
  Username = 0,
  Password = 1,
  Login    = 2,
  Cancel   = 3,
}

/** Full internal application state (equivalent to a Go model struct). */
interface LoginState {
  username: string;
  password: string;
  focus:    Focus;
  message:  string;
  done:     boolean;
  cols:     number;
  rows:     number;
}

// ── LoginModel ───────────────────────────────────────────────────────

/**
 * Concrete TEA model for the login form.
 * State is immutably encapsulated; update() returns a new instance when
 * the state changes, or the same instance (same reference) when nothing
 * changed — hosts can use reference equality to skip re-renders.
 */
export class LoginModel implements Model {
  private constructor(private readonly state: LoginState) {}

  /** Create the initial model for a given terminal size. */
  static create(cols: number, rows: number): LoginModel {
    return new LoginModel({
      username: '', password: '', focus: Focus.Username,
      message: '', done: false, cols, rows,
    });
  }

  /** No initial command needed. */
  init(): Cmd { return null; }

  /** Pure state-transition function. Returns the same reference when nothing changed. */
  update(msg: Msg): [LoginModel, Cmd] {
    const next = _updateState(msg, this.state);
    if (next === this.state) return [this, null];
    return [new LoginModel(next), null];
  }

  /** Pure render function — returns the full ANSI frame string. */
  view(): string { return _render(this.state); }
}

// ── update helpers (analogous to bubbletea Update) ────────────────────

const FOCUS_CYCLE: Focus[] = [Focus.Username, Focus.Password, Focus.Login, Focus.Cancel];

function _nextFocus(current: Focus, delta: 1 | -1): Focus {
  const i = FOCUS_CYCLE.indexOf(current);
  return FOCUS_CYCLE[(i + FOCUS_CYCLE.length + delta) % FOCUS_CYCLE.length];
}

function _updateState(msg: Msg, state: LoginState): LoginState {
  switch (msg.type) {
    case 'Resize':
      return { ...state, cols: msg.cols, rows: msg.rows };
    case 'MousePress':
      return _handleMousePress(msg.row, msg.col, state);
    case 'Key':
      return _handleKey(msg.key, msg.event, state);
  }
}

function _handleMousePress(row: number, col: number, state: LoginState): LoginState {
  const hit = _hitTest(row, col, state);
  if (hit === null) return state;

  if (hit === Focus.Username || hit === Focus.Password) {
    return { ...state, focus: hit };
  }
  if (!state.done) {
    return _activateFocus({ ...state, focus: hit });
  }
  return state;
}

function _handleKey(key: string, event: KeyEvent, state: LoginState): LoginState {
  if (state.done) {
    if (event.key === 'r' || event.key === 'R') {
      return { ...state, username: '', password: '', focus: Focus.Username, message: '', done: false };
    }
    return state;
  }

  const k = event.key;
  if (k === 'Tab') {
    event.preventDefault();
    return { ...state, focus: event.shiftKey ? _nextFocus(state.focus, -1) : _nextFocus(state.focus, 1) };
  }
  if (k === 'ArrowDown') return { ...state, focus: _nextFocus(state.focus, 1) };
  if (k === 'ArrowUp')   return { ...state, focus: _nextFocus(state.focus, -1) };
  if (k === 'Backspace') {
    if (state.focus === Focus.Username && state.username.length > 0)
      return { ...state, username: state.username.slice(0, -1) };
    if (state.focus === Focus.Password && state.password.length > 0)
      return { ...state, password: state.password.slice(0, -1) };
    return state;
  }
  if (k === 'Enter') return _activateFocus(state);
  if (key.length === 1 && key >= ' ' && !event.ctrlKey && !event.altKey && !event.metaKey) {
    if (state.focus === Focus.Username && state.username.length < INPUT_W)
      return { ...state, username: state.username + key };
    if (state.focus === Focus.Password && state.password.length < INPUT_W)
      return { ...state, password: state.password + key };
  }
  return state;
}

function _activateFocus(state: LoginState): LoginState {
  if (state.focus === Focus.Cancel) {
    return { ...state, username: '', password: '', focus: Focus.Username,
      message: 'Cancelled. Fill in the form and try again.' };
  }
  if (state.focus === Focus.Username) return { ...state, focus: Focus.Password };
  if (!state.username)   return { ...state, message: 'Username is required.', focus: Focus.Username };
  if (!state.password)   return { ...state, message: 'Password is required.', focus: Focus.Password };
  return { ...state, done: true,
    message: `Welcome, ${state.username}! Login successful ✓  (press R to reset)` };
}

function _hitTest(row: number, col: number, state: LoginState): Focus | null {
  const { ROW0, COL0 } = layout(state);

  if (row === ROW0 + 4) {
    const start = COL0 + 1 + LABEL_USER.length;
    const end   = start + inputVW(state.focus === Focus.Username);
    if (col >= start && col < end) return Focus.Username;
  }

  if (row === ROW0 + 6) {
    const start = COL0 + 1 + LABEL_PASS.length;
    const end   = start + inputVW(state.focus === Focus.Password);
    if (col >= start && col < end) return Focus.Password;
  }

  if (row === ROW0 + 8) {
    const totalVW     = btnVW('Login', state.focus === Focus.Login) + 4 + btnVW('Cancel', state.focus === Focus.Cancel);
    const padL        = Math.floor((INNER - totalVW) / 2);
    const loginStart  = COL0 + 1 + padL;
    const loginEnd    = loginStart + btnVW('Login', state.focus === Focus.Login);
    const cancelStart = loginEnd + 4;
    const cancelEnd   = cancelStart + btnVW('Cancel', state.focus === Focus.Cancel);
    if (col >= loginStart  && col < loginEnd)   return Focus.Login;
    if (col >= cancelStart && col < cancelEnd)  return Focus.Cancel;
  }

  return null;
}

// ── view helpers (analogous to bubbletea View) ────────────────────────

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

function _renderBtn(label: string, focused: boolean): string {
  return focused ? rev(' ' + label + ' ') : '[ ' + label + ' ]';
}

function _render(state: LoginState): string {
  const { ROW0, COL0 } = layout(state);
  let o = cls + hideCursor;

  // header
  const title    = 'xterm.js TUI Demo — Pure Frontend Login';
  const titleCol = Math.max(1, Math.floor((state.cols - title.length) / 2) + 1);
  o += goto(Math.max(1, ROW0 - 1), titleCol) + fg(36, bold(title));

  // box
  o += goto(ROW0,     COL0) + '┌' + '─'.repeat(BOX_W - 2) + '┐';
  o += _boxRow(ROW0 + 1, COL0, bold(_center('Login', INNER)));
  o += goto(ROW0 + 2, COL0) + '├' + '─'.repeat(BOX_W - 2) + '┤';
  o += _boxRow(ROW0 + 3, COL0, ' '.repeat(INNER));

  // username row
  {
    const foc   = state.focus === Focus.Username;
    const field = _renderInput(state.username, foc, false);
    const rest  = INNER - LABEL_USER.length - inputVW(foc);
    o += _boxRow(ROW0 + 4, COL0, LABEL_USER + field + ' '.repeat(Math.max(0, rest)));
  }

  o += _boxRow(ROW0 + 5, COL0, ' '.repeat(INNER));

  // password row
  {
    const foc   = state.focus === Focus.Password;
    const field = _renderInput(state.password, foc, true);
    const rest  = INNER - LABEL_PASS.length - inputVW(foc);
    o += _boxRow(ROW0 + 6, COL0, LABEL_PASS + field + ' '.repeat(Math.max(0, rest)));
  }

  o += _boxRow(ROW0 + 7, COL0, ' '.repeat(INNER));

  // buttons row
  {
    const loginBtn  = _renderBtn('Login',  state.focus === Focus.Login);
    const cancelBtn = _renderBtn('Cancel', state.focus === Focus.Cancel);
    const totalVW   = btnVW('Login', state.focus === Focus.Login) + 4 + btnVW('Cancel', state.focus === Focus.Cancel);
    const padL      = Math.floor((INNER - totalVW) / 2);
    const padR      = INNER - padL - totalVW;
    o += _boxRow(ROW0 + 8, COL0,
      ' '.repeat(padL) + loginBtn + '    ' + cancelBtn + ' '.repeat(Math.max(0, padR)));
  }

  o += _boxRow(ROW0 + 9, COL0, ' '.repeat(INNER));
  o += goto(ROW0 + 10, COL0) + '└' + '─'.repeat(BOX_W - 2) + '┘';

  // message
  if (state.message) {
    o += goto(ROW0 + 12, COL0) + fg(state.done ? 32 : 33, '  ' + state.message);
  }

  // hint
  const hint    = '  Click to focus  •  Tab/↑↓ to navigate  •  Enter to confirm  •  Backspace to delete';
  const hintCol = Math.max(1, Math.floor((state.cols - hint.length) / 2) + 1);
  o += goto(ROW0 + 13, hintCol) + fg(90, hint);

  // cursor — only shown inside active text field
  if (!state.done && state.focus <= Focus.Password) {
    o += showCursor;
    const label = state.focus === Focus.Username ? LABEL_USER : LABEL_PASS;
    const row   = state.focus === Focus.Username ? ROW0 + 4 : ROW0 + 6;
    const col   = COL0 + 1 + label.length +
      (state.focus === Focus.Username ? state.username : state.password).length;
    o += goto(row, col);
  }

  return o;
}
