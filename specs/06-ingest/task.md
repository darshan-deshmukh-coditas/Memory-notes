# Tasks: spec 06 `actiontrack ingest <folder>`

Order follows CLAUDE.md: find the requirement, test first (red), implement (green), refactor, update traceability, run `npm run check`. Test IDs (TC-nn) are in `testcases.md`. "Spec NN" means that spec's implementation must be done first (its own tasks, not listed here). The decisions Q1 to Q21 in `plan.md` must be recorded in `docs/FRD.md` (D77+) before the tasks that cite them start.

Legend: `[ ]` open. Satisfies = FRD, NFRD or spec ID. Depends = earlier task IDs or other specs.

## A. Preparation

| Done | ID | Task | Satisfies | File | Test | Depends |
|---|---|---|---|---|---|---|
| [ ] | T01 | Confirm specs 01 to 05 and 11 have their own tasks done or are at least stubbed with `NotImplementedError`. Record which functions ingest will call. | spec 06 Dependencies | none (check only) | none | none |
| [ ] | T02 | Record plan.md decisions Q1 to Q21 as D77+ in `docs/FRD.md` section 11 and the revision note. | CLAUDE.md step 1 | `docs/FRD.md` | none | T01 |
| [ ] | T03 | Check that each test case citing a plan.md decision (TC-48, TC-51, TC-53, TC-70, TC-71, TC-72) matches that decision as recorded in `plan.md` and `docs/FRD.md`. Correct any test whose wording differs. | TC-48, TC-51, TC-53, TC-70, TC-71, TC-72 | `specs/06-ingest/testcases.md` | none | T02 |
| [ ] | T04 | Add `INTERNAL: 4` to `EXIT` and widen `ExitCode` (D62.1). Spec 11 owns this; do it there and confirm here. | D62.1, D20 | `src/domain/exit-codes.ts` | TC-10 (compile) | Spec 11 |
| [ ] | T05 | Add `today?: string` to `IngestOptions` and pass `--today` through (D54.1). Spec 11 owns parsing. | D54.1 | `src/cli/commands/ingest.ts` | TC-04 (compile) | Spec 11 |
| [ ] | T06 | Create the fixture files listed in `testcases.md` "Fixtures needed", each with a header comment stating expected counts. Generate byte-sensitive files (BOM, CRLF, 0xFF) in the test, not by hand. | all TC | `tests/fixtures/notes/*` | none | T03 |
| [ ] | T07 | Add a shared test helper: temp folder with notes, temp store path, fake `Deps` (fixed clock, recording connector, captured `out`/`err`), fault-injecting store writer, generator for 500-note and 1 MB folders. | TC-05 to TC-69 | `tests/fixtures/ingest-helpers.ts` (new, justified) | none | T06 |

## B. Red: turn stubs into failing tests

| Done | ID | Task | Satisfies | File | Test | Depends |
|---|---|---|---|---|---|---|
| [ ] | T08 | Add `describe("ingest (BR-01, BR-11, FR-I1..I15)")` to the command tests. Replace nothing else. Add TC-01 to TC-16 as real failing tests. | FR-I1, FR-I8, FR-I9, FR-I13, FR-I14, D20, D30, D35.3, D70 | `tests/unit/commands.test.ts` | TC-01 to TC-16 | T07 |
| [ ] | T09 | Add TC-42, TC-43, TC-44, TC-47, TC-50, TC-52, TC-53, TC-54, TC-69 to the same file. | FR-I15, D13, D14.2, D52.1, D59.3, NFR-SEC3, D29, NFR-M2, NFR-M3 | `tests/unit/commands.test.ts` | as listed | T07 |
| [ ] | T10 | Add TC-11, TC-12, TC-51, TC-70, TC-71, TC-72 to the same file. | D59.4, D62.1, D17.2, D13, Q1, D35.3, Q3, Q4 | `tests/unit/commands.test.ts` | as listed | T07, T03 |
| [ ] | T11 | Replace the parsing `it.todo`s in `tests/unit/ingest-parsing.test.ts` with TC-17 to TC-21, TC-45, TC-46, TC-55 as real failing tests. | AC-I2, AC-I3, D12, D26.1, D37.1, D58.1, D69.1 | `tests/unit/ingest-parsing.test.ts` | as listed | T07 |
| [ ] | T12 | Add TC-22 to TC-29 and TC-23 to TC-26 (byte and line-ending cases) to `tests/unit/edge-cases.test.ts`. | D5.1, D22, D55, D57.1, D64 | `tests/unit/edge-cases.test.ts` | as listed | T07 |
| [ ] | T13 | Add TC-30 to TC-34, TC-37, TC-38 to TC-41, TC-48, TC-49 to `tests/unit/edge-cases.test.ts`. | FR-E1, FR-E2, FR-E3, D3, D23, D39, D41, D61, D25 | `tests/unit/edge-cases.test.ts` | as listed | T07 |
| [ ] | T14 | Add TC-35 and TC-36 to `tests/unit/dates.test.ts`. | D8, D33.1, D8.4 | `tests/unit/dates.test.ts` | TC-35, TC-36 | T07 |
| [ ] | T15 | Add TC-56 to TC-68 to `tests/acceptance/sample-notes.test.ts`. Keep the existing A1 to A10 and P1 names in the names. Add P3 and P4. Mark timing tests so they can be skipped on slow CI. | NFR-A1 to A9, NFR-P1, P3, P4, NFR-R2, NFR-U6 | `tests/acceptance/sample-notes.test.ts` | TC-56 to TC-68 | T07 |
| [ ] | T16 | Run `npm test`. Confirm every new ingest test fails with `NotImplementedError` or an assertion, not a syntax error and not a pass. Fix any test that passes by accident. | CLAUDE.md step 2 | none | TC-01 to TC-72 | T08 to T15 |
| [ ] | T17 | Keep `tests/unit/safety.test.ts` unchanged and passing. It enforces create-draft only. | NFR-S1, AC-F3 | `tests/unit/safety.test.ts` | safety suite | T16 |

## C. Green: pure core and shell

| Done | ID | Task | Satisfies | File | Test | Depends |
|---|---|---|---|---|---|---|
| [ ] | T18 | Define the ingest summary and report types (plan "Summary shape"). Types only, no logic. | FR-I13, D30.2 | `src/domain/types.ts` | compile; TC-08 | T16 |
| [ ] | T19 | Implement the pure `runIngest(notes, store, today)` skeleton: loop over notes in file-name order, lines in order, return store and report. Notes arrive as text. | FR-I1, FR-I2, D69.1 | `src/cli/commands/ingest.ts` | TC-45, TC-49 | T18, Spec 01, Spec 05 |
| [ ] | T20 | Per-note pipeline inside `runIngest`: header, checkbox lines, owner, due, normalise, merge. Failures become values (skip, skipped line, warning). Nothing thrown for malformed input. | FR-I5, FR-I8, D5.3, NFR-R1 | `src/cli/commands/ingest.ts` | TC-05, TC-17, TC-18 | T19, Spec 01, 02, 03, 04 |
| [ ] | T21 | Two-pass roster: build from all non-skipped notes plus `store.roster` before resolving any owner. | D23.1, D61.1, D61.2 | `src/cli/commands/ingest.ts`, `src/owners/resolve.ts` | TC-30, TC-33, TC-34 | T20, Spec 03, 05 |
| [ ] | T22 | Id assignment via the store (sequential, never reused, continues from highest stored id). | D14.1, D14.2, D69.1 | `src/cli/commands/ingest.ts`, `src/store/store.ts` | TC-45, TC-46, TC-47 | T20, Spec 05 |
| [ ] | T23 | Merge through `mergeItem` (spec 04). Count merged lines; keep first id; keep done if any copy done; latest wording and date. Use a map index so merge is O(n). | D3.1, D3.5, D28, D39.1, D52.2 | `src/cli/commands/ingest.ts`, `src/dedupe/merge.ts` | TC-38, TC-39, TC-40, TC-41, TC-48 | T22, Spec 04 |
| [ ] | T24 | Re-run behaviour: unchanged lines add nothing; stored items never removed; done status and id kept. | FR-I15, D13.1, D13.2, D52.1 | `src/cli/commands/ingest.ts`, `src/dedupe/merge.ts` | TC-42, TC-43, TC-44 | T23 |
| [ ] | T25 | Implement the changed-due-date rule per decision Q1. | D13 | `src/dedupe/merge.ts` | TC-72 | T24, T02 |
| [ ] | T26 | Summary collection: ignored lines by kind, ignored files count (passed in by shell), flagged and no-date lists, owner label lists, roster matches. | D29.2, D30.2, D16.4, D25.3, D26.2, D27.2, D41.1 | `src/cli/commands/ingest.ts` | TC-08, TC-19, TC-20, TC-32, TC-37 | T20, Spec 01 |
| [ ] | T27 | Warnings: weekday versus explicit date (D33.4), email conflict (D56.2, most recent meeting wins), `(unresolved)` owner (D41.3). | D33.4, D56.2, D70.1 | `src/cli/commands/ingest.ts` | TC-13, TC-14, TC-15 | T20, Spec 02, 03, 05 |
| [ ] | T28 | Exit code selection: 1 for skipped note, skipped line or D70.1 warning; 0 otherwise; highest wins. Flagged dates and no-owner/group/ambiguous do not count. | D53.1, D70.1, D70.2 | `src/cli/commands/ingest.ts` | TC-16, TC-05 | T26, T27, T04 |
| [ ] | T29 | Folder checks in the shell: missing or unreadable folder exits 2 with path in message; no `.md` files prints `No notes found`, exits 2. | FR-I14, D20.3, D35.3 | `src/cli/commands/ingest.ts` | TC-01, TC-02, TC-03 | T05 |
| [ ] | T30 | Store load in the shell via spec 05. Corrupt store or version != 1: exit 2, no write. | D59.4, D69.2 | `src/cli/commands/ingest.ts`, `src/store/store.ts` | TC-12 | Spec 05 |
| [ ] | T31 | Save once, after `runIngest`, through the atomic writer. Any I/O error: exit 4 with clear message; previous file bytes intact. | D62.1, NFR-R3, D59.2 | `src/cli/commands/ingest.ts`, `src/store/store.ts` | TC-10, TC-11 | T30, Spec 05, T04 |
| [ ] | T32 | Save policy when nothing changed per decision Q3, and all-skipped run per decision Q4. | D13, D35.3 | `src/cli/commands/ingest.ts` | TC-70, TC-71 | T31, T02 |
| [ ] | T33 | Reporting: skip report on stderr (`Skipped notes:` then `Skipped lines:`, then warnings); totals on stdout; printed after processing. Use `deps.err` and `deps.out` only. | D30.1, D30.2, D30.3, NFR-O1, NFR-U6, NFR-O3 | `src/cli/commands/ingest.ts` | TC-06, TC-07, TC-09 | T26, T27 |
| [ ] | T34 | Store path: `--store`, then `ACTIONTRACK_STORE`, then default from cwd (precedence per decision Q14). | D17.2, D59.1 | `src/cli/index.ts`, `src/store/store.ts` | TC-51 | T31, T02 |
| [ ] | T35 | Read-only on the folder: no writes or temp files in the notes folder. Read notes once. | NFR-SEC3, D32.1 | `src/cli/commands/ingest.ts` | TC-52 | T29 |
| [ ] | T36 | Clock: the pure core takes `today` as an argument; the shell passes `--today` or `deps.clock`. No `Date.now` in the core. | NFR-M2, NFR-D3, D54.1 | `src/cli/commands/ingest.ts` | TC-35, TC-54 | T19 |
| [ ] | T37 | Never call `deps.connector()` during ingest. | NFR-M3 | `src/cli/commands/ingest.ts` | TC-69 | T29 |
| [ ] | T38 | Make the `IngestOptions` contract match plan and spec 11 (folder, store, today). Remove the `NotImplementedError` from `ingest` once T19 to T37 are green. | FR-I1, D54 | `src/cli/commands/ingest.ts` | TC-01 to TC-16 | T19 to T37 |
| [ ] | T39 | Wire ingest in `cli/index.ts` with real `Deps`; map exit code. Only place that maps errors to exit codes. | spec 11 | `src/cli/index.ts` | TC-04 | T38, T05 |
| [ ] | T40 | Run the new unit and integration tests. All TC-01 to TC-16, TC-42 to TC-47, TC-49, TC-50, TC-52, TC-54, TC-69 must pass. | CLAUDE.md step 3 | none | TC-01 to TC-69 | T38 |

## D. Parsing edge cases end to end

| Done | ID | Task | Satisfies | File | Test | Depends |
|---|---|---|---|---|---|---|
| [ ] | T41 | Confirm through ingest that BOM, CRLF, empty, whitespace-only and non-UTF-8 notes behave per spec 01. Add ingest-level assertions only; no parser changes here unless a test shows a gap (then fix in spec 01 module and record). | D55.1 to D55.3, D64.1, D5.1 | `src/parser/note.ts` (if needed) | TC-23, TC-24, TC-25, TC-26 | T40, Spec 01 |
| [ ] | T42 | Confirm ignored-line kinds reach the summary (table row, action line, block quote, code fence, HTML comment, numbered checkbox). | D26.2, D27.1, D37.1 | `src/parser/items.ts` (if needed) | TC-19, TC-20 | T40, Spec 01 |
| [ ] | T43 | Confirm skip reasons are exactly the six strings (the five in D65.1 plus `unreadable file`, Q6) and reach the report unchanged. | D65.1, Q6 | `src/parser/note.ts` (if needed) | TC-06 | T40, Spec 01 |

## E. Sample folder, idempotence and performance

| Done | ID | Task | Satisfies | File | Test | Depends |
|---|---|---|---|---|---|---|
| [ ] | T44 | Make the sample folder checks A1 to A4 pass. Copy `notes/` into a temp dir before any run that writes the store; never run against the real folder. Record the first-run numbers in a comment (the NFRD section 10 preamble says confirm against the first working build). | NFR-A1 to A4 | `tests/acceptance/sample-notes.test.ts` | TC-56 to TC-59 | T40 |
| [ ] | T45 | Make A5 to A8 pass. | NFR-A5 to A8, E1 to E3 | `tests/acceptance/sample-notes.test.ts` | TC-60 to TC-63 | T44, Spec 03, 04 |
| [ ] | T46 | Make A9 pass: second run on sample gives same items, ids, statuses; zero added. | NFR-A9, D13.1 | `tests/acceptance/sample-notes.test.ts` | TC-64 | T45 |
| [ ] | T47 | Make NFR-R2 check pass: stderr skip-line count equals the totals. | NFR-R2, NFR-U6 | `tests/acceptance/sample-notes.test.ts` | TC-68 | T44 |
| [ ] | T48 | Performance: P1 under 5 s on sample; P3 (500 notes, 5,000 items) and P4 (1 MB note) complete. Profile if P3 is slow; fix the merge index first. | NFR-P1, NFR-P3, NFR-P4 | `tests/acceptance/sample-notes.test.ts`, `src/cli/commands/ingest.ts` | TC-65, TC-66, TC-67 | T46 |

## F. Refactor and close

| Done | ID | Task | Satisfies | File | Test | Depends |
|---|---|---|---|---|---|---|
| [ ] | T49 | Refactor: keep the pure core free of `node:fs`, store and email imports (CLAUDE.md dependency rule). Check with a grep in review. Keep tests green. | NFR-M1, CLAUDE.md | `src/cli/commands/ingest.ts` | TC-01 to TC-69 | T48 |
| [ ] | T50 | Remove any now-unused stubs in `src/parser/*`, `src/dedupe/*`, `src/owners/*`, `src/dates/*` that ingest made real. Only the ones this spec used. | CLAUDE.md scaffold rule | the modules above | full suite | T48 |
| [ ] | T51 | Update the status column in `docs/TRACEABILITY.md` for BR-01, BR-08, BR-11, cross-cutting store/CLI, NFR-R1..R5, NFR-D1..D7, NFR-P1..P4, NFR-A1..A10. Use `wip` or `done` only where tests are green. | CLAUDE.md step 4 | `docs/TRACEABILITY.md` | none | T48 |
| [ ] | T52 | Run `npm run typecheck`, `npm test`, `npm run check`. All green. | CLAUDE.md step 4 | none | full suite | T51, T50 |
| [ ] | T53 | Check the diff: only `src/` ingest-related files, `tests/`, `docs/TRACEABILITY.md`, and `docs/FRD.md` (for D77+ answers). No other spec folder touched. | spec README | `git diff --stat` | none | T52 |
| [ ] | T54 | Cross-platform check (NFR-C1): run the acceptance suite on Windows (this machine). Note macOS and Linux as not yet run. | NFR-C1, N3 | none | TC-56 to TC-68 | T52 |
| [ ] | T55 | Do not commit unless asked. Report the list of changed files and test counts. | repo rule | none | none | T53 |

## Definition of done

- [ ] Every decision Q1 to Q21 in plan.md is recorded in `docs/FRD.md` (D77+). No test case relies on a decision that is not recorded.
- [ ] TC-01 to TC-72 exist as real tests with the TC ID in brackets. Every "(negative)" case passes for the right reason.
- [ ] `ingest` runs end to end on `notes/` with 4 notes skipped, 31 read, exit 1 (TC-57). No crash (TC-56).
- [ ] Re-running ingest on the sample changes no id or status (TC-64).
- [ ] No item from a trap line, no free-text due date, no connector call, no write to the notes folder.
- [ ] Exit codes: 0, 1, 2, 4 as specified; 3 never returned by ingest.
- [ ] Warnings and errors on stderr; totals on stdout; no log file.
- [ ] Performance: P1 under 5 s on the dev machine; P3 and P4 complete.
- [ ] `docs/TRACEABILITY.md` status updated; `npm run check` green.
- [ ] `tests/unit/safety.test.ts` still passes unchanged.
- [ ] Only the files listed in T53 changed.
