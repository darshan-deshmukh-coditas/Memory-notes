# Tasks: spec 07, `actiontrack list`

Order follows CLAUDE.md: find the ID, test first (red), implement (green), refactor, update TRACEABILITY, run `npm run check`.

Format per task: `ID | spec/FRD IDs | file | tests turned green (see testcases.md) | depends on`.

Blocked tasks: T17 and T36 need specs 02, 05 and 06 to be implemented. Everything else in list can be built with fixtures and fakes, but tests that call `statusOf` or `parseCliDate` only pass once spec 02 is in place.

## A. Gate and prerequisites

- [ ] T01 | CLAUDE.md workflow, plan D193 to D210 | docs/FRD.md | none (decision record) | none
  D193 to D210 are settled per decision D193 to D210 in `plan.md` ("Decisions"). Record them as new decisions (D193 to D210 for this spec) in `docs/FRD.md` in this same change. Red tests may start once that is done.
- [ ] T02 | D1.3, D59, D62, spec 11 rules 3 to 7 | src/clock.ts, src/store/store.ts, src/cli/deps.ts, src/domain/errors.ts (read only) | none (check) | none
  Confirm the interfaces `list` needs exist: `Clock.today()`, a store load function (missing file = empty, corrupt = exit 2), `Deps.out`/`Deps.err`, and an `ActiontrackError` subclass for exit 2. Record any missing piece as a blocker for T17, T30 and T36.
- [ ] T03 | D59.3, spec 05 rules 4 to 5 | tests/fixtures/store/list-basic.json | fixture for all list tests | T02
  Create fixture F-LIST exactly as in `testcases.md` ("Fixtures needed"): 12 items, roster of five people, store version 1, nextId 13.
- [ ] T04 | NFR-M2, NFR-M3 | tests/unit/commands.test.ts (helpers at top of the list section) | none (helper) | T03
  Add test helpers: `loadFixture()`, `runList(args, { today, store, env })` that returns `{ code, stdout, stderr }` using `fixedClock` and fake `out`/`err` arrays, and `makeStore(items)` for small stores. Keep helpers inside the test file (no new test files).

## B. Red: turn the list `it.todo` stubs into failing tests

- [ ] T05 | D15.1, D15.3, D71.2, D44.1 | tests/unit/commands.test.ts | TC-01, TC-02, TC-03, TC-04, TC-05, TC-16, TC-58 (red) | T04
  Replace the first `it.todo` in the list section with the default and sort tests. Each name starts with its spec ID in brackets.
- [ ] T06 | AC-L1, D44.2, D1.1, D1.2, D15.4 | tests/unit/commands.test.ts | TC-06, TC-07, TC-08, TC-09, TC-10 (red) | T04
  Status tests: overdue only, open excludes overdue and keeps due-today, done only, boundary at yesterday and today, undated never overdue.
- [ ] T07 | AC-L2, D31.4, FR-L7 | tests/unit/commands.test.ts | TC-12, TC-13, TC-61 (red) | T04
  AND-combination tests.
- [ ] T08 | AC-L3, D31.1, D31.2 | tests/unit/commands.test.ts | TC-14, TC-15 (red) | T04
  `--due-before` strict and undated excluded.
- [ ] T09 | D38.1, D34.1, D31.6, D10.1 | tests/unit/commands.test.ts | TC-17, TC-18, TC-19, TC-20, TC-21 (red) | T04
  Year and rollover tests. These fail for the right reason only after spec 02 `parseCliDate` exists; until then they fail with `NotImplementedError`, which is acceptable for red.
- [ ] T10 | NFR-U3, D54.1, D15 | tests/unit/commands.test.ts | TC-22, TC-23, TC-44, TC-49 (red) | T04
  Bad-argument tests: bad date, unknown status, bad `--today`, `--status` in any case (D205).
- [ ] T11 | D4.4, D31.3, D42.1, D42.2, D72.1 | tests/unit/commands.test.ts | TC-24 to TC-31, TC-50, TC-51, TC-56 (red) | T04
  Owner tests: ambiguous first name, unique first name, full name case, unknown name, the four tokens, token limitation, repeated flag, literal label, roster-only person.
- [ ] T12 | D15.2, D16.1, D39.2, D58.2, D65.2, D71.1, NFR-U5, FR-L6 | tests/unit/commands.test.ts | TC-32 to TC-37, TC-52, TC-54, TC-55, TC-57 (red) | T04
  Table tests: columns, labels, `-`/`?`, file names, sources join, no colour, empty table, alignment, no truncation, no stderr.
- [ ] T13 | D15.5, D58.2, D71.3 | tests/unit/commands.test.ts | TC-38, TC-39, TC-40, TC-59, TC-60 (red) | T04
  JSON tests: array, keys, full sources, flagged item, empty `[]`.
- [ ] T14 | D31.5, D59.3, D14.1 | tests/unit/commands.test.ts | TC-41, TC-42, TC-43, TC-53 (red) | T04
  No-match and missing-store tests, stored ids kept in filtered output.
- [ ] T15 | D1.3, NFR-M2, ADR 0002, D44.1, D62.1, D59.4 | tests/unit/commands.test.ts | TC-45, TC-46, TC-62, TC-63, TC-64 (red) | T04
  Overdue at read time with two injected dates, read-only store, single clock read, internal error exit 4, corrupt store.
- [ ] T16 | NFR-P2, NFR-P3, N2 | tests/unit/commands.test.ts | TC-47 (red) | T04
  Timed test on a generated 5,000-item store (seeded, built in the test). Use a generous CI bound.
- [ ] T17 | NFR-U2, spec 11 | tests/unit/commands.test.ts | TC-48 (red) | T02, T04
  Integration test: the CLI parser passes `owner`, `status`, `dueBefore`, `json`, `today`, `store` to `list` (spy). Blocked until `cli/index.ts` is importable in tests.
- [ ] T18 | NFR-A7, FR-L6 | tests/acceptance/sample-notes.test.ts | TC-11 (red) | T36 prerequisite: spec 06 ingest
  Add the sample-folder acceptance test. Write it now as a failing test; it goes green when spec 06 ingest works.
- [ ] T19 | all | tests/unit/commands.test.ts | confirm red | T05 to T18
  Run `npm test`. Every new list test must fail, and for the right reason (`NotImplementedError` or a wrong result), not a syntax or fixture error. Fix any test that fails for a wrong reason before going on.

## C. Green: implement in `src/cli/commands/list.ts` (pure functions first)

- [ ] T20 | D31.3, D42.1, D4.4, D72.1, spec 03 rules 8 to 11 | src/cli/commands/list.ts | TC-25 to TC-31, TC-50, TC-51, TC-56 (partial) | T11, spec 03 and spec 05 roster
  Implement `matchOwner(input, roster, items)`: token map first (`OWNER_TOKENS` in `domain/types.ts`), then full name (case-insensitive), then unique first name (case-insensitive). Return the matched name, a label, or `{ kind: "ambiguous", choices }`, or `{ kind: "none" }`. Pure.
- [ ] T21 | D4.4, D31.3 | src/cli/commands/list.ts (+ existing errors module) | TC-24 | T20
  On an ambiguous first name, throw an `ActiontrackError` subclass that maps to exit 2 and lists the choices. Only `cli/index.ts` maps to the exit code.
- [ ] T22 | FR-L1 to FR-L4, D15.1, D15.4, D31.4, D1.1, D1.2, D44.1, D44.2 | src/cli/commands/list.ts | TC-01, TC-06 to TC-16, TC-58, TC-61 (partial, the owner part depends on T20) | T20, spec 02 `statusOf`
  Implement `filterItems(items, filters, today)`. Compute status with `statusOf` (never read a stored overdue). Default keeps open and overdue. `--status` keeps equal computed status. `--due-before` keeps dated items strictly before the parsed cut-off. Combine with AND.
- [ ] T23 | D15.3, D71.2, D193 | src/cli/commands/list.ts | TC-02 to TC-05 | T22
  Implement `sortItems`: dated items by ISO due ascending, undated last, ties and undated groups by numeric id.
- [ ] T24 | NFR-U3, D54.1 | src/cli/commands/list.ts | TC-23, TC-44, TC-49 | T10
  Validate `--status` against `open|done|overdue` case-insensitively (D205). Error names the valid values. Validate `--today` as ISO, with the valid format in the message.
- [ ] T25 | D31.6, D38.1, NFR-U3 | src/cli/commands/list.ts | TC-20, TC-21, TC-22 | T09, spec 02 `parseCliDate`
  Use `parseCliDate` for `--due-before`. Any failure is exit 2 and the message names the valid forms.
- [ ] T26 | D15.2, D16.1, D39.2, D58.2, D71.1, FR-L6 | src/cli/commands/list.ts | TC-32 to TC-36 | T22, T23
  Implement `renderRows(items)` into table rows: id, owner, task, due (`-`, `?` or date), status, sources joined by ", " (file names only).
- [ ] T27 | D65.2, NFR-U5, D201 | src/cli/commands/list.ts | TC-37, TC-54, TC-55 | T26
  Implement plain aligned table: header row, columns padded to widest cell by display width (helper), no ANSI codes, no truncation. No new dependency (ask first if one seems needed).
- [ ] T28 | D15.5, D58.2, D195, D196 | src/cli/commands/list.ts | TC-38, TC-39, TC-59, TC-60 | T22, T23
  Implement `renderJson(items)`: array of `{id, owner, task, due, dueFlagged, status, sources}`, `sources` as full `{file, meetingDate, line}` records, status computed.
- [ ] T29 | D31.5, D71.3, D59.3, FR-L8 | src/cli/commands/list.ts | TC-40, TC-41, TC-43, TC-52, TC-28 | T26, T28
  No-match output: table mode prints `No items match.` to `deps.out`, no header. JSON mode prints `[]` only. Both exit 0.
- [ ] T30 | NFR-M2, D1.3, D59.3, D59.4, D44.1, ADR 0002, spec 11 rule 3 | src/cli/commands/list.ts | TC-42, TC-45, TC-46, TC-53, TC-62, TC-64 | T22 to T29
  Shell: read the store once (missing = empty store, no file created; corrupt = error, not overwritten), read `today` once from `deps.clock` unless `--today` is set, call pure functions, write to `deps.out`, return an exit code. Never call save.
- [ ] T31 | D62.1, spec 11 rule 7 | src/cli/index.ts (only if needed) | TC-63 | T30
  Confirm an unexpected error (plain `Error`) reaching `cli/index.ts` from `list` gives exit 4, a stderr message, and leaves the store unchanged. Add the mapping only if it is missing.
- [ ] T32 | NFR-O3 | src/cli/commands/list.ts | TC-57 | T30
  Confirm a valid run writes nothing to stderr.
- [ ] T33 | NFR-U2 | src/cli/index.ts | TC-48 | T17, T30
  Confirm the `list` command wiring forwards `--owner`, `--status`, `--due-before`, `--json`, `--today`, `--store`. Make the test green.
- [ ] T34 | NFR-P2, NFR-P3 | src/cli/commands/list.ts (or the store load path) | TC-47 | T30, T16
  Run the timed test. If it is over the bound, profile load vs filter and fix the slower one. Do not add caching that stores `overdue`.
- [ ] T35 | D1.3, NFR-M2, ADR 0002 | (verification) | TC-45 | T30
  Run TC-45 alone. Confirm the same store bytes give different statuses for two `--today` values.
- [ ] T36 | NFR-A7 | tests/acceptance/sample-notes.test.ts | TC-11 | T18, spec 06 ingest done
  Run ingest on the sample folder into a temp store, then list. Confirm the undated sample items show `-` and are never overdue.

## D. Refactor

- [ ] T37 | CLAUDE.md dependency rule | src/cli/commands/list.ts | all list tests stay green | T36 (or T30 if spec 06 is not ready)
  Check imports: `list.ts` imports only `dates/`, `owners/`, `store/`, `domain/`, `clock` types. Pure helpers take their inputs as arguments and never touch I/O. Pure modules do not import `store` or `email`.
- [ ] T38 | CLAUDE.md "delete the placeholder" | src/cli/commands/list.ts | all list tests stay green | T37
  Remove the `NotImplementedError` placeholder import and body.
- [ ] T39 | CLAUDE.md conventions | src/cli/commands/list.ts, tests | all list tests stay green | T38
  Check no `any`, `.js` suffixes on relative imports, strict types. Read names and comments: cite a spec ID only where the rule is not obvious.

## E. Traceability and docs

- [ ] T40 | CLAUDE.md step 4 | docs/TRACEABILITY.md | n/a | T19 (set `wip` when red tests are in), T39 (set `done` when green)
  Set the status of the BR-03 row and the BR-04 row to `wip` at T19, and to `done` once all list tests are green. Do not change other rows.
- [ ] T41 | D193 to D210 (from T01) | docs/FRD.md | n/a | T01
  Confirm that each answer from T01 is recorded as a new decision. No edit to earlier decisions.
- [ ] T42 | D210, spec 07 item 8 | specs/07-list/spec.md | TC-63 | T01
  Only if the requester asks: update spec 07 item 8 to name exit 4 (D62.1). Otherwise leave spec 07 unchanged.
- [ ] T43 | CLAUDE.md exit codes | CLAUDE.md | n/a | T01 (ask first)
  The exit-code list in CLAUDE.md omits exit 4 (D62.1). Propose the change to the requester. Do not edit CLAUDE.md without approval.

## F. Verify

- [ ] T44 | CLAUDE.md commands | (run) | all | T39
  `npm run typecheck` passes.
- [ ] T45 | CLAUDE.md commands | (run) | all | T44
  `npm test` passes. Every list test named in `testcases.md` is green, or is listed as blocked by spec 02, 05 or 06 with the reason.
- [ ] T46 | CLAUDE.md step 4 | (run) | all | T45
  `npm run check` passes.
- [ ] T47 | NFR-C1, N3 | (manual, Windows terminal) | TC-34, TC-37, TC-54 | T46
  Run `npm run dev -- list --status overdue --today 2026-10-20` and `npm run dev -- list --json --store <copy>` in PowerShell. Check that the table reads well and that JSON is clean on stdout.
- [ ] T48 | NFR-SEC2, spec 07 "list never changes the store" | (manual) | TC-46 | T46
  Copy a store, run several `list` variants, and confirm the file bytes are unchanged and no network call is made. Confirm `package.json` has no new dependency.

## Definition of done

- [ ] All decisions in `plan.md`'s Decisions section (D193 to D210) are recorded in `docs/FRD.md` under their IDs.
- [ ] Every test in `testcases.md` exists, names its spec ID in brackets, and is green (or blocked by a named dependency).
- [ ] `list` never writes the store and never stores `overdue` (ADR 0002, D44.1).
- [ ] The default view, filters, AND, sort, table, JSON, no-match and exit codes 0, 2 and 4 behave as in `spec.md` and in the decisions it cites.
- [ ] NFR-P2 is measured on 5,000 items and is under 1 second on the development machine.
- [ ] `docs/TRACEABILITY.md` rows BR-03 and BR-04 show `done`.
- [ ] `npm run check` passes on Windows. No new dependency, no colour codes, no log file, no output to stdout beyond results.
- [ ] No file outside `src/cli/commands/list.ts`, `src/cli/index.ts` (only if T31 or T33 needs it), `tests/`, `docs/FRD.md` and `docs/TRACEABILITY.md` was changed. Spec and CLAUDE.md changes happened only with approval (T42, T43).
