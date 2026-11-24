# Spec 07: `actiontrack list`

Shows stored items, narrowed by owner, status and due date.

| Field | Value |
|---|---|
| Business reqs | BR-03, BR-04, BR-09 |
| FRD | FR-L1 to L9, AC-L1 to L3, D1, D15, D16, D31, D38, D39.2, D42, D44, D54, D58.2, D65, D71, D72 |
| NFRD | NFR-P2, U2, U3, U5, NFR-A7 |
| Module | `cli/commands/list.ts` (uses `dates/resolve.ts`, `owners/resolve.ts`, `store/store.ts`) |
| Tests | `tests/unit/commands.test.ts` (list section) |

## Usage
```
actiontrack list [--owner <name>] [--status open|done|overdue] [--due-before <date>] [--json] [--store <path>] [--today <YYYY-MM-DD>]
```

## Behaviour
1. **Default**: open and overdue items, no done items (D15.1).
2. **Status is exclusive** and computed on today (spec 02 rule 12). `--status open` shows open items that are not overdue; `--status overdue` shows overdue items; `--status done` shows done items (D44.2, D15.4, AC-D1). Any other value is an error, exit 2, naming the valid values.
3. **`--owner <name>`** (D31.3): a full name (case-insensitive), or a first name that matches exactly one person. A first name that matches several people is an error, exit 2, that lists the choices (D4.4). The tokens `none`, `group`, `ambiguous`, `unresolved` select the owner labels (D42.1). A name that matches no known person prints `No items match.` and exits 0; it is not an error (D72.1).
4. **`--due-before <date>`** (D31, D38): strictly before the date. The date itself is excluded (D31.1). Undated items are excluded (D31.2). The date is ISO or a month-name form such as `Mar 4`; a missing year uses today's year with the 6-month rollover from today (D38.1). A bad date is an error, exit 2.
5. Filters combine with **AND** (D31.4).
6. **Order**: by due date ascending, items with no date last (D15.3). Rows with equal due dates are ordered by id (D71.2).
7. **No match**: print `No items match.` and exit 0 (D31.5). This includes an empty or missing store (D59.3).
8. **Exit codes**: `0` success, `2` bad arguments, `1` is not used.
9. `list` never changes the store.

## Table (D15.2, D16.1, D39.2)
Columns, in order: `id`, `owner`, `task`, `due`, `status`, `source(s)`.
- `owner` shows the full name, or `(no owner)`, `(group)`, `(ambiguous)` or `(unresolved)` (D16.1).
- `due` shows `YYYY-MM-DD`. An item with no date and no flag shows `-`. A flagged item shows `?` (D71.1).
- The table is plain aligned columns with a header row and no colour (D65.2).
- `status` shows `open`, `overdue` or `done`.
- `source(s)` shows **every** source file name (D39.2), separated by commas.

## `--json` (D15.5, D58.2)
An array of objects: `id`, `owner`, `task`, `due` (`YYYY-MM-DD` or `null`), `dueFlagged`, `status` (computed), `sources` (full `{file, meetingDate, line}` records). Output is only JSON on stdout, with no table. An empty result is `[]`, exit 0, with no text line (D71.3).

## Acceptance tests
- `D15.1`, `D15.3` default view and sort, undated last
- `D44.2`, `AC-L1` `--status overdue` only overdue; `--status open` excludes overdue; `--status done` shows done
- `AC-L2`, `D31.4` `--owner X --status open` is AND
- `AC-L3`, `D31.1`, `D31.2` `--due-before` strict, undated excluded
- `D31.3`, `D4.4` first name unique, ambiguous (error lists choices), full name case-insensitive
- `D42.1` `--owner none|group|ambiguous|unresolved`
- `D38.1` `--due-before "Mar 4"` year and rollover from `--today`
- `D31.5` `No items match.` and exit 0
- `D15.5`, `D58.2` JSON fields and full sources
- `NFR-U3` unknown `--status` or bad date gives exit 2 with valid options
- `NFR-A7` undated items are listed and never overdue
- `NFR-P2` responds in under 1 s at 5,000 items
- `D71.1` undated shows `-`, flagged shows `?`
- `D71.2` equal due dates are ordered by id
- `D71.3` `--json` with no match prints `[]`, exit 0
- `D72.1` `--owner` with an unknown name prints `No items match.` and exits 0
