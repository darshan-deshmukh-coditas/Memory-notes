import { makeIso } from "../dates/calendar.js";
import type { Attendee, IsoDate } from "../domain/types.js";

/** Header parsing (specs/01-note-parsing; FRD D2, D11, D21, D22, D57, D63; plan Q-01, Q-09 to Q-16). Pure: no I/O. */

export interface ParsedHeader {
  /** `null` when no date key has a value (filename fallback applies, FRD D22.2). */
  date: IsoDate | null;
  /** Present-but-unparseable raw date text: the note is malformed (FRD D22.1). */
  unparseableDate?: string;
  attendees: Attendee[];
}

const MONTH_NAMES = [
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
];

/** `9 September 2026`: full English month names, case-insensitive (plan Q-11). */
function parseLongDate(value: string): IsoDate | null {
  const m = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(value);
  if (!m) return null;
  const month = MONTH_NAMES.indexOf((m[2] ?? "").toLowerCase()) + 1;
  if (month === 0) return null;
  return makeIso(Number(m[3]), month, Number(m[1]));
}

/** Accepted header date values: `YYYY-MM-DD`, `9 September 2026`, and the same with a leading `Weekday,` (FRD D21.2, D63.3). */
export function parseHeaderDate(raw: string): IsoDate | null {
  // The weekday word is dropped before parsing and never checked (FRD D63.3).
  const value = raw.trim().replace(/^[A-Za-z]+,\s+/, "");
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) return makeIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  return parseLongDate(value);
}

/** `Full Name` or `Full Name <email>`; comma split only; empty entries dropped (FRD D11.2, D63.2, plan Q-09). */
export function parseAttendees(raw: string): Attendee[] {
  const out: Attendee[] = [];
  for (const entry of raw.split(",")) {
    const text = entry.trim();
    if (text === "") continue;
    const m = /^(.*?)\s*<([^<>]*)>$/.exec(text);
    const name = (m ? m[1] ?? "" : text).trim();
    if (name === "") continue; // email-only entries are dropped (plan Q-09)
    const email = m ? (m[2] ?? "").trim() : "";
    out.push(email.includes("@") ? { name, email } : { name });
  }
  return out;
}

/** Splits a YAML flow list `[a, b]` into its entries. */
function flowList(value: string): string {
  return value.replace(/^\[/, "").replace(/\]$/, "");
}

function parseYaml(lines: string[], end: number): { date?: string; attendees?: string } {
  const found: { date?: string; attendees?: string } = {};
  for (let i = 1; i < end; i++) {
    const line = lines[i] ?? "";
    // `[^\n]*` (not `.*`) so a lone CR stays in the value (plan 01 Q-14).
    const m = /^([A-Za-z_]+):\s*([^\n]*)$/.exec(line);
    if (!m) continue;
    const key = (m[1] ?? "").toLowerCase();
    const value = (m[2] ?? "").trim();
    if (key === "date" && found.date === undefined) found.date = value;
    if (key === "attendees" && found.attendees === undefined) {
      if (value.startsWith("[")) {
        found.attendees = flowList(value);
      } else {
        // Block list: following `- name` lines.
        const items: string[] = [];
        for (let j = i + 1; j < end; j++) {
          const item = /^\s*-\s+(.*)$/.exec(lines[j] ?? "");
          if (!item) break;
          items.push((item[1] ?? "").trim());
        }
        found.attendees = items.join(",");
      }
    }
  }
  return found;
}

/**
 * Reads the header from the lead: the text before the first line that starts with `## `.
 * YAML front matter wins when it closes; otherwise labelled `Date:` / `Attendees:` lines are read.
 */
export function parseHeader(text: string): ParsedHeader {
  const lines = text.split("\n");
  let leadEnd = lines.findIndex((l) => l.startsWith("## "));
  if (leadEnd === -1) leadEnd = lines.length;

  let raw: { date?: string; attendees?: string } = {};
  if ((lines[0] ?? "").trimEnd() === "---") {
    const close = lines.findIndex((l, i) => i > 0 && i < leadEnd && l.trimEnd() === "---");
    if (close !== -1) {
      raw = parseYaml(lines, close);
    } else {
      raw = labelled(lines, leadEnd);
    }
  } else {
    raw = labelled(lines, leadEnd);
  }

  const attendees = parseAttendees(raw.attendees ?? "");
  const dateText = (raw.date ?? "").trim();
  if (dateText === "") return { date: null, attendees };
  const parsed = parseHeaderDate(dateText);
  if (parsed === null) return { date: null, unparseableDate: dateText, attendees };
  return { date: parsed, attendees };
}

/** Labelled lines in the lead. The first `Date:` and first `Attendees:` win (plan Q-16). */
function labelled(lines: string[], leadEnd: number): { date?: string; attendees?: string } {
  const found: { date?: string; attendees?: string } = {};
  for (let i = 0; i < leadEnd; i++) {
    const m = /^(date|attendees)\s*:([^\n]*)$/i.exec(lines[i] ?? "");
    if (!m) continue;
    const key = (m[1] ?? "").toLowerCase();
    const value = (m[2] ?? "").trim();
    if (key === "date" && found.date === undefined) found.date = value;
    if (key === "attendees" && found.attendees === undefined) found.attendees = value;
  }
  return found;
}

/** Filename date fallback: a leading, real `YYYY-MM-DD` only (FRD D57.1, plan Q-10). */
export function dateFromFilename(file: string): IsoDate | null {
  const base = file.split(/[\\/]/).pop() ?? file;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(base);
  if (!m) return null;
  return makeIso(Number(m[1]), Number(m[2]), Number(m[3]));
}
