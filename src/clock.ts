import { isIsoDate } from "./dates/calendar.js";
import { UsageError } from "./domain/errors.js";
import type { IsoDate } from "./domain/types.js";

/** Injectable "today" so overdue logic and date resolution are testable (FRD D1.3, NFR-M2). */
export interface Clock {
  today(): IsoDate;
}

/** System local date (FRD D1.3). */
export const systemClock: Clock = {
  today() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  },
};

export function fixedClock(date: IsoDate): Clock {
  return { today: () => date };
}

/** `--today` if given (ISO only, FRD D54.1), otherwise the clock. An invalid value is a usage error (exit 2). */
export function resolveToday(flag: string | undefined, clock: Clock): IsoDate {
  if (flag === undefined) return clock.today();
  if (!isIsoDate(flag.trim())) {
    throw new UsageError(`Invalid --today "${flag}". Use YYYY-MM-DD, for example 2026-10-20.`);
  }
  return flag.trim();
}
