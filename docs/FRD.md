# Functional Requirements Document (FRD): actiontrack

| Field | Value |
|---|---|
| Document | FRD-actiontrack |
| Version | 0.1 (Draft for review) |
| Date | 2026-11-24 |
| Audience | Evaluators / reviewers |
| Parent | BRD.md |
| Companion | NFRD.md |
| Technology | Not specified. The requirements are technology-agnostic, except for the Gmail MCP connector named in the scenario. |
| Decisions | v0.5 holds 42 stakeholder decisions (D1 to D42) in section 11. D21 to D35 were made after inspecting the sample `notes/` folder. D36 to D42 close the remaining functional gaps. Where section 11 conflicts with an earlier requirement or an open question, **section 11 wins**, and a later decision wins over an earlier one. |

**Conventions.**
- "Shall" = a requirement taken from the scenario or directly implied by it.
- **[OQ-xx]** marks a behaviour the scenario does not define. The requirement states only what is known, and the unknown is listed in section 9. No behaviour has been invented.
- **Source** states where the requirement comes from: *Scenario* (stated), *Derived* (necessary consequence of a stated item), or *Edge case* (E1 to E4 in the BRD).
- The scenario text is truncated in places, notably the description of the note format, the `list` command and `followup`. Requirements there are limited to what is legible.

---

## 1. System overview

`actiontrack` is a CLI with four commands that operate on a persistent store of action items.

```
 notes folder (*.md)                                    Gmail (via MCP)
        |                                                    ^
        v                                                    | create draft only
  [ ingest ] --> action item store <-- [ done ] <-- user     |
                       |   ^                                 |
                       v   |                                 |
                    [ list ] [ followup ] -------------------+
```

## 2. Data definitions

### 2.1 Meeting note (input)

Per the scenario, each note is a `.md` file containing:
- a **date**
- **attendees**
- **free-form text** (the text is cut off in the source)
- action items written as checklist lines, for example `- [ ] Priya to send the revised quote by Friday`

The exact layout is **not defined** (OQ-01 to OQ-06).

### 2.2 Action item (stored)

| Field | Description | Source |
|---|---|---|
| id | Identifier used by `done <id>`. Format and stability are undefined (OQ-07, OQ-08). | Scenario (implied by `done <id>`) |
| owner | Person responsible. May be absent (E2). | Scenario |
| task | Description of the work | Scenario |
| due date | A real calendar date resolved from the note's wording. May be absent (E2). | Scenario |
| source file | The note the item came from | Scenario |
| status | open, done or overdue (see FR-L5 and OQ-16) | Scenario |

Open: whether a "source" can hold several files for a duplicate item (OQ-22), and whether meeting date and line number are also stored (OQ-09).

---

## 3. Command: `actiontrack ingest <folder>`

**Purpose.** Parse every `.md` meeting note in `<folder>` and store the action items found.

| ID | Requirement | Source |
|---|---|---|
| FR-I1 | The command shall accept a folder path as its argument. | Scenario |
| FR-I2 | The command shall parse every `.md` file in the folder. | Scenario |
| FR-I3 | Files that are not `.md` shall not be parsed as notes. Whether they are reported is open. [OQ-10] | Derived |
| FR-I4 | The command shall recognise action items written as checklist lines of the form `- [ ] <text>`. Recognition of other forms, such as `- [x]`, `* [ ]`, indented or nested items, and numbered lists, is open. [OQ-04, OQ-05] | Scenario |
| FR-I5 | For each action item the command shall extract and store owner, task, due date, source file and status. | Scenario |
| FR-I6 | The command shall resolve due-date wording in the note (for example "by Friday") to a real calendar date. The reference date and the rules are open. [OQ-13 to OQ-19] | Scenario |
| FR-I7 | The command shall extract the meeting date and attendees from each note. Where and how they appear is open. [OQ-01, OQ-02] | Scenario |
| FR-I8 | A note that is malformed shall be skipped. It shall not stop processing of other notes and shall not crash the tool. | Scenario / E4 |
| FR-I9 | The command shall report every skipped note, naming the file. The reason and format of the report are open. [OQ-30, OQ-31] | Scenario / E4 |
| FR-I10 | The command shall handle duplicate items repeated across several meetings. The matching rule and the resulting behaviour are open. [OQ-20 to OQ-25] | Scenario / E1 |
| FR-I11 | The command shall capture items with no owner and/or no due date. It shall not drop them. Their stored representation is open. [OQ-11, OQ-12] | Scenario / E2 |
| FR-I12 | The command shall distinguish two people with the same first name. The resolution method is open. [OQ-26 to OQ-29] | Scenario / E3 |
| FR-I13 | The command shall give the user a summary on completion. The contents are open. [OQ-32] | Derived |
| FR-I14 | Behaviour when the folder does not exist or is empty is open. [OQ-33] | Derived |
| FR-I15 | Behaviour when `ingest` is run again on a folder that was already ingested is open (idempotency, updates, status preservation). [OQ-24, OQ-25] | Derived |

**Acceptance criteria (verifiable now).**
- AC-I1: Given a folder with N valid notes and M malformed notes, the command finishes without crashing and the M malformed files are reported by name.
- AC-I2: Every checklist action item in the N valid notes appears in the store with a source file and a status. (The exact meaning of "every" depends on OQ-04 and OQ-05.)
- AC-I3: No stored due date is free text. Each is a calendar date, or is absent.

---

## 4. Command: `actiontrack list`

**Purpose.** Show stored action items.

The scenario text for this command is truncated after "Overdu...". Only the filters below are legible.

| ID | Requirement | Source |
|---|---|---|
| FR-L1 | `list` with no filters shall show items. Whether done items are included by default is open. [OQ-34] | Scenario |
| FR-L2 | `--owner <name>` shall show only items for that owner. Matching rules (case, partial, full name) are open. [OQ-26, OQ-35] | Scenario |
| FR-L3 | `--status open\|done\|overdue` shall show only items in that status. | Scenario |
| FR-L4 | `--due-before <date>` shall show only items due before the given date. Date input format, inclusivity and treatment of items with no due date are open. [OQ-36] | Scenario |
| FR-L5 | An item shall be shown as overdue under the "Overdu..." rule in the scenario. The definition is **cut off** in the source. Whether overdue is stored or computed is open. [OQ-16, OQ-17] | Scenario |
| FR-L6 | Each listed item shall display at least id, owner, task, due date, status and source file. Layout is open. [OQ-37] | Derived |
| FR-L7 | Filters may be combined. The combination logic (AND) is the usual reading but is not stated. [OQ-38] | Derived |
| FR-L8 | Behaviour when no items match is open. [OQ-39] | Derived |
| FR-L9 | The sort order of results is open. [OQ-37] | Derived |

**Acceptance criteria.**
- AC-L1: `list --status overdue` returns only items that meet the overdue definition once OQ-16 is answered.
- AC-L2: `list --owner X --status open` returns only items matching both.
- AC-L3: `list --due-before D` returns no item due on or after D (inclusivity pending OQ-36).

---

## 5. Command: `actiontrack done <id>`

**Purpose.** Mark an item as done.

| ID | Requirement | Source |
|---|---|---|
| FR-D1 | The command shall take an item id and set that item's status to done. | Scenario |
| FR-D2 | A done item shall no longer appear as open or overdue. | Derived |
| FR-D3 | The change shall persist across runs of the tool. Storage location is open. [OQ-44] | Derived |
| FR-D4 | Behaviour for an unknown id, or an item already done, is open. [OQ-40] | Derived |
| FR-D5 | Whether `done` also writes back to the source markdown file (checking the box) is open. [OQ-41] | Derived |
| FR-D6 | Whether a later `ingest` can reopen a done item is open. [OQ-25] | Derived |

**Acceptance criteria.**
- AC-D1: After `done <id>`, `list --status done` includes the item and `list --status open` and `--status overdue` exclude it.

---

## 6. Command: `actiontrack followup <owner>`

**Purpose.** Draft a follow-up email for an owner covering their open and overdue items, and create a Gmail draft through the Gmail MCP connector. **It never sends.**

The scenario text for this command is truncated. It reads "followup <owner ... per owner covering their open ... and overdue items, and creates a Gmail draft through the Gmail MCP connector. It never sends." Whether the argument is a single owner, `--all`, or optional is therefore open. [OQ-45]

| ID | Requirement | Source |
|---|---|---|
| FR-F1 | The command shall create one follow-up email per owner. | Scenario |
| FR-F2 | The email shall cover that owner's open items and overdue items. | Scenario |
| FR-F3 | Done items shall be excluded. | Derived (open and overdue only) |
| FR-F4 | The email shall be created as a Gmail **draft** using the Gmail MCP connector. | Scenario |
| FR-F5 | The tool shall **never send** an email, under any option, flag, error path or retry. | Scenario (hard rule) |
| FR-F6 | The draft's recipient address shall come from an owner-to-email source that is not defined. [OQ-46] | Derived |
| FR-F7 | Draft subject, body template, tone, sign-off and per-item detail are open. [OQ-47] | Derived |
| FR-F8 | Behaviour when the owner has no open or overdue items is open. [OQ-48] | Derived |
| FR-F9 | Behaviour for items with no owner (no one to email) is open. [OQ-12] | Edge case E2 |
| FR-F10 | Behaviour when the name given matches several people (same first name) shall not silently pick one. The disambiguation method is open. [OQ-26 to OQ-29] | Edge case E3 |
| FR-F11 | Behaviour when the Gmail connector is unavailable or unauthorised shall not crash the tool or send anything. Messaging is open. [OQ-49] | Derived |
| FR-F12 | Behaviour when `followup` is run twice for the same owner (duplicate drafts) is open. [OQ-50] | Derived |
| FR-F13 | The command shall report what it did, for example the draft id or link. The format is open. [OQ-51] | Derived |

**Acceptance criteria.**
- AC-F1: Running `followup` results in a draft in Gmail and no sent message.
- AC-F2: The draft lists every open and overdue item for that owner and no done item.
- AC-F3: No code path in the tool can call a send operation. This is checkable by inspection and by test.

---

## 7. Cross-cutting edge-case requirements

| ID | Edge case | Requirement | Open points |
|---|---|---|---|
| FR-E1 | Duplicates across meetings | The same action item mentioned in more than one meeting shall not appear as multiple independent items in `list` or in a follow-up draft. | What counts as the same item (OQ-20, OQ-21); which meeting's data wins (OQ-23); how all source files are kept (OQ-22); how status carries over (OQ-24) |
| FR-E2 | No owner / no date | These items shall be captured, listed and clearly identifiable as missing owner and/or date. | Display (OQ-11); overdue status when no date (OQ-17); inclusion in follow-up (OQ-12) |
| FR-E3 | Same first name | Two different people with the same first name shall be kept as separate owners. | How identity is determined (OQ-26, OQ-27); what the user types (OQ-28); what is shown (OQ-29) |
| FR-E4 | Malformed notes | A malformed note shall be skipped and reported. The tool shall not crash. | What "malformed" means (OQ-30); report format (OQ-31) |

## 8. Requirements traceability matrix

| Business req | Functional reqs | Acceptance criteria |
|---|---|---|
| BR-01 | FR-I1, FR-I2, FR-I3, FR-I4 | AC-I1, AC-I2 |
| BR-02 | FR-I5, FR-I6, FR-I7, FR-L6 | AC-I2, AC-I3 |
| BR-03 | FR-L1 to FR-L4, FR-L6 to FR-L9 | AC-L2, AC-L3 |
| BR-04 | FR-L3, FR-L5 | AC-L1 |
| BR-05 | FR-D1 to FR-D6 | AC-D1 |
| BR-06 | FR-F1, FR-F2, FR-F3 | AC-F2 |
| BR-07 | FR-F4, FR-F5 | AC-F1, AC-F3 |
| BR-08 | FR-I10, FR-E1 | pending OQ-20 to OQ-25 |
| BR-09 | FR-I11, FR-E2, FR-F9 | pending OQ-11, OQ-12 |
| BR-10 | FR-I12, FR-F10, FR-E3 | pending OQ-26 to OQ-29 |
| BR-11 | FR-I8, FR-I9, FR-E4 | AC-I1 |

## 9. Open questions (functional)

All must be answered before the FRD can be baselined. None has been assumed.

### Note format and parsing
| ID | Question |
|---|---|
| OQ-01 | Where is the meeting date in a note (front matter, heading, filename, a labelled line), and in what format(s)? |
| OQ-02 | Where are attendees listed and how are they delimited? Do they carry full names, emails, or first names only? |
| OQ-03 | The scenario's description of the free-form body is cut off. Is there a required section or heading for action items, or are checklist lines recognised anywhere in the note? |
| OQ-04 | Is `- [x]` (already checked in the note) treated as done on ingest? Are other bullet or checkbox styles in scope (`*`, `+`, numbered, nested, uppercase `[X]`)? |
| OQ-05 | Are checklist lines inside code blocks, quotes or tables ignored? |
| OQ-06 | How is an owner identified in the line? Only the "<Name> to <task>" pattern, or also "@name", "Owner: name", "name:", "(Name)", multiple owners, "we", "team"? |
| OQ-07 | What is the id format (sequential number, hash, source-based)? |
| OQ-08 | Must ids stay stable across re-ingests? |
| OQ-09 | Besides source file, should meeting date and line number be stored? |
| OQ-10 | Are non-`.md` files and subfolders ignored silently, reported, or recursed into? |
| OQ-11 | How are missing owner and missing date displayed in `list`? |
| OQ-12 | Should items with no owner appear in any follow-up, and who receives it? |

### Date resolution
| ID | Question |
|---|---|
| OQ-13 | Which date is the reference for relative terms: the meeting date or the ingest date? |
| OQ-14 | Which wordings must be supported (weekday names, "tomorrow", "next week", "end of month", "EOD", "ASAP", "Q1", absolute dates in several formats)? |
| OQ-15 | When the item says "Friday" and the meeting is on a Friday, is that the same day or the next? Is "by Friday" the coming Friday after the meeting? |
| OQ-16 | What exactly defines **overdue**? (The scenario text is cut off.) Is it due date before today, and is the due date itself still on time? |
| OQ-17 | Can an item with no due date ever be overdue? |
| OQ-18 | Which "today" and timezone are used? Is there an override for testing? |
| OQ-19 | What happens when the due-date wording cannot be resolved (for example "soon")? Is the item stored without a date, flagged, or sent to the malformed report? |

### Duplicates
| ID | Question |
|---|---|
| OQ-20 | What makes two items "the same": exact text, normalised text, same owner plus similar task, fuzzy similarity? What threshold? |
| OQ-21 | Must the same owner be required for a match? Is the same task with different owners a duplicate? |
| OQ-22 | Are all meetings where the item appeared kept, or only one? |
| OQ-23 | If duplicates differ in due date or wording, which wins (earliest, latest, most recent meeting)? |
| OQ-24 | If one copy is checked off or `done` and a later note repeats it, is the item done or reopened? |
| OQ-25 | Is `ingest` idempotent? Does re-ingesting the same folder create no new items and keep statuses? |

### Same first name and owner identity
| ID | Question |
|---|---|
| OQ-26 | How is a person's identity determined (full name in attendees, email, context in the note)? |
| OQ-27 | When an item says only "Priya" and two Priyas attended, what should happen (pick by attendee, flag as ambiguous, store unresolved)? |
| OQ-28 | What does the user type for `--owner` and `followup <owner>` (first name, full name, email, id)? Is the match case-insensitive? |
| OQ-29 | How are two same-first-name owners shown in `list` and in drafts? |

### Malformed notes and reporting
| ID | Question |
|---|---|
| OQ-30 | What defines a malformed note (missing date, missing attendees, unreadable or non-UTF-8 file, empty, broken structure)? Is a note with one bad line skipped as a whole or only that line? |
| OQ-31 | In what form is the skip report given (console, file), with what detail (file, reason, line)? |
| OQ-32 | What does the ingest summary show (notes read, skipped, items added, duplicates merged, items missing owner or date)? |
| OQ-33 | What should happen when the folder is missing, empty or unreadable, and what exit code is used? |

### list, done and followup
| ID | Question |
|---|---|
| OQ-34 | Does `list` with no filter show all items or only open and overdue? |
| OQ-35 | Is `--owner` an exact or partial match? |
| OQ-36 | In which format is the `--due-before` date given? Is the date itself included? Are undated items included? |
| OQ-37 | What columns, sort order and output format does `list` use (table, JSON option)? |
| OQ-38 | Are combined filters ANDed? |
| OQ-39 | What message is shown when nothing matches? |
| OQ-40 | What happens on `done` with an unknown id or an already-done item? |
| OQ-41 | Does `done` also update the source `.md` file? |
| OQ-44 | Where is the item store kept and in what form? |
| OQ-45 | Is `followup` argument-driven only, or is there also an all-owners mode or an optional argument? (The scenario text is cut off.) |
| OQ-46 | Where does each owner's email address come from? |
| OQ-47 | What is the email template (subject, greeting, body layout, per-item fields, closing, signature)? |
| OQ-48 | What if the owner has nothing open or overdue: no draft and a message, or an empty draft? |
| OQ-49 | What is the expected behaviour and message if the Gmail MCP connector is missing, unauthenticated or erroring? |
| OQ-50 | Should a repeat `followup` replace, skip or duplicate an existing draft? |
| OQ-51 | What confirmation is shown after a draft is created? |

(The BRD's own OQ-40 to OQ-45 are separate questions and are now resolved. See the Revision note.)

## 11. Decisions confirmed by the requester (v0.2, 2026-11-24)

Each decision was chosen by the requester from the options offered. Details beyond what was chosen remain open and are listed under "Still open".

### D1. Overdue and "today"
| ID | Requirement |
|---|---|
| FR-D1.1 | An item is **overdue** if its status is open and its due date is **before today**. An item due today is still open. |
| FR-D1.2 | An item with no due date is **never** overdue. |
| FR-D1.3 | "Today" is the system's local date. A `--today <date>` override shall exist for repeatable testing. |
| Resolves | OQ-16, OQ-17, OQ-18 |
| Still open | The exact name and format of the override flag (it was offered as `--today`). Whether it applies to every command. |

### D2. Note format: YAML front matter
| ID | Requirement |
|---|---|
| FR-D2.1 | The meeting date and attendees are read from YAML front matter, using the keys `date:` and `attendees:`. |
| FR-D2.2 | If front matter has no date, the date in the filename is used as a fallback. |
| FR-D2.3 | A note with no date after the fallback is **malformed** and is skipped (see D5). |
| Resolves | OQ-01, OQ-02 (location and keys) |
| Still open | Accepted date formats. Attendee entry shape (full name, or full name with email, see D6). Whether a missing `attendees:` key is allowed. Filename date pattern. OQ-03 (action items anywhere in the body, or under a heading). |

### D3. Duplicates: same owner plus normalised task
| ID | Requirement |
|---|---|
| FR-D3.1 | Two items are duplicates if they have the same owner and the same **normalised task**. Normalised means lowercased and stripped of punctuation. |
| FR-D3.2 | Duplicates are merged into **one** item. |
| FR-D3.3 | The merged item keeps **all source files**. |
| FR-D3.4 | The merged item uses the **latest due date** among the duplicates. |
| FR-D3.5 | If any copy is done, the merged item **stays done**. |
| Resolves | OQ-20, OQ-21, OQ-22, OQ-23, OQ-24 |
| Still open | Whitespace handling beyond punctuation. How items with no owner are matched (same task text, owner empty). Whether the same task for different owners is kept as separate items (implied yes). OQ-25 (is `ingest` idempotent on re-run). The stored form of multiple source files, which affects the `list` display. |

### D4. Same first name: attendees list
| ID | Requirement |
|---|---|
| FR-D4.1 | A first name in an action item is resolved against the note's **attendees** (full names). |
| FR-D4.2 | If two attendees share that first name, the owner is stored as **ambiguous** and reported. |
| FR-D4.3 | Commands (`--owner`, `followup`) accept **full names**. |
| FR-D4.4 | A bare first name that matches several people shall give an **error that lists the choices**. It shall not pick one. |
| Resolves | OQ-26, OQ-27, OQ-28 |
| Still open | OQ-29 (display of same-first-name owners in `list` and drafts, assumed full name). Case sensitivity. How an ambiguous item appears in `list` and whether it enters any follow-up. What happens when the first name is not among the note's attendees. How to identify the same person across notes. |

### D5. Malformed notes
| ID | Requirement |
|---|---|
| FR-D5.1 | A whole note is **skipped and reported** if its date is missing or unparseable, the file is empty, or it is not valid UTF-8. |
| FR-D5.2 | In an otherwise valid note, an unparseable action line is **skipped and reported at line level**. The rest of the note is processed. |
| FR-D5.3 | The tool shall never crash on malformed input. |
| Resolves | OQ-30. It also narrows OQ-60 (encoding): UTF-8 is the supported encoding. |
| Still open | OQ-31 (report format and wording). Definition of an "unparseable action line". Exit code when notes are skipped (OQ-61). |

### D6. Owner email for drafts
| ID | Requirement |
|---|---|
| FR-D6.1 | The recipient is taken from an **email in the note's attendees list** if present. |
| FR-D6.2 | Otherwise it is taken from a **local owners mapping file**. |
| FR-D6.3 | If neither exists, the draft is created **with no recipient** and a warning is shown. |
| Resolves | OQ-46 |
| Still open | Mapping file name, location and format. Which wins when the attendee email and the mapping file disagree, or when two notes give different emails for one person. |

### D7. followup arguments
| ID | Requirement |
|---|---|
| FR-D7.1 | `followup <owner>` creates a draft for that one owner. |
| FR-D7.2 | `followup --all` creates one draft per owner who has open or overdue items. |
| FR-D7.3 | An owner with **nothing open or overdue gets no draft** and a message is shown. |
| FR-D7.4 | Neither form shall send email. FR-F5 still applies. |
| Resolves | OQ-45, OQ-48 |
| Still open | Whether `<owner>` and `--all` are mutually exclusive (assumed yes). Handling of items with no owner and ambiguous owners under `--all` (OQ-12). OQ-47 (email template), OQ-49, OQ-50, OQ-51. |

### D8. Date resolution
| ID | Requirement |
|---|---|
| FR-D8.1 | Relative due dates are resolved against the **meeting date**, not the ingest date. |
| FR-D8.2 | A weekday name resolves to the **next occurrence strictly after the meeting day**. "Friday" in a note dated on a Friday gives the following Friday. |
| FR-D8.3 | Supported wording: weekday names, `tomorrow`, `next week`, `EOD`, `EOM`, ISO dates and common absolute dates. |
| FR-D8.4 | Wording that cannot be resolved stores **no date** and **flags the item**. |
| Resolves | OQ-13, OQ-15, OQ-19. It partly resolves OQ-14. |
| Still open | The exact meaning of `next week` (Monday of next week? seven days later?), `EOD` (the meeting date?) and `EOM` (end of the meeting's month?). Which "common absolute" formats are accepted, including day-month order such as 03/04. How a flagged item shows in `list`. |

### D9. Relative date words (completes D8)
| ID | Requirement |
|---|---|
| FR-D9.1 | `next week` resolves to the **Monday of the following calendar week** after the meeting date. |
| FR-D9.2 | `EOD` resolves to the **meeting date**. |
| FR-D9.3 | `EOM` resolves to the **last day of the meeting date's month**. |
| Resolves | OQ-14 |
| Still open | Whether a plain `Monday` to `Sunday` that falls inside "next week" is handled by D8. Wording such as "end of week", "this week", "tomorrow morning" and "in 3 days" is not listed, so it falls under D8.4 (flagged, no date). |

### D10. Absolute date formats
| ID | Requirement |
|---|---|
| FR-D10.1 | Accepted absolute forms: `YYYY-MM-DD` and month-name forms (`4 Mar`, `Mar 4`, `4 March 2026`). |
| FR-D10.2 | If the year is missing, the **meeting's year** is used. |
| FR-D10.3 | Numeric slash dates such as `03/04` are **not guessed**. They are treated as unresolvable, so no date is stored and the item is flagged (D8.4). |
| Still open | A missing-year date that lands before the meeting date, such as "5 Jan" in a December meeting. The meeting's year makes it a past date. Whether it is rolled to the next year is undecided. |

### D11. Front matter shape (completes D2)
| ID | Requirement |
|---|---|
| FR-D11.1 | `date:` is an ISO date, `YYYY-MM-DD`. |
| FR-D11.2 | `attendees:` is a list of entries shaped `Full Name <email>`. The `<email>` part is **optional**. |
| FR-D11.3 | A missing `attendees:` key is **allowed**. First names cannot then be resolved, so the item's owner is stored as **unresolved**. |
| Resolves | OQ-02 (fully) |
| Still open | The filename date pattern for the D2.2 fallback. How "unresolved" is labelled in `list` (D16 defines labels only for no owner and ambiguous). Behaviour when an item names a full name that is not an attendee. |

### D12. Which lines are action items
| ID | Requirement |
|---|---|
| FR-D12.1 | Any `- [ ]` or `- [x]` line is an action item wherever it appears in the body, **including nested lines**. |
| FR-D12.2 | Lines inside **fenced code blocks** are ignored. |
| FR-D12.3 | `- [x]` items are ingested with status **done**. |
| Resolves | OQ-03, and OQ-04 and OQ-05 in part |
| Still open | Other bullet styles (`*`, `+`, numbered), uppercase `[X]`, and checklist lines in block quotes and tables. Whether an item that is both done and a duplicate follows D3.5 (assumed yes). |

### D13. Re-running ingest
| ID | Requirement |
|---|---|
| FR-D13.1 | `ingest` is **idempotent**. Running it again on the same folder adds no duplicates. |
| FR-D13.2 | Existing items keep their **id and done status**. |
| FR-D13.3 | New or changed lines are added or updated using the D3 duplicate rule. |
| Resolves | OQ-25 |
| Still open | What counts as a changed line. What happens to a stored item when its line is removed from the note (kept, or marked stale). |

### D14. Item ids
| ID | Requirement |
|---|---|
| FR-D14.1 | Ids are **short sequential numbers** (1, 2, 3, ...). |
| FR-D14.2 | An id **never changes and is never reused** after creation. |
| Resolves | OQ-07, OQ-08 |
| Still open | Ordering in which ids are assigned during a single ingest (for example by file name, then line order). |

### D15. `list` output
| ID | Requirement |
|---|---|
| FR-D15.1 | With no filters, `list` shows **open and overdue** items. |
| FR-D15.2 | Output is a **table** with columns: id, owner, task, due, status, source(s). |
| FR-D15.3 | Rows are sorted by **due date**, with undated items last. |
| FR-D15.4 | `--status done` shows done items. |
| FR-D15.5 | A `--json` flag gives machine-readable output. |
| Resolves | OQ-34, OQ-37, OQ-65 (JSON need) |
| Still open | OQ-35, OQ-36, OQ-38, OQ-39. The JSON field names. The tie-break order for equal due dates. Whether `--status open` also shows overdue items (it should not, if status is exclusive). Whether the table shows meeting date. |

### D16. Missing and ambiguous owners
| ID | Requirement |
|---|---|
| FR-D16.1 | `list` shows `(no owner)` and `(ambiguous)` as the owner for those items. |
| FR-D16.2 | They can be filtered with `--owner none`. |
| FR-D16.3 | `followup --all` **skips** them and prints a **count** of skipped items. |
| FR-D16.4 | The ingest summary lists them. |
| Resolves | OQ-11, OQ-12 |
| Still open | How `--owner none` is told apart from a person whose name is "None". How to select only ambiguous items. |

### D17. Item store
| ID | Requirement |
|---|---|
| FR-D17.1 | The store is a **single local, human-readable file** in the working directory, such as `.actiontrack/items`. |
| FR-D17.2 | The path is **overridable** by an option or an environment variable. |
| FR-D17.3 | The file technology is not fixed by this document. |
| Resolves | OQ-44 |
| Still open | The option and variable names. What happens when the command is run from a different directory. Concurrent runs. |

### D18. Owners mapping file (completes D6)
| ID | Requirement |
|---|---|
| FR-D18.1 | An **owners file** lives in the store directory and maps **full names to emails**. |
| FR-D18.2 | An **attendee email** in a note takes precedence over the file. |
| FR-D18.3 | If two different emails exist for one person, a **warning** is reported. |
| Still open | File name and syntax. Which email is used when two conflict (D18.2 settles only note against file). |

### D19. Follow-up email content and repeat runs
| ID | Requirement |
|---|---|
| FR-D19.1 | Subject: `Follow-up: your open action items (N)`. |
| FR-D19.2 | Greeting uses the owner's **first name**. |
| FR-D19.3 | Body has two lists, **Overdue** first then **Open**. Each entry shows task, due date, meeting date and source. |
| FR-D19.4 | A polite closing and **no signature**. |
| FR-D19.5 | A **repeat** `followup` for the same owner **warns and does not create a second draft** unless `--force` is given. |
| Resolves | OQ-47, OQ-50 |
| Still open | What N counts (assumed all items listed). How a "repeat" is detected, for example a record kept in the store. The meeting date shown for a merged item that has several meetings. What `--force` does if the earlier draft is still in Gmail. Exact wording. |

### D20. Failure handling and exit codes
| ID | Requirement |
|---|---|
| FR-D20.1 | Exit `0`: success. |
| FR-D20.2 | Exit `1`: completed **with warnings**, for example skipped notes or drafts with no recipient. |
| FR-D20.3 | Exit `2`: bad arguments or a missing folder. |
| FR-D20.4 | Exit `3`: Gmail connector failure. |
| FR-D20.5 | On a connector failure the tool prints a **clear error**, sends nothing, and stored data is **never affected**. |
| Resolves | OQ-49, OQ-61 (NFRD), and OQ-33 in part (missing folder) |
| Still open | Behaviour for an **empty** folder. Which code wins when several apply, such as warnings plus a Gmail failure. Behaviour in `--all` when one owner's draft fails and others succeed. |

### Decisions D21 to D35 (made after reviewing the sample `notes/` folder)

The sample folder holds **35 `.md` files and 1 `.txt` file**. D21 to D35 were chosen by the requester after the notes were inspected. Where they conflict with D1 to D20 they **amend** them, and the amendment is named.

#### D21. Header formats (amends D2.1, D11.1)
| ID | Requirement |
|---|---|
| FR-D21.1 | **Both** header forms are accepted: YAML front matter (`---` block with `date:` and `attendees: [a, b]`) and labelled lines (`Date: ...`, `Attendees: a, b`). Keys are case-insensitive. |
| FR-D21.2 | Date values accepted in the header: `YYYY-MM-DD`, `9 September 2026` and `Monday, 14 September 2026`. |
| FR-D21.3 | Attendee entries in the sample carry no emails. The optional `<email>` from D11.2 stays allowed. |
| Sample evidence | 30 notes use labelled lines. 2 notes use YAML (`2026-09-16-standup.md`, `2026-09-30-standup.md`). 3 `.md` files have no header (empty, binary, untitled). |
| Still open | Other date wordings in headers. A note that has both forms. Attendee separators other than a comma. |

#### D22. Unparseable header date (clarifies D2.2, D5.1)
| ID | Requirement |
|---|---|
| FR-D22.1 | A note whose `Date` value **cannot be parsed** is skipped and reported as malformed. The filename date is **not** used as a fallback in this case. |
| FR-D22.2 | The filename fallback (D2.2) applies **only when no date is present at all**. |
| FR-D22.3 | Emptiness and UTF-8 checks (D5.1) run first. |
| Sample evidence | `2026-10-03-sales-pipeline.md` has `Date: sometime last week`, so it is skipped. |
| Still open | The filename date pattern accepted by the fallback. |

#### D23. Roster fallback for owner names (refines D4.1, D11.3)
| ID | Requirement |
|---|---|
| FR-D23.1 | A **roster of full names** is built from the attendees of all ingested notes. |
| FR-D23.2 | When a note has **no attendees**, a first name that matches **exactly one** person on the roster resolves to that person. A first name that matches several stays **ambiguous**. |
| Sample evidence | `2026-09-23-standup.md` has no attendees. "Sam" resolves to Sam Okafor. "Rahul" stays ambiguous (Rahul Mehta, Rahul Verma). |
| Still open | Whether the roster is also used when a note has attendees but the first name is not among them. Whether skipped notes contribute names. |

#### D24. Owner name forms (extends D4, resolves most of OQ-06)
| ID | Requirement |
|---|---|
| FR-D24.1 | An initial such as `Priya N.` matches the attendee whose surname starts with that letter. |
| FR-D24.2 | `@anita:` counts as owner Anita. |
| FR-D24.3 | A joint owner such as `Anita & Rahul to ...` creates **one item per person**. Each person is resolved by the attendee rules. |
| FR-D24.4 | `Lena (with Priya) to ...` is owned by **Lena**. The collaborator stays in the task text. |
| Still open | An initial that matches no attendee. Joint forms using "and" or commas. Whether the split items from one line are linked for display. |

#### D25. Group and placeholder owners (extends D16)
| ID | Requirement |
|---|---|
| FR-D25.1 | `Everyone` and `Team` are stored with owner **`(group)`**. |
| FR-D25.2 | `Someone` and `TBD` are stored as **`(no owner)`**. |
| FR-D25.3 | Neither kind gets an individual follow-up. Both are listed in the ingest summary and counted by `followup --all`. |
| Sample evidence | `Everyone`: 2026-09-18 and the 2026-09-30 offsite. `Team`: 2026-10-01. `Someone`: 2026-09-10. `TBD`: 2026-09-18. |
| Still open | The `--owner` token for `(group)`. Other placeholder words such as `All`, `We`, `Everybody`. |

#### D26. What counts as an action item (amends D12)
| ID | Requirement |
|---|---|
| FR-D26.1 | Action items are **checkbox lines only**, with bullets `-`, `*` or `+` and marks `[ ]`, `[x]` or `[X]`. Nested lines count. |
| FR-D26.2 | **Table rows** and **`ACTION:` lines are not items.** They are counted in the ingest summary as ignored non-checkbox candidates. |
| Sample evidence | `2026-09-30-q4-offsite.md` has a table row (Anita, brand kit) and `ACTION: Karan to circulate the offsite summary tomorrow`. Both are ignored. `* [ ]`, `+ [ ]` and `[X]` appear in the offsite and finance notes. |
| Still open | Numbered-list checkboxes (`1. [ ]`). |

#### D27. Ignored contexts (resolves OQ-05)
| ID | Requirement |
|---|---|
| FR-D27.1 | Checkbox-looking lines inside **block quotes**, **fenced code blocks** and **HTML comments** are never items. |
| FR-D27.2 | They are reported as ignored lines in the ingest summary. |
| Sample evidence | Block quote in `2026-09-21-incident-review.md`. Code fence and HTML comment in `2026-10-09-security-review.md`. |
| Still open | Indented code blocks. HTML comments that span several lines. |

#### D28. Duplicate matching (amends D3.1)
| ID | Requirement |
|---|---|
| FR-D28.1 | Two items are duplicates if they have the same **resolved owner** and the same **normalised task**. |
| FR-D28.2 | Normalised task = lowercase, with the **`by ...` due phrase removed**, the articles **a, an, the** removed, punctuation removed, and spaces collapsed. |
| FR-D28.3 | Differences in other words keep items **separate**. |
| Sample evidence | Priya Nair's "send the revised quote to Acme" appears in 2026-09-01, 2026-09-08 ("Priya N." with "by Friday") and 2026-09-15 (done). They merge into one done item. "Share first wireframes" and "share updated wireframes" stay separate. |
| Still open | Whether other due phrases are removed (`from 9 Oct`, `on 2026-10-14`, `results due 15 October`). Which task wording is displayed for a merged item. Matching for `(no owner)` and `(group)` items. |

#### D29. Files ingested (resolves OQ-10)
| ID | Requirement |
|---|---|
| FR-D29.1 | Only **top-level `.md`** files are read. Other files and subfolders are ignored. |
| FR-D29.2 | The ingest summary reports how many files were ignored. This is not an error. |
| Sample evidence | `2026-09-19-offsite-draft.txt` is ignored. |

#### D30. Skip report and ingest summary (resolves OQ-31, OQ-32)
| ID | Requirement |
|---|---|
| FR-D30.1 | After ingest, print **Skipped notes** (file and reason) and **Skipped lines** (file:line and reason). |
| FR-D30.2 | Then print totals: notes read, notes skipped, items added, merged as duplicates, no-owner, ambiguous-owner, no-date or unresolved-date, and ignored lines. |
| FR-D30.3 | Warnings go to **stderr**. The exit code is **1** if anything was skipped (see D20). |
| Sample evidence | Expected note-level skips: empty `2026-09-09-notes-final-v2.md`, binary `scratch.md`, `untitled.md` (no date), `2026-10-03-sales-pipeline.md` (unparseable date). That leaves 31 notes read. |
| Still open | The reason wording. A saved report file or `--verbose` mode (neither was chosen). |

#### D31. `list` filters (resolves OQ-35, OQ-36, OQ-38, OQ-39)
| ID | Requirement |
|---|---|
| FR-D31.1 | `--due-before D` means **strictly before D**. D itself is excluded. |
| FR-D31.2 | Undated items are **excluded** from `--due-before`. |
| FR-D31.3 | `--owner` matches a **full name case-insensitively**, or a **first name that matches exactly one person**. A first name matching several people is an **error listing the choices** (D4.4). |
| FR-D31.4 | Filters combine with **AND**. |
| FR-D31.5 | No match prints `No items match.` and exits **0**. |
| FR-D31.6 | Date input accepts ISO and `Mar 4` forms (D10). |
| Still open | Which year a `Mar 4` filter value uses. |

#### D32. `done` edge cases (resolves OQ-40, OQ-41)
| ID | Requirement |
|---|---|
| FR-D32.1 | `done` updates **only the item store**. The source note is never edited. |
| FR-D32.2 | An **unknown id** is an error, exit **2**. |
| FR-D32.3 | An **already-done** item prints a message and exits **0**. |
| FR-D32.4 | A successful `done` shows the item's owner and task as confirmation. |

#### D33. More date wording (extends D8 to D10)
| ID | Requirement |
|---|---|
| FR-D33.1 | **Resolved to a date:** ordinals (`Oct 3rd`), weekday plus date (`Wed 16 Sep`, `Saturday 10 Oct`), `from 9 Oct`, `on 2026-10-14`. |
| FR-D33.2 | `next Tuesday` = the Tuesday of the **following week**. `end of month` = last day of the **meeting's month**. `end of next week` = the **Friday of the following week**. |
| FR-D33.3 | **Flagged, no date stored:** `mid-October`, `for November`, `sometime`. |
| FR-D33.4 | When a weekday and an explicit date **disagree**, the **explicit date wins** and a warning is shown. |
| Worked examples | `2026-09-03` is a Thursday, so `end of next week` = 2026-09-11. `2026-10-05` is a Monday, so `next Tuesday` = 2026-10-13. |
| Still open | `results due 15 October` (assumed to resolve as a concrete date, to be confirmed). `by tomorrow` with `EOD` as in `EOD tomorrow`. |

#### D34. Year rollover (amends D10.2)
| ID | Requirement |
|---|---|
| FR-D34.1 | A date **without a year** that falls **more than 6 months before the meeting date** moves to the **next year**. Otherwise it uses the meeting's year. |
| Note | No sample note triggers this. It is a design decision. |

#### D35. `followup` output and empty folder (resolves OQ-51; extends D20)
| ID | Requirement |
|---|---|
| FR-D35.1 | For each draft, `followup` prints the **owner**, the **recipient or `(no recipient)`**, the **item count** and the **Gmail draft id**. |
| FR-D35.2 | `followup --all` also prints a **total line**. |
| FR-D35.3 | `ingest` on a folder with **no `.md` files** prints `No notes found` and exits **2**. |

#### D36. Due phrases (amends D28.2, extends D33)
| ID | Requirement |
|---|---|
| FR-D36.1 | Due wording introduced by **by, from, on or due** resolves to a date, for example `results due 15 October`. |
| FR-D36.2 | For duplicate matching, a trailing phrase introduced by **by, from, on or due** is **removed** from the task text, as `by ...` already is in D28.2. |
| Still open | `before ...` phrases such as "before the next review" (not a date, so left in the text). |

#### D37. Numbered lists (resolves OQ-04)
| ID | Requirement |
|---|---|
| FR-D37.1 | Numbered checkbox lines such as `1. [ ] ...` are **not** action items. They are ignored and counted in the summary as ignored lines. |

#### D38. Year for `--due-before` (resolves the open point in D31)
| ID | Requirement |
|---|---|
| FR-D38.1 | A `--due-before` value without a year uses **today's year** (or the `--today` year), with the D34 six-month rollover measured **from today**. ISO dates are exact. |

#### D39. Merged item display (extends D3, resolves part of OQ-09)
| ID | Requirement |
|---|---|
| FR-D39.1 | A merged item shows the **task wording and meeting date of the most recent note** in which it appears. |
| FR-D39.2 | `list` shows **every source file**. |
| FR-D39.3 | The follow-up email shows the latest meeting date and the latest source. |
| Still open | Whether a line number is stored per item (the skip report uses `file:line`, but items have no decision). |

#### D40. Duplicates for unowned items (extends D28)
| ID | Requirement |
|---|---|
| FR-D40.1 | Items with the same label (`(no owner)` or `(group)`) and the same normalised task **merge**. |
| FR-D40.2 | An **ambiguous-owner** item merges only with an item of the **same first name** and the same normalised task. |
| Sample evidence | "Everyone to review the prototype" and "Someone to update the CRM notes" would merge with later repeats of the same text, within their label. |

#### D41. First name not in the note's attendees (refines D4.1, D23)
| ID | Requirement |
|---|---|
| FR-D41.1 | If the first name is not among the note's attendees, the **roster** is used. Exactly one match assigns that person, and the ingest summary notes the roster match. |
| FR-D41.2 | Several roster matches give **ambiguous**. |
| FR-D41.3 | No roster match stores the first name as **`(unresolved)`** and reports it. |
| Still open | Whether notes skipped as malformed contribute names to the roster. |

#### D42. `--owner` tokens for special labels (resolves open points in D16, D25)
| ID | Requirement |
|---|---|
| FR-D42.1 | `--owner none`, `--owner group`, `--owner ambiguous` and `--owner unresolved` select the labels `(no owner)`, `(group)`, `(ambiguous)` and `(unresolved)`. |
| FR-D42.2 | A person literally named one of these words is **not supported**. This is reported as a known limitation. |
| FR-D42.3 | `(unresolved)` items are, like the other special labels, skipped by `followup --all` and counted. |

### Resolved question index (after D1 to D42)
**Resolved (FRD):** OQ-01, 02, 03, 05, 07, 08, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 44, 45, 46, 47, 48, 49, 50, 51. NFRD OQ-61, OQ-65 and OQ-70 are resolved.
**Also resolved by D36 to D42:** OQ-04 and OQ-09 (meeting date part).
**Partly resolved:** OQ-06 (owner forms beyond D24), OQ-09 (line number per item), OQ-29 (display of same-first-name owners in `list` and drafts), OQ-60 (UTF-8 only is decided, other encodings are not).
**Still open:** the "Still open" rows inside D1 to D42. The NFRD and BRD questions are now resolved (NFRD section 13, BRD section 11).

> Corrections to earlier text: D21 amends D2.1 and D11.1. D22 clarifies D2.2. D26 amends D12. D28 amends D3.1. D34 amends D10.2. The earlier statement that the sample folder had "31 of 33" labelled notes was wrong. The folder has 35 `.md` files: 30 labelled, 2 YAML, 3 with no header.

> Where a "Still open" note in D1 to D8 is answered by a later decision, the later decision wins.

## 10. Revision note

BRD section 11 once used OQ-40 to OQ-45 for business-level questions, which clashed with FRD numbers. All BRD-level questions are now resolved (BRD section 11, B1 to B4), so no renumbering is needed.
