// ═══════════════════════════════════════════════════════════════════════
//  TEA — init
//  Returns the initial Model for a given terminal size.
// ═══════════════════════════════════════════════════════════════════════

import type { Model } from './model.ts';

export function init(cols: number, rows: number): Model {
  return { username: '', password: '', focus: 0, message: '', done: false, cols, rows };
}
