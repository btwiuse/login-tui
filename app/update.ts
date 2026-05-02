// ═══════════════════════════════════════════════════════════════════════
//  TEA — update
//  Pure state transition function.  Returns the same reference when
//  nothing changes, so hosts can skip re-renders cheaply.
// ═══════════════════════════════════════════════════════════════════════

import type { Msg, Model, KeyEvent } from './model.ts';
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

function _hitTest(row: number, col: number, model: Model): number | null {
  const { ROW0, COL0 } = layout(model);

  if (row === ROW0 + 4) {
    const start = COL0 + 1 + LABEL_USER.length;
    const end   = start + inputVW(model.focus === 0);
    if (col >= start && col < end) return 0;
  }

  if (row === ROW0 + 6) {
    const start = COL0 + 1 + LABEL_PASS.length;
    const end   = start + inputVW(model.focus === 1);
    if (col >= start && col < end) return 1;
  }

  if (row === ROW0 + 8) {
    const totalVW     = btnVW('Login', model.focus === 2) + 4 + btnVW('Cancel', model.focus === 3);
    const padL        = Math.floor((INNER - totalVW) / 2);
    const loginStart  = COL0 + 1 + padL;
    const loginEnd    = loginStart + btnVW('Login', model.focus === 2);
    const cancelStart = loginEnd + 4;
    const cancelEnd   = cancelStart + btnVW('Cancel', model.focus === 3);
    if (col >= loginStart  && col < loginEnd)   return 2;
    if (col >= cancelStart && col < cancelEnd)  return 3;
  }

  return null;
}
