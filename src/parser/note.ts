import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { ActiontrackError } from "../domain/errors.js";
import { EXIT } from "../domain/exit-codes.js";
import type { Note, SkipReport } from "../domain/types.js";
import { dateFromFilename, parseHeader } from "./header.js";

/** Note reading (specs/01-note-parsing; FRD D5, D22, D29, D55, D57, D64, D65; plan Q-01, Q-02, Q-03, Q-14, Q-17, Q-18). */

/** The six whole-note skip reasons (FRD D65.1 as amended by plan Q-02). Tests assert these exact strings. */
export const SKIP_REASONS = {
  emptyFile: "empty file",
  notUtf8: "not valid UTF-8",
  missingDate: "missing date",
  unparseableDate: "unparseable date",
  unreadableFile: "unreadable file",
} as const;

export type NoteResult = { ok: true; note: Note } | { ok: false; skip: SkipReport };

/**
 * Reads one note. Checks run in order and stop at the first failure: readable, valid UTF-8,
 * non-empty, header date (FRD D22.3). A UTF-8 BOM is stripped and CRLF is treated as LF (D55).
 * Never throws (NFR-R1).
 */
export function readNote(filePath: string): NoteResult {
  const file = basename(filePath);
  const skip = (reason: string): NoteResult => ({ ok: false, skip: { file, reason } });

  let buffer: Buffer;
  try {
    buffer = readFileSync(filePath);
  } catch {
    return skip(SKIP_REASONS.unreadableFile);
  }

  let text: string;
  try {
    // TextDecoder strips a leading BOM by default (FRD D55.1).
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return skip(SKIP_REASONS.notUtf8);
  }

  text = text.replace(/\r\n/g, "\n");
  if (text.trim() === "") return skip(SKIP_REASONS.emptyFile);

  try {
    const header = parseHeader(text);
    if (header.unparseableDate !== undefined) return skip(SKIP_REASONS.unparseableDate);
    const meetingDate = header.date ?? dateFromFilename(file);
    if (meetingDate === null) return skip(SKIP_REASONS.missingDate);
    return { ok: true, note: { file, meetingDate, attendees: header.attendees, body: text } };
  } catch {
    return skip(SKIP_REASONS.unreadableFile);
  }
}

/** Plain code-unit comparison so the order is the same on every OS (NFR-D3). */
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Top-level `.md` files of the folder, sorted by name. Matching is case-insensitive (plan Q-03).
 * Subfolders and other files are counted as ignored. A missing or unreadable folder throws
 * ActiontrackError with exit 2 (FRD D20.3, plan Q-18).
 */
export function listNoteFiles(folder: string): { notes: string[]; ignored: number } {
  let entries;
  try {
    if (!statSync(folder).isDirectory()) throw new Error("not a directory");
    entries = readdirSync(folder, { withFileTypes: true });
  } catch {
    throw new ActiontrackError(`Folder not found or not readable: ${folder}`, EXIT.USAGE);
  }
  const notes: string[] = [];
  let ignored = 0;
  for (const entry of entries) {
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) notes.push(entry.name);
    else ignored++;
  }
  notes.sort(byCodeUnit);
  return { notes, ignored };
}

/** Absolute path of a note inside the folder. */
export function notePath(folder: string, name: string): string {
  return join(folder, name);
}
