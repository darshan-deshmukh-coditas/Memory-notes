import { EXIT, type ExitCode } from "./exit-codes.js";

/** Error that maps to a CLI exit code and a user-facing message. */
export class ActiontrackError extends Error {
  constructor(
    message: string,
    readonly exitCode: ExitCode,
  ) {
    super(message);
    this.name = "ActiontrackError";
  }
}

export class UsageError extends ActiontrackError {
  constructor(message: string) {
    super(message, EXIT.USAGE);
  }
}

export class GmailError extends ActiontrackError {
  constructor(message: string) {
    super(message, EXIT.GMAIL);
  }
}

/** Placeholder thrown by scaffold stubs. Remove as each module is implemented. */
export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`Not implemented: ${what}`);
    this.name = "NotImplementedError";
  }
}
