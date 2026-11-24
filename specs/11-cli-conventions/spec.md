# Spec 11: CLI conventions

Rules shared by all four commands: names, options, output streams, exit codes, and the injected clock.

| Field | Value |
|---|---|
| Business reqs | BR-01 to BR-07, BR-11 |
| FRD | D1.3, D17.2, D20, D30.3, D53, D54, D59, D62, D65, D70 |
| NFRD | NFR-U1 to U6, R6, O1, O3, M2, C1, C4, N3 |
| Modules | `cli/index.ts` (the only place that builds real dependencies and maps errors to exit codes), `cli/deps.ts`, `domain/errors.ts`, `domain/exit-codes.ts`, `clock.ts` |
| Tests | `tests/unit/commands.test.ts` |

## Commands and options (NFR-U1, U2)
1. The program is `actiontrack` with four commands: `ingest <folder>`, `list`, `done <id>`, `followup <owner> | --all`.
2. Options per command are those in specs 06 to 09. `--help` describes every command and option (NFR-U4).
3. **Global options**: `--store <path>` (D17.2, D59) and `--today <YYYY-MM-DD>` (D54.1), accepted by all four commands. An invalid `--today` is exit 2 and the message gives the valid format.
4. **Environment**: `ACTIONTRACK_STORE` (store path), `ACTIONTRACK_GMAIL_MCP_CMD` (Gmail MCP server command). Nothing else.

## Streams (NFR-O3, D30.3)
5. Results (tables, summaries, JSON, draft lines) go to **stdout**. Warnings and errors go to **stderr**. There is no log file.
5a. Only the strings fixed by D65 (skip reasons, the `list` table shape) are exact. All other output wording is free, and tests assert content, not wording (D65.3).

## Exit codes (D20, D53)
| Code | Meaning |
|---|---|
| 0 | success |
| 1 | completed with warnings (skipped notes or lines, drafts with no recipient, repeat follow-up skipped, email conflict, malformed owners file) |
| 2 | bad arguments, missing folder, no notes found, unknown id, ambiguous or unknown owner argument, corrupt store |
| 3 | Gmail connector failure |
| 4 | unexpected internal error (a bug or an I/O failure, never malformed input) (D62.1) |

When several apply, the **highest** wins (D53.1, D62.2). Failures give a clear message that says what was wrong and, where there is a fixed set, the valid options (NFR-U3, NFR-R6). `domain/exit-codes.ts` must gain `INTERNAL: 4`.

## Errors and robustness (NFR-R1, CLAUDE.md conventions)
6. Code that can fail on user input returns results or throws an `ActiontrackError` subclass. **Only `cli/index.ts`** maps errors to exit codes and messages.
7. An unexpected internal error is caught at the top, reported on stderr, and exits 4 with the store left as it was (D62). Malformed input is **never** a crash (D5.3).

## The clock (NFR-M2, D1.3)
8. "Today" comes from an injected `Clock`. `cli/index.ts` supplies the system local date, or the `--today` value. No other module reads the system date.

## Platform (NFR-C1, N3)
9. Runs on Windows 10+, macOS and Linux (Node 22+). Paths use `node:path`. CRLF is accepted in notes (D55). The runtime and install method are not specified beyond Node 22 in `package.json`.

## Acceptance tests
- `NFR-U1`, `NFR-U2` each command and filter exists as named
- `NFR-U4` `--help` for each command
- `D54.1` `--today` on every command; invalid value is exit 2
- `D17.2` `--store` and `ACTIONTRACK_STORE`
- `NFR-O3` warnings and errors on stderr; results on stdout
- `D20`, `D53.1` exit codes, and highest wins
- `NFR-M2` a fixed clock gives repeatable overdue results
- `NFR-C1` the test suite runs on Windows, macOS and Linux
