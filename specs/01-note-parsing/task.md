# Tasks: 01 Note parsing

Format: `Tnn | satisfies | file | tests (see testcases.md) | depends on`. Work in build order from CLAUDE.md: header, then items, then note, then acceptance. Test first: a task that adds tests goes red before its implementation task goes green.

## Phase 0: decisions and setup

- [ ] T01 | all `Q-nn` in plan.md | `docs/FRD.md` section 11 (new D77+ rows) | TC-58 to TC-73 renamed | none
  - Decisions Q-01 to Q-19 are settled (see the Decisions section of plan.md). Record each as a new decision D77 onward in the same change. Implement each Q-item per decision Q-nn.
- [ ] T02 | baseline | repo | none | none
  - Run `npm run check` on the scaffold. Record that the spec 01 stubs show as todo, not failing, before changes.
- [ ] T03 | fixtures | `tests/fixtures/notes/` | none | none
  - Confirm `labelled-basic.md`, `yaml-basic.md`, `traps.md`, `bad-date.md` exist and match `tests/fixtures/notes/README.md`. Do not edit them.
- [ ] T04 | fixtures | `tests/fixtures/notes/` (new files) | TC-06, TC-15, TC-31 to TC-34, TC-35 to TC-44, TC-64, TC-70 | none
  - Create `header-labelled.md`, `header-yaml-list.md`, `header-yaml-block.md`, `header-after-heading.md`, `items-forms.md`, `ignored-contexts.md`. Synthetic text only, no real names.
- [ ] T05 | acceptance setup | `tests/acceptance/sample-notes.test.ts` (new) | TC-50 to TC-57 | none
  - Create the file with a helper that runs the parse stage over the repo `notes/` folder. Read-only.

## Phase 1: red (tests first)

- [ ] T06 | D21.1, D21.2, D11.2, D11.3, D63.2, D63.3 | `tests/unit/ingest-parsing.test.ts` | TC-05 to TC-14 | T03, T04
  - Replace the parseHeader `it.todo` lines with real failing tests. Keep the existing describe name.
- [ ] T07 | D63.1, D57.1 | `tests/unit/ingest-parsing.test.ts` | TC-15, TC-18 | T04
  - Add the failing tests for the heading boundary (`## ` only) and for a date that is not leading in the filename.
- [ ] T08 | D26.1, D12.1, D12.3, D26.2, D27.1, D27.2, D37.1, D64.2, D64.3 | `tests/unit/ingest-parsing.test.ts` | TC-31 to TC-44 (not Q) | T04
  - Replace the extractItems `it.todo` lines with real failing tests. Each test asserts the item list and the ignored kind list.
- [ ] T09 | D29.1, D29.2, NFR-D3, D35.3 scope | `tests/unit/ingest-parsing.test.ts` | TC-01 to TC-04 | T03
  - Replace the listNoteFiles `it.todo` lines with real failing tests. Move the D35.3 stub out to spec 06 per decision Q-19; rename the `D5.2` stub to `D50.1` (see plan risks).
- [ ] T10 | D5.1, D55.1 to D55.3, D64.1, D22.1 to D22.3, D57.1, D65.1, NFR-R1, NFR-R2, NFR-R5, NFR-SEC4 | `tests/unit/edge-cases.test.ts` | TC-16 to TC-30, TC-45 to TC-47, TC-49 | T03, T04
  - Replace the E4 stubs and add the readNote and skip tests as real failing tests. Build temp files inside the test (see testcases.md, Fixtures needed).
- [ ] T11 | NFR-A1 to NFR-A4 | `tests/acceptance/sample-notes.test.ts` | TC-50 to TC-57 | T05
  - Write the eight sample checks as failing tests. TC-54 asserts presence per kind now; exact counts are added in T42.
- [ ] T12 | red check | all three test files | all non-Q TCs | T06 to T11
  - Run `npm test`. Every new spec 01 test must fail with `NotImplementedError` (or a wrong value), not a syntax or import error. Fix test code until only the intended failures remain.
- [ ] T13 | settled decisions Q-01 to Q-19 | `tests/unit/*.test.ts` | TC-58 to TC-73 | T01
  - Write the Q-rows as failing tests, named with the decision ID (per decision Q-nn). Do not add `it.todo`.

## Phase 2: green, in dependency order

Header
- [ ] T14 | D21.1, D63.1 | `src/parser/header.ts` | TC-06, TC-15 | T12
  - Lead = lines before the first line starting with `## `. Labelled keys matched case-insensitively.
- [ ] T15 | D21.1, D11.1 | `src/parser/header.ts` | TC-05 | T14
  - YAML front matter when the first line is `---` and a closing `---` exists. Use a small hand-written reader for `date:` and `attendees:` (flow list `[a, b]` and block `- a`). No new dependency (CLAUDE.md: ask before adding).
- [ ] T16 | D21.2, D63.3 | `src/parser/header.ts` | TC-07, TC-08, TC-09, TC-10 | T14
  - Parse the three date forms. Validate as a real calendar date (leap years included). Weekday word dropped before parsing, not checked against the date.
- [ ] T17 | D11.2, D63.2 | `src/parser/header.ts` | TC-11, TC-13, TC-14 | T15
  - Attendee entries: `Name` or `Name <email>`; comma split only.
- [ ] T18 | D11.3 | `src/parser/header.ts` | TC-12 | T17
  - Missing attendees key returns `[]`, not a skip.
- [ ] T19 | D22.1, NFR-SEC4 | `src/parser/header.ts` | TC-19 (header part), TC-30 | T16
  - Present but unparseable date returns `unparseableDate` raw text and `date: null`. No evaluation of the value.
- [ ] T20 | D57.1 | `src/parser/header.ts` (`dateFromFilename`) | TC-16, TC-18 | T16
  - Pure: leading `YYYY-MM-DD` of the basename only, real date only.

Items
- [ ] T21 | D27.1, D27.2, D64.2 (fence part) | `src/parser/items.ts` | TC-37, TC-38, TC-40, TC-41, TC-42 | T08
  - Scanner state: fence (backticks) and HTML comment. Quote and fence checks come before checkbox matching.
- [ ] T22 | D26.2 | `src/parser/items.ts` | TC-35, TC-36 | T21
  - Table rows (`|`) and `ACTION:` lines are counted by kind, never items.
- [ ] T23 | D37.1 | `src/parser/items.ts` | TC-44 | T21
  - Numbered checkbox counted as `numbered checkbox`.
- [ ] T24 | D26.1, D12.1, D12.3, FR-I4 | `src/parser/items.ts` | TC-31, TC-32, TC-33, TC-34 | T21
  - Bullets `- * +`, marks `[ ] [x] [X]`, nested (spaces and tab), any heading level. Text trimmed. Line = `firstLine + index`.
- [ ] T25 | D64.3 | `src/parser/items.ts` | TC-43 | T24
  - Do not treat indentation as a code block. Indented checkbox is an item.
- [ ] T26 | D50.1, D50.2 | `src/parser/items.ts` | TC-45, TC-46, TC-47 | T24
  - Checkbox with no text after trim: skip `{line, reason: "empty action item"}`, keep the others. Checkbox with text is always kept.
- [ ] T27 | D64.2 (single-line), D27.1 | `src/parser/items.ts` | TC-41 | T21
  - Single-line `<!-- ... -->` containing a checkbox counted as `HTML comment`.
- [ ] T28 | NFR-SEC4 | `src/parser/items.ts` | TC-49 | T24
  - No `eval`, `exec`, shell, or dynamic import anywhere in parser modules. Code review step, plus the spy test.

Note reading
- [ ] T29 | D55.3, D5.1, D22.3, FR-I8 | `src/parser/note.ts` | TC-22, TC-23 | T16
  - Pure `decodeNote(buffer)`: `TextDecoder("utf-8", {fatal: true})`. Invalid gives `not valid UTF-8`. Runs before the header check.
- [ ] T30 | D5.1, D64.1, D55.1, D55.2 | `src/parser/note.ts` | TC-20, TC-21, TC-24, TC-25, TC-29 | T29
  - BOM stripped, not a failure. Whitespace-only (after BOM strip) gives `empty file`. CRLF normalised for parsing. Long lines handled.
- [ ] T31 | D22.1, D22.2, D57.1, D5.1 | `src/parser/note.ts` | TC-17, TC-19, TC-63 | T19, T20, T30
  - Order: empty, UTF-8, header. Filename fallback only when `date` is null and no unparseable value. Skip reasons from the fixed constants only.
- [ ] T32 | NFR-R1, NFR-R2 | `src/parser/note.ts` | TC-26, TC-27, TC-28 | T31
  - Wrap all fs and parse calls; every error becomes `{file, reason}` with a fixed reason. Export the six reason strings (including `unreadable file`) as one constant and assert against it.
- [ ] T33 | D29.1, D29.2, NFR-D3, NFR-SEC3 | `src/parser/note.ts` (`listNoteFiles`) | TC-01 to TC-04 | T09 (red), T31
  - `readdir` with `withFileTypes`. Pure `selectNoteNames(entries)` for the rules. Only the given folder is read. Plain code-unit sort.
- [ ] T34 | D65.1, D50.1 | `src/parser/items.ts` and `note.ts` | TC-45 (line skip shape) | T26, T31
  - Line-level skip shape `{file, line, reason}` produced by the caller path; check the shape matches the type in `src/domain/types.ts`.

Decision tasks (per decisions Q-01 to Q-19; one task per decision group, same change as the decision)
- [ ] T35 | Q-01, Q-17, Q-16 | `src/parser/header.ts`, `note.ts` | TC-58, TC-71, TC-72 | T13, T31
- [ ] T36 | Q-02 | `src/parser/note.ts` | TC-59 | T13, T32
- [ ] T37 | Q-03 | `src/parser/note.ts` | TC-60 | T13, T33
- [ ] T38 | Q-04, Q-05, Q-15 | `src/parser/items.ts` | TC-39, TC-40, TC-61, TC-70 | T13, T21, T24
- [ ] T39 | Q-06, Q-10, Q-11 | `src/parser/header.ts` | TC-62, TC-65, TC-66 | T13, T16, T20
- [ ] T40 | Q-08 (and Q-07 check via TC-63 in T31) | `src/domain/types.ts` (`Note` gets the absolute first body line), `note.ts`, `items.ts` | TC-48 | T13, T31
  - Type change: record the decision first. This changes signatures used by specs 04 and 05; check their tests.
- [ ] T41 | Q-09, Q-12, Q-13, Q-14 | `src/parser/header.ts`, `note.ts` | TC-64, TC-67, TC-68, TC-69 | T13, T14, T15
- [ ] T42 | NFR-A4 (counts) | `tests/acceptance/sample-notes.test.ts`, `testcases.md` row TC-54 | TC-54 | T11, T34, T38
  - Run the parse stage on the sample folder, record the exact ignored counts by kind and the four skip results, and write the counts into TC-54 in testcases.md. Review them by hand against the four trap files before recording. Only after review.
- [ ] T43 | NFR-A2, NFR-A3 | `tests/acceptance/sample-notes.test.ts` | TC-50, TC-51, TC-52 | T33, T34, T32
  - Make the acceptance checks green for the sample folder.

## Phase 3: acceptance and refactor

- [ ] T44 | NFR-A1, NFR-A4, NFR-A2 | `tests/acceptance/sample-notes.test.ts` | TC-53, TC-55, TC-56, TC-57 | T43
  - Make the remaining sample checks green.
- [ ] T45 | refactor | `src/parser/*.ts` | all green TCs | T44
  - Keep `parseHeader`, `dateFromFilename`, `extractItems`, `decodeNote` pure (no fs, no clock). Only `listNoteFiles` and `readNote` do IO. `domain/` imports nothing. No `any`. `.js` suffix on relative imports. `node:path` only.
- [ ] T46 | BR-01, BR-11, NFR-R1..R5, NFR-A2..A4 (traceability) | `docs/TRACEABILITY.md` | none | T44
  - Add D11 and D37 to the BR-01 row (both missing today; D5 is already on the BR-11 row). Set BR-01, BR-11 and NFR-R1..R5 status to `wip`. Mark `done` only when spec 06 also passes.
- [ ] T47 | NFR-C1 | repo | TC-01, TC-25, TC-56 | T45
  - Run the tests on Windows (dev machine). Record macOS and Linux as not yet run, or run them if available. Note the result in the handover, not in a new file.
- [ ] T48 | all | repo | all | T45, T46
  - Run `npm run check` (typecheck and test). Expect the spec 01 tests green and the other specs' todos still todo.
- [ ] T49 | all | `tests/unit/ingest-parsing.test.ts`, `tests/unit/edge-cases.test.ts` | none | T48
  - Confirm no `it.todo` remains for spec 01 IDs. Other specs' todos stay.
- [ ] T50 | safety | `tests/unit/safety.test.ts` | none | T48
  - Confirm the safety test still passes unchanged. Do not edit it. Nothing in spec 01 may import `email/`.

## Definition of done

- [ ] Every decision Q-01 to Q-19 is recorded as D77+ in `docs/FRD.md`.
- [ ] Every non-Q TC in testcases.md exists as a real test with its ID in the name, and passes.
- [ ] The Q-rows pass; their names carry the decision ID.
- [ ] `readNote`, `listNoteFiles`, `parseHeader`, `extractItems`, `dateFromFilename` never throw on user input (negative TCs green).
- [ ] The six skip reason strings are the only skip reasons: `empty file`, `not valid UTF-8`, `missing date`, `unparseable date`, `unreadable file` (note level) and `empty action item` (line level).
- [ ] Sample acceptance checks NFR-A1 to NFR-A4 pass; TC-54 counts recorded.
- [ ] `docs/TRACEABILITY.md` rows updated (T46); no other rows changed.
- [ ] `npm run check` passes.
- [ ] No file outside `src/parser/`, `src/domain/types.ts` (per decision Q-08), `tests/`, `docs/FRD.md`, `docs/TRACEABILITY.md`, and this spec folder was changed.
- [ ] No file in `notes/` was changed.
