# Tasks: 02 Date resolution

Order follows CLAUDE.md: test first (red), implement (green), refactor, then traceability and `npm run check`. Test IDs (TC-nn) are defined in `testcases.md`. Files are under the repo root `C:\Users\darshan.deshmukh_cod\Downloads\notes`.

Decision rule: tasks marked **[OQ]** follow the settled decision with the matching ID in the Decisions section of `plan.md` (per decision OQ-nn). Implement that decision as written.

## Phase 0: confirm and read

- [ ] T01 Record decisions OQ-1 to OQ-20 (plan.md, Decisions section) as D77+ in `docs/FRD.md` in a separate change. Spec IDs: D1.3, D8.1..D10.3, D33, D34, D38.1, D48, D49, D66; NFR-C4. Depends: none. Blocks: T14, T03, T20 to T25 where marked [OQ].
- [ ] T02 Read `src/domain/types.ts` (`IsoDate`, `ItemStatus`, `StoredStatus`), `src/domain/errors.ts` (`ActiontrackError`, `UsageError`) and `src/clock.ts`. Confirm which error class `parseCliDate` throws. No code change. Spec: D31.6, NFR-U3. Depends: none.
- [ ] T03 **[OQ]** Per decision OQ-1: apply to the stub in `src/dates/resolve.ts`: add a `findDuePhrase` stub that throws `NotImplementedError`, and keep `resolveDue` as the one-phrase resolver. Spec: D48, D49. Depends: T01.

## Phase 1: red tests

- [ ] T04 In `tests/unit/dates.test.ts`, convert the existing 11 `resolveDue` `it.todo` stubs into real tests with IDs in the name: TC-02, TC-03, TC-06, TC-07, TC-09, TC-10, TC-11, TC-12, TC-13, TC-15 to TC-18, TC-20, TC-21, TC-22 to TC-25, TC-27. Spec: D8.2, D9, D33.2, D10, D33.1, D33.4, D36.1, D34, D10.3, D33.3. Depends: T02.
- [ ] T05 Convert the 3 `overdue` stubs to TC-43, TC-44, TC-45, TC-48. Spec: D1.1, D1.2, D1.3. Depends: T02.
- [ ] T06 Convert the `parseCliDate` stub to TC-50 and TC-51. Spec: D38.1. Depends: T02.
- [ ] T07 Add failing tests for weekday rules and case: TC-04, TC-05, TC-14, TC-71. Spec: D8.2, D47.1, D66.1, D33.2. Depends: T04.
- [ ] T08 Add failing tests for relative words: TC-08, TC-16, TC-19, TC-69. Spec: D66.2, D10.1, D33.1. Depends: T04.
- [ ] T09 Add failing tests for D8.1 and clock: TC-01, TC-41, TC-42. Spec: D8.1, D1.3, NFR-M2. Depends: T02.
- [ ] T10 Add failing tests for the phrase finder: TC-21 (multi-prefix), TC-26, TC-29, TC-30, TC-31, TC-32, TC-33, TC-34, TC-35, TC-68, TC-72. Spec: D48.1..D48.3, D49.1, D49.2, D36.1. Depends: T03, T07.
- [ ] T11 Add failing tests for flagged wording: TC-28, TC-36, TC-37, TC-58, TC-65, TC-66, TC-67. Spec: D46.2, D66.3, D8.4, NFR-A7. Depends: T04.
- [ ] T12 Add failing tests for rollover edges: TC-23, TC-24, TC-63, TC-70. Spec: D34.1, D33.4. Depends: T04.
- [ ] T13 Add failing tests for invalid and leap dates: TC-61, TC-62, TC-64, TC-57. Spec: D10.1, D33.1, NFR-U3. **[OQ]** Per decision OQ-9, OQ-10. Depends: T01, T04.
- [ ] T14 Add failing tests for open-question defaults: TC-59, TC-60, TC-53, TC-56, TC-69, TC-70, TC-71. Spec: D9.1, D33.2, D31.6, NFR-U3, D66.1. **[OQ]** Per decision OQ-3, OQ-5, OQ-6, OQ-13, OQ-15. Depends: T01, T04.
- [ ] T15 Add failing robustness and determinism tests: TC-38, TC-39, TC-40, TC-47. Spec: D8.4, NFR-D2, NFR-D3, D44.1. Depends: T04.
- [ ] T16 Add failing status tests: TC-46, TC-49. Spec: D44.1. Depends: T05.
- [ ] T17 Add failing `parseCliDate` negative tests: TC-52, TC-54, TC-55. Spec: D38.1, NFR-U3. Depends: T06.
- [ ] T18 Run `npm run test`. Confirm each new test fails with `NotImplementedError` or an assertion, never a compile or import error. Fix imports only. Depends: T04 to T17.
- [ ] T19 Update `docs/TRACEABILITY.md` BR-02 and BR-04 rows from `todo` to `wip` (red tests exist). Spec: BR-02, BR-04. Depends: T18.

## Phase 2: green

- [ ] T20 Implement day arithmetic helpers in `src/dates/resolve.ts` (civil date to day number, day number to civil date, weekday, add days, last day of month, valid civil date check). Pure, UTC-based integer math. Tests: TC-39, TC-40. Spec: NFR-D2, NFR-D3. Depends: T18.
- [ ] T21 Implement ISO and month-name parsing (full and abbreviated month names, case-insensitive). Tests: TC-15, TC-17, TC-69, TC-71. Spec: D10.1, D66.1, D33.1. **[OQ]** Per decision OQ-5, OQ-6. Depends: T20.
- [ ] T22 Implement ordinal parsing (`Oct 3rd`, `Oct 5th`). Tests: TC-18, TC-64. Spec: D33.1. **[OQ]** Per decision OQ-9. Depends: T21.
- [ ] T23 Implement year-less date handling and `rollYear` (more than 6 months before meeting moves to next year). Tests: TC-16, TC-22, TC-23, TC-24. Spec: D10.2, D34.1. **[OQ]** Per decision OQ-12. Depends: T21.
- [ ] T24 Implement bare weekday and `next <weekday>`, with `Mon`..`Sun` abbreviations. Tests: TC-02, TC-03, TC-04, TC-05, TC-12, TC-14, TC-59, TC-60. Spec: D8.2, D33.2, D47.1, D66.1. **[OQ]** Per decision OQ-3. Depends: T20.
- [ ] T25 Implement relative words: tomorrow, EOD, EOD tomorrow, EOM, end of month, next week, end of next week. Tests: TC-06, TC-07, TC-08, TC-09, TC-10, TC-11, TC-13. Spec: D8.3, D9.1..D9.3, D33.2, D66.2. Depends: T24.
- [ ] T26 Implement weekday plus explicit date agreement: explicit date wins, warning returned, roll over before check. Tests: TC-19, TC-20, TC-70. Spec: D33.4. **[OQ]** Per decision OQ-13. Depends: T23, T24.
- [ ] T27 Implement the `resolveDue` dispatch and the flagged result for `03/04`, `mid-October`, `for November`, `sometime`, `by <date>`, and the D66.3 list. Never throw. Tests: TC-25, TC-27, TC-28, TC-35, TC-36, TC-37, TC-38, TC-58, TC-61, TC-62, TC-66, TC-67. Spec: D10.3, D33.3, D46.2, D66.3, D8.4, NFR-A7. **[OQ]** Per decision OQ-7, OQ-8, OQ-10. Depends: T25, T26.
- [ ] T28 Implement `findDuePhrase` scanning introducers `by`, `due`, `on`, `from`, `for <month name>`, and the last-resolving-wins rule. Tests: TC-21, TC-26, TC-31, TC-32, TC-34, TC-68, TC-72. Spec: D48.1, D48.2, D48.3, D36.1. **[OQ]** Per decision OQ-2, OQ-7, OQ-20. Depends: T27.
- [ ] T29 Implement removal of the resolved phrase and its joining dash or comma from `taskText`. Tests: TC-29, TC-33. Spec: D49.1, D49.2. **[OQ]** Per decision OQ-18. Depends: T28.
- [ ] T30 Implement `statusOf(item, today)`: done, then overdue (`due < today`), then open. No mutation. Tests: TC-43, TC-44, TC-45, TC-46, TC-47, TC-48, TC-49. Spec: D1.1, D1.2, D44.1, D1.3. Depends: T18.
- [ ] T31 Implement `parseCliDate(input, today)`: ISO exact; month-name forms with today's year and rollover from today; otherwise throw an `ActiontrackError` subclass whose message lists valid forms. Tests: TC-50, TC-51, TC-52, TC-53, TC-54, TC-55, TC-56, TC-57. Spec: D31.6, D38.1, NFR-U3. **[OQ]** Per decision OQ-10, OQ-15. Depends: T21, T23.
- [ ] T32 Confirm `systemClock` in `src/clock.ts` already uses local getters (no change). Make TC-41 pass. Spec: D1.3. Depends: T18.
- [ ] T33 Run `npm run test` and confirm every test in `dates.test.ts` is green. Depends: T20 to T32.

## Phase 3: refactor and checks

- [ ] T34 Refactor `src/dates/resolve.ts`: one place for month and weekday tables, one place for suffix checks, no duplicated regexes. Tests stay green. Depends: T33.
- [ ] T35 Check `src/dates/resolve.ts` imports only `../domain/*` and `../clock.js` (dependency rule). Confirm no `store` or `email` import. Depends: T34.
- [ ] T36 Confirm no `any` and no implicit `any` in the module (`npm run typecheck`). Depends: T34.
- [ ] T37 Run the date tests under other timezones (PowerShell: `$env:TZ='Pacific/Kiritimati'; npm run test`, then `$env:TZ='America/Los_Angeles'`). All must pass (N3, NFR-C1). Depends: T33.
- [ ] T38 Confirm the 2026 weekday values used in tests with a calendar check (for example `Date.UTC`) in a scratch script outside the repo. Do not commit it. Depends: T33.
- [ ] T39 Check each acceptance bullet in `spec.md` (the "Acceptance tests" list) maps to at least one TC in `testcases.md`. Record gaps in `testcases.md`, not in the spec. Depends: T33.

## Phase 4: traceability and gate

- [ ] T40 Update `docs/TRACEABILITY.md`: BR-02 and BR-04 rows from `wip` to `done` for the IDs in this spec. Leave the NFR rows unchanged unless every ID in that row is covered. Depends: T39.
- [ ] T41 Run `npm run check` (typecheck and test). Must pass with zero `it.todo` left in `tests/unit/dates.test.ts`. Depends: T40.
- [ ] T42 Run `git status` and `git diff --stat`. Confirm changed files are only `src/dates/resolve.ts`, `src/clock.ts` (if touched), `tests/unit/dates.test.ts`, `docs/TRACEABILITY.md`, `docs/FRD.md` (D77+ only, if OQ answers were recorded). No changes to other specs or `notes/`. Depends: T41.
- [ ] T43 Do not commit unless the user asks. Report the changed files. Depends: T42.

## Definition of done

- [ ] Every requirement ID in `plan.md` (requirement map) has at least one passing TC.
- [ ] Every decision OQ-1 to OQ-20 in `plan.md` is recorded as D77+ in `docs/FRD.md`.
- [ ] `resolveDue`, `findDuePhrase`, `statusOf`, `parseCliDate` never throw on user wording (only `parseCliDate` throws, and only for CLI input, with an error that names valid forms).
- [ ] No `overdue` value is written anywhere in this module (it is returned by `statusOf` only).
- [ ] Dates are ISO `YYYY-MM-DD` or `null` in every return value.
- [ ] `tests/unit/dates.test.ts` has no `it.todo`, and every test name starts with its bracketed ID.
- [ ] `docs/TRACEABILITY.md` BR-02 and BR-04 rows are `done`.
- [ ] `npm run check` passes, including under at least two `TZ` settings.
- [ ] No file outside the list in T42 is changed. Nothing is committed without the user's request.
