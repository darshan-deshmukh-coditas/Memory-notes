import { NotImplementedError } from "../domain/errors.js";
import type { Attendee, IsoDate } from "../domain/types.js";

export interface ParsedHeader {
  /** `null` when no date is present at all (filename fallback applies, FRD D22.2). */
  date: IsoDate | null;
  /** Present-but-unparseable raw date text: the note is malformed (FRD D22.1). */
  unparseableDate?: string;
  attendees: Attendee[];
  /** 0-based line index where the body starts. */
  bodyStart: number;
}

/**
 * Parse YAML front matter OR labelled `Date:` / `Attendees:` lines (FRD D21).
 * Keys are case-insensitive. Accepted dates: YYYY-MM-DD, `9 September 2026`,
 * `Monday, 14 September 2026`. Attendees: `Full Name <email>`, email optional (D11.2).
 */
export function parseHeader(_text: string): ParsedHeader {
  throw new NotImplementedError("parseHeader (FRD D2, D11, D21, D22)");
}

/** Filename date fallback, only when no date is present at all (FRD D2.2, D22.2). */
export function dateFromFilename(_file: string): IsoDate | null {
  throw new NotImplementedError("dateFromFilename (FRD D2.2)");
}
