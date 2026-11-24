import { EXIT, type ExitCode } from "./exit-codes.js";

/** Error that maps to a CLI exit code and a user-facing message (only cli/index.ts maps it). */
export class ActiontrackError extends Error {
  constructor(
    message: string,
    readonly exitCode: ExitCode,
  ) {
    super(message);
    this.name = "ActiontrackError";
  }
}

/** Bad arguments, missing folder, unknown id, ambiguous owner argument (exit 2). */
export class UsageError extends ActiontrackError {
  constructor(message: string) {
    super(message, EXIT.USAGE);
  }
}

/** Corrupt or wrong-version store. Never overwritten (FRD D59.4, D69.2). Exit 2. */
export class StoreError extends ActiontrackError {
  constructor(message: string) {
    super(message, EXIT.USAGE);
  }
}

/** Gmail connector failure (exit 3). Nothing is sent and stored data is untouched (FRD D20.5). */
export class GmailError extends ActiontrackError {
  constructor(message: string) {
    super(message, EXIT.GMAIL);
  }
}

/** Unexpected internal error, e.g. a failed write (exit 4, FRD D62.1). */
export class InternalError extends ActiontrackError {
  constructor(message: string) {
    super(message, EXIT.INTERNAL);
  }
}
