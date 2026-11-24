# Test cases: 01 Note parsing

Conventions
- Test names start with the ID in brackets, for example `[D21.1] reads YAML front matter`.
- `Q-nn` rows test a recommended default from `plan.md` (open question). Their names must be renamed to a new decision ID (D77 or later) once the user confirms, in the same change as the decision.
- Type `unit` = pure function or readNote on a temp file. `property` = seeded loop of generated inputs (no new dependency). `acceptance` = sample `notes/` folder.
- "Never throws" rows assert the returned value, not just the absence of an exception.
- Fixture paths are under `tests/fixtures/notes/` unless marked "temp" (created inside the test, see Fixtures needed).

## Test cases

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result |
|---|---|---|---|---|---|---|
| TC-01 | D29.1 | tests/unit/ingest-parsing.test.ts | [D29.1] lists top-level .md only, not subfolders | unit | temp folder: `a.md`, `b.txt`, `sub/c.md` | notes = [`a.md`]; `c.md` not listed |
| TC-02 | D29.2 | tests/unit/ingest-parsing.test.ts | [D29.2] counts .txt and subfolders as ignored, no error | unit | temp folder as TC-01 | ignored = 2; no throw |
| TC-03 | NFR-D3 | tests/unit/ingest-parsing.test.ts | [NFR-D3] returns notes in ascending name order | unit | temp folder: `2026-10-01.md`, `2026-09-30.md`, `Z.md` | order: `2026-09-30.md`, `2026-10-01.md`, `Z.md` |
| TC-04 | D29.2 | tests/unit/ingest-parsing.test.ts | [D29.2] folder with no .md returns empty notes list, no throw | unit | temp folder with `x.txt` only | notes = []; ignored = 1 |
| TC-05 | D21.1, D11.1 | tests/unit/ingest-parsing.test.ts | [D21.1] reads YAML front matter date and attendees | unit | `yaml-basic.md` | meetingDate and attendees as in fixture; no skip |
| TC-06 | D21.1 | tests/unit/ingest-parsing.test.ts | [D21.1] reads labelled lines, keys case-insensitive | unit | `labelled-basic.md`; plus inline `DATE: 2026-09-09` / `attendees: A B` variant | same result for any key case |
| TC-07 | D21.2 | tests/unit/ingest-parsing.test.ts | [D21.2] `9 September 2026` gives 2026-09-09 | unit | `Date: 9 September 2026` | meetingDate = `2026-09-09` |
| TC-08 | D21.2, D63.3 | tests/unit/ingest-parsing.test.ts | [D21.2] `Monday, 14 September 2026` gives 2026-09-14 | unit | `Date: Monday, 14 September 2026` | meetingDate = `2026-09-14` |
| TC-09 | D21.2 | tests/unit/ingest-parsing.test.ts | [D21.2] `YYYY-MM-DD` value accepted | unit | `Date: 2026-09-14` | meetingDate = `2026-09-14` |
| TC-10 | D63.3 | tests/unit/ingest-parsing.test.ts | [D63.3] weekday word ignored even when it does not match the date | unit | `Date: Tuesday, 14 September 2026` | meetingDate = `2026-09-14`; no skip |
| TC-11 | D11.2 | tests/unit/ingest-parsing.test.ts | [D11.2] attendee with and without `<email>` | unit | `Attendees: Anita Rao <anita@example.com>, Rahul Mehta` | two attendees: `{name:"Anita Rao", email:"anita@example.com"}`, `{name:"Rahul Mehta"}` (no email key) |
| TC-12 | D11.3 | tests/unit/ingest-parsing.test.ts | [D11.3] missing attendees key gives empty list, note not skipped | unit | header with `Date:` only | attendees = []; ok result |
| TC-13 | D63.2 | tests/unit/ingest-parsing.test.ts | [D63.2] labelled attendees split on commas | unit | `Attendees: Anita Rao, Rahul Mehta, Priya Nair` | three names in order |
| TC-14 | D63.2 | tests/unit/ingest-parsing.test.ts | [D63.2] YAML `[a, b]` and `- a` list forms both read | unit | two YAML headers: flow list and block list | same two attendees for both |
| TC-15 | D63.1, D57.1 | tests/unit/ingest-parsing.test.ts | [D63.1] a Date line after the first `## ` heading is not read | unit | file `2026-09-01-x.md`: `## Notes` then `Date: 2026-12-25` | meetingDate = `2026-09-01` (filename fallback); the body date is ignored |
| TC-16 | D57.1 | tests/unit/edge-cases.test.ts | [D57.1] no date key: leading real date in filename is used | unit | `2026-09-23-standup.md` with no Date line | meetingDate = `2026-09-23`; ok |
| TC-17 | D57.1, D5.1 | tests/unit/edge-cases.test.ts | [D57.1] `untitled.md` with no date is skipped as `missing date` | unit | `untitled.md` (no date, no leading date) | skip {file:"untitled.md", reason:"missing date"}; no throw |
| TC-18 | D57.1 | tests/unit/edge-cases.test.ts | [D57.1] date not at the start of the filename is not used | unit | `notes-2026-09-01.md`, no Date line | skip reason `missing date` |
| TC-19 | D22.1, D22.2 | tests/unit/edge-cases.test.ts | [D22.1] present but unparseable date skipped with no filename fallback | unit | `2026-10-03-sales-pipeline.md` (`Date: sometime last week`) | skip reason `unparseable date`; filename date not used |
| TC-20 | D5.1 | tests/unit/edge-cases.test.ts | [D5.1] empty file skipped as `empty file`, never thrown | unit | `2026-09-09-notes-final-v2.md` (or temp empty file) | skip reason `empty file`; ok:false |
| TC-21 | D64.1 | tests/unit/edge-cases.test.ts | [D64.1] whitespace-only file skipped as `empty file` | unit | temp file: spaces, tabs, CRLF only | skip reason `empty file` |
| TC-22 | D55.3, D5.1 | tests/unit/edge-cases.test.ts | [D55.3] non-UTF-8 bytes skipped as `not valid UTF-8`, never thrown | unit | `scratch.md` (or temp file with bytes `0xFF 0xFE 0x80`) | skip reason `not valid UTF-8`; no throw |
| TC-23 | D22.3 | tests/unit/edge-cases.test.ts | [D22.3] UTF-8 check runs before header check | unit | temp file: `Date: 2026-09-09 \xFF` | skip reason `not valid UTF-8` (not `unparseable date`) |
| TC-24 | D55.1 | tests/unit/edge-cases.test.ts | [D55.1] UTF-8 BOM is stripped and is not a failure | unit | temp file: BOM + `labelled-basic.md` content | ok result, same as without BOM |
| TC-25 | D55.2 | tests/unit/edge-cases.test.ts | [D55.2] CRLF gives the same note and items as LF | unit | `labelled-basic.md` as LF, and the same text as CRLF (temp) | identical meetingDate, attendees, items, line numbers |
| TC-26 | NFR-R1 | tests/unit/edge-cases.test.ts | [NFR-R1] readNote never throws for a missing path or a directory path | unit | path that does not exist; path that is a directory | ok:false with a SkipReport; no exception |
| TC-27 | NFR-R2, NFR-R1 | tests/unit/edge-cases.test.ts | [NFR-R2] every skip has file and a fixed reason, over generated inputs | property | 200 seeded random byte buffers written to temp files | each result ok:true, or ok:false with file set and reason in the five strings; no throw |
| TC-28 | D65.1 | tests/unit/edge-cases.test.ts | [D65.1] skip reasons are exactly the five fixed strings | unit | constant from `note.ts` and extractItems skip output | set equals `{empty file, not valid UTF-8, missing date, unparseable date, empty action item}` |
| TC-29 | NFR-R5 | tests/unit/edge-cases.test.ts | [NFR-R5] 1 MB single-line note is read without error | unit | temp file: one 1 MB line with a checkbox at the end | ok; item found; no throw |
| TC-30 | NFR-SEC4 | tests/unit/edge-cases.test.ts | [NFR-SEC4] shell text in the date value is an unparseable date, not run | unit | `Date: 2026-09-09; rm -rf .` with a spy on `child_process` and `fs` writes | skip reason `unparseable date`; spies called 0 times |
| TC-31 | D26.1, FR-I4 | tests/unit/ingest-parsing.test.ts | [D26.1] `-`, `*`, `+` bullets with `[ ]`, `[x]`, `[X]` give items in order | unit | body with one line per bullet and mark | items in source order; count matches |
| TC-32 | D12.3 | tests/unit/ingest-parsing.test.ts | [D12.3] `[x]` and `[X]` are done, `[ ]` is not | unit | `- [x] a`, `- [X] b`, `- [ ] c` | done = true, true, false |
| TC-33 | D26.1 | tests/unit/ingest-parsing.test.ts | [D26.1] nested items at 2 spaces, 4 spaces and a tab are items | unit | three nested checkbox lines | three items |
| TC-34 | D12.1 | tests/unit/ingest-parsing.test.ts | [D12.1] checkbox under a `##` heading in the body is an item | unit | `## Actions` then `- [ ] Send deck` | one item, text `Send deck` |
| TC-35 | D26.2 | tests/unit/ingest-parsing.test.ts | [D26.2] table row containing `[ ]` is not an item, counted | unit | `\| Anita \| [ ] brand kit \|` | 0 items; ignored has one `table row` entry |
| TC-36 | D26.2 | tests/unit/ingest-parsing.test.ts | [D26.2] `ACTION:` line is not an item, counted | unit | `ACTION: Karan to circulate summary tomorrow` | 0 items; ignored has one `ACTION line` entry |
| TC-37 | D27.1, D27.2 | tests/unit/ingest-parsing.test.ts | [D27.1] checkbox inside a block quote is not an item, counted | unit | `> - [ ] Quoted task` (`2026-09-21-incident-review.md`) | 0 items from that line; ignored has `block quote` |
| TC-38 | D27.1, D27.2 | tests/unit/ingest-parsing.test.ts | [D27.1] checkbox inside a backtick fence is not an item, counted | unit | fence ```` ``` ```` around `- [ ] in code` | 0 items; ignored has `code fence` |
| TC-39 | Q-05 | tests/unit/ingest-parsing.test.ts | [Q-05] checkbox inside a `~~~` fence is not an item | unit | fence `~~~` around `- [ ] in code` | 0 items; ignored has `code fence` |
| TC-40 | Q-05 | tests/unit/ingest-parsing.test.ts | [Q-05] unclosed fence runs to end of file, later checkboxes ignored | unit | fence opened, `- [ ] a` and `- [ ] b` after it, no closing fence | 0 items; no throw |
| TC-41 | D64.2 | tests/unit/ingest-parsing.test.ts | [D64.2] single-line HTML comment with a checkbox is ignored, counted | unit | `<!-- - [ ] hidden -->` (`2026-10-09-security-review.md`) | 0 items; ignored has `HTML comment` |
| TC-42 | D64.2 | tests/unit/ingest-parsing.test.ts | [D64.2] multi-line HTML comment ignored from `<!--` to `-->` | unit | three lines: `<!--`, `- [ ] hidden`, `-->` | 0 items; ignored has the checkbox line |
| TC-43 | D64.3 | tests/unit/ingest-parsing.test.ts | [D64.3] checkbox in an indented (4 space) block is an item | unit | `    - [ ] indented task` | one item |
| TC-44 | D37.1 | tests/unit/ingest-parsing.test.ts | [D37.1] numbered checkbox `1. [ ]` is not an item, counted | unit | `1. [ ] numbered task` | 0 items; ignored has `numbered checkbox` |
| TC-45 | D50.1 | tests/unit/edge-cases.test.ts | [D50.1] `- [ ]` with no text skipped at file:line, rest of note kept | unit | body: `- [ ] Real task`, `- [ ]`, `- [x] Done task` | skip {file, line of empty box, reason `empty action item`}; 2 items returned |
| TC-46 | D50.2 | tests/unit/edge-cases.test.ts | [D50.2] checkbox with text and no owner pattern is kept | unit | `- [ ] Update the runbook` | one item, text `Update the runbook` |
| TC-47 | D50.1 | tests/unit/edge-cases.test.ts | [D50.1] checkbox followed only by spaces is `empty action item` | unit | `- [ ]   ` (trailing spaces) | skip with reason `empty action item`; no item |
| TC-48 | Q-08 | tests/unit/ingest-parsing.test.ts | [Q-08] line numbers are absolute file lines, header counted, CRLF once | unit | `labelled-basic.md` with checkbox on file line 9 (after header) | item line = 9 (not body-relative) |
| TC-49 | NFR-SEC4 | tests/unit/edge-cases.test.ts | [NFR-SEC4] hostile item text returned verbatim, nothing executed | unit | `- [ ] $(rm -rf ~) \`whoami\` <script>x</script> ; DROP TABLE items` | one item; text equals input; spies on `child_process` and `fs` writes: 0 calls |
| TC-50 | NFR-A1 | tests/acceptance/sample-notes.test.ts | [NFR-A1] parse stage over the sample folder completes without throw | acceptance | `notes/` (35 `.md`, 1 `.txt`) | completes; no uncaught error |
| TC-51 | NFR-A2 | tests/acceptance/sample-notes.test.ts | [NFR-A2] 4 notes skipped with exact reasons, 31 read | acceptance | `notes/` | skipped: `2026-09-09-notes-final-v2.md` `empty file`; `scratch.md` `not valid UTF-8`; `untitled.md` `missing date`; `2026-10-03-sales-pipeline.md` `unparseable date`; 31 ok; 35 `.md` seen |
| TC-52 | NFR-A3 | tests/acceptance/sample-notes.test.ts | [NFR-A3] `.txt` note counted as ignored, not parsed | acceptance | `notes/2026-09-19-offsite-draft.txt` | not in notes; ignored count includes it |
| TC-53 | NFR-A4 | tests/acceptance/sample-notes.test.ts | [NFR-A4] trap lines not ingested in the four trap files | acceptance | `2026-09-21-incident-review.md`, `2026-10-09-security-review.md`, `2026-09-30-q4-offsite.md` | no item text equals the quote line, fence line, comment line, table row or `ACTION:` text |
| TC-54 | NFR-A4 | tests/acceptance/sample-notes.test.ts | [NFR-A4] trap-line counts by kind are recorded and match | acceptance | same three files | each kind (`block quote`, `code fence`, `HTML comment`, `table row`, `ACTION line`) present at least once; exact counts from the first run are written into this row (see task T42) |
| TC-55 | D21.1 | tests/acceptance/sample-notes.test.ts | [D21.1] sample YAML notes are read with attendees | acceptance | `2026-09-16-standup.md`, `2026-09-30-standup.md` | both ok; attendees non-empty; meetingDate ISO |
| TC-56 | D55.2 | tests/acceptance/sample-notes.test.ts | [D55.2] sample CRLF note gives item line numbers on the LF line count | acceptance | `2026-10-02-finance-sync.md` | ok; item lines match the 1-based line numbers of the same text with LF |
| TC-57 | D21.2 | tests/acceptance/sample-notes.test.ts | [D21.2] every read sample note has an ISO meetingDate | acceptance | all 31 read notes | each meetingDate matches `^\d{4}-\d{2}-\d{2}$` and is a real date |
| TC-58 | Q-01 | tests/unit/edge-cases.test.ts | [Q-01] blank `Date:` value counts as no date | unit | `2026-09-01-x.md` with `Date:` (blank) | meetingDate = `2026-09-01` (fallback); `untitled.md` with blank Date gives `missing date` |
| TC-59 | Q-02 | tests/unit/edge-cases.test.ts | [Q-02] unreadable file skipped with reason `unreadable file` | unit | temp file with read permission removed (POSIX); on Windows, mock `fs.readFile` to reject with EACCES | ok:false; reason `unreadable file`; no throw |
| TC-60 | Q-03 | tests/unit/ingest-parsing.test.ts | [Q-03] `.MD` and `.x.md` are notes; a directory named `y.md` is not | unit | temp folder: `A.MD`, `.x.md`, dir `y.md/` | notes = [`.x.md`, `A.MD`] in name order; directory counted as ignored |
| TC-61 | Q-04 | tests/unit/ingest-parsing.test.ts | [Q-04] inside a fence only checkbox-looking lines are counted as ignored | unit | fence with `plain text`, `- [ ] a`, `| cell |` lines | ignored count = 1 (the checkbox line only) |
| TC-62 | Q-06 | tests/unit/edge-cases.test.ts | [Q-06] date with a time component is `unparseable date` | unit | `Date: 2026-09-09 10:30` | skip reason `unparseable date` |
| TC-63 | Q-07 | tests/unit/edge-cases.test.ts | [Q-07] a skipped note returns no Note body and no items | unit | `2026-10-03-sales-pipeline.md` | readNote ok:false; result has no `body` or items field |
| TC-64 | Q-09 | tests/unit/ingest-parsing.test.ts | [Q-09] blank attendee entries from `a,,b` and trailing commas are dropped | unit | `Attendees: Anita Rao,, Rahul Mehta,` and `Attendees: <x@y.z>` | attendees = Anita Rao, Rahul Mehta; email-only entry dropped |
| TC-65 | Q-10 | tests/unit/edge-cases.test.ts | [Q-10] impossible leading date in filename is `missing date` | unit | `2026-13-01-x.md`, no Date line | skip reason `missing date` |
| TC-66 | Q-11 | tests/unit/ingest-parsing.test.ts | [Q-11] month names are case-insensitive; ordinals and abbreviations are unparseable | unit | `9 SEPTEMBER 2026` (ok); `9th September 2026` and `9 Sep 2026` (skip) | first gives 2026-09-09; the other two give `unparseable date` |
| TC-67 | Q-12 | tests/unit/ingest-parsing.test.ts | [Q-12] when YAML and labelled headers both exist, YAML wins | unit | YAML `date: 2026-09-09` plus body lead `Date: 2026-09-10` (no `##` in between) | meetingDate = `2026-09-09` |
| TC-68 | Q-13 | tests/unit/edge-cases.test.ts | [Q-13] unclosed YAML front matter is not a YAML block | unit | `---` line, `date: 2026-09-09`, no closing `---`, then `Date: 2026-09-10` | labelled line is read: meetingDate = `2026-09-10` |
| TC-69 | Q-14 | tests/unit/edge-cases.test.ts | [Q-14] lone CR is content, no crash, no split | unit | temp file: `Date: 2026-09-09\r- [ ] task` (CR only) | ok; no throw; 0 items (one line, not a checkbox at line start) |
| TC-70 | Q-15 | tests/unit/ingest-parsing.test.ts | [Q-15] `-[ ]` is not an item; `- [ ]text` is an item with text `text` | unit | `-[ ] no space`, `- [ ]text` | 1 item, text `text`; first line not an item |
| TC-71 | Q-16 | tests/unit/ingest-parsing.test.ts | [Q-16] with two `Date:` lines in the lead, the first wins | unit | `Date: 2026-09-09` then `Date: 2026-09-10` | meetingDate = `2026-09-09` |
| TC-72 | Q-17 | tests/unit/edge-cases.test.ts | [Q-17] BOM-only file is `empty file` | unit | temp file: bytes `EF BB BF` | skip reason `empty file` |
| TC-73 | Q-18 | tests/unit/ingest-parsing.test.ts | [Q-18] missing folder throws a typed ActiontrackError | unit | path that does not exist | throws `ActiontrackError` subclass (not a plain Error); spec 06 maps to exit 2 |

Negative cases (malformed input never throws): TC-17, TC-19, TC-20, TC-21, TC-22, TC-23, TC-26, TC-27, TC-29, TC-45, TC-59, TC-69.

## Fixtures needed

Existing (verified present, do not edit; README in `tests/fixtures/notes/` lists them):
- `tests/fixtures/notes/labelled-basic.md`: used by TC-06, TC-24, TC-25, TC-48.
- `tests/fixtures/notes/yaml-basic.md`: used by TC-05.
- `tests/fixtures/notes/traps.md`: used by TC-35 to TC-38 and TC-41 to TC-44 (if the test uses it; otherwise inline).
- `tests/fixtures/notes/bad-date.md`: used by TC-19.

New checked-in fixtures to create under `tests/fixtures/notes/` (tiny, synthetic, no real names):
- `header-labelled.md`: `9 September 2026` and `Monday, 14 September 2026` forms, a Tuesday mismatch, comma attendees with and without `<email>`, blank attendee slots (TC-07 to TC-13, TC-64).
- `header-yaml-list.md`: YAML front matter with `attendees: [a, b]` (TC-05, TC-14). A second YAML file with a `- a` block list is needed for TC-14; create `header-yaml-block.md` for it.
- `items-forms.md`: `-`, `*`, `+` bullets, `[ ]` `[x]` `[X]`, nested at 2 and 4 spaces and a tab, a checkbox under `##`, `[ ]`-only empty box, `-[ ]` and `- [ ]text` (TC-31 to TC-34, TC-43, TC-45 to TC-47, TC-70).
- `ignored-contexts.md`: block quote, table row, `ACTION:`, numbered checkbox, backtick fence, `~~~` fence, single-line and multi-line HTML comment (TC-35 to TC-42, TC-44, TC-61).
- `header-after-heading.md`: `## Notes` then `Date:` (TC-15).

Generated inside tests (temp dir, per the README rule that editors may rewrite special bytes):
- empty file, whitespace-only file, BOM-only file, BOM + note, CRLF copy of a note, non-UTF-8 bytes, `Date: 2026-09-09 \xFF`, 1 MB single line, lone-CR file, unclosed YAML, two `Date:` lines, random byte buffers (TC-21, TC-22, TC-23, TC-24, TC-25, TC-27, TC-29, TC-58, TC-68, TC-69, TC-71, TC-72), unreadable file (TC-59), directory named `y.md`, `.MD`, `.x.md` (TC-60), `2026-13-01-x.md` (TC-65), `9 SEPTEMBER` variants (TC-66), hostile date value (TC-30), hostile item text (TC-49).

Sample folder (read-only, `notes/` at repo root): used by TC-50 to TC-57. Do not copy or modify these files.
