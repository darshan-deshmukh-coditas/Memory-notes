# Tasks: 03 Owner resolution

Order follows CLAUDE.md: spec ID, then red test, then green implementation, then refactor, then TRACEABILITY and `npm run check`. Test IDs (TC-nn) refer to `testcases.md`. "deps" lists earlier tasks that must be done first. Tasks marked **(per decision Qn)** follow the decision recorded for Qn in `plan.md`.

Columns: ID | spec / FRD ID | file | test turned green (TC) | deps | action.

## Phase 0: resolve the stub mismatches and record decisions

- [ ] **T01** | Q1, spec Modules row | `src/owners/resolve.ts` | none | none | Rename stub `matchOwnerArg` to `resolveOwnerArg`. Add `parseOwnerPhrase` and `buildRoster` stubs throwing `NotImplementedError`. Keep the existing function docs.
- [ ] **T02** | Q3 | `src/domain/types.ts` | none | T01 | Change `OwnerResolution.unresolved` from `firstName` to `text` (raw owner text), per D68.1. **(per decision Q3)**
- [ ] **T03** | Q2 | `src/owners/resolve.ts` | none | T01 | Change `resolveOwner` to return an array of results, one per `&` part. **(per decision Q2)**
- [ ] **T04** | Q13 | `src/owners/resolve.ts`, `src/domain/errors.ts` | none | T01 | Define the `resolveOwnerArg` result type (`person`, `label`, `no-match`) and add a usage-error subclass of `ActiontrackError` for ambiguous first names (check which error classes already exist first). **(per decision Q13)**
- [ ] **T05** | Q1, Q2, Q3, Q13 | `docs/FRD.md` section 11 | none | T02, T03, T04 | Copy each decision Q1, Q2, Q3 and Q13 from `plan.md`'s Decisions section into `docs/FRD.md` section 11 as a new decision (D77 or later). Do not change earlier D entries. Do this before any red test cites these decisions.

## Phase 1: red tests (turn stubs into failing tests)

- [ ] **T06** | D25.1, D25.2, D46.1 | `tests/unit/edge-cases.test.ts` (E2) | TC-01, TC-02, TC-03, TC-04, TC-05 | T01 | Replace the E2 `it.todo` for "Someone/TBD ... Everyone/Team" with the five TCs. Run and confirm they fail with `NotImplementedError`.
- [ ] **T07** | D50.2 | same file (E2) | TC-06 | T01 | Add the no-owner-pattern test. Red.
- [ ] **T08** | D67.1, D67.2, D24.2 | same file (E3) | TC-08, TC-09, TC-10, TC-11 | T01 | Add the owner-phrase tests. Red.
- [ ] **T09** | D24.4, D60.2, D24.3 | same file (E3) | TC-15, TC-16, TC-17, TC-18, TC-19 | T03 | Add the joint owner and collaborator tests. Red.
- [ ] **T10** | D4.2 (E3 todo "bare first name ... ambiguous") | same file (E3) | TC-20, TC-21, TC-22, TC-23 | T01 | Turn the first E3 `it.todo` into TC-20 to TC-23. Red.
- [ ] **T11** | D24.1 (E3 todo "`Priya N.` resolves by surname initial") | same file (E3) | TC-12, TC-13, TC-14 | T01 | Turn the second E3 `it.todo` into TC-12 to TC-14. Red.
- [ ] **T12** | D23 (E3 todo "no attendees: ...") | same file (E3) | TC-30, TC-31, TC-32 | T01 | Turn the third E3 `it.todo` into TC-30 to TC-32. Red.
- [ ] **T13** | D41.1, D41.2, D41.3, D60.1 | same file (E3) | TC-25, TC-26, TC-27, TC-28, TC-29 | T01 | Add roster-fallback and full-name tests. Red.
- [ ] **T14** | D4.4, D31.3 (E3 todo "--owner / followup with an ambiguous first name ...") | same file (E3) | TC-44, TC-45, TC-46, TC-47 | T04 | Turn the fourth E3 `it.todo` into the arg-matching tests. Red.
- [ ] **T15** | D42.1, D42.2 | same file (E2/E3) | TC-48, TC-49, TC-43 | T01 | Add token and label tests. Red.
- [ ] **T16** | D61.1, D61.2 | same file (E3) | TC-50, TC-51, TC-52 | T01 | Add roster tests for `buildRoster`. Red.
- [ ] **T17** | rule 12 | same file (E3) | TC-21, TC-24 | T01 | Add case-insensitive name tests. Red (TC-21 is also in T10; do not duplicate).
- [ ] **T18** | Q6 **(per decision Q6)** | same file (E3) | TC-36, TC-37 | T05 | Add accent and hyphen tests per decision Q6. Red.
- [ ] **T19** | Q2b, Q2c, Q7a, Q7b, Q7c, Q8, Q9, Q5 **(per decision Q2b, Q2c, Q7a, Q7b, Q7c, Q8, Q9, Q5)** | same file (E2/E3) | TC-33, TC-34, TC-35, TC-38, TC-39, TC-40, TC-41, TC-42, TC-24 | T05 | Add the tests for these decisions. Red.
- [ ] **T20** | NFR-SEC4 | same file (E3) | TC-53 | T01 | Add hostile-text test. Red.
- [ ] **T21** | NFR-R1 | same file (E3) | TC-54 | T01 | Add the never-throw property test over the listed inputs. Red.
- [ ] **T22** | NFR-A6, NFR-A7, NFR-A8 | `tests/acceptance/owners.acceptance.test.ts` (new) | TC-55, TC-56, TC-57, TC-58 | T01, T29 | Add the four acceptance tests. Mark them red and expected to stay red until spec 01 and spec 06 deliver the sample pipeline. Use `it.todo` if the pipeline does not exist yet, and say so in the test name.
- [ ] **T23** | CLAUDE.md test-first rule | `tests/unit/edge-cases.test.ts` | all | T06 to T21 | Run `npm test`. Confirm each new test fails with `NotImplementedError` or an assertion, not with a syntax or import error. Record the count.

## Phase 2: fixtures

- [ ] **T24** | NFR-M1 | `tests/fixtures/` (synthetic) | all unit TCs | none | Add a small attendee and roster fixture file with the synthetic names listed in `testcases.md`. No real sample names.
- [ ] **T25** | NFR-A6 to NFR-A8 | `tests/fixtures/` or the sample `notes/` folder (read-only) | TC-55 to TC-58 | none | Confirm the sample dates named in the spec exist. Do not copy or edit `notes/`.

## Phase 3: green implementation

- [ ] **T26** | D50.2, D67.1 | `src/owners/resolve.ts` `parseOwnerPhrase` | TC-06, TC-08, TC-09 | T01 | Split on the first case-sensitive lower-case ` to ` (word boundary). No match gives no-owner with full text.
- [ ] **T27** | D25.1, D25.2, D46.1 | `src/owners/resolve.ts` | TC-01 to TC-05, TC-43 | T26 | Placeholder detection by exact phrase (case-insensitive per Q4). Return `none` or `group`.
- [ ] **T28** | D67.2, D24.2 | `parseOwnerPhrase` | TC-10, TC-11, TC-40, TC-41 | T26 | `@name:` form, tested before the ` to ` split (Q8). No colon: treat as ordinary phrase.
- [ ] **T29** | D24.1 surname-initial, rule 10 | `src/owners/resolve.ts` | TC-12, TC-13, TC-14, TC-35 | T26 | Parse `First N.` (dot optional per Q7c). Match attendee surname initial, case-insensitive. No match gives `unresolved`.
- [ ] **T30** | D24.3, D60.2 | `parseOwnerPhrase`, `resolveOwner` | TC-15, TC-16, TC-18, TC-19, TC-39 | T03 | Split only on `&`. Trim each part. Dedupe identical parts (Q2b). Return one result per part.
- [ ] **T31** | D24.4 | `parseOwnerPhrase` | TC-17 | T26 | Strip trailing `(with ...)` from each part, keep the collaborator in the task text (Q10).
- [ ] **T32** | D4.1, rule 9 | `resolveOwner` | TC-22, TC-23, TC-20, TC-21 | T26 | First-name match against attendees, case-insensitive. Exactly one: person. Two or more: `ambiguous`. None: fall to roster.
- [ ] **T33** | rule 12 | `resolveOwner` | TC-24 | T32 | Full-name match, case-insensitive, returning the attendee spelling (Q5).
- [ ] **T34** | D41.1, D41.2, D41.3, D23.2, NFR-A8 | `resolveOwner` | TC-27, TC-28, TC-29, TC-30, TC-31, TC-32 | T32 | Roster fallback. `viaRoster: true` for a unique match. Several gives `ambiguous`. None gives `unresolved`.
- [ ] **T35** | D60.1 | `resolveOwner` | TC-25, TC-26 | T33, T34 | Full name not in attendees: accept if on roster (`viaRoster: true`, Q15); else `unresolved`.
- [ ] **T36** | D24.1 with roster, Q7a, Q7b | `resolveOwner` | TC-33, TC-34 | T29, T34 | Initial form uses the roster when no attendee has the first name (Q7b). Two matches on first name and initial give `ambiguous` (Q7a).
- [ ] **T37** | Q6 **(per decision Q6)** | `resolveOwner` | TC-36, TC-37 | T18, T32 | Exact match after case folding; no accent folding; hyphen and apostrophe are name characters.
- [ ] **T38** | Q9 **(per decision Q9)** | `parseOwnerPhrase` | TC-07, TC-42 | T26 | Non-empty phrase before ` to ` is an owner phrase, resolved to `unresolved`. Empty phrase gives `(no owner)` with full text.
- [ ] **T39** | D61.1, D61.2 | `src/owners/resolve.ts` `buildRoster` | TC-50, TC-51, TC-52 | T01 | Union of names from read notes and store names. Skipped notes contribute nothing. Case-insensitive dedupe keeping first spelling (Q12).
- [ ] **T40** | D4.4, D31.3 | `resolveOwnerArg` | TC-44, TC-45, TC-46 | T04 | Full name: case-insensitive match. First name matching one: that person. Several: throw usage error listing the choices.
- [ ] **T41** | D72.1 | `resolveOwnerArg` | TC-47 | T04 | Unknown name returns the no-match result, no throw (Q13).
- [ ] **T42** | D42.1, D42.2 | `resolveOwnerArg` | TC-48, TC-49 | T40 | Tokens `none`, `group`, `ambiguous`, `unresolved` map to labels before any name lookup (D42.2 limitation).
- [ ] **T43** | NFR-SEC4, NFR-R1 | `src/owners/resolve.ts` | TC-53, TC-54 | T26 to T42 | No `eval`, no shell, no regex built from note text. Wrap nothing in try/catch; make every branch return a value. Re-run TC-53 and TC-54.
- [ ] **T44** | BR-10 / E3, BR-09 / E2 | all of the above | TC-01 to TC-54 | T26 to T43 | Run the full unit suite. All TCs green except the acceptance set in T22.

## Phase 4: refactor (tests stay green)

- [ ] **T45** | NFR-M1 | `src/owners/resolve.ts` | all unit TCs | T44 | Extract one name-normalise helper (case fold, trim, strip trailing punctuation per Q4), used by parser and roster. Keep it pure.
- [ ] **T46** | CLAUDE.md conventions | `src/owners/resolve.ts`, `src/domain/types.ts` | all | T45 | Remove any `any`, keep `strict` typing, `.js` suffix on relative imports, `node:path` not used here. Run `npm run typecheck`.
- [ ] **T47** | CLAUDE.md dependency direction | `src/owners/resolve.ts` | all | T46 | Confirm the module imports only `domain/`. No import of `store` or `email`.
- [ ] **T48** | NFR-M1 | `src/owners/resolve.ts` | all | T47 | Check the public API matches the spec Modules row: `parseOwnerPhrase`, `resolveOwner`, `buildRoster`, `resolveOwnerArg`. Remove stubs no longer used.

## Phase 5: integration handoffs (verified in other specs)

- [ ] **T49** | D41.1, D16.4, NFR-A8 | spec 06 `ingest` | TC-27, TC-30 (indirect) | T34 | Ingest summary shows roster matches (`viaRoster`) and special labels. Verified by spec 06's tests, not here. Confirm spec 06's test list covers it.
- [ ] **T50** | D16.3, D42.3, D73 | spec 09 `followup` | TC-47 (indirect), TC-48 | T41, T42 | Followup uses `resolveOwnerArg` and skips special labels. Verified by spec 09's tests. Record the handoff.
- [ ] **T51** | D31.3, D72.1 | spec 07 `list --owner` | TC-44, TC-47 | T40, T41 | List uses `resolveOwnerArg`. Usage error for ambiguous, `No items match.` exit 0 for unknown (D72.1). Verified by spec 07.
- [ ] **T52** | D56.2 | spec 05 and 06 | none in this spec | none | Confirm the roster holds names only here. Email and date-of-email fields are spec 05's. No change in this spec.

## Phase 6: docs, traceability, check

- [ ] **T53** | docs/TRACEABILITY.md | `docs/TRACEABILITY.md` rows for BR-09 / E2 and BR-10 / E3 | T44, T22 | Set status to `done` only for IDs that are fully green. Leave acceptance IDs (NFR-A6 to A8) as `todo` until T22 is green. List the covered IDs in the notes column.
- [ ] **T54** | CLAUDE.md workflow step 4 | repo root | all | T53 | Run `npm run check`. Fix any lint, typecheck or test failures before closing the spec.
- [ ] **T55** | NFR-O3 | `src/owners/resolve.ts` | none | T44 | Confirm no `console` call or log file is added. Warnings are data returned to the caller (spec 06 prints them to stderr).
- [ ] **T56** | Known limitation | `docs/FRD.md` D42.2 | none | T05 | Confirm D42.2 is listed as a known limitation in the README or FRD. Add the note only if missing (no new behaviour).

## Definition of done

- [ ] Every TC-01 to TC-58 exists with the exact test name in `testcases.md` (the unit set in `tests/unit/edge-cases.test.ts`, the acceptance set in the acceptance folder).
- [ ] No `it.todo` remains in the E2 and E3 blocks for the IDs in this spec. The E4 and E1 todos are out of scope.
- [ ] Every decision in `plan.md`'s Decisions section (Q1 to Q16) is recorded there and must be copied to `docs/FRD.md` section 11 as D77+. No earlier D entry was edited.
- [ ] `resolveOwner`, `parseOwnerPhrase`, `buildRoster` and `resolveOwnerArg` exist with the names in the spec Modules row. No `matchOwnerArg` remains.
- [ ] The resolver never throws on any listed input (TC-54). No note text is evaluated (TC-53).
- [ ] Unit tests for owner labels, name forms, roster and arg matching are green. Acceptance tests for NFR-A6 to A8 are green once specs 01 and 06 run the sample folder, or are recorded as waiting on them.
- [ ] `docs/TRACEABILITY.md` status updated for BR-09 / E2 and BR-10 / E3, with the covered IDs listed.
- [ ] `npm run check` passes.
- [ ] No file under `src/`, `tests/`, `docs/` or any other spec folder was changed beyond the tasks above (T05, T53 and the fixtures are the only out-of-module edits).
- [ ] Handoffs T49 to T52 are verified by the test lists of specs 05, 06, 07 and 09. This spec does not edit those folders.
