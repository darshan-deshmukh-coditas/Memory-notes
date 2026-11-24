# Plan: spec 11, CLI conventions

Status: planning only. No code changed by this document.
Source of truth: `spec.md` in this folder, `docs/FRD.md` section 11, `docs/NFRD.md`, `docs/TRACEABILITY.md`.

## Goal

Make the cross-cutting rules that every command shares true in code and in tests: program name and the four commands, global options (`--store`, `--today`), environment variables, stdout versus stderr, exit codes 0 to 4 with highest-wins, the single error-to-exit mapping in `cli/index.ts`, the injected clock, and platform behaviour on Windows, macOS and Linux.

## Current state (checked against the code)

| Convention | Spec ref | Code today | Gap |
|---|---|---|---|
| Four commands | NFR-U1 | `src/cli/index.ts` registers `ingest`, `list`, `done`, `followup` | None |
| `--store` on all commands | D17.2, D59 | Added per command via `storeOpt()` | None (works, but not "global" in commander terms) |
| `--today` on all four commands | D54.1 | Only on `list` and `followup` | `ingest` and `done` lack `--today` |
| `--today` feeds the clock | NFR-M2, D1.3 | `deps.clock` is always `systemClock`; `--today` value is passed to commands as a string | `index.ts` must build a `fixedClock(value)` per run when `--today` is given |
| Exit code 4 | D62.1 | `src/domain/exit-codes.ts` has no `INTERNAL` | Add `INTERNAL: 4` |
| Unexpected error exit | D62.1 | Catch-all sets `EXIT.WARNINGS` (1) | Must set 4 and print a clear stderr message |
| Bad arguments exit | D20.3 | Commander parse errors (unknown command, unknown flag, missing argument, bad `--status` choice, `parseId` failure) exit 1 by default | Need `exitOverride` or equivalent so these exit 2 |
| Error mapping in one place | spec 11 item 6 | Only `index.ts` maps `ActiontrackError` to codes | Commands return `ExitCode` directly; see decision D272 |
| Streams | NFR-O3, D30.3 | `out` and `err` are injected through `Deps`; `console.log` and `console.error` only in `index.ts` | None |
| No log file | NFR-O3, N4 | No log code exists | Add a test that proves none is created |
| Injected clock | NFR-M2 | `clock.ts` defines `Clock`, `systemClock`, `fixedClock` | Confirm no other module calls `new Date()` (only `clock.ts` does, today) |
| `NotImplementedError` | CLAUDE.md scaffold rule | Mapped to exit 2 in `index.ts` | Delete the mapping and the class once every command is implemented |
| Tests | spec 11 Tests row | `tests/unit/commands.test.ts` has no conventions block | Add a `describe("CLI conventions")` block |

Note: `src/cli/index.ts` runs `program.parseAsync(process.argv)` at import time. In-process tests cannot call it without side effects. See the design approach.

## Scope

In scope:
- Program name, command set, `--help` on every command (NFR-U4).
- Global `--store` and `--today` handling, `--today` validation (D54.1).
- Environment variables `ACTIONTRACK_STORE` and `ACTIONTRACK_GMAIL_MCP_CMD`, and nothing else.
- Stdout for results, stderr for warnings and errors, no log file.
- Exit code table 0 to 4 and highest-wins (D20, D53.1, D62).
- Error classes in `domain/errors.ts`, the one mapping in `cli/index.ts`.
- Injected clock and the rule that only `clock.ts` reads the system date.
- Windows, macOS and Linux: `node:path`, CRLF accepted in notes (D55), suite runs on all three (NFR-C1).
- Output ordering rule: `list` order is spec 07's; this spec only requires that the same input gives the same output order (NFR-A9, D15.3).

Out of scope:
- Per-command options and their validation (specs 06 to 09).
- Store file format and atomic write (spec 05).
- Gmail connector internals (spec 10).
- Note parsing and dates (specs 01 to 04).

## Requirement map

| ID | Rule (one line) | Module | Test ID(s) |
|---|---|---|---|
| NFR-U1 | Binary `actiontrack` with `ingest`, `list`, `done`, `followup` | `cli/index.ts` | TC-01, TC-02 |
| NFR-U2 | `--owner`, `--status open\|done\|overdue`, `--due-before` exist as named | `cli/index.ts` | TC-03 |
| NFR-U3 | Bad argument: clear message naming what was wrong and the valid options; exit 2 | `cli/index.ts`, `domain/errors.ts` | TC-04, TC-05, TC-06 |
| NFR-U4 | `--help` describes each command and option | `cli/index.ts` | TC-07, TC-08 |
| NFR-U5 | Terminal-readable output; JSON via `--json` (D15.5) | `cli/commands/list.ts` (spec 07) | TC-09 |
| NFR-U6 | Skip report visible during or after ingest | `cli/commands/ingest.ts` (spec 06) | TC-10 |
| D54.1 | `--today YYYY-MM-DD` on all four commands; invalid value exit 2 | `cli/index.ts` | TC-11 to TC-14 |
| D17.2 | `--store` and `ACTIONTRACK_STORE` override the default path | `cli/index.ts`, `store/store.ts` | TC-15, TC-16, TC-17 |
| D59.1 | Default store resolved from cwd on every run | `store/store.ts` | TC-18 |
| D20 | Exit codes 0, 1, 2, 3 meaning as in spec | `domain/exit-codes.ts`, `cli/index.ts` | TC-19 to TC-22 |
| D53.1 | Highest applicable code wins | `cli/index.ts` (and commands for ingest, followup) | TC-23 |
| D62.1 | Unexpected internal error: exit 4, stderr message, store unchanged | `cli/index.ts`, `domain/exit-codes.ts` | TC-24, TC-25 |
| D62.2 | 4 beats 3, 2, 1 | `cli/index.ts` | TC-26 |
| NFR-O3 | Warnings and errors to stderr; results to stdout | `cli/deps.ts`, `cli/index.ts` | TC-27, TC-28 |
| N4 | No log file is created | whole CLI | TC-29 |
| D30.3 | Skip warnings on stderr; exit 1 when anything skipped | `cli/commands/ingest.ts` (spec 06) | TC-30 |
| D65.3 | Tests assert content, not wording, except fixed strings | `tests/unit/commands.test.ts` | TC-31 |
| NFR-M2 | A fixed clock gives repeatable overdue results | `clock.ts`, `cli/index.ts` | TC-32, TC-33 |
| D1.3 | "Today" is the system local date when `--today` is absent | `clock.ts` | TC-34 |
| NFR-C1, N3 | Paths via `node:path`; suite runs on Windows, macOS, Linux | all | TC-35, TC-36 |
| NFR-O1 | Each command prints what it did (counts, ids) on stdout | each command | TC-37 |
| D55 | CRLF and LF treated alike (conventions point only) | `parser/note.ts` | TC-38 |
| NFR-C4 | Timezone and locale rule for dates | `clock.ts` | TC-39 (uses D276) |
| spec 11 item 6 | Only `cli/index.ts` maps errors to exit codes | `cli/index.ts` | TC-40 |
| spec 11 item 8 | No module other than `clock.ts` reads the system date | `clock.ts` | TC-41 |
| spec 11 item 4 | Only `ACTIONTRACK_STORE` and `ACTIONTRACK_GMAIL_MCP_CMD` are read | `cli/index.ts`, `store/store.ts` | TC-42 |

## Design approach

1. **One exit-code mapping.** `cli/index.ts` is the only file that turns an error or result into a process exit code. Commands return a value (an `ExitCode` or a result object, see D272) and throw `ActiontrackError` subclasses. The catch block maps:
   - `ActiontrackError` gives `e.exitCode` and `error: <message>` on stderr.
   - Commander parse errors give exit 2.
   - Anything else gives exit 4 and `unexpected error: <message>` on stderr.
   - `NotImplementedError` is removed after the last command is implemented.
2. **Add `INTERNAL: 4`** to `domain/exit-codes.ts` (already named in `specs/README.md`). Add `InternalError extends ActiontrackError` in `domain/errors.ts` with exit 4, so the mapping is uniform.
3. **Highest wins.** Commands that can produce several codes (`ingest`, `followup --all`) compute the maximum themselves. `index.ts` only sets `process.exitCode` once.
4. **Shared stderr reporter.** `Deps.err` is the only way to write a warning or error. `index.ts` builds it as `console.error`. Tests inject an array-collecting fake.
5. **Testable entry point.** Split `index.ts` into `buildProgram(deps): Command` and `run(argv, deps): Promise<ExitCode>`, with the bin entry only calling `run(process.argv, realDeps)`. This keeps `index.ts` the only place real dependencies are built (CLAUDE.md) and lets tests call `run` in process with fake deps. Where a test needs the real process, spawn `node --import tsx src/cli/index.ts` with a temp working directory.
6. **`--today` handling.** When `--today` is given, `index.ts` validates it (ISO `YYYY-MM-DD`, real calendar date, see D271) and passes `{ ...deps, clock: fixedClock(value) }` into the command. Invalid values exit 2 before any command runs, so no store is read or written.
7. **Store path resolution order** (spec 05 states it, FRD D17.2 does not): `--store` flag, then `ACTIONTRACK_STORE`, then the default `.actiontrack/items.json` relative to the current working directory (D59.1). Recorded as decision D264.
8. **Global options.** Use one helper that adds `--store` and `--today` to every command, so the four commands cannot drift apart.
9. **Paths.** Use `node:path` (`join`, `resolve`, `isAbsolute`) everywhere. Never build paths by string concatenation with `/`.

## Dependencies

- Specs 01 to 10 use every convention here: options (06 to 09), exit codes (06 to 09), stderr for skips (06), JSON (07), store path (05), connector env var (10).
- `domain/errors.ts` and `domain/exit-codes.ts` are used by specs 01 to 10. Change them first.
- `clock.ts` is used by date resolution (spec 02) and by every command for "today".
- `specs/README.md` lists `INTERNAL: 4` as a required type change (D62).
- Changing a convention here changes the acceptance results of specs 06 to 09. Re-run the sample checks after any change.

## Risks

| Risk | Effect | Mitigation |
|---|---|---|
| Windows path quoting in tests and docs (`C:\...` and spaces) | Tests fail only on Windows | Build paths with `node:path`; add a test folder name with a space (TC-35) |
| Commander version quirks (13.x): parse errors call `process.exit` directly, and help output goes to stdout or stderr depending on the error path | Exit codes and streams differ from spec | Use `exitOverride` and `configureOutput({ writeErr })`; pin behaviour with TC-04 to TC-08 |
| Stdout and stderr mixing breaks `--json` | Scripts parse warnings as JSON | Warnings only ever go through `Deps.err`; TC-28 checks stdout is valid JSON when warnings exist |
| Broken pipe on stdout (`actiontrack list --json \| head`) | Unexpected error, exit 4 for a benign case | See D275 |
| `process.exitCode` set in several places | Wrong code wins silently | Single assignment at the end of `run` (design item 3) |
| In-process tests importing `index.ts` run the CLI at import time | Test runner exits early or hangs | Design item 5 |
| `systemClock` used in tests by accident | Non-repeatable overdue results | Lint-style test TC-41 greps for `new Date(` outside `clock.ts` |

## Decisions

Each decision below is settled. D264 and D270 to D273 were answered by the user; the others were settled from the earlier list of open points.

- **D264** `--store` beats `ACTIONTRACK_STORE`, which beats the default path.
- **D265** An empty `ACTIONTRACK_STORE` is treated as unset.
- **D266** A relative `--store` or `ACTIONTRACK_STORE` path is resolved against the current working directory.
- **D267** With `--json`, stdout holds only the JSON document; warnings and errors stay on stderr.
- **D268** No `--version` or `-V`; an unknown flag gives exit 2.
- **D269** No command given: help is printed to stdout, exit 2.
- **D270** Unknown command or unknown flag: exit 2.
- **D271** `--today` with a valid format but an impossible date (`2026-02-30`): exit 2, message gives the valid format.
- **D272** Commands throw `ActiontrackError` subclasses for errors and may return `ExitCode` for OK and WARNINGS only; only `cli/index.ts` maps them to exit codes.
- **D273** `followup` with neither or both of `<owner>` and `--all`: exit 2, message names the two valid forms.
- **D274** `ACTIONTRACK_GMAIL_MCP_CMD` unset when `followup` runs: exit 2, message names the variable.
- **D275** EPIPE on stdout exits 0 silently; any other stdout write error is exit 4.
- **D276** "Today" is the system local date (D1.3); `--today` overrides it. NFR-C4 is closed by D1.3.
- **D277** `list` prints full task text with no truncation, as plain aligned columns (D65.2).
- **D278** `list` breaks equal due dates by ascending id.
- **D279** Default store is `.actiontrack/items.json` under the working directory (D59.1); spec 05 owns the exact name.

Settled, not open (for reference): date and "today" source (D1.3, D54.1), exit code set (D20, D62), no colour in output (D65.2), `--json` for `list` (D15.5), stderr for warnings (NFR-O3), no log file (N4), supported OS and Node 22 (N3, `package.json` engines).

## Done when

- Every requirement row in the map has a passing test (see `testcases.md`).
- `npm run check` passes on Windows (the dev machine) and in CI on macOS and Linux, if available (NFR-C1).
- `docs/TRACEABILITY.md` row "Cross-cutting: store, CLI" and rows NFR-U*, NFR-O3, NFR-C1 show `done`.
- Decisions D264 to D279 are implemented and each has a passing test.
