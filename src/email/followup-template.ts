import { NotImplementedError } from "../domain/errors.js";
import type { ActionItem, IsoDate } from "../domain/types.js";

/**
 * Subject `Follow-up: your open action items (N)`, greeting by first name, Overdue list then
 * Open list (task, due, meeting date, source), polite closing, NO signature (FRD D19, D39.3).
 */
export function renderFollowup(
  _owner: string,
  _items: ActionItem[],
  _today: IsoDate,
): { subject: string; body: string } {
  throw new NotImplementedError("renderFollowup (FRD D19)");
}
