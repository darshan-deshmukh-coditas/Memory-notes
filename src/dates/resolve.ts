import { UsageError } from "../domain/errors.js";
import type { ActionItem, IsoDate, ItemStatus } from "../domain/types.js";
import {
  MONTHS,
  WEEKDAYS,
  addDays,
  compareIso,
  isIsoDate,
  lastDayOfMonth,
  makeIso,
  parseIso,
  subtractMonths,
  weekdayIndex,
  yearOf,
} from "./calendar.js";

/** Due wording resolution (specs/02-date-resolution; FRD D8 to D10, D33, D34, D36, D48, D49, D66). */

export type DueResolution =
  | { kind: "date"; date: IsoDate; warning?: string }
  | { kind: "flagged"; wording: string };

export interface DuePhraseResult {
  /** Task text with the resolved phrase and its joining dash or comma removed (FRD D49). */
  task: string;
  due: IsoDate | null;
  dueFlagged: boolean;
  warning?: string;
}

const MONTH_LOOKUP = new Map<string, number>();
MONTHS.forEach((name, i) => {
  MONTH_LOOKUP.set(name, i + 1);
  MONTH_LOOKUP.set(name.slice(0, 3), i + 1);
});
MONTH_LOOKUP.set("sept", 9);

const WEEKDAY_LOOKUP = new Map<string, number>();
WEEKDAYS.forEach((name, i) => {
  WEEKDAY_LOOKUP.set(name, i);
  WEEKDAY_LOOKUP.set(name.slice(0, 3), i);
});

function monthNumber(word: string): number | undefined {
  return MONTH_LOOKUP.get(word);
}

/** `1st`, `2nd`, `3rd`, `4th`, `11th`, `21st`: the suffix must match its number (specs/02 OQ-9). */
function ordinalOk(n: number, suffix: string): boolean {
  if (suffix === "") return true;
  const tens = n % 100;
  const expected =
    tens >= 11 && tens <= 13 ? "th" : (({ 1: "st", 2: "nd", 3: "rd" }) as Record<number, string>)[n % 10] ?? "th";
  return suffix === expected;
}

/** `4 mar`, `4th march 2026`, `mar 4`, `march 4th, 2026`. A missing year uses the meeting year with the six-month rollover (FRD D34). */
function resolveDayMonth(text: string, meeting: IsoDate): IsoDate | null {
  const dmy = /^(\d{1,2})(st|nd|rd|th)? ([a-z]+)(?:,? (\d{4}))?$/.exec(text);
  const mdy = /^([a-z]+) (\d{1,2})(st|nd|rd|th)?(?:,? (\d{4}))?$/.exec(text);
  let day: number;
  let suffix: string;
  let month: number | undefined;
  let yearText: string | undefined;
  if (dmy) {
    day = Number(dmy[1]);
    suffix = dmy[2] ?? "";
    month = monthNumber(dmy[3] ?? "");
    yearText = dmy[4];
  } else if (mdy) {
    day = Number(mdy[2]);
    suffix = mdy[3] ?? "";
    month = monthNumber(mdy[1] ?? "");
    yearText = mdy[4];
  } else {
    return null;
  }
  if (month === undefined || !ordinalOk(day, suffix)) return null;

  if (yearText !== undefined) return makeIso(Number(yearText), month, day);

  const year = yearOf(meeting);
  const candidate = makeIso(year, month, day);
  if (!candidate) return null;
  // Exactly six months before the meeting does not roll; earlier than that does (specs/02 OQ-12).
  if (compareIso(candidate, subtractMonths(meeting, 6)) < 0) return makeIso(year + 1, month, day);
  return candidate;
}

/** Resolves one wording (no due keyword) against the meeting date. Null when it does not resolve. */
function resolveWording(raw: string, meeting: IsoDate): { date: IsoDate; warning?: string } | null {
  const text = raw.trim().replace(/[.,]+$/, "").replace(/\s+/g, " ").toLowerCase();
  if (text === "") return null;

  if (isIsoDate(text)) return { date: text };
  if (text === "tomorrow" || text === "eod tomorrow") return { date: addDays(meeting, 1) };
  if (text === "eod") return { date: meeting };
  if (text === "eom" || text === "end of month") return { date: lastDayOfMonth(meeting) };

  // ISO week: Monday to Sunday. "next week" is the week after the meeting's week (specs/02 OQ-3).
  const meetingMonday = addDays(meeting, -weekdayIndex(meeting));
  const followingMonday = addDays(meetingMonday, 7);
  if (text === "next week") return { date: followingMonday };
  if (text === "end of next week") return { date: addDays(followingMonday, 4) };

  const nextWeekday = /^next ([a-z]+)$/.exec(text);
  if (nextWeekday) {
    const idx = WEEKDAY_LOOKUP.get(nextWeekday[1] ?? "");
    return idx === undefined ? null : { date: addDays(followingMonday, idx) };
  }

  // A bare weekday is the next occurrence strictly after the meeting day (FRD D8.2).
  const bare = WEEKDAY_LOOKUP.get(text);
  if (bare !== undefined) {
    for (let n = 1; n <= 7; n++) {
      const cand = addDays(meeting, n);
      if (weekdayIndex(cand) === bare) return { date: cand };
    }
    return null;
  }

  // Optional leading weekday: `Wed 16 Sep`. The explicit date wins; a mismatch is a warning (FRD D33.4).
  let datePart = text;
  let weekdayWord: string | undefined;
  const lead = /^([a-z]+) (.+)$/.exec(text);
  if (lead && WEEKDAY_LOOKUP.has(lead[1] ?? "")) {
    weekdayWord = lead[1];
    datePart = lead[2] ?? "";
  }

  const resolved = resolveDayMonth(datePart, meeting);
  if (!resolved) return null;
  if (weekdayWord === undefined) return { date: resolved };
  const want = WEEKDAY_LOOKUP.get(weekdayWord) ?? 0;
  if (weekdayIndex(resolved) !== want) {
    return {
      date: resolved,
      warning: `weekday "${weekdayWord}" does not match ${resolved}; the explicit date was used`,
    };
  }
  return { date: resolved };
}

/** Resolves one due wording (one phrase) against the meeting date (FRD D8, D9, D10, D33). */
export function resolveDue(wording: string, meetingDate: IsoDate): DueResolution {
  const r = resolveWording(wording, meetingDate);
  if (!r) return { kind: "flagged", wording };
  return r.warning ? { kind: "date", date: r.date, warning: r.warning } : { kind: "date", date: r.date };
}

const KEYWORD_RE = /(^|\s)(by|due|on|from|for)\s+/gi;
const SEPARATOR_RE = /\s[—–-]\s|[,;]/;
const WORD_RE = /\S+/g;

interface Hit {
  start: number;
  end: number;
  date: IsoDate;
  warning?: string;
}

/**
 * Finds due phrases in one task text (specs/02 rules 3 to 7; FRD D48, D49). The last phrase that
 * resolves is the due date and is removed with its joining dash or comma. A `by`/`due` phrase (or
 * `for <month>`) that fails flags the item unless a later phrase resolves (D48.2). `on`/`from`
 * phrases that do not resolve are plain text and never flag (D48.3).
 */
export function findDuePhrase(text: string, meetingDate: IsoDate): DuePhraseResult {
  const resolvedHits: Hit[] = [];
  const failed: number[] = [];

  KEYWORD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = KEYWORD_RE.exec(text)) !== null) {
    const keyword = (m[2] ?? "").toLowerCase();
    const kwStart = m.index + (m[1] ?? "").length;
    const bodyStart = m.index + m[0].length;
    const rest = text.slice(bodyStart);
    const sep = SEPARATOR_RE.exec(rest);
    const body = text.slice(bodyStart, bodyStart + (sep ? sep.index : rest.length));
    const tokens = [...body.matchAll(WORD_RE)];

    if (keyword === "for") {
      // `for <month name>` only flags when it fails. `for 4 Mar` stays as plain text (specs/02 OQ-7).
      const first = (tokens[0]?.[0] ?? "").toLowerCase();
      if (monthNumber(first) !== undefined && !resolveWording(body.trim(), meetingDate)) failed.push(kwStart);
      continue;
    }

    let hit: Hit | undefined;
    for (let n = tokens.length; n >= 1 && !hit; n--) {
      const cand = tokens
        .slice(0, n)
        .map((t) => t[0])
        .join(" ");
      const r = resolveWording(cand, meetingDate);
      const last = tokens[n - 1];
      if (r && last && last.index !== undefined) {
        const end = bodyStart + last.index + last[0].length;
        hit = { start: kwStart, end, date: r.date, ...(r.warning ? { warning: r.warning } : {}) };
      }
    }
    if (hit) resolvedHits.push(hit);
    else if (keyword === "by" || keyword === "due") failed.push(kwStart);
  }

  const last = resolvedHits[resolvedHits.length - 1];
  const dueFlagged = failed.some((start) => last === undefined || start > last.start);
  if (!last) return { task: text.trim(), due: null, dueFlagged };

  const task = cleanJoin(text.slice(0, last.start), text.slice(last.end));
  return {
    task,
    due: last.date,
    dueFlagged,
    ...(last.warning ? { warning: last.warning } : {}),
  };
}

/** Joins the text on each side of a removed phrase, dropping the dash or comma that joined it (FRD D49). */
function cleanJoin(left: string, right: string): string {
  const l = left.replace(/[\s—–,;-]+$/, "");
  const r = right.replace(/^[\s—–,;-]+/, "");
  return (l && r ? `${l} ${r}` : `${l}${r}`).replace(/\s+/g, " ").trim();
}

/** Parse a command-line date: ISO exactly, or `4 Mar` / `Mar 4` with the year rule (FRD D31.6, D38). */
export function parseCliDate(input: string, today: IsoDate): IsoDate {
  const text = input.trim();
  const iso = parseIso(text);
  if (iso) return iso;
  const resolved = resolveDayMonth(text.toLowerCase().replace(/\s+/g, " "), today);
  if (resolved) return resolved;
  throw new UsageError(
    `Invalid date "${input}". Use YYYY-MM-DD (for example 2026-03-04) or a month and day (for example "Mar 4").`,
  );
}

/** Status at read time (FRD D1, D44). Overdue is never stored (ADR 0002). */
export function statusOf(item: Pick<ActionItem, "status" | "due">, today: IsoDate): ItemStatus {
  if (item.status === "done") return "done";
  if (item.due !== null && compareIso(item.due, today) < 0) return "overdue";
  return "open";
}
