import { NotImplementedError } from "../domain/errors.js";
import type { ActionItem } from "../domain/types.js";

/**
 * Merge a freshly parsed item into the store (FRD D3, D13, D28, D39, D40).
 * Duplicate key = resolved owner + normalised task; ambiguous owners merge only on the same
 * first name. A merged item keeps ALL sources, the LATEST due date, stays done if any copy is
 * done, and shows the wording of the most recent note. Existing id and done status are kept.
 */
export function mergeItem(
  _existing: ActionItem[],
  _incoming: Omit<ActionItem, "id">,
): { items: ActionItem[]; merged: boolean } {
  throw new NotImplementedError("mergeItem (FRD D3, D13, D28, D39, D40)");
}
