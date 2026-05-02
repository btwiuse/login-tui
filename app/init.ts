// ═══════════════════════════════════════════════════════════════════════
//  TEA — init
//  Returns the initial Model for a given terminal size.
// ═══════════════════════════════════════════════════════════════════════

import type { Model } from './model.ts';
import { Focus } from './model.ts';

export function init(cols: number, rows: number): Model {
  return { username: '', password: '', focus: Focus.Username, message: '', done: false, cols, rows };
}
