// ═══════════════════════════════════════════════════════════════════════
//  Zustand vanilla store — wraps the TEA model and dispatch logic.
//  Hosts subscribe to state changes for rendering and call dispatch to
//  feed events, eliminating per-host `let model` bookkeeping.
// ═══════════════════════════════════════════════════════════════════════

import { createStore } from 'zustand/vanilla';
import type { Model, Msg } from './model.ts';
import { init } from './init.ts';
import { update } from './update.ts';

export interface AppState {
  model: Model;
}

/**
 * Create a zustand store for the given initial terminal size.
 * Returns the store and a stable dispatch function.
 * dispatch is a plain closure (not part of store state) so destructuring it
 * is safe — it will never become a stale reference.
 */
export function createAppStore(cols: number, rows: number) {
  const store = createStore<AppState>()(() => ({ model: init(cols, rows) }));

  function dispatch(msg: Msg): void {
    const model = store.getState().model;
    const next = update(msg, model);
    if (next !== model) store.setState({ model: next });
  }

  return { store, dispatch };
}
