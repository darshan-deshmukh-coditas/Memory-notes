# Spec 06: `actiontrack ingest <folder>`

The command that wires specs 01 to 05 together: read notes, resolve owners and dates, merge duplicates, save, and report.

| Field | Value |
|---|---|
| Business reqs | BR-01, BR-02, BR-08 to BR-11 |
| FRD | FR-I1 to I15, FR-E1 to E4, D13, D20, D29, D30, D35.3, D52, D53, D54, D59 |
| NFRD | NFR-R1 to R3, D3, D4, P1, P3, P4, O1, O3, U6, NFR-A1 to A9 |
| Module | `cli/commands/ingest.ts` (uses `parser/*`, `owners/*`, `dates/*`, `dedupe/*`, `store/*`) |
| Tests | `tests/unit/commands.test.ts`, `tests/unit/edge-cases.test.ts`, `tests/acceptance/sample-notes.test.ts` |

## Usage
```
actiontrack ingest <folder> [--store <path>] [--today <YYYY-MM-DD>]
```

## Behaviour
1. **Order** (CLAUDE.md pipeline): list notes (spec 01) then, per note: emptiness and UTF-8, header, checkbox lines, owner (spec 03), due (spec 02), normalise and merge (spec 04). The store is saved once at the end (spec 05).
2. Roster and processing order are deterministic: notes by file name, lines in order. Ids follow spec 05 rule 9 (NFR-D3).
3. The roster for owner fallback is built from **all notes read in this run** before owners are resolved, plus names already in the store (D23.1, D61).
4. Skipped notes and skipped lines never stop the run (D5.3, NFR-R1). Every one is reported (NFR-R2).
5. Idempotent: running it again on the same folder adds nothing and changes no id or status (D13.1, D13.2). It never deletes items (D52).
6. `<folder>` missing or unreadable: error, exit 2. A folder with no `.md` files: print `No notes found`, exit 2 (D35.3).
7. The command changes nothing outside the store file. It only reads from the given folder (NFR-SEC3), and never edits notes (D32.1).

## Output (D30, NFR-O1, NFR-U6)
8. **stderr** (warnings, printed after processing):
   - `Skipped notes:` one per line, `<file>: <reason>` (reasons in spec 01)
   - `Skipped lines:` one per line, `<file>:<line>: <reason>`
   - warnings: weekday and explicit date disagree (D33.4), email conflicts (D56.2), `(unresolved)` owners
9. **stdout** (summary totals, always printed when the run completes):
   - notes read, notes skipped, items added, merged as duplicates
   - items with `(no owner)`, `(group)`, `(ambiguous)`, `(unresolved)` owners, listed by file and line (D16.4, D25.3)
   - items with no date or an unresolved date (flagged), listed by file and line
   - ignored lines (by kind), ignored files, and roster matches used (D41.1)
10. Exit code: `0` clean; `1` when anything was skipped or a warning was printed; `2` bad arguments, missing folder, or no notes; `3` is not used by ingest. The highest applicable code wins (D53.1).

## Sample folder expectations (NFR-A1 to A9)
| Check | Expected |
|---|---|
| A1 | completes, no crash |
| A2 | 4 skipped (`2026-09-09-notes-final-v2.md`, `scratch.md`, `untitled.md`, `2026-10-03-sales-pipeline.md`), 31 read, exit 1 |
| A3 | `2026-09-19-offsite-draft.txt` counted as an ignored file |
| A4 | trap lines (block quote, code fence, HTML comment, table row, `ACTION:`) not ingested |
| A5 | Priya Nair `send the revised quote to Acme` is one done item with 3 sources |
| A6 | bare `Priya` and bare `Rahul` where two match are `(ambiguous)`; `Priya N.` and `Priya S.` resolve |
| A7 | `Someone`, `TBD` are `(no owner)`; `Everyone`, `Team` are `(group)`; undated items are never overdue |
| A8 | `2026-09-23-standup.md` (no attendees): `Sam` is Sam Okafor, `Rahul` stays ambiguous |
| A9 | a second ingest gives the same items, ids and statuses |

## Acceptance tests
- `AC-I1` N valid and M malformed notes: finishes, M reported by name
- `AC-I2` every real checkbox item is stored with source and status
- `AC-I3` no stored due date is free text
- `D13.1`, `D13.2`, `NFR-A9` idempotent re-ingest
- `D52.1` re-ingest after deleting a line keeps the item
- `D30.1`, `D30.2`, `D30.3` report lists, totals, stderr, exit 1
- `D35.3` folder with no `.md`: `No notes found`, exit 2
- `D20.3` missing folder: exit 2
- `D53.1` highest exit code wins
- `NFR-P1` sample folder ingests in under 5 s; `NFR-P3`, `NFR-P4` 500 notes, 5,000 items, 1 MB notes

## Defaults to confirm
- P16. "Warnings" that make exit code 1: skipped notes, skipped lines, date/weekday disagreement, email conflict, `(unresolved)` owners. Flagged dates and `(ambiguous)`, `(no owner)`, `(group)` items are listed in the summary but do **not** by themselves change the exit code.
- P28. Summary count labels and layout are not fixed. Tests assert the numbers and the file names, not the exact wording.
