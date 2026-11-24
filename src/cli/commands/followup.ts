import { NotImplementedError } from "../../domain/errors.js";
import type { ExitCode } from "../../domain/exit-codes.js";
import type { Deps } from "../deps.js";

export interface FollowupOptions {
  /** Mutually exclusive with `all` (D7). */
  owner?: string | undefined;
  all?: boolean | undefined;
  force?: boolean | undefined;
  today?: string | undefined;
  store?: string | undefined;
}

/**
 * Creates Gmail DRAFTS only, via DraftConnector. Never sends (FR-F5, NFR-S1).
 * Open + overdue items only (D7, D19); nothing to chase means no draft and a message (D7.3);
 * repeat run warns unless `--force` (D19.5); special-label owners skipped and counted (D16.3, D42.3);
 * recipient: attendee email, then owners file, else none with a warning (D6, D18).
 * Connector failure: clear error, exit 3, store untouched (D20).
 */
export async function followup(_opts: FollowupOptions, _deps: Deps): Promise<ExitCode> {
  throw new NotImplementedError("followup command (FRD section 6, D6, D7, D19, D20, D35)");
}
