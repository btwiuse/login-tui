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
  dispatch: (msg: Msg) => void;
}

/** Create a zustand store for the given initial terminal size. */
export function createAppStore(cols: number, rows: number) {
  return createStore<AppState>((set, get) => ({
    model: init(cols, rows),
    dispatch(msg: Msg) {
      const next = update(msg, get().model);
      if (next !== get().model) set({ model: next });
    },
  }));
}
