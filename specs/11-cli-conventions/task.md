# Tasks: spec 11, CLI conventions

Order follows the CLAUDE.md workflow: find the ID, turn the `it.todo` into a failing test (red), implement (green), refactor, update `docs/TRACEABILITY.md`, run `npm run check`.
Test IDs (TC-xx) are defined in `testcases.md`. Decisions O-1 to O-16 are settled and recorded in the Decisions section of `plan.md`. Implement each task against the decision ID it names.
Dependency column: a task can start only when the listed tasks are done.

## Phase 0: record decisions (blocking for the parts that depend on them)

- [ ] **T01** Record each decision O-1 to O-16 (`plan.md` Decisions section) as a new decision `D77` or later in `docs/FRD.md` section 11, in the same change as the code. Spec: D77+ (new). File: `docs/FRD.md`. Test: none. Depends: none.
- [ ] **T02** Confirm the spec 05 and spec 09 statements that O-1 and O-10 touch, so the decision does not contradict them. Spec: D17.2, D59.1. File: `docs/FRD.md` (read only). Test: none. Depends: T01.

## Phase 1: red (failing tests first)

- [ ] **T03** Write the `describe("CLI conventions")` block in `tests/unit/commands.test.ts`. Replace the stubs with real tests named `[TC-xx] <ID>: ...` for TC-01 to TC-55 from `testcases.md`. Keep the `it.todo` entries for other commands untouched. Spec: NFR-U1..U6, D54.1, D17.2, D20, D53.1, D62, NFR-O3, N4, NFR-M2, D1.3, NFR-C1. File: `tests/unit/commands.test.ts`. Test: TC-01..TC-55 (all red). Depends: T01.
- [ ] **T04** Add the in-process test helper: a collecting fake `Deps` (`out`, `err` arrays, `env` object, `clock`, `connector` returning a fake `DraftConnector`), and a temp-directory helper using `node:os` `tmpdir()` and `node:path` `join`. File: `tests/unit/commands.test.ts` (or `tests/unit/support/cli-harness.ts` if the file gets too long). Test: used by TC-01..TC-55. Depends: T03.
- [ ] **T05** Add the spawn helper for process-level tests: run `process.execPath` with `--import tsx src/cli/index.ts`, cwd set to a temp dir, env passed explicitly. Capture stdout, stderr, exit code. File: same as T04. Test: TC-01, TC-07, TC-29, TC-47. Depends: T04.
- [ ] **T06** Add a fixture folder `tests/fixtures/cli-conventions/` with: one valid note (`2026-10-01-ok.md`), one empty note (`2026-10-02-empty.md`), one CRLF note (`2026-10-03-crlf.md`), one note with a due date of `2026-10-19` for overdue checks, and a store file fixture with a version-1 store holding one open item. Spec: D5.1, D55, D65.1, NFR-M2. File: `tests/fixtures/cli-conventions/*`. Test: TC-10, TC-20, TC-30, TC-31, TC-33, TC-38. Depends: none.

## Phase 2: green, foundations (domain and clock)

- [ ] **T07** Add `INTERNAL: 4` to `EXIT` and the type. Spec: D62.1. File: `src/domain/exit-codes.ts`. Test: TC-24 (partial). Depends: T03.
- [ ] **T08** Add `InternalError extends ActiontrackError` with exit `EXIT.INTERNAL`. Spec: D62.1. File: `src/domain/errors.ts`. Test: TC-24, TC-26. Depends: T07.
- [ ] **T09** Add a pure helper `highestExit(codes: ExitCode[]): ExitCode` returning the maximum, with `0` for an empty list. Spec: D53.1, D62.2. File: `src/domain/exit-codes.ts`. Test: TC-23, TC-26. Depends: T07.
- [ ] **T10** Confirm `clock.ts` is the only module that reads the system date. Keep `systemClock` as is. Add `fixedClock` use only in `cli/index.ts`. Spec: NFR-M2, D1.3. File: `src/clock.ts` (no change expected). Test: TC-34, TC-39, TC-41. Depends: T03.
- [ ] **T11** Make `systemClock.today()` correct at local midnight (it already reads local getters; add a test before changing anything). Spec: NFR-C4, D1.3, O-13. File: `src/clock.ts`. Test: TC-34, TC-39. Depends: T10, per decision O-13.

## Phase 3: green, CLI shell

- [ ] **T12** Split `src/cli/index.ts` into `buildProgram(deps)` and `run(argv, deps): Promise<ExitCode>`. Keep the bin entry (the only place real deps are built) calling `run(process.argv, realDeps)`. No behaviour change yet. Spec: CLAUDE.md architecture, spec 11 item 6. File: `src/cli/index.ts`. Test: TC-40 (structure), all in-process tests. Depends: T03, T04.
- [ ] **T13** Configure commander: `exitOverride()` and `configureOutput({ writeErr: deps.err, writeOut: deps.out })` so parse errors become `ActiontrackError` (exit 2) and go through the single reporter. Spec: D20.3, NFR-U3, O-7. File: `src/cli/index.ts`. Test: TC-04, TC-05, TC-06, TC-46, TC-47. Depends: T12, per decision O-7.
- [ ] **T14** Change `parseId` for `done` so a bad id raises a usage error (exit 2) with a message naming the valid form. Spec: NFR-U3, spec 08 item 1. File: `src/cli/index.ts`. Test: TC-06 (done abc case). Depends: T13.
- [ ] **T15** Add `--status` choices with the valid options in the error text (`open`, `done`, `overdue`). Spec: NFR-U3, spec 07 item 2. File: `src/cli/index.ts`. Test: TC-04. Depends: T13.
- [ ] **T16** Add a shared `addGlobalOptions(cmd, { today: boolean })` helper used by all four commands so `--store` (all) and `--today` (all four) cannot drift. Spec: D17.2, D54.1, spec 11 item 3. File: `src/cli/index.ts`. Test: TC-11. Depends: T12.
- [ ] **T17** Add `--today` to `ingest` and `done` (currently missing). Spec: D54.1. File: `src/cli/index.ts`. Test: TC-11. Depends: T16.
- [ ] **T18** Validate `--today` before any command runs: ISO `YYYY-MM-DD` and a real calendar date. On failure throw `UsageError` naming the valid format. Spec: D54.1, O-8. File: `src/cli/index.ts`. Test: TC-12, TC-13, TC-14. Depends: T16, per decision O-8.
- [ ] **T19** When `--today` is valid, build `{ ...deps, clock: fixedClock(value) }` for that run only. Spec: NFR-M2, spec 11 item 8. File: `src/cli/index.ts`. Test: TC-32, TC-33. Depends: T18, T10.
- [ ] **T20** Resolve the store path in one place: flag, then `ACTIONTRACK_STORE` (treat empty as unset, O-2), then `<cwd>/.actiontrack/items.json`. Make relative paths absolute from cwd (O-3). Pass the resolved path to each command. Spec: D17.2, D59.1, O-1, O-2, O-3, O-16. File: `src/cli/index.ts`; the store module only receives the final path (spec 05 owns `store/store.ts`). Test: TC-15, TC-16, TC-17, TC-18, TC-43, TC-44, TC-55. Depends: T16, per decision O-1, O-2, O-3, O-16.
- [ ] **T21** Make the Gmail connector env check raise `UsageError` naming `ACTIONTRACK_GMAIL_MCP_CMD`, and only when `followup` needs it. Spec: spec 11 item 4, O-11. File: `src/cli/index.ts`. Test: TC-51, TC-42. Depends: T12, per decision O-11.
- [ ] **T22** Require exactly one of `<owner>` or `--all` for `followup`. Both or neither: `UsageError` (exit 2). Spec: spec 09 items 1-2, O-10. File: `src/cli/index.ts` (and the `followup` command for the `--all` check if needed). Test: TC-50. Depends: T13, per decision O-10.
- [ ] **T23** Print help to stdout and exit 2 when no command is given. Spec: O-6, D20.3. File: `src/cli/index.ts`. Test: TC-47. Depends: T13, per decision O-6.
- [ ] **T24** Keep `--version` out: no `.version()` call, so `-V` is an unknown option (exit 2). Spec: O-5. File: `src/cli/index.ts`. Test: TC-46. Depends: T13, per decision O-5.
- [ ] **T25** Replace the catch block in `run` with the single mapping: `ActiontrackError` gives its `exitCode` and `error: <message>` on stderr; anything else gives `EXIT.INTERNAL` and `unexpected error: <message>` on stderr. Commander errors go through `ActiontrackError`. Spec: D62.1, spec 11 items 6-7. File: `src/cli/index.ts`. Test: TC-24, TC-25, TC-49. Depends: T08, T13.
- [ ] **T26** Set `process.exitCode` once, at the end of `run`, from the highest of the codes the commands returned (`highestExit`). Spec: D53.1, D62.2. File: `src/cli/index.ts`. Test: TC-23, TC-26. Depends: T09, T25.
- [ ] **T27** Handle EPIPE on stdout: exit 0 silently; any other write error goes through the usual mapping. Spec: O-12. File: `src/cli/index.ts`. Test: TC-52. Depends: T25, per decision O-12.
- [ ] **T28** Remove the `NotImplementedError` mapping and the class, once every command is implemented (last step of the phase). Spec: CLAUDE.md scaffold rule. File: `src/cli/index.ts`, `src/domain/errors.ts`. Test: TC-40 (second assertion: no references). Depends: tasks for specs 06, 07, 08, 09 done (every command implemented).

## Phase 4: green, output streams and content

- [ ] **T29** Ensure every warning and error in `src/` goes through `Deps.err` and every result through `Deps.out`. Remove any direct `console.*` call outside `cli/index.ts`. Spec: NFR-O3, D30.3. File: all `src/cli/commands/*.ts`, `src/cli/index.ts`. Test: TC-27, TC-28, TC-40. Depends: T12.
- [ ] **T30** With `--json`, stdout holds only the JSON document; warnings stay on stderr. Spec: D15.5, spec 07 item on JSON, O-4. File: `src/cli/commands/list.ts`. Test: TC-09, TC-28, TC-45. Depends: T29, per decision O-4.
- [ ] **T31** Each command prints a result line on stdout on success (counts, ids, draft ids as the spec requires). Spec: NFR-O1. File: `src/cli/commands/{ingest,list,done,followup}.ts`. Test: TC-37. Depends: T29.
- [ ] **T32** Ingest skip report: skip reasons use the fixed strings from D65.1 exactly; skipped notes and lines go to stderr; exit 1 if anything was skipped. Spec: D30.3, D65.1, NFR-U6, D70.1. File: `src/cli/commands/ingest.ts`. Test: TC-10, TC-20, TC-30, TC-31. Depends: T06, T29, T09.
- [ ] **T33** `list` sort tie-break: ascending id after due date (O-15). Spec: D15.3, NFR-A9. File: `src/cli/commands/list.ts` (or `dates/resolve.ts` helper). Test: TC-54. Depends: per decision O-15.
- [ ] **T34** `list` table prints full task text, no truncation, no colour (O-14, D65.2). File: `src/cli/commands/list.ts`. Test: TC-53. Depends: per decision O-14.
- [ ] **T35** Exit mapping for `followup` connector failure: `GmailError` gives exit 3, store untouched. Spec: D20.4, D20.5, D53.2. File: `src/cli/commands/followup.ts`. Test: TC-22, TC-23. Depends: T25, T09.
- [ ] **T36** `done` and `ingest` return `ExitCode` only for OK and WARNINGS; errors are thrown (O-9). File: `src/cli/commands/done.ts`, `src/cli/commands/ingest.ts`. Test: TC-48, TC-49. Depends: per decision O-9, T25.
- [ ] **T37** Store-level write failures (I/O) surface as non-`ActiontrackError` errors so they reach exit 4 with the store unchanged (atomic write from spec 05). Spec: D62.1, D59.2. File: `src/store/store.ts` (spec 05 owns the write; only the error type changes here). Test: TC-25. Depends: T25, spec 05 store task.

## Phase 5: green, repository-wide rules

- [ ] **T38** Remove any `process.exit` or `process.exitCode` write outside `src/cli/index.ts`. Spec: spec 11 item 6, O-9. File: any file found by search. Test: TC-40. Depends: T36.
- [ ] **T39** Remove any `new Date(` or `Date.now(` outside `src/clock.ts`. Spec: spec 11 item 8. File: any file found by search. Test: TC-41. Depends: T10.
- [ ] **T40** Confirm only `ACTIONTRACK_STORE` and `ACTIONTRACK_GMAIL_MCP_CMD` are read from the environment. Spec: spec 11 item 4. File: any file found by search. Test: TC-42. Depends: T20, T21.
- [ ] **T41** Confirm no log file is written anywhere (no `createWriteStream`, no `*.log` path). Spec: NFR-O3, N4. File: any file found by search. Test: TC-29. Depends: T29.
- [ ] **T42** Check that paths use `node:path` only (no string joins with `/` or `\`). Add a space-in-path case. Spec: NFR-C1, N3. File: `src/cli/index.ts`, `src/store/store.ts`. Test: TC-35. Depends: T20.
- [ ] **T43** Add a CI matrix (Windows, macOS, Linux) running `npm run check`. Spec: NFR-C1, N3. File: CI config (only if the user has CI; otherwise record as a manual step). Test: TC-36. Depends: T40.

## Phase 6: refactor, traceability, check

- [ ] **T44** Refactor: remove duplicated option definitions, keep one `storeOpt`/`todayOpt` pair, keep `index.ts` under the size it needs (no business logic in it). Spec: CLAUDE.md conventions. File: `src/cli/index.ts`. Test: all TC-01..TC-55 stay green. Depends: T28, T42.
- [ ] **T45** Update `docs/TRACEABILITY.md`: the row "Cross-cutting: store, CLI" and rows NFR-U1..U6, NFR-O3, NFR-C1 change status (`todo` to `wip` to `done`). File: `docs/TRACEABILITY.md`. Test: none. Depends: T44.
- [ ] **T46** Update `specs/11-cli-conventions/spec.md` only if T01 changed a rule (add the decision ID next to the rule). File: `specs/11-cli-conventions/spec.md`. Test: none. Depends: T01.
- [ ] **T47** Run `npm run typecheck`, then `npm test`, then `npm run check`. All must pass. Test: TC-01..TC-55. Depends: T45, T46.
- [ ] **T48** Manual smoke on Windows: `npm run dev -- --help`, `npm run dev -- list --today 2026-02-30` (exit 2), `npm run dev -- ingest notes` (exit 0 or 1 per sample). Record results in the PR. Test: TC-12, TC-14, TC-19. Depends: T47.
- [ ] **T49** Confirm the sample acceptance checks that depend on exit codes (NFR-A1, NFR-A2 exit 1, NFR-A9) are still green after the change. File: `tests/acceptance/`. Test: TC-20, TC-30. Depends: T47.
- [ ] **T50** Record every decision O-1 to O-16 (`plan.md` Decisions section, T01) in `docs/FRD.md` section 11 as D77 or later. Depends: T01, T47.

## Definition of done

- [ ] All TC-01 to TC-55 in `testcases.md` are real tests, named with their TC ID, and pass.
- [ ] No `it.todo` remains in the "CLI conventions" block of `tests/unit/commands.test.ts`.
- [ ] `EXIT` has `INTERNAL: 4`; `highestExit` and `InternalError` exist and are tested.
- [ ] Exit codes come only from `src/cli/index.ts` (TC-40 green). `console.*` appears only in `src/cli/index.ts` (TC-27, TC-40).
- [ ] `--store` and `--today` are accepted by all four commands (TC-11). `--today` invalid is exit 2 (TC-12, TC-13, TC-14).
- [ ] No log file is created by any command, including failures (TC-29).
- [ ] Each decision O-1 to O-16 (`plan.md` Decisions section) is recorded as D77 or later in `docs/FRD.md`, and its test has been run.
- [ ] `docs/TRACEABILITY.md` status updated for the cross-cutting row, NFR-U1..U6, NFR-O3 and NFR-C1.
- [ ] `npm run check` passes. The Windows smoke run (T48) is recorded. NFR-C1 CI matrix is either green or recorded as a manual step.
- [ ] No file outside `specs/11-cli-conventions/` (and the files the tasks name) is changed, and no spec in another folder is edited.
