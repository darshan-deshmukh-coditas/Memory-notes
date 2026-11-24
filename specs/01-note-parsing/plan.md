# Plan: 01 Note parsing

## Goal

Turn each top-level `.md` note into a `Note` (meeting date, attendees, body) or a skip report, and turn each note body into raw checkbox items with line numbers and done flags. Owners, due dates and duplicates are out of scope (specs 02 to 04). Nothing here may throw on user input (NFR-R1).

## Scope

**In scope**
- `listNoteFiles(folder)`: which files are notes, and their order (D29, NFR-D3).
- `readNote(file)`: empty / UTF-8 / BOM / CRLF checks, header, filename date fallback, skip reasons (D5.1, D22, D55, D57, D64.1, D65.1).
- `parseHeader(text)`: YAML front matter and labelled lines, date forms, attendees (D11, D21, D63).
- `dateFromFilename(file)`: leading real date only (D57.1).
- `extractItems(body, firstLine)`: checkbox lines, ignored contexts, empty action items (D12, D26, D27, D37, D50, D64).

**Out of scope (owned elsewhere)**
- Owner resolution, first-name matching: `specs/03-owner-resolution`.
- Due-date wording and meeting-date resolution: `specs/02-date-resolution`.
- Duplicate merging and normalisation: `specs/04-dedupe`.
- Store writes, ids, the skip report wording and ingest summary totals (D30.2), exit codes (D70), the "No notes found" rule (D35.3): `specs/05-store`, `specs/06-ingest`.
- `list`, `done`, `followup`, Gmail: specs 07 to 10.

## Requirement map

| ID | Rule (one line) | Module | Test IDs |
|---|---|---|---|
| FR-I1, FR-I2 | Folder argument; every top-level `.md` is parsed | `parser/note.ts` `listNoteFiles` | TC-01, TC-04 |
| FR-I3 (D29.1, D29.2) | Non-`.md` and subfolders are ignored and counted, not errors | `listNoteFiles` | TC-01, TC-02 |
| NFR-D3 | Files processed in ascending name order | `listNoteFiles` | TC-03 |
| FR-I4, D12.3, D26.1 | Checkbox lines `- * +` with `[ ] [x] [X]`, nested, done flag | `parser/items.ts` | TC-31, TC-32, TC-33 |
| D12.1 | Checkbox anywhere in body, including under headings | `items.ts` | TC-34 |
| D26.2 | Table rows and `ACTION:` lines are ignored and counted | `items.ts` | TC-35, TC-36 |
| D27.1, D27.2 | Block quotes, fenced code, HTML comments ignored and counted | `items.ts` | TC-37, TC-38, TC-39, TC-40, TC-41, TC-42 |
| D64.2 | HTML comment ignored from `<!--` to `-->`, multi-line | `items.ts` | TC-41, TC-42 |
| D64.3 | Indented code block is not special; checkbox there is an item | `items.ts` | TC-43 |
| D37.1 | Numbered checkboxes ignored and counted | `items.ts` | TC-44 |
| D50.1 | `- [ ]` with no text: skipped as `file:line`, `empty action item` | `items.ts` / `note.ts` | TC-45, TC-47 |
| D50.2 | Checkbox with text and no owner pattern is kept | `items.ts` | TC-46 |
| FR-I7, D21.1, D63.1 | Labelled and YAML header, read only before first `## ` heading | `parser/header.ts` | TC-05, TC-06, TC-15 |
| D21.2, D11.1, D63.3 | Date forms `YYYY-MM-DD`, `9 September 2026`, weekday ignored | `header.ts` | TC-07, TC-08, TC-09, TC-10 |
| D11.2, D11.3, D63.2 | Attendees: `Name <email>` optional email; comma list; missing key gives `[]` | `header.ts` | TC-11, TC-12, TC-13, TC-14 |
| D57.1, D22.2 | Filename fallback only when no date key exists, leading real date only | `header.ts` `dateFromFilename` | TC-16, TC-17, TC-18 |
| FR-I8, FR-I9, FR-E4, D5.1, D22.1, D22.3 | Whole-note skip in order: empty, UTF-8, date missing, date unparseable | `note.ts` `readNote` | TC-19, TC-20, TC-22, TC-23 |
| D64.1 | Whitespace-only file is `empty file` | `note.ts` | TC-21 |
| D55.1, D55.2, D55.3 | BOM stripped, CRLF equals LF, invalid UTF-8 skipped | `note.ts` | TC-22, TC-24, TC-25 |
| D65.1 (as amended by D78) | Exactly six skip reason strings | `note.ts` | TC-28 |
| NFR-R1 | Reading never throws | `note.ts` | TC-26, TC-27 |
| NFR-R2 | Every skip is reported with file and reason | `note.ts` | TC-27 |
| NFR-R5 | Long lines and odd input handled | `note.ts`, `items.ts` | TC-29 |
| NFR-SEC3 | Only reads the folder given | `note.ts` | Review (no test) |
| NFR-SEC4 | Note text is data, never executed | `header.ts`, `items.ts` | TC-30, TC-49 |
| NFR-A1 to NFR-A4 | Sample folder: 4 skipped, 31 read, trap lines not ingested, `.txt` ignored | `tests/acceptance/sample-notes.test.ts` | TC-50 to TC-57 |
| Decisions D77 to D95 | See Decisions section | various | TC-58 to TC-73 |
| Decision D95 | Scope only, no test here | n/a | none |

## Design per module

Pure/IO split: only `listNoteFiles` and `readNote` touch the file system. `parseHeader`, `dateFromFilename`, `extractItems` and the decode step are pure and take strings or names.

- **`listNoteFiles(folder)`** (IO shell). Calls `readdir` with `withFileTypes`. Pure helper `selectNoteNames(entries: {name, isFile})` returns `{notes, ignored}`. A note is a regular file whose name ends in `.md` (case rule: D79). Sort with a plain code-unit comparison, not `localeCompare`, so order is the same on all OS (NFR-D3).
- **`readNote(file)`** (IO shell around pure core). `fs.readFile` returns a Buffer inside try/catch that maps every error to a skip. Pure `decodeNote(buffer)`: decode with `TextDecoder("utf-8", {fatal: true})`, strip a leading BOM, then check empty (no non-whitespace), in that order (D5.1 list, D22.3). Then `parseHeader(text)`. If `date` is null and no unparseable value, call `dateFromFilename(path.basename(file))`. Body is the text after `bodyStart`.
- **`parseHeader(text)`** (pure). Normalises CRLF to LF for parsing only. Lead = lines before the first line that starts with `## `. YAML is used when the first line is `---` and a closing `---` exists; otherwise labelled lines in the lead. Keys matched case-insensitively. Date value matched against the three D21.2 forms, then checked as a real calendar date. Attendees split on commas only.
- **`dateFromFilename(file)`** (pure). Matches `^(\d{4}-\d{2}-\d{2})` at the start of the basename and checks it is a real date.
- **`extractItems(body, firstLine)`** (pure). Line scanner with two states: inside fence (opening marker char and length, closed by the same char with at least that length) and inside HTML comment. Per line, in order: fence/comment state, block quote (first non-space `>`), table row (first non-space `|`), `ACTION:` prefix, numbered checkbox (`^\s*\d+[.)]\s+\[`), checkbox (`^\s*[-*+]\s+\[( |x|X)\]`). Only checkbox lines become items. Line number = `firstLine + index`.

**Type change.** `Note` gets the absolute first line of `body` (D84) in `src/domain/types.ts`.

**Ignored counts.** `ExtractResult.ignored` is `SkipReport[]`. Its `reason` carries the ignored kind label (for example `block quote`, `code fence`, `HTML comment`, `table row`, `ACTION line`, `numbered checkbox`). These labels are summary wording (D65.3) and must not reuse the skip reason strings.

## Error and skip handling

- Skip reason strings, exactly six (D65.1 as amended by D78). Whole-note skips: `empty file`, `not valid UTF-8`, `missing date`, `unparseable date`, `unreadable file`. Line-level skip (reported as `file:line`): `empty action item`.
- Note-level skip result: `{file, reason}`. Line-level skip: `{file, line, reason}`, `line` is 1-based absolute.
- `readNote` never throws. Any unexpected error becomes a skip with reason `unreadable file` (D78).
- Skipped notes contribute no `Note` and are not passed to `extractItems`; they add nothing to item or ignored counts (D83).
- `listNoteFiles` errors on a missing folder are not a note skip. It throws a typed `ActiontrackError` that spec 06 maps to exit 2 (D94).
- Warnings go to stderr only, printed by the caller (spec 06), never by these modules.

## Dependencies on other specs

- **Consumes from spec 06 (ingest):** nothing; spec 06 calls these functions.
- **Produces for spec 02 (dates):** `Note.meetingDate` (ISO `YYYY-MM-DD`, never null on a returned Note); `RawItem.text` for due-phrase parsing.
- **Produces for spec 03 (owners):** `Note.attendees` (`{name, email?}`); `RawItem.text` for owner phrases.
- **Produces for spec 04 (dedupe):** `RawItem.{text, done, line}` and `Note.file`.
- **Produces for spec 05 (store):** `Source {file, meetingDate, line}` is built by the caller from `Note` and `RawItem`.
- **Produces for spec 06 (ingest):** skip reports (note and line level), ignored-kind counts, the `Note.firstLine` change, and the list of ignored files from `listNoteFiles`.

## Risks

- A hand-written Markdown scanner can drift from real Markdown. Keep the rules to the listed ones and test each trap in its own case.
- Labelled `Date:` text inside the body could be read as a header. D63.1 limits reading to the lead; test it (TC-15).
- File-system error codes differ between Windows and POSIX (for example EPERM vs EACCES). Map all errors to one path (D78).
- Trap counts for the sample folder (NFR-A4) are not recorded in the spec. TC-54 needs recorded values after the first run.
- `TRACEABILITY.md` row BR-01 lists D2, D12, D21, D26, D27, D29, D50, D55, D57, D63 to D65 but not D5, D11, D22, D37. Fix in task T46.
- Stub `it.todo("no .md files: No notes found, exit 2 (D35.3)")` belongs to spec 06, not this spec. Move it (D95).
- Stub name `bad action lines are skipped at line level (D5.2)` is narrower in D50.1 (only empty checkbox lines). D50 is later and wins; rename the stub in task T09.
- A change to `Note` affects specs 04 and 05 signatures. Record the decision before changing the type.

## Decisions

Settled. Each line is final; the matching test is named with its D-nn ID. A later decision wins, and new decisions are recorded in `docs/FRD.md` section 11 from D77.

- **D77** A blank `Date:` value counts as no date; the filename fallback applies, else `missing date`.
- **D78** An unreadable file (permission error, path is a directory) is skipped with reason `unreadable file`. This amends D65.1: the skip reason strings are now six.
- **D79** `.md` is matched case-insensitively (so `.MD` is a note); dotfiles ending `.md` are notes; a directory named `y.md` is not a note and is counted as ignored.
- **D80** Ignored-line counts inside fences, quotes and comments count only checkbox-looking lines.
- **D81** Both `` ``` `` and `~~~` fences are accepted; an unclosed fence runs to end of file (later checkbox lines are ignored, no skip).
- **D82** A date with a time part (for example `2026-09-09 10:30`) is `unparseable date`.
- **D83** A skipped note adds nothing to item or ignored counts; only its skip entry is reported.
- **D84** Line numbers are absolute 1-based file lines, counting header lines after BOM strip; a CRLF line counts once. This requires the `Note` type change above.
- **D85** Empty attendee entries (`a,,b`, trailing comma) are dropped silently; an email-only entry (`<x@y.z>`) is dropped.
- **D86** An impossible date in the filename (for example `2026-13-01-x.md`) with no date key is `missing date`.
- **D87** Month names are case-insensitive and full English names only (`9 SEPTEMBER 2026` is accepted); `9th September 2026` and `9 Sep 2026` are `unparseable date`.
- **D88** When a note has both YAML front matter and labelled lines, YAML wins; labelled lines are not read.
- **D89** Unclosed YAML front matter (`---` with no closing `---`) is no YAML block; labelled lines are read from the lead.
- **D90** A lone CR is ordinary content; the file is one line; no crash (matches D55.2).
- **D91** `-[ ]` (no space after the bullet) is not an item; `- [ ]text` is an item with text `text`. Tabs count as indentation.
- **D92** The first `Date:` line in the lead wins; later ones are ignored.
- **D93** A BOM-only file is `empty file`, since the BOM is stripped before the empty check.
- **D94** A missing or unreadable folder makes `listNoteFiles` throw `ActiontrackError`; spec 06 maps it to exit 2 (FR-D20.3).
- **D95** The D35.3 stub (`No notes found`, exit 2) moves to spec 06 tests; scope only, no test in this spec.

Standing assumptions (not questions):
- `## ` boundary means a line that starts with exactly `## ` (no leading space). `### ` does not end the lead.
- Done marks are `[x]` and `[X]` only (D12.3).
