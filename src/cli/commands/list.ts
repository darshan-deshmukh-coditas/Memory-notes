import { NotImplementedError } from "../../domain/errors.js";
import type { ExitCode } from "../../domain/exit-codes.js";
import type { ItemStatus } from "../../domain/types.js";
import type { Deps } from "../deps.js";

export interface ListOptions {
  owner?: string | undefined;
  status?: ItemStatus | undefined;
  dueBefore?: string | undefined;
  json?: boolean | undefined;
  today?: string | undefined;
  store?: string | undefined;
}

/**
 * Default shows open + overdue (D15.1). Filters AND together (D31.4). Table columns:
 * id, owner, task, due, status, source(s), sorted by due with undated last (D15). `--json` for machines.
 * No match prints `No items match.` and exits 0 (D31.5).
 */
export async function list(_opts: ListOptions, _deps: Deps): Promise<ExitCode> {
  throw new NotImplementedError("list command (FRD section 4, D15, D31)");
}
