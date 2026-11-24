import { NotImplementedError } from "../../domain/errors.js";
import type { ExitCode } from "../../domain/exit-codes.js";
import type { Deps } from "../deps.js";

export interface DoneOptions {
  id: number;
  store?: string | undefined;
}

/** Updates the store only, never the source note (D32.1). Unknown id: exit 2. Already done: message, exit 0. */
export async function done(_opts: DoneOptions, _deps: Deps): Promise<ExitCode> {
  throw new NotImplementedError("done command (FRD section 5, D32)");
}
