# Plan: spec 07, `actiontrack list`

## Goal
Show stored action items, narrowed by owner, status and due date, as a plain table or as JSON. `list` is read-only: it never changes the store. Overdue is computed at read time from an injected "today" (ADR 0002, D1, D44).

## Scope
**In scope (this spec)**
- Default view (open + overdue, no done) (D15.1).
- `--status open|done|overdue`, exclusive (D44.2, D15.4).
- `--owner` with full names, unique first names, and the tokens `none|group|ambiguous|unresolved` (D31.3, D4.4, D42.1, D72.1).
- `--due-before` strict, undated excluded, ISO or month-name input (D31.1, D31.2, D31.6, D38.1, D34.1).
- AND combination of filters (D31.4).
- Sort by due ascending, undated last, equal dates by id (D15.3, D71.2).
- Table: columns id, owner, task, due, status, source(s); `-` and `?` in `due` (D15.2, D16.1, D39.2, D58.2, D71.1, D65.2).
- `--json` array of objects (D15.5, D58.2, D71.3).
- No match: `No items match.` on stdout, exit 0 (D31.5, D59.3, D72.1).
- Exit 0 on success, exit 2 on bad arguments. Exit 1 is not used by `list` (spec text, item 8).

**Out of scope (owned elsewhere)**
- Status rule (`statusOf`) and `--today`/ISO parsing (`parseCliDate`): spec 02, rules 11 and 12. `list` calls them; it does not re-implement them.
- Owner labels, roster and first-name matching rules: spec 03 (rules 8 to 11), roster in spec 05 (rule 4).
- Store file format, missing-store handling, corrupt-store and version errors: spec 05 (rules 10, 11). `list` only receives the loaded store.
- Global options (`--store`, `--today`), stdout/stderr split, exit-code mapping in `cli/index.ts`, unexpected-error exit 4: spec 11 and FRD D62.
- Writing the store (`done`): spec 08. Drafts and `followup`: spec 09 and 10.
- Ingest and how items get due dates or owners: specs 01, 02, 03, 04, 06.

## Requirement map

| ID | Rule (one line) | Module | Test ID(s) |
|---|---|---|---|
| BR-03, BR-04, BR-09 | Users can view and filter items; overdue is shown; unowned and undated items are visible | `cli/commands/list.ts` | TC-01, TC-11 |
| FR-L1 | `list` with no filters shows items | `list.ts` | TC-01 |
| FR-L2 | `--owner` shows only that owner's items | `list.ts` | TC-12, TC-25, TC-26 |
| FR-L3 | `--status` shows only items in that status | `list.ts` | TC-06, TC-09 |
| FR-L4 | `--due-before` shows items due before the date | `list.ts` | TC-14, TC-15 |
| FR-L5 | Overdue is computed, not stored | `dates/resolve.ts` (`statusOf`), `list.ts` | TC-08, TC-45, TC-46 |
| FR-L6 | Rows show id, owner, task, due, status, source | `list.ts` | TC-34 |
| FR-L7 | Filters combine with AND | `list.ts` | TC-13 |
| FR-L8 | No match output | `list.ts` | TC-41 |
| FR-L9 | Sort order | `list.ts` | TC-02, TC-03, TC-04 |
| AC-L1 | `--status overdue` returns only overdue | `list.ts` | TC-06 |
| AC-L2 | `--owner X --status open` returns only items matching both | `list.ts` | TC-12 |
| AC-L3 | `--due-before D` excludes items due on or after D | `list.ts` | TC-14 |
| D1.1, D1.2 | Overdue = open and due before today; undated never overdue | `dates/resolve.ts` | TC-08, TC-10 |
| D4.4, D31.3 | First name matching several people is an error listing choices; full name is case-insensitive | `list.ts` | TC-24, TC-26 |
| D14.1 | Ids shown are the stored ids, not renumbered | `list.ts` | TC-53 |
| D15.1 | Default is open + overdue | `list.ts` | TC-01 |
| D15.2 | Table columns in order | `list.ts` | TC-34 |
| D15.3 | Sort by due, undated last | `list.ts` | TC-02, TC-03 |
| D15.4 | `--status done` shows done | `list.ts` | TC-09 |
| D15.5 | `--json` machine-readable | `list.ts` | TC-38, TC-39 |
| D16.1 | `(no owner)`, `(ambiguous)` shown as owner | `list.ts` | TC-32 |
| D31.1 | `--due-before` strict | `list.ts` | TC-14 |
| D31.2 | Undated excluded from `--due-before` | `list.ts` | TC-15 |
| D31.4 | AND | `list.ts` | TC-13 |
| D31.5 | No match: text, exit 0 | `list.ts` | TC-41 |
| D31.6 | `--due-before` ISO and `Mar 4` forms | `dates/resolve.ts` (`parseCliDate`), `list.ts` | TC-21, TC-22 |
| D34.1, D38.1 | Year-less date uses today's year; rolls forward if more than 6 months before today | `dates/resolve.ts` | TC-17, TC-18, TC-19, TC-20 |
| D39.2 | Table shows every source file | `list.ts` | TC-36 |
| D42.1 | `--owner none|group|ambiguous|unresolved` select labels | `list.ts`, `domain/types.ts` | TC-29, TC-30 |
| D42.2 | A person named like a token is not supported (limitation) | `list.ts` | TC-31 |
| D44.1 | Exactly one status at read time | `dates/resolve.ts` | TC-07, TC-45 |
| D44.2 | `open` excludes overdue; `overdue` shows overdue | `list.ts` | TC-06, TC-07 |
| D54.1 | Invalid `--today` exits 2 | `cli/index.ts` (spec 11) | TC-44 |
| D58.2 | Table shows file names; JSON shows full records | `list.ts` | TC-35, TC-39 |
| D59.3 | Missing store is empty | `list.ts` via `store/store.ts` | TC-42, TC-43 |
| D62.1 | Unexpected error: exit 4, store untouched (cross-cutting) | `cli/index.ts` | TC-63 |
| D65.2 | Plain aligned table, no colour | `list.ts` | TC-37 |
| D71.1 | `-` for undated unflagged, `?` for flagged | `list.ts` | TC-33 |
| D71.2 | Equal due dates ordered by id | `list.ts` | TC-04 |
| D71.3 | `--json` no match prints `[]`, exit 0 | `list.ts` | TC-40 |
| D72.1 | Unknown `--owner` name: `No items match.`, exit 0 | `list.ts` | TC-28 |
| NFR-A7 | Undated items listed, never overdue | `list.ts` (sample folder) | TC-11 |
| NFR-M2 | "Today" injected | `clock.ts`, `list.ts` | TC-45, TC-62 |
| NFR-P2, NFR-P3 | Under 1 s at 5,000 items | `list.ts` | TC-47 |
| NFR-U2 | Flags `--owner`, `--status`, `--due-before` exist | `cli/index.ts` | TC-48 |
| NFR-U3 | Bad status or date: exit 2 with valid options | `list.ts` | TC-22, TC-23 |
| NFR-U5 | Output readable in a terminal | `list.ts` | TC-34, TC-37 |

## Design approach
- **Pure core.** Put the logic in pure functions in `cli/commands/list.ts` (or a sibling module under `cli/commands/` if the file grows): `matchOwner(store, input)`, `filterItems(items, filters, today)`, `sortItems(items)`, `renderTable(rows)`, `renderJson(rows)`. No I/O inside them.
- **Shell.** `list(opts, deps)` loads the store, builds the filters, calls the pure functions, and writes to `deps.out` (results) or `deps.err` (errors). It returns an `ExitCode`. Bad input throws an `ActiontrackError` subclass that `cli/index.ts` maps to exit 2.
- **Overdue at read time.** Every row's status comes from `statusOf(item, today)` (spec 02 rule 12). `today` comes from `deps.clock` unless `--today` is given. The store is never written. Same store plus two different dates gives different statuses (ADR 0002).
- **Status filter.** Compute the status for each item, then keep the rows whose computed status equals the requested value. The default keeps `open` and `overdue`.
- **Owner filter.** Resolve the input in this order: (1) a `--owner` token in `OWNER_TOKENS` maps to its label; (2) a full name matched case-insensitively against the roster and item owners; (3) a first name matched exactly, case-insensitively, against the roster. Several matches in (3) is an error (exit 2) that lists the choices. No match is an empty result, not an error (D72.1).
- **Due filter.** Parse the value with `parseCliDate` (spec 02 rule 11). Keep items with a non-null `due` that is strictly less than the parsed date.
- **Sort.** Compare `due` as ISO strings (valid because all stored dates are validated `YYYY-MM-DD`). Null dates go last. Ties and all-undated groups are ordered by numeric id.
- **Table.** Header row, then one row per item. Columns padded to the widest cell. `due` is `YYYY-MM-DD`, `-` or `?`. `source(s)` is the file names joined with `, `. No colour codes.
- **JSON.** A single array of objects with the fields listed in the spec. `status` is computed. `sources` carries the full `{file, meetingDate, line}` records. Empty result: `[]`.
- **No match.** Empty result in table mode prints `No items match.` to stdout. Empty result in JSON mode prints `[]` and nothing else.

## Dependencies
- **Spec 02 (dates):** `statusOf`, `parseCliDate`, and the validated ISO date type. Must be implemented before the overdue and `--due-before` tests can go green.
- **Spec 03 (owners):** the special labels and the rule that `(ambiguous)` and `(unresolved)` are labels, not people. Owner matching depends on spec 05's roster.
- **Spec 05 (store):** `loadStore` (missing file = empty store, corrupt or wrong version = exit 2), the `items` and `roster` shape, and `sources` records.
- **Spec 06 (ingest):** needed only for the sample-folder acceptance test (TC-11). Unit tests use a fixture store file.
- **Spec 11 (CLI conventions):** `--today` parsing, stdout/stderr split, exit-code mapping.
- **Spec 08 (done):** only to confirm that `done` items are excluded by default in the end-to-end flow.

## Risks
- **Midnight and time zones.** "Today" is the system's local date (D1.3). An item due on the day before a local midnight may change status between two runs. Stored dates are plain dates with no time zone, so the comparison itself is safe. The risk is in how the clock is read. Mitigation: read the clock once per command and pass `today` down; test the boundary with a fixed clock (TC-62).
- **Table alignment with wide Unicode.** Names such as `Zoe Angstrom` (accents), CJK or emoji can have a different display width from their string length, so columns misalign. Mitigation: pad by a display-width helper; no new dependency without asking (CLAUDE.md). See decision Q9.
- **Performance.** The filters and sort are O(n log n) and cannot be the slow part. The real cost is loading a 5,000-item JSON store. Measure the whole command, not just the pure functions (TC-47). The 1 s limit is on a developer machine; a CI timing test can flake, so use a generous bound and report the measured time.
- **Commander choice errors.** `--status` uses commander's `.choices()`. Commander's own error message and exit code must be mapped to exit 2 with the valid values listed (NFR-U3). Verify this in TC-23.
- **Stored ids.** Filtering must never renumber. Ids come from the store (D14.1), so a filtered view can have gaps (TC-53).

## Decisions
Every item below is settled. Each line is binding. Record each as a new decision (D77 and up) in `docs/FRD.md`.

- **Q1** Undated items are listed after all dated items, ordered by id.
- **Q2** No special case: undated items are never overdue, so they never appear under `--status overdue` (D1.2).
- **Q3** `--json` output is a bare array of item objects, with no envelope and keys in the order the spec lists.
- **Q4** `dueFlagged` in JSON reports the stored flag as it is.
- **Q5** An empty result exits 0.
- **Q6** A table with zero rows prints only `No items match.`, with no header row.
- **Q7** First-name matching counts the stored roster and item owners; a first name counts as a person only when a full name exists.
- **Q8** First-name matching is a case-insensitive exact match on the first word of a full name.
- **Q9** Column widths use display width: wide characters count as 2; task text and sources are not truncated; no new dependency.
- **Q10** `--due-before` accepts whatever `parseCliDate` accepts (spec 02 rule 11), including the D10.1 forms.
- **Q11** Rollover follows D34.1; a date exactly 6 months before today is not rolled forward (TC-19 tests this).
- **Q12** An impossible calendar date, an empty `--due-before ""`, or `Feb 29` without a year in a non-leap year exits 2, with the valid forms listed.
- **Q13** `--status` values are case-insensitive: `open`, `done` and `overdue` are accepted in any case.
- **Q14** A repeated flag takes its last value.
- **Q15** A literal owner label is not accepted as `--owner`; only the tokens `none|group|ambiguous|unresolved` are.
- **Q16** `--json` with a missing store prints `[]`, exits 0, and prints no text line.
- **Q17** `list` prints no warnings to stderr on a valid run.
- **Q18** Exit 4 (unexpected internal error, D62.1) applies to `list`, as spec 11 states.

**Spec inconsistencies noted (no code change needed):**
- CLAUDE.md lists exit codes 0 to 3. FRD D62.1 adds exit 4. Update CLAUDE.md when the requester confirms.
- Spec 07 item 8 says exit 1 "is not used". That is correct for `list` (D70 applies to `ingest`). Keep as is.
