// ═══════════════════════════════════════════════════════════════════════
//  TEA — view
//  Pure render function.  Model → full ANSI frame string.
//  No I/O; callers pass the result to terminal.write().
// ═══════════════════════════════════════════════════════════════════════

import type { Model } from './model.ts';
import {
  hideCursor, showCursor, goto, cls, bold, rev, fg,
  BOX_W, INPUT_W, LABEL_USER, LABEL_PASS, INNER,
} from './ansi.ts';
import { layout, inputVW, btnVW } from './geom.ts';

/** Pure view function.  Returns the full ANSI frame for the given model. */
export function view(model: Model): string {
  return _render(model);
}

// ── private helpers ──────────────────────────────────────────────────

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

function _render(model: Model): string {
  const { ROW0, COL0 } = layout(model);
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
    const rest  = INNER - LABEL_USER.length - inputVW(foc);
    o += _boxRow(ROW0 + 4, COL0, LABEL_USER + field + ' '.repeat(Math.max(0, rest)));
  }

  o += _boxRow(ROW0 + 5, COL0, ' '.repeat(INNER));

  // password row
  {
    const foc   = model.focus === 1;
    const field = _renderInput(model.password, foc, true);
    const rest  = INNER - LABEL_PASS.length - inputVW(foc);
    o += _boxRow(ROW0 + 6, COL0, LABEL_PASS + field + ' '.repeat(Math.max(0, rest)));
  }

  o += _boxRow(ROW0 + 7, COL0, ' '.repeat(INNER));

  // buttons row
  {
    const loginBtn  = _renderBtn('Login',  model.focus === 2);
    const cancelBtn = _renderBtn('Cancel', model.focus === 3);
    const totalVW   = btnVW('Login', model.focus === 2) + 4 + btnVW('Cancel', model.focus === 3);
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
