# Tasks: spec 09, `actiontrack followup`

Order matters. Each task lists the spec or FRD ID it satisfies, the file it touches, the test cases (see `testcases.md`) it turns green, and what it depends on. Red before green: no implementation task starts until its tests exist and fail for the right reason (`NotImplementedError` or assertion, not a syntax or import error).

Conventions: `npm test` for the red and green runs, `npm run check` at the end. No edits to `docs/FRD.md` except T02. No edits to `src/email/connector.ts` interface beyond what is stated. No edits to `tests/unit/safety.test.ts` except re-running it.

## Phase 0: record decisions

- [x] **T01** Requester's answers for `plan.md` Q1 to Q23 are recorded in its "Decisions" section. Q1, Q3, Q5, Q6, Q8, Q9 and Q15 were answered by the requester; the rest are settled in the same section. Satisfies: CLAUDE.md "stop and ask". File: none. Tests: none. Depends on: none. Blocks everything below that cites a decision TC.
- [ ] **T02** Record the answers as new decisions D77 and later in `docs/FRD.md` section 11, one per answer, each naming the earlier "Still open" row it closes (D19.5 for Q6 and Q7, D16.3 for Q8, D6.3 for Q9 and Q10, D58.2 for Q12, D74.1 for Q19). Satisfies: CLAUDE.md workflow step 1. File: `docs/FRD.md`. Tests: none. Depends on: T01.

## Phase 1: fixtures and red tests

- [ ] **T03** Create the fake connector in `tests/fixtures/followup/fake-connector.ts`. It implements `DraftConnector`, records calls, returns configurable draft ids, and can throw `GmailError`, a plain `Error`, or delay. It has no other method. Satisfies: NFR-M3, AC-F3. File: `tests/fixtures/followup/fake-connector.ts`. Tests: supports TC-18 to TC-21, TC-28, TC-31. Depends on: none.
- [ ] **T04** Create the in-memory store and fixed-clock fixture set (Priya, Sam, Lee, label items, merged item, prior `drafts` record). Satisfies: NFR-M2, D14. File: `tests/fixtures/followup/store-fixtures.ts`. Tests: supports all followup TCs. Depends on: T03.
- [ ] **T05** Create the attendee, owners-file and hostile-text fixtures (`tests/fixtures/followup/owners/*.json`, note fixtures). Satisfies: D6, D18, D56, NFR-SEC4. File: `tests/fixtures/followup/`. Tests: TC-12 to TC-15, TC-34, TC-50, TC-57. Depends on: T04.
- [ ] **T06** Replace the followup `it.todo` lines in `tests/unit/commands.test.ts` (the `describe("followup (BR-06, BR-07, AC-F1..F3)")` block) with real tests named `[TC-01]` to `[TC-28]`, `[TC-31]`, `[TC-35]` to `[TC-57]` as far as they are unit-level. Each test cites its FRD ID. Satisfies: CLAUDE.md step 2. File: `tests/unit/commands.test.ts`. Tests: TC-01 to TC-28, TC-31, TC-35 to TC-57 (except integration rows TC-32, TC-33). Depends on: T03, T04, T05, T01.
- [ ] **T07** Add the template tests (TC-02 to TC-06, TC-46 to TC-49) in the same `commands.test.ts` followup section, calling `renderFollowup` directly with `ActionItem` fixtures. Satisfies: D19, D39.3, D65.3. File: `tests/unit/commands.test.ts`. Tests: TC-02 to TC-06, TC-46 to TC-49. Depends on: T06.
- [ ] **T08** Add the static import check (TC-51) as a test that reads `src/email/followup-template.ts` and asserts no import from `store/`, `mcp-connector` or `cli/`. Satisfies: NFR-M1. File: `tests/unit/commands.test.ts`. Tests: TC-51. Depends on: T06.
- [ ] **T09** Add the acceptance case (TC-53) to `tests/acceptance/sample-notes.test.ts`, with the expected count taken from the spec 06 sample fixture decision. Mark it `it.todo` if spec 06 has not decided the count yet. Satisfies: NFR-A10, AC-F1. File: `tests/acceptance/sample-notes.test.ts`. Tests: TC-53. Depends on: T03, T04, T01.
- [ ] **T10** Add the integration stubs for TC-32 and TC-33 as `it.todo` under the spec 10 connector section, and cross-link them. Satisfies: D75.1, D76.1. File: `tests/unit/commands.test.ts` (followup section) with a comment pointing at spec 10. Tests: TC-32, TC-33 (owned by spec 10). Depends on: T06.
- [ ] **T11** Run `npm test` and confirm every new test fails, and fails with `NotImplementedError` or an assertion, not a compile or import error. Satisfies: TDD red. File: none. Tests: all new. Depends on: T06 to T10.
- [ ] **T12** Run `tests/unit/safety.test.ts` and record that TC-29 and TC-30 pass before any code change. Do not edit the file. Satisfies: NFR-S1, NFR-S2, AC-F3. File: none. Tests: TC-29, TC-30. Depends on: none.

## Phase 2: pure core (template and selection)

- [ ] **T13** Implement subject, greeting (first token, Q11) and closing in `renderFollowup`. Satisfies: D19.1, D19.2, D19.4, D74.1. File: `src/email/followup-template.ts`. Tests: TC-02, TC-03, TC-05, TC-47. Depends on: T11.
- [ ] **T14** Implement the Overdue and Open sections, each omitted when empty, Overdue first. Satisfies: D19.3. File: `src/email/followup-template.ts`. Tests: TC-04, TC-48. Depends on: T13.
- [ ] **T15** Implement per-entry output: task, due date or "no due date", meeting date, file name only (Q12). Satisfies: D19.3, D39.3, D58.2. File: `src/email/followup-template.ts`. Tests: TC-06, TC-49. Depends on: T14.
- [ ] **T16** Render note text as data: no interpretation of task text. Satisfies: NFR-SEC4. File: `src/email/followup-template.ts`. Tests: TC-50. Depends on: T15.
- [ ] **T17** Implement the pure selection helper: keep open and overdue (D44), exclude done (FR-F3), sort by due date ascending, undated last, ties by numeric id (rule 9), use the latest source for a merged item with the Q13 tie rule. File: `src/cli/commands/followup.ts` (exported helper) or a new pure function in the same module. Satisfies: FR-F2, FR-F3, D1, D39.3, D44. Tests: TC-01, TC-45, TC-46, TC-42. Depends on: T11.
- [ ] **T18** Implement the subject N as the count of selected items (not the total items). Satisfies: D74.1. File: `src/email/followup-template.ts` (caller passes the selected list). Tests: TC-25. Depends on: T13, T17.

## Phase 3: command shell

- [ ] **T19** Implement argument validation: exactly one of `<owner>` or `--all` (D73.1), and the four special tokens as usage errors (D73.2), returning exit 2 with the required message. File: `src/cli/commands/followup.ts`. Tests: TC-22, TC-23, TC-24. Depends on: T11.
- [ ] **T20** Implement `<owner>` resolution through the spec 03 resolver: full name, first name matching one, first name matching several gives exit 2 with the choices (D4.4). Unknown name gives exit 2 (Q1). File: `src/cli/commands/followup.ts`. Tests: TC-11, TC-38. Depends on: T19, spec 03 done.
- [ ] **T21** Implement the store read path: missing store gives exit 2 with a message telling the user to run `ingest` first, and no draft (Q3); corrupt store gives exit 2 and no write (D59.4). File: `src/cli/commands/followup.ts` via spec 05 loader. Tests: TC-35, TC-44. Depends on: T19, spec 05 done.
- [ ] **T22** Implement `--all` grouping: open and overdue items per resolved owner; count items with label owners (D16.3, D25.3, D42.3) and print the count. File: `src/cli/commands/followup.ts`. Tests: TC-08, TC-10, TC-39. Depends on: T17, T21.
- [ ] **T23** Implement the "nothing to chase" path: no draft, message, exit 0 for `<owner>` and `--all`; `--force` makes no difference here (Q21). File: `src/cli/commands/followup.ts`. Tests: TC-09, TC-37, TC-55. Depends on: T22.
- [ ] **T24** Implement the env var check `ACTIONTRACK_GMAIL_MCP_CMD` before any owner is processed or any draft is created (Q5, Q22). Exit 3, message naming the variable. File: `src/cli/commands/followup.ts` (reads a value passed in `Deps`; the real env read stays in `cli/index.ts`). Tests: TC-26. Depends on: T23.
- [ ] **T25** Implement the repeat check: any prior `drafts` record for the resolved owner name (exact match, Q6). Warn with earlier draft id and date, create no draft, count as a warning (exit 1). Skip the check when `--force`. File: `src/cli/commands/followup.ts`. Tests: TC-16, TC-40, TC-41. Depends on: T22.
- [ ] **T26** Implement `--force`: create a new draft and add a new record; never touch earlier records or the Gmail draft (D51.3). File: `src/cli/commands/followup.ts`. Tests: TC-17. Depends on: T25.
- [ ] **T27** Implement recipient resolution: attendee email from the most recent note that has one (Q9), then owners file (case-insensitive full name, Q10, attendee wins D18.2), else no `to` key and a warning (D6.3). Conflicting attendee emails give the most recent and a warning (D56.2). File: `src/cli/commands/followup.ts`. Tests: TC-12 to TC-15, TC-57, TC-56. Depends on: T22.
- [ ] **T28** Implement the warning for a malformed owners file: warning naming the file, exit 1, drafts without recipients (D56.3). File: `src/cli/commands/followup.ts` via spec 05 loader result. Tests: TC-34. Depends on: T27.
- [ ] **T29** Implement the single `createDraft` call per owner: build `{to?, subject, body}`, call once, no loop, no retry (FR-F5, rule 16). File: `src/cli/commands/followup.ts`. Tests: TC-31, TC-28. Depends on: T15, T18, T27.
- [ ] **T30** Implement failure handling: a connector failure gives exit 3, a clear stderr message, no record; `--all` continues to the next owner and exits 3 at the end (D53.2). File: `src/cli/commands/followup.ts`. Tests: TC-18, TC-19. Depends on: T29.
- [ ] **T31** Implement the unexpected-error path: a non-Gmail error gives exit 4, a clear message, and the store unchanged (D62.1). File: `src/cli/commands/followup.ts`. Tests: TC-36. Depends on: T30.
- [ ] **T32** Implement the `drafts` record write after a successful call only: owner, draft id, clock time (Q16), item ids of listed items (D51.1). Atomic save via spec 05. File: `src/cli/commands/followup.ts`, `src/store/store.ts`. Tests: TC-27. Depends on: T29, spec 05 done.
- [ ] **T33** Implement the draft-saved-but-record-failed path: exit 4 with owner and draft id on stderr (Q18). File: `src/cli/commands/followup.ts`. Tests: TC-43. Depends on: T32, T31.
- [ ] **T34** Implement the per-draft output: owner, recipient or `(no recipient)`, item count, draft id (D35.1). File: `src/cli/commands/followup.ts`. Tests: TC-20. Depends on: T29.
- [ ] **T35** Implement the total line for `--all`, printed even when zero drafts (Q15, D35.2). File: `src/cli/commands/followup.ts`. Tests: TC-21, TC-54. Depends on: T34.
- [ ] **T36** Implement exit code precedence: highest of 4, 3, 2, 1, 0 (D53.1); skipped label items do not change the exit code (Q8); stderr warnings do not print addresses (Q14). File: `src/cli/commands/followup.ts`. Tests: TC-39, TC-56. Depends on: T30, T27.
- [ ] **T37** Confirm `followup` makes no call beyond `createDraft` and does no network or process work in tests. Satisfies: NFR-M3. File: `src/cli/commands/followup.ts`. Tests: TC-52. Depends on: T29.

## Phase 4: safety and interface

- [ ] **T38** Add the type-level or runtime check that the `DraftConnector` surface is only `createDraft` (AC-F3). File: `tests/unit/commands.test.ts` (the TC-28 test), not `safety.test.ts`. Tests: TC-28. Depends on: T06, T29.
- [ ] **T39** Re-run `tests/unit/safety.test.ts`. Confirm TC-29 and TC-30 still pass and the file is byte-identical to before this spec (`git diff --stat tests/unit/safety.test.ts` is empty). Satisfies: NFR-S1, NFR-S2, AC-F3, RULE-1. File: none. Tests: TC-29, TC-30. Depends on: T29, T37.
- [ ] **T40** Confirm `src/email/connector.ts` still has only `createDraft` and no send, flag or retry. Satisfies: FR-F5, NFR-S1. File: `src/email/connector.ts` (read-only check). Tests: TC-28, TC-30. Depends on: T38.

## Phase 5: refactor

- [ ] **T41** Remove every `NotImplementedError` throw from `src/email/followup-template.ts` and `src/cli/commands/followup.ts`, and remove the now-unused import (CLAUDE.md: delete the placeholder as you implement each module). File: both. Tests: all followup TCs still green. Depends on: T13 to T37.
- [ ] **T42** Refactor the command shell into small named steps (validate, select, resolve recipient, repeat check, draft, record) without changing behaviour. Check with the same tests. File: `src/cli/commands/followup.ts`. Tests: all followup TCs. Depends on: T41.
- [ ] **T43** Check the template and selection are free of I/O and imports from `store/` or `email/mcp-connector.ts` (NFR-M1). File: `src/email/followup-template.ts`. Tests: TC-51. Depends on: T42.

## Phase 6: traceability and checks

- [ ] **T44** Update `docs/TRACEABILITY.md` row BR-06 (`email/followup-template.ts`, `cli/commands/followup.ts`, `unit/commands.test.ts`) status from `todo` to `done`. Also update BR-07 row for the `followup` part if needed (connector status is spec 10's). File: `docs/TRACEABILITY.md`. Tests: none. Depends on: T42, T43.
- [ ] **T45** Update the NFR-S1..S3 row status in `docs/TRACEABILITY.md` only if `safety.test.ts` coverage has changed (it should not). File: `docs/TRACEABILITY.md`. Tests: TC-29, TC-30. Depends on: T39.
- [ ] **T46** Run `npm run typecheck`, fix any strict-mode error (no `any`, `.js` suffixes on relative imports). File: as needed. Tests: all. Depends on: T42.
- [ ] **T47** Run `npm run check` and confirm it passes: lint, typecheck, tests. File: none. Tests: all. Depends on: T44, T45, T46.
- [ ] **T48** Manual check (not automated, D45.3, NFR-S3): run `followup` against a real Gmail MCP server on a throwaway note, confirm the draft appears in Gmail Drafts and nothing appears in Sent. Record the result in the PR description, not in a file. Satisfies: NFR-S3, AC-F1. Tests: none. Depends on: T47, spec 10 done.
- [ ] **T49** Update this spec folder only if the requester changed a behaviour in T01. Otherwise leave `spec.md` as written. File: `specs/09-followup/spec.md` (only on change). Tests: none. Depends on: T02.
- [ ] **T50** Check no file outside `src/`, `tests/`, `docs/TRACEABILITY.md`, `docs/FRD.md` and the new fixture folder was changed. File: none (git status review). Tests: none. Depends on: T47.

## Definition of done

- [ ] Every `followup` TC in `testcases.md` is either green or explicitly marked as owned by spec 03, 05 or 10 and green in that spec.
- [ ] Every decision Q1 to Q23 cited by a TC is recorded as a decision in `docs/FRD.md` (D77 or later).
- [ ] TC-29 and TC-30 (`tests/unit/safety.test.ts`) pass and that file is unchanged.
- [ ] No code path calls any method on the connector except `createDraft`; no retry; no send option (FR-F5, AC-F3, NFR-S1, NFR-S2).
- [ ] Exit codes follow `plan.md` requirement map: 0, 1, 2, 3, 4 with the highest-wins rule (D53.1).
- [ ] `followup` writes a `drafts` record only after a successful call; items are not modified (D51.1, D20.5).
- [ ] `followup` output prints owner, recipient or `(no recipient)`, count, draft id, and a total line for `--all` (D35).
- [ ] `docs/TRACEABILITY.md` BR-06 status is `done`.
- [ ] `npm run check` passes on Windows (the platform in use). macOS and Linux run is the NFR-C1 check, owned by spec 11.
- [ ] No `NotImplementedError` remains in `src/email/followup-template.ts` or `src/cli/commands/followup.ts`.
- [ ] No email is sent in any manual or automated run (T48).
