// ═══════════════════════════════════════════════════════════════════════
//  Zustand vanilla store — wraps the TEA model and dispatch logic.
//  Analogous to bubbletea's tea.Program: it calls init(), runs the
//  dispatch loop (update + setState), and executes Cmds.
// ═══════════════════════════════════════════════════════════════════════

import { createStore } from 'zustand/vanilla';
import type { Model, Msg, Cmd } from './tea.ts';

export interface AppState {
  model: Model;
}

/**
 * Create a zustand store for the given initial model.
 * Analogous to `tea.NewProgram(model{})` in bubbletea.
 *
 * - Calls `initialModel.init()` and executes the returned Cmd (if any).
 * - Returns the store and a stable dispatch function.
 * - dispatch is a plain closure (not part of store state) so destructuring
 *   it is safe — it will never become a stale reference.
 */
export function createAppStore(initialModel: Model) {
  const store = createStore<AppState>()(() => ({ model: initialModel }));

  const dispatch = (msg: Msg): void => {
    const model = store.getState().model;
    const [next, cmd] = model.update(msg);
    if (next !== model) store.setState({ model: next });
    if (cmd) Promise.resolve(cmd()).then(dispatch);
  };

  // Execute the initial command returned by init() (mirrors bubbletea's program.Run)
  const initCmd: Cmd = initialModel.init();
  if (initCmd) Promise.resolve(initCmd()).then(dispatch);

  return { store, dispatch };
}
