# Plan: spec 06 `actiontrack ingest <folder>`

Source of truth: `spec.md` in this folder. Requirements in `docs/FRD.md` section 11 (D1 to D76), `docs/NFRD.md`. Test cases in `testcases.md` (TC-01 to TC-72). Steps in `task.md`.

## Goal

Read every top-level `.md` note in a folder, turn its checkbox lines into stored action items with resolved owner and due date, merge duplicates, save the store once, and report what happened. Idempotent. Never stops on malformed input. Never sends mail and never edits a note.

## Scope

In scope (this spec):
- Command wiring and the run order: list notes, read each note, extract, resolve owner, resolve due, normalise, merge, save once.
- Ingest summary: skip report, skipped lines, warnings, totals, ignored lines by kind, ignored files, roster matches.
- Exit code selection for ingest: 0, 1, 2, 4 (3 is not used).
- Idempotent re-run and roster construction for the run.

Out of scope, with owning spec:
- Header, note reading, checkbox recognition, skip reasons, `listNoteFiles`: spec 01 (note-parsing).
- Due-date wording and weekday rules: spec 02 (date-resolution).
- Owner phrases, labels, roster matching, same first name: spec 03 (owner-resolution).
- Duplicate key, normalisation, `mergeItem`: spec 04 (dedupe).
- Store file, ids, atomic write, corrupt-store check, `owners.json`: spec 05 (store).
- Option parsing (`--today`, `--store`), stream helpers, `EXIT.INTERNAL`: spec 11 (cli-conventions).
- `list`, `done`, `followup`: specs 07 to 09. The Gmail connector: spec 10.

## Requirement map

| ID | Rule (one line) | Module | Tests |
|---|---|---|---|
| FR-I1, D20.3 | Folder argument; missing folder exits 2 | `cli/commands/ingest.ts` | TC-01 |
| FR-I2, D29.1, D29.2 | Only top-level `.md` read; others counted as ignored | `cli/commands/ingest.ts` | TC-53, TC-58 |
| FR-I8, NFR-R1, D5.3 | Malformed note skipped; run continues; no crash | `cli/commands/ingest.ts`, `parser/note.ts` | TC-05, TC-56 |
| FR-I9, NFR-R2, D30.1, D65.1 | Every skipped note and line reported with fixed reason | `cli/commands/ingest.ts` | TC-06, TC-07, TC-68 |
| FR-I13, D30.2 | Summary totals on completion | `cli/commands/ingest.ts` | TC-08 |
| D30.3, NFR-O3 | Warnings to stderr; totals to stdout; no log file | `cli/commands/ingest.ts` | TC-09 |
| FR-I14, D35.3 | Empty folder: `No notes found`, exit 2 | `cli/commands/ingest.ts` | TC-02, TC-03 |
| FR-I15, D13.1, D13.2, NFR-A9 | Re-run adds nothing; ids and done status kept | `cli/commands/ingest.ts`, `dedupe/merge.ts` | TC-43, TC-44, TC-64 |
| D52.1, D52.2 | Stored items never removed; reworded line is new item | `dedupe/merge.ts` | TC-41, TC-42 |
| D14.1, D14.2, D69.1 | Sequential ids, never reused; order by file, then line, then name order | `cli/commands/ingest.ts`, `store/store.ts` | TC-45, TC-46, TC-47 |
| D20.1 to D20.5, D53.1, D62.1, D62.2 | Exit codes; highest wins; internal error 4; store untouched | `cli/commands/ingest.ts`, `cli/index.ts` | TC-10, TC-11 |
| D59.3, D59.4, D69.2 | Missing store created; corrupt or version != 1 exits 2, not overwritten | `store/store.ts` | TC-12, TC-50 |
| D70.1 | Exit 1 for skipped notes, skipped lines, weekday/date mismatch, email conflict, unresolved owner | `cli/commands/ingest.ts` | TC-05, TC-13, TC-14, TC-15 |
| D70.2, D16.4, D25.3 | Flagged dates and no-owner/group/ambiguous do not change exit | `cli/commands/ingest.ts` | TC-16, TC-37 |
| FR-I3 (answered by D29) | Non-`.md` files not parsed | `cli/commands/ingest.ts` | TC-53 |
| FR-I4, D26.1, D12, D37.1 | Checkbox lines only; nested OK; numbered ignored | `parser/items.ts` | TC-17, TC-20, TC-21 |
| FR-I5, FR-I11, AC-I2 | Every real item stored with owner, task, due, source, status | `cli/commands/ingest.ts` | TC-17 |
| AC-I3, D8.4 | Due stored as ISO or null; unresolvable is flagged | `dates/resolve.ts` | TC-18, TC-36 |
| D26.2, D27.1, D27.2, D64.2 | Trap lines not items; counted by kind | `parser/items.ts` | TC-19, TC-22, TC-59 |
| D5.1, D22.1, D22.2, D57.1 | Whole-note skip reasons and filename fallback rules | `parser/note.ts`, `parser/header.ts` | TC-27, TC-28, TC-29 |
| D55.1 to D55.3, D64.1 | BOM stripped; CRLF = LF; non-UTF-8 and empty skipped | `parser/note.ts` | TC-23, TC-24, TC-25, TC-26 |
| D50.1 | Checkbox with no text: skipped line, `empty action item` | `parser/items.ts` | TC-07 |
| FR-E1, D3.1, D3.5, D28.1, D28.3 | Duplicates merged; stays done; different wording separate | `dedupe/*` | TC-38, TC-39, TC-41 |
| D39.1, D58.1 | Merged item shows latest wording and date; source record | `dedupe/merge.ts` | TC-40, TC-55 |
| D23.1, D23.2, D4, D61.1, D61.2 | Roster from all notes read this run plus store names; skipped notes excluded | `owners/resolve.ts`, `cli/commands/ingest.ts` | TC-30, TC-33, TC-34 |
| D41.1 to D41.3 | Roster match noted; several matches ambiguous; none unresolved | `owners/resolve.ts` | TC-15, TC-31, TC-32 |
| D33.4, D56.2 | Warnings: weekday/date disagreement, email conflict | `dates/resolve.ts`, `cli/commands/ingest.ts` | TC-13, TC-14 |
| D8, D33.1 | Due resolved against meeting date, not run date | `dates/resolve.ts` | TC-35 |
| D17.2, D59.1 | Store path from `--store` or env | `cli/index.ts`, `store/store.ts` | TC-51 |
| NFR-SEC3, D32.1 | Only reads the folder; never edits notes | `cli/commands/ingest.ts` | TC-52 |
| NFR-M2, NFR-D3 | Injected clock; deterministic output | `cli/commands/ingest.ts` | TC-49, TC-54 |
| NFR-M3 | Ingest never touches the connector | `cli/commands/ingest.ts` | TC-69 |
| NFR-A1 to NFR-A9 | Sample folder checks | acceptance | TC-56 to TC-64 |
| NFR-P1, NFR-P3, NFR-P4 | 5 s on sample; 500 notes/5,000 items; 1 MB note | acceptance | TC-65, TC-66, TC-67 |

## Design approach

Functional core, imperative shell (CLAUDE.md).

Pure core (no I/O, no clock, no store import):
- `runIngest(notes, store, today)` takes `notes: {file, text}[]` already read as UTF-8 text, plus the loaded store and `today`. It returns `{ store, report, exitCode }` where `report` is the summary shape below. It runs the pipeline in order for each note: emptiness, UTF-8 (done by the shell before this call, see below), header, checkbox lines, owner, due, normalise, merge.
- Roster is built first, from all notes that were not skipped, plus `store.roster` (D23.1, D61). Owners are resolved only after the roster is complete, so the result does not depend on note order.
- Notes are processed in file-name order, lines in order, so ids follow D69.1.
- Per-note problems come back as values (skip reasons, line skips, warnings). Nothing is thrown for malformed input (D5.3).

Shell (`cli/commands/ingest.ts` with `deps`):
1. Check the folder exists and is readable. Missing or unreadable: exit 2 (D20.3).
2. List top-level `.md` files (spec 01). No `.md` files: `No notes found`, exit 2 (D35.3). Count other top-level entries as ignored files (D29.2).
3. Read each file as bytes. Decode UTF-8 (spec 01 owns the check and reason).
4. Load the store (spec 05). Corrupt store or version other than 1: exit 2, no write (D59.4, D69.2).
5. Call `runIngest`. Nothing is written yet.
6. Save the store once, atomically (spec 05). Any I/O failure here: exit 4, store unchanged (D62.1).
7. Print the skip report to stderr, the summary to stdout (D30, NFR-O1). Warnings go to stderr.
8. Return the exit code.

Summary shape (values, not wording):
- `notesRead`, `notesSkipped: {file, reason}[]`, `skippedLines: {file, line, reason}[]`
- `ignoredFiles: number`, `ignoredLines: Record<kind, number>`
- `itemsAdded`, `mergedDuplicates`
- `ownerLabels`: lists of `{file, line}` for `(no owner)`, `(group)`, `(ambiguous)`, `(unresolved)`
- `flaggedDates` and `noDateItems`: lists of `{file, line}`
- `rosterMatches: {file, line, name, person}[]`
- `warnings: {weekdayMismatch, emailConflict, unresolvedOwner}` lists

Exit code: 4 if an internal error occurred. Else 2 if usage, folder, no notes, or store error. Else 1 if any skipped note, skipped line, or D70.1 warning. Else 0. Highest applicable wins (D53.1).

## Dependencies

- Spec 01 (note-parsing): `listNoteFiles`, `readNote`, `extractItems`, skip reasons, ignored-line kinds. Must exist before the pure core can run.
- Spec 02 (date-resolution): `resolveDue` with meeting date, weekday-mismatch flag.
- Spec 03 (owner-resolution): `resolveOwner` with roster, labels, roster-match info.
- Spec 04 (dedupe): `normalizeTask`, `mergeItem`, source records.
- Spec 05 (store): `loadStore` (corrupt check), `saveStore` (atomic), id assignment, `roster` field, `EXIT` use, store path.
- Spec 11 (cli-conventions): `--today` option in `IngestOptions` (not present in the stub yet), `EXIT.INTERNAL = 4` in `src/domain/exit-codes.ts` (D62), stream helpers.
- `cli/index.ts`: builds real `Deps` (`systemClock`, lazy connector). Only place that maps errors to exit codes.

Test doubles: fixed clock, fake connector, temp folders, fault-injecting store writer.

## Risks

- Partial failure mid-run. Mitigated by saving once at the end. A crash between write and rename is covered by spec 05's atomic write. Any error before save leaves the old store (TC-11). Thrown errors in the core would be exit 4; that path is tested (TC-10).
- Re-ingest idempotence depends on the duplicate key being stable (D28). A change to normalisation would change ids. Mitigation: TC-43, TC-64 run twice on the same data.
- Id order. Ids follow file and line order within one run. A new note added later gets higher ids even if its file name sorts earlier. Tests must not assume a global order across runs.
- Roster order. A roster built from all notes first avoids order effects, but adds a full pass over the notes. Fine at the stated volumes.
- Performance at 5,000 items. Merge must use a map index, not a scan per item. Checked by TC-66 and TC-65.
- Windows path and line endings. CRLF and BOM are covered by TC-25, TC-26. File-name sort uses plain code-unit order (decision Q10).
- Silent drift in summary numbers. Tests assert numbers from the sample (TC-57, TC-68), so wording changes do not break them (D65.3).

## Decisions

Q1. A line with the same owner and normalised task as a stored item is the same item; on a re-run its due date is updated from the newest copy. Covered by TC-72.
Q2. A line removed from a note keeps its item and its source record. Nothing is deleted (D52.1).
Q3. A re-run with no change does not rewrite the store file.
Q4. If every `.md` note is skipped: exit 1 with the skip report; the store is created empty if missing (D59.3). Covered by TC-71.
Q5. A missing or unreadable notes folder exits 2, not 4 (D20.3).
Q6. A single note that exists but cannot be read (permission error or locked) is skipped with reason `unreadable file`, the sixth skip reason from spec 01 (decision Q-02).
Q7. Ignored line kinds: table-row, action-line, block-quote, code-fence, html-comment, numbered-checkbox. Plain prose is not counted. A checkbox-looking line inside a fence or comment counts once, under its own kind.
Q8. The same owner and task twice in one note is merged and counted as merged. Covered by TC-48.
Q9. Items added = new ids this run. Merged = lines folded into an existing item, including every line on a re-run, so a second run reports 0 added.
Q10. Notes are processed in plain code-unit, case-sensitive file-name order (D69.1).
Q11. Each top-level entry that is not a `.md` file counts as one ignored file; a subfolder counts as one and its contents are not read. Covered by TC-53.
Q12. A note that is not skipped counts as read, even if it has skipped lines.
Q13. On an email conflict, ingest warns and keeps the most recent meeting's email. Dependency: specs 05 and 09 must persist attendee emails.
Q14. `--store` wins over `ACTIONTRACK_STORE`. Covered by TC-51.
Q15. "No notes found" is printed to stderr (exit 2).
Q16. The roster match is listed as a count plus a `file:line` list.
Q17. The roster holds only resolved full names from attendees and stored owners, never labels such as `(no owner)`.
Q18. A corrupt store exits 2 with a clear error (D59.4).
Q19. Spec 06 ID references: D3 and D4 are FRD decisions; P1, P3, P4, O1, O3 and U6 mean NFR-P1, NFR-P3, NFR-P4, NFR-O1, NFR-O3 and NFR-U6; NFR-D3 is determinism. The spec text itself is not changed here.
Q20. The stdout totals include `(group)` and `(unresolved)`; spec 06 overrides D30.2.
Q21. For a line merged within one run, the first occurrence in file and line order gives the id; later copies merge into it (D69.1).
