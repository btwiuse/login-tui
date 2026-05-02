// ═══════════════════════════════════════════════════════════════════════
//  Internal — geometry helpers
//  Shared layout / sizing utilities used by both update (hit-testing)
//  and view (rendering).  Not part of the public API.
// ═══════════════════════════════════════════════════════════════════════

import type { Model } from './model.ts';
import { BOX_W, BOX_H, INPUT_W } from './ansi.ts';

/** Compute the top-left origin of the centred box (1-based terminal coords). */
export function layout(model: Model): { ROW0: number; COL0: number } {
  const blockH = BOX_H + 3;
  const ROW0 = Math.max(1, Math.floor((model.rows - blockH) / 2) + 1);
  const COL0 = Math.max(1, Math.floor((model.cols - BOX_W)  / 2) + 1);
  return { ROW0, COL0 };
}

/** Visual width (columns) of an input widget depending on focus state. */
export function inputVW(focused: boolean): number { return focused ? INPUT_W : INPUT_W + 2; }

/** Visual width (columns) of a button widget depending on focus state. */
export function btnVW(label: string, focused: boolean): number {
  return focused ? label.length + 2 : label.length + 4;
}
