// ═══════════════════════════════════════════════════════════════════════
//  Layer 2 — LoginApp
//  Owns all TUI state and rendering logic.  Zero xterm / DOM dependency.
//
//  Public API (each method returns the ANSI string to write, or ''):
//    app.init()                  — SGR mouse enable + first frame
//    app.resize(cols, rows)      — update size, return refreshed frame
//    app.mousePress(row, col)    — left-button press at 1-based cell
//    app.key(key, event)         — forward a KeyEvent
// ═══════════════════════════════════════════════════════════════════════

import {
  hideCursor, showCursor, goto, cls, bold, rev, fg,
  BOX_W, BOX_H, INPUT_W, LABEL_USER, LABEL_PASS, INNER,
} from './ansi.ts';

export interface AppState {
  username: string;
  password: string;
  focus:    number;  // 0=username  1=password  2=login  3=cancel
  message:  string;
  done:     boolean;
}

/** Subset of the DOM KeyboardEvent interface used by LoginApp. */
export interface KeyEvent {
  key:            string;
  shiftKey:       boolean;
  ctrlKey:        boolean;
  altKey:         boolean;
  metaKey:        boolean;
  preventDefault(): void;
}

export class LoginApp {
  cols: number;
  rows: number;
  private _state: AppState;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this._state = {
      username: '',
      password: '',
      focus:    0,
      message:  '',
      done:     false,
    };
  }

  // ── public API ───────────────────────────────────────────────────────

  /** Sequences to write once at startup: enable SGR mouse + first frame. */
  init(): string {
    return '\x1b[?1000h\x1b[?1006h' + this._render();
  }

  /** Notify the app that the terminal was resized; returns new frame. */
  resize(cols: number, rows: number): string {
    this.cols = cols;
    this.rows = rows;
    return this._render();
  }

  /**
   * Handle a left-button SGR mouse press at 1-based (row, col).
   * Returns a new frame if focus changed, otherwise ''.
   */
  mousePress(row: number, col: number): string {
    const hit = this._hitTest(row, col);
    if (hit === null) return '';

    const s = this._state;
    if (hit === 0 || hit === 1) {
      s.focus = hit;
    } else if (!s.done) {
      s.focus = hit;
      this._activateFocus();
    }
    return this._render();
  }

  /**
   * Handle a key event.
   * Returns a new frame if state changed, otherwise ''.
   */
  key(key: string, event: KeyEvent): string {
    const s = this._state;

    if (s.done) {
      if (event.key === 'r' || event.key === 'R') {
        Object.assign(s, { username: '', password: '', focus: 0, message: '', done: false });
        return this._render();
      }
      return '';
    }

    const k = event.key;
    if (k === 'Tab') {
      event.preventDefault();
      s.focus = event.shiftKey ? (s.focus + 3) % 4 : (s.focus + 1) % 4;
    } else if (k === 'ArrowDown') {
      s.focus = (s.focus + 1) % 4;
    } else if (k === 'ArrowUp') {
      s.focus = (s.focus + 3) % 4;
    } else if (k === 'Backspace') {
      if (s.focus === 0 && s.username.length > 0) s.username = s.username.slice(0, -1);
      else if (s.focus === 1 && s.password.length > 0) s.password = s.password.slice(0, -1);
    } else if (k === 'Enter') {
      this._activateFocus();
    } else if (key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      if (s.focus === 0 && s.username.length < INPUT_W) s.username += key;
      else if (s.focus === 1 && s.password.length < INPUT_W) s.password += key;
    }

    return this._render();
  }

  // ── private helpers ──────────────────────────────────────────────────

  private _layout(): { ROW0: number; COL0: number } {
    const blockH = BOX_H + 3;
    const ROW0 = Math.max(1, Math.floor((this.rows - blockH) / 2) + 1);
    const COL0 = Math.max(1, Math.floor((this.cols - BOX_W)  / 2) + 1);
    return { ROW0, COL0 };
  }

  private _center(s: string, w: number): string {
    const pad = Math.max(0, w - s.length);
    const l   = Math.floor(pad / 2);
    return ' '.repeat(l) + s + ' '.repeat(pad - l);
  }

  private _boxRow(row: number, col0: number, inner: string): string {
    return goto(row, col0) + '│' + inner + '│';
  }

  private _renderInput(value: string, focused: boolean, isPassword: boolean): string {
    const display = isPassword ? '*'.repeat(value.length) : value;
    const padded  = display.padEnd(INPUT_W).slice(0, INPUT_W);
    return focused ? rev(padded) : '[' + padded + ']';
  }

  private _inputVW(focused: boolean): number { return focused ? INPUT_W : INPUT_W + 2; }

  private _renderBtn(label: string, focused: boolean): string {
    return focused ? rev(' ' + label + ' ') : '[ ' + label + ' ]';
  }

  private _btnVW(label: string, focused: boolean): number {
    return focused ? label.length + 2 : label.length + 4;
  }

  private _hitTest(row: number, col: number): number | null {
    const { ROW0, COL0 } = this._layout();
    const s = this._state;

    if (row === ROW0 + 4) {
      const start = COL0 + 1 + LABEL_USER.length;
      const end   = start + this._inputVW(s.focus === 0);
      if (col >= start && col < end) return 0;
    }

    if (row === ROW0 + 6) {
      const start = COL0 + 1 + LABEL_PASS.length;
      const end   = start + this._inputVW(s.focus === 1);
      if (col >= start && col < end) return 1;
    }

    if (row === ROW0 + 8) {
      const totalVW     = this._btnVW('Login', s.focus === 2) + 4 + this._btnVW('Cancel', s.focus === 3);
      const padL        = Math.floor((INNER - totalVW) / 2);
      const loginStart  = COL0 + 1 + padL;
      const loginEnd    = loginStart + this._btnVW('Login', s.focus === 2);
      const cancelStart = loginEnd + 4;
      const cancelEnd   = cancelStart + this._btnVW('Cancel', s.focus === 3);
      if (col >= loginStart  && col < loginEnd)   return 2;
      if (col >= cancelStart && col < cancelEnd)  return 3;
    }

    return null;
  }

  private _activateFocus(): void {
    const s = this._state;
    if (s.focus === 3) {
      Object.assign(s, { username: '', password: '', focus: 0,
        message: 'Cancelled. Fill in the form and try again.' });
    } else if (s.focus === 0) {
      s.focus = 1;
    } else {
      if (!s.username) {
        s.message = 'Username is required.';
        s.focus   = 0;
      } else if (!s.password) {
        s.message = 'Password is required.';
        s.focus   = 1;
      } else {
        s.done    = true;
        s.message = `Welcome, ${s.username}! Login successful ✓  (press R to reset)`;
      }
    }
  }

  private _render(): string {
    const { ROW0, COL0 } = this._layout();
    const s = this._state;
    let o = cls + hideCursor;

    // header
    const title    = 'xterm.js TUI Demo — Pure Frontend Login';
    const titleCol = Math.max(1, Math.floor((this.cols - title.length) / 2) + 1);
    o += goto(Math.max(1, ROW0 - 1), titleCol) + fg(36, bold(title));

    // box
    o += goto(ROW0,     COL0) + '┌' + '─'.repeat(BOX_W - 2) + '┐';
    o += this._boxRow(ROW0 + 1, COL0, bold(this._center('Login', INNER)));
    o += goto(ROW0 + 2, COL0) + '├' + '─'.repeat(BOX_W - 2) + '┤';
    o += this._boxRow(ROW0 + 3, COL0, ' '.repeat(INNER));

    // username row
    {
      const foc   = s.focus === 0;
      const field = this._renderInput(s.username, foc, false);
      const rest  = INNER - LABEL_USER.length - this._inputVW(foc);
      o += this._boxRow(ROW0 + 4, COL0, LABEL_USER + field + ' '.repeat(Math.max(0, rest)));
    }

    o += this._boxRow(ROW0 + 5, COL0, ' '.repeat(INNER));

    // password row
    {
      const foc   = s.focus === 1;
      const field = this._renderInput(s.password, foc, true);
      const rest  = INNER - LABEL_PASS.length - this._inputVW(foc);
      o += this._boxRow(ROW0 + 6, COL0, LABEL_PASS + field + ' '.repeat(Math.max(0, rest)));
    }

    o += this._boxRow(ROW0 + 7, COL0, ' '.repeat(INNER));

    // buttons row
    {
      const loginBtn  = this._renderBtn('Login',  s.focus === 2);
      const cancelBtn = this._renderBtn('Cancel', s.focus === 3);
      const totalVW   = this._btnVW('Login', s.focus === 2) + 4 + this._btnVW('Cancel', s.focus === 3);
      const padL      = Math.floor((INNER - totalVW) / 2);
      const padR      = INNER - padL - totalVW;
      o += this._boxRow(ROW0 + 8, COL0,
        ' '.repeat(padL) + loginBtn + '    ' + cancelBtn + ' '.repeat(Math.max(0, padR)));
    }

    o += this._boxRow(ROW0 + 9, COL0, ' '.repeat(INNER));
    o += goto(ROW0 + 10, COL0) + '└' + '─'.repeat(BOX_W - 2) + '┘';

    // message
    if (s.message) {
      o += goto(ROW0 + 12, COL0) + fg(s.done ? 32 : 33, '  ' + s.message);
    }

    // hint
    const hint    = '  Click to focus  •  Tab/↑↓ to navigate  •  Enter to confirm  •  Backspace to delete';
    const hintCol = Math.max(1, Math.floor((this.cols - hint.length) / 2) + 1);
    o += goto(ROW0 + 13, hintCol) + fg(90, hint);

    // cursor — only shown inside active text field
    if (!s.done && s.focus <= 1) {
      o += showCursor;
      const label = s.focus === 0 ? LABEL_USER : LABEL_PASS;
      const row   = s.focus === 0 ? ROW0 + 4 : ROW0 + 6;
      const col   = COL0 + 1 + label.length +
        (s.focus === 0 ? s.username : s.password).length;
      o += goto(row, col);
    }

    return o;
  }
}
