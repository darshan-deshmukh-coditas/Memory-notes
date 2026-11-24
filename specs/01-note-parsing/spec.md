# Spec 01: Note parsing

Reads the notes folder and turns each note into a header (meeting date, attendees) plus raw checkbox lines. It never decides owners, due dates or duplicates; those are specs 02 to 04.

| Field | Value |
|---|---|
| Business reqs | BR-01, BR-11 (E4) |
| FRD | FR-I1 to I4, I7 to I9, FR-E4, D2, D5, D11, D12, D21, D22, D26, D27, D29, D37, D50, D55, D57, D63, D64, D65 |
| NFRD | NFR-R1, R2, R5, SEC3, SEC4, NFR-A2 to A4 |
| Modules | `parser/note.ts` (`listNoteFiles`, `readNote`), `parser/header.ts` (`parseHeader`), `parser/items.ts` (`extractItems`) |
| Tests | `tests/unit/ingest-parsing.test.ts`, `tests/unit/edge-cases.test.ts` (E4) |

## Behaviour

### Which files (D29)
1. Only top-level `*.md` files in the given folder are notes. Other files and subfolders are ignored and counted as ignored files. This is not an error.
2. Files are processed in ascending file-name order, so output is deterministic (NFR-D3).

### Reading a file (D5.1, D55, D22.3)
3. Checks run in this order and stop at the first failure: empty file, not valid UTF-8, header. A file is **empty** when it has no non-whitespace content (D64.1). A failure skips the whole note with exactly one of these reasons: `empty file`, `not valid UTF-8`, `missing date`, `unparseable date` (D65.1).
4. A UTF-8 BOM is stripped first and is not a failure. CRLF and LF are treated alike. A lone CR is not supported (D55).
5. Reading never throws. Any failure becomes a skip entry `{file, reason}` (NFR-R1).

### Header (D21, D11, D57, D22)
6. Two header forms are accepted: YAML front matter (a `---` block with `date:` and `attendees:`) and labelled lines (`Date: ...`, `Attendees: a, b`). Keys are case-insensitive. Labelled lines are read only **before the first `## ` heading** (D63.1). Attendees are separated by **commas only**; in YAML, `attendees:` is `[a, b]` or a `- a` list (D63.2).
7. Accepted date values: `YYYY-MM-DD`, `9 September 2026`, `Monday, 14 September 2026` (D21.2). The weekday word in `Monday, 14 September 2026` is ignored (D63.3). The result is an ISO `YYYY-MM-DD` that is a real calendar date.
8. An attendee entry is `Full Name` or `Full Name <email>` (D11.2). The email is optional. A missing `attendees` key is allowed and gives an empty attendee list (D11.3).
9. If **no** date is present, the date comes from a **leading** `YYYY-MM-DD` at the start of the file name, which must be a real calendar date (D57.1). Otherwise the note is skipped as `missing date`.
10. If a date **is** present but cannot be parsed, the note is skipped as `unparseable date` and the file name is **not** used (D22.1, D22.2).

### Checkbox lines (D12, D26, D27, D37, D50)
11. An action line is a line with bullet `-`, `*` or `+`, then a checkbox `[ ]`, `[x]` or `[X]`, at any indent level (nested lines count). `[x]` and `[X]` mean done (D12.3).
12. These are **never** items. Each is counted as an ignored line, by kind, in the ingest summary:
    - numbered checkboxes such as `1. [ ] ...` (D37)
    - table rows and `ACTION:` lines (D26.2)
    - lines inside block quotes, fenced code blocks and HTML comments (D27). An HTML comment is ignored from `<!--` to `-->`, even over several lines (D64.2). An **indented code block is not special**: a checkbox line there is still an item (D64.3).
13. A checkbox line with no text after the checkbox is a **skipped line**, reported as `file:line` with reason `empty action item` (D50.1, D65.1). A line with text is always returned as a raw item, even if no owner can be found (D50.2).
14. Each raw item carries: text after the checkbox (trimmed), 1-based line number, done flag.
15. Note text is data. It is never executed or treated as a command (NFR-SEC4).

## Edge cases and sample evidence

| Case | Expected | Sample |
|---|---|---|
| Empty file | skipped, `empty file` | `2026-09-09-notes-final-v2.md` |
| Binary file | skipped, `not valid UTF-8` | `scratch.md` |
| No header | skipped, `missing date` (file name has no leading date) | `untitled.md` |
| Unparseable date | skipped, `unparseable date`, no file-name fallback | `2026-10-03-sales-pipeline.md` (`Date: sometime last week`) |
| `.txt` file | ignored file, counted | `2026-09-19-offsite-draft.txt` |
| YAML header | read | `2026-09-16-standup.md`, `2026-09-30-standup.md` |
| CRLF note | read like LF | `2026-10-02-finance-sync.md` |
| Block quote line | ignored | `2026-09-21-incident-review.md` |
| Code fence line, HTML comment line | ignored | `2026-10-09-security-review.md` |
| Table row, `ACTION:` line | ignored | `2026-09-30-q4-offsite.md` |
| `*`, `+` bullets, `[X]`, nested line | items | offsite and finance notes |

Result for the sample folder: 35 `.md` files, 4 skipped, 31 read (NFR-A2).

## Acceptance tests (cite IDs in test names)
- `D21.1` reads YAML and labelled headers, case-insensitive keys
- `D21.2` accepts `9 September 2026` and `Monday, 14 September 2026`
- `D11.2` attendee with and without `<email>`
- `D11.3` missing attendees gives an empty list
- `D57.1` file-name fallback only for a leading real date; `untitled.md` stays malformed
- `D22.1` present-but-bad date is skipped with no fallback
- `D5.1`, `D55.3` empty and non-UTF-8 files skipped, never thrown
- `D55.1`, `D55.2` BOM stripped; CRLF equals LF
- `D26.1`, `D12.3` bullets `- * +`, marks `[ ] [x] [X]`, nested, done flag
- `D26.2`, `D27`, `D37` ignored kinds are counted, never items
- `D50.1`, `D50.2` empty checkbox skipped; text without owner pattern kept
- `D29` top-level `.md` only; `.txt` and folders counted as ignored
- `D63.1` a `Date:` line after the first `## ` heading is not read as the header
- `D63.2`, `D63.3` comma-separated attendees (YAML `[a, b]` and `- a`); header weekday ignored
- `D64.1` a whitespace-only file is skipped as `empty file`
- `D64.2`, `D64.3` a multi-line HTML comment is ignored; a checkbox in an indented block still counts
- `D65.1` skip reasons use exactly the five strings
