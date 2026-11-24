import type { IsoDate } from "../domain/types.js";

/** Pure calendar arithmetic on ISO dates. UTC is used internally; no timezone is involved. */

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
  if (m === 2) return isLeap(y) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

/** The ISO date for a real calendar date, or null for an impossible one. */
export function makeIso(y: number, m: number, d: number): IsoDate | null {
  if (!Number.isInteger(y) || y < 1 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Parses `YYYY-MM-DD` and checks that it is a real calendar date. */
export function parseIso(s: string): IsoDate | null {
  const m = ISO_RE.exec(s);
  if (!m) return null;
  return makeIso(Number(m[1]), Number(m[2]), Number(m[3]));
}

export function isIsoDate(s: string): boolean {
  return parseIso(s) !== null;
}

function parts(iso: IsoDate): { y: number; m: number; d: number } {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`not an ISO date: ${iso}`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function fromUtc(ms: number): IsoDate {
  const dt = new Date(ms);
  return makeIso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()) ?? "0001-01-01";
}

export function addDays(iso: IsoDate, n: number): IsoDate {
  const { y, m, d } = parts(iso);
  return fromUtc(Date.UTC(y, m - 1, d + n));
}

/** Monday = 0 ... Sunday = 6. */
export function weekdayIndex(iso: IsoDate): number {
  const { y, m, d } = parts(iso);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function lastDayOfMonth(iso: IsoDate): IsoDate {
  const { y, m } = parts(iso);
  return makeIso(y, m, daysInMonth(y, m)) ?? iso;
}

/** Subtracts calendar months, clamping the day to the end of the target month (specs/02 OQ-12). */
export function subtractMonths(iso: IsoDate, n: number): IsoDate {
  const { y, m, d } = parts(iso);
  const total = y * 12 + (m - 1) - n;
  const ty = Math.floor(total / 12);
  const tm = (total % 12) + 1;
  return makeIso(ty, tm, Math.min(d, daysInMonth(ty, tm))) ?? iso;
}

export function yearOf(iso: IsoDate): number {
  return parts(iso).y;
}

/** ISO strings sort correctly as text, so this is a plain comparison. */
export function compareIso(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
