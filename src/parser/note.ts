import { NotImplementedError } from "../domain/errors.js";
import type { Note, SkipReport } from "../domain/types.js";

export type NoteResult = { ok: true; note: Note } | { ok: false; skip: SkipReport };

/**
 * Read one note file. Whole-note skip when: empty, not valid UTF-8, date missing after
 * fallback, or date unparseable (FRD D5.1, D22). Must never throw (NFR-R1).
 */
export function readNote(_file: string): NoteResult {
  throw new NotImplementedError("readNote (FRD D5.1, D22)");
}

/** Top-level `.md` files only; others and subfolders are counted as ignored (FRD D29). */
export function listNoteFiles(_folder: string): { notes: string[]; ignored: number } {
  throw new NotImplementedError("listNoteFiles (FRD D29, D35.3)");
}
