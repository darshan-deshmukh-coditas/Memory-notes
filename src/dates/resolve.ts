import { NotImplementedError } from "../domain/errors.js";
import type { IsoDate } from "../domain/types.js";

export type DueResolution =
  | { kind: "date"; date: IsoDate; warning?: string }
  | { kind: "none" }
  | { kind: "flagged"; wording: string };

/**
 * Resolve due wording against the MEETING date (FRD D8.1). Rules:
 * - weekday: next occurrence strictly after the meeting day (D8.2)
 * - tomorrow; EOD = meeting date; EOM / end of month; next week = Monday of following week;
 *   next <weekday> = that weekday of following week; end of next week = Friday (D8, D9, D33)
 * - ISO and month-name dates, ordinals, weekday+date, by/from/on/due prefixes (D10, D33, D36)
 * - year missing: meeting year, rolled to next year if more than 6 months earlier (D34)
 * - slash dates like 03/04 are NOT guessed, so flagged (D10.3)
 * - weekday vs explicit date disagree: explicit date wins, with a warning (D33.4)
 */
export function resolveDue(_wording: string, _meetingDate: IsoDate): DueResolution {
  throw new NotImplementedError("resolveDue (FRD D8, D9, D10, D33, D34, D36)");
}

/** Parse a CLI date such as `--due-before` (ISO, `Mar 4`); year rule per FRD D38. */
export function parseCliDate(_input: string, _today: IsoDate): IsoDate {
  throw new NotImplementedError("parseCliDate (FRD D31.6, D38)");
}
