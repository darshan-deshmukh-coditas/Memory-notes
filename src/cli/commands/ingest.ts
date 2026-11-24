import { NotImplementedError } from "../../domain/errors.js";
import type { ExitCode } from "../../domain/exit-codes.js";
import type { Deps } from "../deps.js";

export interface IngestOptions {
  folder: string;
  store?: string | undefined;
}

/**
 * Pipeline: listNoteFiles -> readNote -> extractItems -> resolveOwner -> resolveDue
 * -> normalizeTask -> mergeItem -> saveStore, then print the skip report and totals (FRD D30).
 * Exit 0 clean, 1 if anything was skipped, 2 if the folder is missing or has no notes (D20, D35.3).
 */
export async function ingest(_opts: IngestOptions, _deps: Deps): Promise<ExitCode> {
  throw new NotImplementedError("ingest command (FRD section 3, D13, D30)");
}
