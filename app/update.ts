// ═══════════════════════════════════════════════════════════════════════
//  TEA — update
//  Pure state transition function.  Returns the same reference when
//  nothing changes, so hosts can skip re-renders cheaply.
// ═══════════════════════════════════════════════════════════════════════

import type { Msg, Model, KeyEvent } from './model.ts';
import { Focus } from './model.ts';
import { INPUT_W, LABEL_USER, LABEL_PASS, INNER } from './ansi.ts';
import { layout, inputVW, btnVW } from './geom.ts';

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

// ── private helpers ──────────────────────────────────────────────────

function _handleMousePress(row: number, col: number, model: Model): Model {
  const hit = _hitTest(row, col, model);
  if (hit === null) return model;

  if (hit === Focus.Username || hit === Focus.Password) {
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
      return { ...model, username: '', password: '', focus: Focus.Username, message: '', done: false };
    }
    return model;
  }

  const k = event.key;
  if (k === 'Tab') {
    event.preventDefault();
    return { ...model, focus: event.shiftKey ? (model.focus + 3) % 4 as Focus : (model.focus + 1) % 4 as Focus };
  }
  if (k === 'ArrowDown') return { ...model, focus: (model.focus + 1) % 4 as Focus };
  if (k === 'ArrowUp')   return { ...model, focus: (model.focus + 3) % 4 as Focus };
  if (k === 'Backspace') {
    if (model.focus === Focus.Username && model.username.length > 0)
      return { ...model, username: model.username.slice(0, -1) };
    if (model.focus === Focus.Password && model.password.length > 0)
      return { ...model, password: model.password.slice(0, -1) };
    return model;
  }
  if (k === 'Enter') return _activateFocus(model);
  if (key.length === 1 && key >= ' ' && !event.ctrlKey && !event.altKey && !event.metaKey) {
    if (model.focus === Focus.Username && model.username.length < INPUT_W)
      return { ...model, username: model.username + key };
    if (model.focus === Focus.Password && model.password.length < INPUT_W)
      return { ...model, password: model.password + key };
  }
  return model;
}

function _activateFocus(model: Model): Model {
  if (model.focus === Focus.Cancel) {
    return { ...model, username: '', password: '', focus: Focus.Username,
      message: 'Cancelled. Fill in the form and try again.' };
  }
  if (model.focus === Focus.Username) return { ...model, focus: Focus.Password };
  if (!model.username)   return { ...model, message: 'Username is required.', focus: Focus.Username };
  if (!model.password)   return { ...model, message: 'Password is required.', focus: Focus.Password };
  return { ...model, done: true,
    message: `Welcome, ${model.username}! Login successful ✓  (press R to reset)` };
}

function _hitTest(row: number, col: number, model: Model): Focus | null {
  const { ROW0, COL0 } = layout(model);

  if (row === ROW0 + 4) {
    const start = COL0 + 1 + LABEL_USER.length;
    const end   = start + inputVW(model.focus === Focus.Username);
    if (col >= start && col < end) return Focus.Username;
  }

  if (row === ROW0 + 6) {
    const start = COL0 + 1 + LABEL_PASS.length;
    const end   = start + inputVW(model.focus === Focus.Password);
    if (col >= start && col < end) return Focus.Password;
  }

  if (row === ROW0 + 8) {
    const totalVW     = btnVW('Login', model.focus === Focus.Login) + 4 + btnVW('Cancel', model.focus === Focus.Cancel);
    const padL        = Math.floor((INNER - totalVW) / 2);
    const loginStart  = COL0 + 1 + padL;
    const loginEnd    = loginStart + btnVW('Login', model.focus === Focus.Login);
    const cancelStart = loginEnd + 4;
    const cancelEnd   = cancelStart + btnVW('Cancel', model.focus === Focus.Cancel);
    if (col >= loginStart  && col < loginEnd)   return Focus.Login;
    if (col >= cancelStart && col < cancelEnd)  return Focus.Cancel;
  }

  return null;
}
