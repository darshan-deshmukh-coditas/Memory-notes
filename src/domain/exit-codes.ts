/** Exit codes (FRD D20). */
export const EXIT = {
  OK: 0,
  WARNINGS: 1,
  USAGE: 2,
  GMAIL: 3,
} as const;
export type ExitCode = (typeof EXIT)[keyof typeof EXIT];
