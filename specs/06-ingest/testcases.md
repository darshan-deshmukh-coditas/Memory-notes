# Spec 06 test cases: `actiontrack ingest <folder>`

Every test name starts with its TC ID in brackets. Each test cites its FRD or NFRD ID in the Spec column. Summary assertions check numbers, file names, ids and statuses only, never wording (D65.3).

Type key: **unit** = pure function, no I/O. **integration** = command with a temp folder, temp store and fake `Deps` (fixed clock, fake connector, captured `out` and `err`). **acceptance** = the `notes/` sample folder (NFRD section 10).

Items marked **(negative)** check that something does not happen. 
## Command contract, exit codes and reporting

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-01 | FR-I14, D20.3 | tests/unit/commands.test.ts | [TC-01] missing folder exits 2 and names the path (D20.3) | integration (negative) | Folder path that does not exist | Error on stderr; no store file created | 2 |
| TC-02 | D35.3 | tests/unit/commands.test.ts | [TC-02] folder with no .md files prints No notes found (D35.3) | integration (negative) | Folder holding only `offsite-draft.txt`-style file | `No notes found` printed; store untouched | 2 |
| TC-03 | D35.3 | tests/unit/commands.test.ts | [TC-03] empty folder exits 2 (D35.3) | integration (negative) | Empty folder | `No notes found`; store untouched | 2 |
| TC-04 | D54.1 | tests/unit/commands.test.ts | [TC-04] invalid --today value exits 2 (D54.1) | integration (negative) | `--today 14/10/2026` | Error names the ISO format; nothing read | 2 |
| TC-05 | NFR-R1, FR-I8, D5.3 | tests/unit/commands.test.ts | [TC-05] malformed notes never stop the run (NFR-R1) | integration | 3 valid notes plus 2 malformed (empty, missing date) | Items from the 3 valid notes stored; run finishes | 1 |
| TC-06 | FR-I9, NFR-R2, D65.1 | tests/unit/commands.test.ts | [TC-06] every skipped note is listed as file and reason (NFR-R2) | integration | Folder with one note each: empty, non-UTF-8, no date, unparseable date, unreadable file (locked or permission-denied in the test) | Five `Skipped notes:` lines on stderr, each `<file>: <fixed reason>`, including `unreadable file` | 1 |
| TC-07 | D30.1, D50.1 | tests/unit/commands.test.ts | [TC-07] skipped line is listed as file:line with reason (D30.1) | integration | Note with `- [ ]` (no text) at line 4 | `Skipped lines:` shows `<file>:4: empty action item`; other lines still ingested | 1 |
| TC-08 | D30.2, FR-I13 | tests/unit/commands.test.ts | [TC-08] summary totals match fixture counts (D30.2) | integration | `labelled-basic.md` and `traps.md` together | Stdout totals: notes read, skipped, added, merged, no-owner, ambiguous, no-date, unresolved-date, ignored lines; each equals the count in the fixture header | 0 |
| TC-09 | D30.3, NFR-O3, NFR-U6 | tests/unit/commands.test.ts | [TC-09] warnings to stderr, totals to stdout, no log file (NFR-O3) | integration | Malformed note plus a clean note | Skip report only on `err`; totals only on `out`; no file other than the store written | 1 |
| TC-10 | D53.1, D62.2 | tests/unit/commands.test.ts | [TC-10] internal error (4) beats skipped notes (1) (D53.1) | integration (negative) | Malformed note plus injected store write failure | Exit 4; message on stderr | 4 |
| TC-11 | D62.1, NFR-R3 | tests/unit/commands.test.ts | [TC-11] failed save exits 4 and leaves store byte-identical (D62.1) | integration (negative) | Existing store; fake fs throws on rename | Exit 4; store file bytes unchanged; clear message on stderr | 4 |
| TC-12 | D59.4, D69.2 | tests/unit/commands.test.ts | [TC-12] corrupt store or version other than 1 is never overwritten (D59.4) | integration (negative) | Store containing `{not json`; second store with `"version": 2` | Exit 2 each time; file bytes unchanged | 2 |
| TC-13 | D70.1, D33.4 | tests/unit/commands.test.ts | [TC-13] weekday disagreeing with explicit date warns; explicit date wins (D33.4) | integration | Due phrase whose weekday is wrong for its explicit date | Warning on stderr; stored due is the explicit date | 1 |
| TC-14 | D70.1, D56.2 | tests/unit/commands.test.ts | [TC-14] email conflict between two notes warns; most recent email used (D56.2) | integration | Two notes give different emails for Priya Nair; older note first | Warning on stderr; stored email is the later meeting's | 1 |
| TC-15 | D70.1, D41.3 | tests/unit/commands.test.ts | [TC-15] (unresolved) owner exits 1 and is listed by file:line (D41.3) | integration | Item `Dana to send deck` with no roster match | Listed under unresolved owners with file:line | 1 |
| TC-16 | D70.2, D16.4, D25.3 | tests/unit/commands.test.ts | [TC-16] (no owner), (group), (ambiguous) and flagged dates alone exit 0 (D70.2) | integration | Clean fixture with those items only | Items listed in summary; no warnings | 0 |

## Parsing, checkbox lines and note-level skips

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-17 | AC-I2, D26.1 | tests/unit/ingest-parsing.test.ts | [TC-17] every real checkbox item is stored with owner, task, due, source and status (AC-I2) | integration | `labelled-basic.md` | Item set equals fixture expectations; each has source `{file, meetingDate, line}` and a status | 0 |
| TC-18 | AC-I3, D8 | tests/unit/ingest-parsing.test.ts | [TC-18] no stored due date is free text (AC-I3) | integration | `yaml-basic.md`, `labelled-basic.md` | Every stored due is `null` or matches `^\d{4}-\d{2}-\d{2}$` | 0 |
| TC-19 | D26.2, D27.1, D27.2 | tests/unit/ingest-parsing.test.ts | [TC-19] trap lines are not stored and are counted as ignored (D27.2) | integration | `traps.md` (block quote, code fence, HTML comment, table row, ACTION:) | Zero items from trap lines; ignored counts per kind as in fixture header | 0 |
| TC-20 | D37.1 | tests/unit/ingest-parsing.test.ts | [TC-20] numbered checkbox `1. [ ]` is ignored and counted (D37.1) | unit | Line `1. [ ] send deck` | Not an item; counted under numbered-checkbox kind | n/a |
| TC-21 | D12.1, D26.1, D64.3 | tests/unit/ingest-parsing.test.ts | [TC-21] nested and indented checkbox lines are items (D26.1) | unit | Bullet with nested `- [ ]` under a heading and an indented block | Nested items stored; line numbers correct | n/a |
| TC-22 | D64.2 | tests/unit/ingest-parsing.test.ts | [TC-22] multi-line HTML comment hides checkbox lines until `-->` (D64.2) | unit | `<!--`, `- [ ] hidden`, `-->`, `- [ ] visible` | Only `visible` stored | n/a |
| TC-23 | D64.1, D5.1 | tests/unit/edge-cases.test.ts | [TC-23] whitespace-only file is skipped as empty file (D64.1) | integration (negative) | File with spaces and newlines only | Skip reason `empty file`; run continues | 1 |
| TC-24 | D55.3, D5.1 | tests/unit/edge-cases.test.ts | [TC-24] non-UTF-8 note is skipped as not valid UTF-8 (D55.3) | integration (negative) | Bytes `0xFF 0xFE 0x00` in a note | Skip reason `not valid UTF-8`; other notes ingested | 1 |
| TC-25 | D55.1 | tests/unit/edge-cases.test.ts | [TC-25] UTF-8 BOM is stripped and the note is not skipped (D55.1) | integration | Valid note starting with BOM | Items stored; no skip | 0 |
| TC-26 | D55.2 | tests/unit/edge-cases.test.ts | [TC-26] CRLF and LF versions give the same items and line numbers (D55.2) | unit | Same note in both line endings | Equal item lists; line numbers 1-based and identical | n/a |
| TC-27 | D22.1, D5.1 | tests/unit/edge-cases.test.ts | [TC-27] unparseable Date value skips note; filename date not used (D22.1) | integration (negative) | `2026-10-03-sales-pipeline.md` with `Date: sometime last week` | Skip reason `unparseable date`; no items from that note | 1 |
| TC-28 | D22.2, D57.1 | tests/unit/edge-cases.test.ts | [TC-28] with no date header, leading filename date is the meeting date (D22.2) | integration | `2026-09-30-standup.md` with no date line | Meeting date 2026-09-30; not skipped | 0 |
| TC-29 | D5.1, D57.1 | tests/unit/edge-cases.test.ts | [TC-29] no date header and no leading filename date gives missing date (D57.1) | integration (negative) | `untitled.md` with no date | Skip reason `missing date` | 1 |

## Owners, roster and dates within ingest

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-30 | D4, D23.2 | tests/unit/edge-cases.test.ts | [TC-30] first name matching one roster person resolves when note has no attendees (D23.2) | integration | Note A with attendees "Sam Okafor"; note B (no attendees) with `Sam to ...` | Note B item owner is Sam Okafor | 0 |
| TC-31 | D23.2, D41.2 | tests/unit/edge-cases.test.ts | [TC-31] first name matching two roster people is (ambiguous) (D41.2) | integration | Roster has Rahul Mehta and Rahul Dasgupta; `Rahul to ...` in no-attendee note | Owner `(ambiguous)` | 0 |
| TC-32 | D41.1 | tests/unit/edge-cases.test.ts | [TC-32] roster match is listed in the summary with file:line (D41.1) | integration | As TC-30 | Summary lists one roster match with file and line | 0 |
| TC-33 | D61.1, D23.1 | tests/unit/edge-cases.test.ts | [TC-33] skipped notes contribute nothing to the roster (D61.1) | integration (negative) | Malformed note with attendee `Dana Lee`; clean note with `Dana to ...` and no attendees | Owner `(unresolved)`, not Dana Lee | 1 |
| TC-34 | D61.2 | tests/unit/edge-cases.test.ts | [TC-34] roster includes names already in the store (D61.2) | integration | Run 1 ingests attendee `Sam Okafor`; run 2 on a folder with only `Sam to ...` and no attendees | Run 2 owner is Sam Okafor | 0 |
| TC-35 | D8, D33.1 | tests/unit/dates.test.ts | [TC-35] due wording resolves against meeting date, not --today (D8) | integration | Meeting 2026-09-10 with `by Friday`; `--today 2026-11-24` | Due is the Friday after the meeting date; same result with another `--today` | 0 |
| TC-36 | D8.4, D66.3 | tests/unit/dates.test.ts | [TC-36] unresolvable wording stores null and flags the item (D8.4) | integration | `in 3 days` | Due null; item flagged; listed under no-date or unresolved-date | 0 |
| TC-37 | D16.4, D25.3 | tests/unit/edge-cases.test.ts | [TC-37] (no owner), (group) and (ambiguous) items are listed by file and line (D16.4) | integration | `Someone`, `Everyone`, ambiguous `Priya` lines | Each listed with file and line in summary; none in exit code | 0 |

## Duplicates, idempotence and store integrity

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-38 | D3.1, D28.1 | tests/unit/edge-cases.test.ts | [TC-38] same owner and normalised task in two notes is one item with two sources (D3.1) | integration | Two notes, both "Priya to send the quote by Friday" | One item; two sources; merged count 1 | 0 |
| TC-39 | D3.5 | tests/unit/edge-cases.test.ts | [TC-39] merged item stays done if any copy is done (D3.5) | integration | One copy `[x]`, one `[ ]` | One item with status done | 0 |
| TC-40 | D39.1 | tests/unit/edge-cases.test.ts | [TC-40] merged item shows wording and date of the most recent note (D39.1) | integration | Older note wording A, newer note wording B | Stored task text is B; meeting date is the newer one | 0 |
| TC-41 | D52.2, D28.3 | tests/unit/edge-cases.test.ts | [TC-41] reworded line becomes a new item (D28.3) | integration (negative) | Second run with "send the revised quote" reworded to "send the final quote" | New id assigned; old item unchanged | 0 |
| TC-42 | D52.1 | tests/unit/commands.test.ts | [TC-42] removing a line from a note keeps its stored item (D52.1) | integration (negative) | Run 1 with line; run 2 with line deleted | Item count unchanged; item and id unchanged | 0 |
| TC-43 | D13.1, D13.2, NFR-A9 | tests/unit/commands.test.ts | [TC-43] second run on same folder adds nothing and changes no id or status (D13.1) | integration | Ingest folder twice | Run 2 added 0; ids and statuses equal run 1 | 1 or 0 as in run 1 |
| TC-44 | D13.2 | tests/unit/commands.test.ts | [TC-44] done item stays done and keeps its id on re-run (D13.2) | integration | Mark item done in store; re-ingest | Status done; same id | 0 |
| TC-45 | D14.1, D69.1 | tests/unit/ingest-parsing.test.ts | [TC-45] ids are sequential in file-name then line order (D69.1) | unit | Two notes, several items each | Ids 1..n in that order | 0 |
| TC-46 | D69.1 | tests/unit/ingest-parsing.test.ts | [TC-46] joint owner `Anita & Rahul` gives Anita the lower id (D69.1) | unit | One line naming both | Anita id < Rahul id | 0 |
| TC-47 | D14.2 | tests/unit/commands.test.ts | [TC-47] new ids continue after the highest stored id, never reused (D14.2) | integration | Store with ids 1..5; new note | New item id 6 | 0 |
| TC-48 | D3.1, D179 | tests/unit/edge-cases.test.ts | [TC-48] identical lines twice in one note merge into one item and count as merged (D179) | integration | One note with the same line twice | One item; merged count 1 | 0 |
| TC-49 | NFR-D3 | tests/unit/commands.test.ts | [TC-49] same notes on fresh stores give identical ids and statuses (NFR-D3) | integration | Ingest into two empty stores | Equal item lists | 0 |
| TC-50 | D59.3 | tests/unit/commands.test.ts | [TC-50] missing store file is created on first run (D59.3) | integration | Store path absent | Store file exists after run | 0 |
| TC-51 | D17.2, D59.1, D185 | tests/unit/commands.test.ts | [TC-51] --store overrides ACTIONTRACK_STORE (D185) | integration | Both set to different paths | Only the --store path is written | 0 |
| TC-52 | NFR-SEC3, D32.1 | tests/unit/commands.test.ts | [TC-52] ingest never writes into the notes folder (NFR-SEC3) | integration (negative) | Folder with notes; hash before and after | Hashes equal; no new files in folder | 0 |
| TC-53 | D29.1, D29.2, D182 | tests/unit/commands.test.ts | [TC-53] only top-level .md files are read; others counted as ignored (D29.1) | integration (negative) | Folder with `.md`, `.txt` and a subfolder holding a `.md` | Subfolder note not read; ignored count reported (subfolder counts as one, D182) | varies |
| TC-54 | NFR-M2, NFR-D3 | tests/unit/commands.test.ts | [TC-54] result does not depend on the system clock (NFR-M2) | integration | Same folder, fixed --today, two different fake clocks | Identical items and summary numbers | 0 |
| TC-55 | D58.1 | tests/unit/ingest-parsing.test.ts | [TC-55] each source records file, meeting date and 1-based line (D58.1) | unit | Checkbox on line 7 of a note | Source `{file, meetingDate, line: 7}` | n/a |
| TC-56 | NFR-A1, NFR-R1 | tests/acceptance/sample-notes.test.ts | [TC-56] A1: ingest completes on the sample folder with no crash (NFR-A1) | acceptance | `notes/` (35 .md plus 1 .txt) | Finishes; no uncaught error | 1 |
| TC-57 | NFR-A2 | tests/acceptance/sample-notes.test.ts | [TC-57] A2: 4 notes skipped with names and reasons, 31 read, exit 1 (NFR-A2) | acceptance | As TC-56 | Skipped: `2026-09-09-notes-final-v2.md`, `scratch.md`, `untitled.md`, `2026-10-03-sales-pipeline.md`; read = 31 | 1 |
| TC-58 | NFR-A3 | tests/acceptance/sample-notes.test.ts | [TC-58] A3: `2026-09-19-offsite-draft.txt` counted as ignored file (NFR-A3) | acceptance | As TC-56 | Ignored files = 1, that name appears in report | 1 |
| TC-59 | NFR-A4 | tests/acceptance/sample-notes.test.ts | [TC-59] A4: five trap lines not ingested (NFR-A4) | acceptance | As TC-56 | No stored item whose source line is a trap line in the five named files | 1 |
| TC-60 | NFR-A5, E1 | tests/acceptance/sample-notes.test.ts | [TC-60] A5: Priya Nair revised quote is one done item with 3 sources (NFR-A5) | acceptance | As TC-56 | One item; sources from 2026-09-01, 09-08, 09-15 | 1 |
| TC-61 | NFR-A6 | tests/acceptance/sample-notes.test.ts | [TC-61] A6: bare Priya and Rahul ambiguous; Priya N. and Priya S. resolve (NFR-A6) | acceptance | As TC-56 | Bare names `(ambiguous)`; `Priya N.` gives Priya Nair; `Priya S.` gives Priya Shah | 1 |
| TC-62 | NFR-A7 | tests/acceptance/sample-notes.test.ts | [TC-62] A7: Someone and TBD no-owner; Everyone and Team group; undated not flagged overdue (NFR-A7) | acceptance | As TC-56 | Labels as stated; `Sam to share the VPN guide` due null | 1 |
| TC-63 | NFR-A8, D23.2 | tests/acceptance/sample-notes.test.ts | [TC-63] A8: standup Sam resolves via roster, Rahul stays ambiguous (NFR-A8) | acceptance | As TC-56 | `Sam` = Sam Okafor; `Rahul` = `(ambiguous)` | 1 |
| TC-64 | NFR-A9, D13.1 | tests/acceptance/sample-notes.test.ts | [TC-64] A9: second ingest gives same items, ids and statuses (NFR-A9) | acceptance | Run twice on sample | Run 2 added 0; equal ids and statuses | 1 |
| TC-65 | NFR-P1 | tests/acceptance/sample-notes.test.ts | [TC-65] P1: sample ingest completes in under 5 seconds (NFR-P1) | acceptance | As TC-56, timed | Elapsed < 5000 ms on the dev machine | 1 |
| TC-66 | NFR-P3 | tests/acceptance/sample-notes.test.ts | [TC-66] P3: 500 notes and 5,000 items ingest without failure (NFR-P3) | acceptance | Generated folder (see Fixtures) | Completes; 5,000 items stored | 0 or 1 |
| TC-67 | NFR-P4 | tests/acceptance/sample-notes.test.ts | [TC-67] P4: 1 MB note processed without failure (NFR-P4) | acceptance | Generated 1 MB note with checkbox lines | Completes; items stored | 0 |
| TC-68 | NFR-R2, NFR-U6 | tests/acceptance/sample-notes.test.ts | [TC-68] every skipped sample note appears in the stderr report (NFR-R2) | acceptance | As TC-56 | Count of `Skipped notes:` lines equals count of skipped notes in totals (4) | 1 |
| TC-69 | NFR-M3 | tests/unit/commands.test.ts | [TC-69] ingest never calls the connector (NFR-M3) | integration (negative) | Fake `connector` that records calls | Zero calls | 0 |
| TC-70 | NFR-A9, D13.1, D174 | tests/unit/commands.test.ts | [TC-70] run with zero item changes does not rewrite the store file (D174) | integration | Second run on unchanged folder | Store file bytes unchanged (not rewritten, D174); ids unchanged | 0 |
| TC-71 | D20.2, D35.3, D175 | tests/unit/commands.test.ts | [TC-71] folder whose .md notes are all skipped exits 1 and creates an empty store (D175) | integration | Folder with only empty and untitled notes | Exit 1, not 2; skip report printed; store created with no items | 1 |
| TC-72 | D13, D172 | tests/unit/commands.test.ts | [TC-72] line that changes due date on re-run updates the due date (D172) | integration | Run 1 `by Friday`; run 2 same line `by Monday` | Same id; due is the new date | 0 |

## Negative case count

Negative rows: TC-01, TC-02, TC-03, TC-04, TC-06, TC-10, TC-11, TC-12, TC-23, TC-24, TC-27, TC-29, TC-33, TC-36, TC-41, TC-42, TC-52, TC-53, TC-69. The rest are positive or boundary cases.

## Fixtures needed

Existing (tests/fixtures/notes/): `labelled-basic.md`, `yaml-basic.md`, `traps.md`, `bad-date.md`.

Create in a temp dir inside each test (editors can rewrite bytes, per tests/fixtures/README.md):
- `empty.md` (zero bytes); `whitespace.md` (spaces and newlines only) (TC-23)
- `latin1.md` with byte `0xFF` (TC-24)
- `bom.md` (UTF-8 BOM plus valid note) (TC-25)
- `crlf.md` and `lf.md` (same content, two line endings) (TC-26)
- `2026-09-30-standup.md` with no date line (TC-28); `untitled.md` with no date (TC-29)
- `empty-item.md` with `- [ ]` at line 4 (TC-07)
- `numbered.md` with `1. [ ] ...` (TC-20); `nested.md` (TC-21); `html-comment.md` (TC-22)
- `roster-a.md` (attendees Sam Okafor, Dana Lee, Priya Nair with emails), `roster-b.md` (no attendees; `Sam to ...`, `Dana to ...`, `Rahul to ...`) (TC-30, 31, 33)
- `email-old.md` and `email-new.md` with different emails for Priya Nair (TC-14)
- `weekday-mismatch.md` (TC-13)
- `reword-1.md` and `reword-2.md` (TC-41); `dup-a.md` and `dup-b.md` (TC-38, 40)
- `same-line-twice.md` (TC-48)
- `subfolder/` with a `.md` inside (TC-53)
- Each fixture's header comment states its expected counts. Expected numbers for TC-08 and TC-19 are written there by hand before the test is turned green.

Generated in the test (not committed):
- 500-note folder with 5,000 checkbox items (TC-66)
- one 1 MB note (TC-67)

Fakes and helpers:
- fixed clock (`Clock` in src/clock.ts) for TC-35, TC-54
- fake `Deps.connector` that records calls (TC-69)
- fake store writer that throws on rename (TC-11)
- sample folder path `notes/` (read-only, TC-56 to TC-68); the test copies it into a temp dir before any run that writes a store, so the source folder is never changed.
