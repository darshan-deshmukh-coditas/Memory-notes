# Test cases: spec 07, `actiontrack list`

Test names start with the cited spec or FRD ID in brackets, as CLAUDE.md requires. Each name replaces one `it.todo` in `tests/unit/commands.test.ts` (list section), or is added to `tests/acceptance/sample-notes.test.ts` where marked.

Conventions:
- "today" is injected with `fixedClock("2026-11-24")` unless a row says otherwise.
- "Expected ids" are the stored ids in output order. The fixture is defined under "Fixtures needed".
- Type `neg` marks a negative case (error path, empty result, or a must-not-happen check).
- Rows marked **(Dn)** test the decision Dn in `plan.md` ("Decisions").
- Exit codes: 0 success, 2 bad arguments, 4 unexpected internal error (D62.1). `list` never uses exit 1 or 3.

## Default view, sort and status

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-01 | FR-L1, D15.1 | tests/unit/commands.test.ts | [D15.1] default shows open and overdue, no done items | unit | `list` on fixture | Expected ids `[11,1,10,6,2,8,4,12,3,7,9]`; id 5 (done) absent | 0 |
| TC-02 | D15.3, FR-L9 | tests/unit/commands.test.ts | [D15.3] rows with a date are sorted by due ascending | unit | `list` on fixture | Dated rows in order `11,1,10,6,2,8,4,12` | 0 |
| TC-03 | D15.3 | tests/unit/commands.test.ts | [D15.3] undated items are listed last | unit | `list` on fixture | Last three rows are ids `3,7,9`, all with due `-` or `?` | 0 |
| TC-04 | D71.2 | tests/unit/commands.test.ts | [D71.2] rows with equal due dates are ordered by id | unit | Store order `10,1`, both due 2026-11-10 | Output order `1,10` | 0 |
| TC-05 | D71.2, D193 | tests/unit/commands.test.ts | [D71.2] undated items are ordered by id among themselves | unit | Undated items stored in order `9,3,7` | Output order `3,7,9` | 0 |
| TC-06 | AC-L1, D44.2 | tests/unit/commands.test.ts | [AC-L1] --status overdue returns only overdue items | unit | `--status overdue` | Ids `11,1,10,6`; no open item | 0 |
| TC-07 | D44.2, D1.1 | tests/unit/commands.test.ts | [D44.2] --status open excludes overdue and keeps items due today | unit | `--status open` | Ids `2,8,4,12,3,7,9`; id 2 (due today) present; ids 11, 1, 10, 6 absent | 0 |
| TC-08 | D1.1 | tests/unit/commands.test.ts | [D1.1] item is overdue only when its due date is before today | unit | Store with one open item due 2026-11-23; run with `--today 2026-11-23`, then `--today 2026-11-24` | First run: status `open`. Second run: status `overdue` | 0 |
| TC-09 | FR-L3, D15.4, D44.1 | tests/unit/commands.test.ts | [D15.4] --status done shows done items only, even when past due | unit | `--status done` | Ids `5` only | 0 |
| TC-10 | D1.2 | tests/unit/commands.test.ts | [D1.2] undated item is never overdue | unit, neg | Store with only undated open items; `--status overdue` | `No items match.` | 0 |
| TC-11 | NFR-A7, FR-L6 | tests/acceptance/sample-notes.test.ts | [NFR-A7] undated sample items are listed as open and never overdue | acceptance | `ingest notes` then default `list` on the sample folder | Row "Sam to share the VPN guide" has due `-` and status `open`. Row "Someone" items show `(no owner)`. "Everyone" or "Team" items show `(group)` | 0 |
| TC-16 | D15.1, D31.4 | tests/unit/commands.test.ts | [D15.1] --due-before keeps the default exclusion of done items | unit | `--due-before 2027-01-01` | Ids `11,1,10,6,2,8,4`; id 5 absent | 0 |
| TC-58 | D44.1 | tests/unit/commands.test.ts | [D44.1] done past-due item is done, never overdue | unit | `--status overdue` and `--status open` | Id 5 appears in neither | 0 |

## Filters and AND

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-12 | AC-L2, D31.4 | tests/unit/commands.test.ts | [AC-L2] --owner and --status combine with AND | unit | `--owner "Priya Nair" --status open` | Ids `2` only (ids 1 and 10 are overdue) | 0 |
| TC-13 | D31.4, FR-L7 | tests/unit/commands.test.ts | [D31.4] --owner, --due-before and the default status combine with AND | unit | `--owner Priya --due-before 2026-11-24` | Ids `1,10` | 0 |
| TC-61 | D31.4, D31.5 | tests/unit/commands.test.ts | [D31.4] filters that match nothing together print the no-match line | unit, neg | `--owner group --due-before 2026-11-24` (group item is undated) | `No items match.` | 0 |
| TC-14 | AC-L3, D31.1 | tests/unit/commands.test.ts | [AC-L3] --due-before is strict: the date itself is excluded | unit | `--due-before 2026-11-24` | Ids `11,1,10,6`; id 2 (due 2026-11-24) absent | 0 |
| TC-15 | AC-L3, D31.2 | tests/unit/commands.test.ts | [D31.2] undated items are excluded from --due-before | unit, neg | `--due-before 2026-12-31` | Ids `11,1,10,6,2,8,4`; ids 3, 7, 9 absent | 0 |
| TC-17 | D38.1, D34.1 | tests/unit/commands.test.ts | [D38.1] "Mar 4" with --today 2026-11-24 uses 2027-03-04 | unit | `--due-before "Mar 4"` | Ids `11,1,10,6,2,8,4`. Without the rollover the result would be empty | 0 |
| TC-18 | D38.1 | tests/unit/commands.test.ts | [D38.1] "Mar 4" with --today 2026-02-01 stays in 2026 | unit | `--due-before "Mar 4" --today 2026-02-01` | `No items match.` (cutoff 2026-03-04, no item due before it) | 0 |
| TC-19 | D34.1, D38.1 | tests/unit/commands.test.ts | [D34.1] year-less date exactly 6 months before today is not rolled; one day more is rolled | unit | `--due-before "May 24"`, then `--due-before "May 23"`, both with today 2026-11-24 | "May 24": `No items match.`. "May 23": ids `11,1,10,6,2,8,4,12` | 0 |
| TC-20 | D38.1 | tests/unit/commands.test.ts | [D38.1] ISO date is exact and never rolled | unit | `--due-before 2026-03-04` | `No items match.` | 0 |
| TC-21 | D31.6, D10.1, D202 | tests/unit/commands.test.ts | [D31.6] ISO and month-name forms give the same result | unit | `2027-03-04`, `Mar 4`, `4 Mar` | All three: ids `11,1,10,6,2,8,4` | 0 |
| TC-22 | NFR-U3, D31.6, D204 | tests/unit/commands.test.ts | [NFR-U3] bad --due-before value gives exit 2 and lists valid forms | unit, neg | `2026-02-30`, `soon`, `""` | Each: exit 2; stderr names the valid forms; stdout empty | 2 |
| TC-23 | NFR-U3, D15 | tests/unit/commands.test.ts | [NFR-U3] unknown --status gives exit 2 and names open, done, overdue | unit, neg | `--status closed` | exit 2; stderr lists `open`, `done`, `overdue`; stdout empty. Commander's choice error is mapped to exit 2 | 2 |
| TC-49 | D205 | tests/unit/commands.test.ts | [NFR-U3] --status is case-insensitive | unit | `--status Open`, then `--status OVERDUE` | `Open`: ids `2,8,4,12,3,7,9`. `OVERDUE`: ids `11,1,10,6` | 0 |
| TC-50 | D206 | tests/unit/commands.test.ts | [D31.3] a repeated --owner flag uses the last value | unit | `--owner Priya --owner "Anita Rao"` | Ids `4,3` | 0 |

## Owner matching

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-24 | D4.4, D31.3 | tests/unit/commands.test.ts | [D4.4] an ambiguous first name is an error that lists the choices | unit, neg | `--owner Anita` (roster has Anita Rao and Anita Shah) | exit 2; stderr lists "Anita Rao" and "Anita Shah"; no table on stdout | 2 |
| TC-25 | D31.3 | tests/unit/commands.test.ts | [D31.3] a first name matching exactly one person selects that person | unit | `--owner Priya` | Ids `1,10,2` | 0 |
| TC-26 | D31.3 | tests/unit/commands.test.ts | [D31.3] a full name matches case-insensitively | unit | `--owner "anita rao"` | Ids `4,3` | 0 |
| TC-27 | D31.3, D200 | tests/unit/commands.test.ts | [D31.3] a first name matches case-insensitively | unit | `--owner PRIYA` | Ids `1,10,2` | 0 |
| TC-28 | D72.1 | tests/unit/commands.test.ts | [D72.1] unknown --owner name prints the no-match line and is not an error | unit, neg | `--owner Zara` | stdout `No items match.`; stderr empty | 0 |
| TC-56 | D72.1, D199 | tests/unit/commands.test.ts | [D72.1] a roster person with no items is a valid match with no rows | unit, neg | `--owner Sam` (Sam Lee is roster-only) | stdout `No items match.`; exit 0 | 0 |
| TC-51 | D42.1, D207 | tests/unit/commands.test.ts | [D42.1] a literal owner label is not accepted as a token | unit, neg | `--owner "(no owner)"` | Treated as a name with no match: `No items match.` | 0 |
| TC-29 | D42.1, D16.2 | tests/unit/commands.test.ts | [D42.1] --owner none selects the (no owner) label | unit | `--owner none` | Id `6` | 0 |
| TC-30 | D42.1, D25 | tests/unit/commands.test.ts | [D42.1] --owner group, ambiguous and unresolved select their labels | unit | `--owner group`, `--owner ambiguous`, `--owner unresolved` (three cases) | `7`, `8` and `9` respectively | 0 |
| TC-31 | D42.2 | tests/unit/commands.test.ts | [D42.2] a person named "None" is not reachable by --owner none (known limitation) | unit | Store with roster person "None" and one item; `--owner none` | Returns label rows only, not the person's item. Documented limitation | 0 |

## Table output

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-32 | D16.1 | tests/unit/commands.test.ts | [D16.1] (no owner) and (ambiguous) show as the owner | unit | `list` on fixture | Row 6 owner `(no owner)`; row 8 owner `(ambiguous)` | 0 |
| TC-33 | D71.1 | tests/unit/commands.test.ts | [D71.1] undated unflagged due shows `-`; flagged shows `?` | unit | `list` on fixture | Row 3 due `-`; row 7 due `?` | 0 |
| TC-34 | D15.2, FR-L6, NFR-U5 | tests/unit/commands.test.ts | [D15.2] table has a header row and columns id, owner, task, due, status, source(s) in order | unit | `list` on fixture | Header line lists the six columns in order; one row per item | 0 |
| TC-35 | D58.2 | tests/unit/commands.test.ts | [D58.2] table shows source file names only | unit | `list` on fixture | Row 1 sources cell shows the two file names; no line numbers or meeting dates | 0 |
| TC-36 | D39.2 | tests/unit/commands.test.ts | [D39.2] every source file is shown, joined by ", " | unit | `list` on fixture | Row 1 sources cell: `2026-11-03 wireframes.md, 2026-11-10 design review.md` | 0 |
| TC-37 | D65.2, NFR-U5 | tests/unit/commands.test.ts | [D65.2] table has no colour codes even when FORCE_COLOR is set | unit, neg | `list` with `env.FORCE_COLOR=1` | Output contains no ESC (`\u001b`) character | 0 |
| TC-52 | D198 | tests/unit/commands.test.ts | [D31.5] an empty table result prints only the no-match line, with no header | unit, neg | `--owner none --status done` | stdout is exactly one line: `No items match.` | 0 |
| TC-54 | NFR-U5, D201 | tests/unit/commands.test.ts | [NFR-U5] columns align for accented and CJK names | unit | Store with owners "Zoë Ångström", "李 伟", "Ana"; default `list` | The task column starts at the same display column in every row | 0 |
| TC-55 | D201 | tests/unit/commands.test.ts | [D15.2] long task and source text is not truncated | unit | Task of 300 characters and a source list of 5 files | Full text appears in the output | 0 |
| TC-57 | D209 | tests/unit/commands.test.ts | [NFR-O3] a valid list run writes nothing to stderr | unit | `list` on fixture | stderr empty | 0 |

## JSON output

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-38 | D15.5 | tests/unit/commands.test.ts | [D15.5] --json prints a parseable array of item objects | unit | `--json` on fixture | Parses as an array; first element id 11; status `overdue`; no table text | 0 |
| TC-39 | D58.2 | tests/unit/commands.test.ts | [D58.2] --json sources are full {file, meetingDate, line} records | unit | `--json --owner Priya` | Item 1 `sources` has two objects with `file`, `meetingDate` and numeric `line` | 0 |
| TC-59 | D196 | tests/unit/commands.test.ts | [D8.4] --json due is null and dueFlagged true for a flagged item | unit | `--json --owner group` | Item 7: `due` null, `dueFlagged` true. Item 3 has `dueFlagged` false | 0 |
| TC-60 | D15.5, D195 | tests/unit/commands.test.ts | [D15.5] --json object keys are exactly the listed fields, with no envelope | unit | `--json` on fixture | Keys are exactly `id, owner, task, due, dueFlagged, status, sources` per object; top level is an array; no `taskKey`, `nextId` or stored `overdue` | 0 |
| TC-40 | D71.3 | tests/unit/commands.test.ts | [D71.3] --json with no match prints [] and nothing else | unit, neg | `--json --owner none --status done` | stdout exactly `[]` | 0 |

## No match, missing store and options

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-41 | D31.5, FR-L8 | tests/unit/commands.test.ts | [D31.5] no match prints `No items match.` on stdout and exits 0 | unit, neg | `--owner none --status done` | stdout `No items match.` | 0 |
| TC-42 | D59.3 | tests/unit/commands.test.ts | [D59.3] a missing store is empty; list does not create the file | unit, neg | `--store <missing path>` | stdout `No items match.`; file not created | 0 |
| TC-43 | D59.3, D71.3, D208 | tests/unit/commands.test.ts | [D59.3] a missing store with --json prints [] | unit, neg | `--json --store <missing path>` | stdout `[]`; no file created | 0 |
| TC-44 | D54.1 | tests/unit/commands.test.ts | [D54.1] an invalid --today exits 2 and shows the ISO format | unit, neg | `--today 2026/11/24`, `--today tomorrow` | exit 2; stderr names `YYYY-MM-DD` | 2 |
| TC-48 | NFR-U2 | tests/unit/commands.test.ts | [NFR-U2] --owner, --status and --due-before reach list() with their values | integration | Run the CLI parser with the three flags and a spy `list` | Spy receives `owner`, `status` and `dueBefore` values unchanged | 0 |
| TC-53 | D14.1 | tests/unit/commands.test.ts | [D14.1] filtered output shows stored ids, not row numbers | unit | `--status overdue` | Ids `11,1,10,6` (not `1,2,3,4`) | 0 |

## Overdue at read time and the store

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-45 | D1.3, NFR-M2, ADR 0002 | tests/unit/commands.test.ts | [D1.3] same store gives different status for two injected dates | unit | Same store bytes. Item 1 due 2026-11-10. Run `--status open --today 2026-11-09`, then `--status overdue --today 2026-11-11` | First run includes id 1 with status `open`. Second run includes id 1 with status `overdue`. Store file bytes unchanged | 0 |
| TC-46 | D44.1, ADR 0002, FR-L5 | tests/unit/commands.test.ts | [D44.1] list never writes overdue to the store | unit | Run default `list --today 2026-11-11`, then read the store file | File bytes are identical before and after. The text `overdue` does not appear in the file | 0 |
| TC-62 | NFR-M2, plan Risks (midnight) | tests/unit/commands.test.ts | [NFR-M2] the clock is read once per command, not once per row | unit | Spy clock counting `today()` calls on fixture | Call count is 1 | 0 |
| TC-63 | D62.1 | tests/unit/commands.test.ts | [D62.1] an unexpected internal error exits 4 and leaves the store as it was | integration, neg | Store reader throws a plain `Error` | exit 4; stderr shows a clear message; store bytes unchanged | 4 |
| TC-64 | D59.4, D69.2 | tests/unit/commands.test.ts | [D59.4] a corrupt store exits 2 and is never overwritten | unit, neg | Store file contains invalid JSON | exit 2; stderr names the store path; file bytes unchanged | 2 |

## Performance

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-47 | NFR-P2, NFR-P3, N2 | tests/unit/commands.test.ts | [NFR-P2] default list on 5,000 items finishes in under 1 second | unit (timed) | Generated store of 5,000 items (5 owners, mixed statuses, 10% undated), `list` timed end to end | Wall time under 1000 ms; exit 0. Report the measured time. Use a generous bound in CI to avoid flakiness | 0 |

## Coverage check

- Every acceptance bullet in `spec.md` has at least one row: D15.1 (TC-01), D15.3 (TC-02, TC-03), D44.2 and AC-L1 (TC-06, TC-07), AC-L2 (TC-12), AC-L3 and D31.1 (TC-14), D31.2 (TC-15), D31.3 and D4.4 (TC-24, TC-25, TC-26), D42.1 (TC-29, TC-30), D38.1 (TC-17, TC-18, TC-20), D31.5 (TC-41), D15.5 and D58.2 (TC-38, TC-39), NFR-U3 (TC-22, TC-23), NFR-A7 (TC-11), NFR-P2 (TC-47), D71.1 (TC-33), D71.2 (TC-04), D71.3 (TC-40), D72.1 (TC-28).
- Every example in `spec.md` has a row: `--due-before "Mar 4"` (TC-17), overdue with two dates (TC-45), `--owner X --status open` (TC-12).
- Every decision in `plan.md`'s Decisions section has a row: D193 (TC-05), D195 (TC-60), D196 (TC-59), D198 (TC-52), D199 (TC-56), D200 (TC-27), D201 (TC-54, TC-55), D202 (TC-21), D203 (TC-19), D204 (TC-22), D205 (TC-49), D206 (TC-50), D207 (TC-51), D208 (TC-43), D209 (TC-57), D210 (TC-63).
- Negative rows: TC-10, TC-15, TC-22, TC-23, TC-24, TC-28, TC-31, TC-37, TC-40, TC-41, TC-42, TC-43, TC-44, TC-51, TC-52, TC-56, TC-61, TC-63, TC-64.

## Fixtures needed

**F-LIST: `tests/fixtures/store/list-basic.json`** (store version 1, `nextId` 13). Roster: Priya Nair, Anita Rao, Anita Shah, Rahul Mehta, Sam Lee. Every row below is an item with the given fields. Statuses are stored values, so `open` or `done`. `overdue` is never stored.

| id | owner | task | due | dueFlagged | status | sources |
|---|---|---|---|---|---|---|
| 1 | Priya Nair | Send the wireframes | 2026-11-10 | false | open | `2026-11-03 wireframes.md` line 12; `2026-11-10 design review.md` line 7 |
| 2 | Priya Nair | Book the workshop room | 2026-11-24 | false | open | `2026-11-24 planning.md` line 3 |
| 3 | Anita Rao | Share the VPN guide | null | false | open | `2026-11-05 it sync.md` line 4 |
| 4 | Anita Rao | Update the roadmap | 2026-12-01 | false | open | `2026-11-12 roadmap.md` line 9 |
| 5 | Rahul Mehta | Close the ticket | 2026-10-01 | false | done | `2026-09-28 triage.md` line 2 |
| 6 | (no owner) | Check the budget | 2026-11-20 | false | open | `2026-11-18 finance.md` line 6 |
| 7 | (group) | Post the release notes | null | true | open | `2026-11-19 release.md` line 5 |
| 8 | (ambiguous) | Review the contract | 2026-11-30 | false | open | `2026-11-20 legal.md` line 8 |
| 9 | (unresolved) | Chase the vendor | null | false | open | `2026-11-21 vendor.md` line 3 |
| 10 | Priya Nair | Draft the agenda | 2026-11-10 | false | open | `2026-11-10 design review.md` line 11 |
| 11 | Anita Shah | Sign the NDA | 2026-09-01 | false | open | `2026-08-30 legal.md` line 4 |
| 12 | Rahul Mehta | Renew the licence | 2027-03-10 | false | open | `2026-11-22 ops.md` line 7 |

**Other fixtures:**
- **F-MISSING**: a path that does not exist, under a temp directory created in the test.
- **F-CORRUPT**: a store file containing `{ not json`. Create it in a temp directory (editors can rewrite fixture files).
- **F-BIG**: 5,000 items generated in the test from a seeded pattern. Do not commit a large file.
- **F-WIDE**: a small store with owners "Zoë Ångström", "李 伟", "Ana" and a 300-character task (TC-54, TC-55).
- **F-NONE-ROSTER**: a roster person named "None" with one item (TC-31).
- **F-UNDATED**: undated items stored in the order 9, 3, 7 (TC-05).
- **F-SAMPLE**: the sample folder `notes/` (read only). Used with `ingest` in `tests/acceptance/sample-notes.test.ts` (TC-11). It depends on spec 06.
- **Clock**: `fixedClock` from `src/clock.ts`. A spy clock for TC-62.
- **Fake output**: `deps.out` and `deps.err` captured in arrays, as in other command tests.

Note: the fixtures are a plan only. Create them in the task that first needs them (see `task.md`). Do not add them to `tests/fixtures/notes/`, which holds note files.
