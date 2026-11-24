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
| Decisions | v0.8 holds 279 decisions (D1 to D279) in section 11. D43 to D76 came from the spec-gap review that produced `specs/`; they close most "Still open" rows below. v0.5 held 42 decisions (D1 to D42). D21 to D35 were made after inspecting the sample `notes/` folder. D36 to D42 close the remaining functional gaps. Where section 11 conflicts with an earlier requirement or an open question, **section 11 wins**, and a later decision wins over an earlier one. |

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

### Decisions D43 to D61 (made in the spec-gap review, 2026-11-24)

D43 to D61 were chosen by the requester while the specs in `specs/` were being written. Where they conflict with D1 to D42 they **amend** them, and the amendment is named. Each decision lists the earlier "Still open" point it closes.

#### D43. Spec organisation
| ID | Requirement |
|---|---|
| FR-D43.1 | One `spec.md` per capability under `specs/`, 11 in all: `01-note-parsing`, `02-date-resolution`, `03-owner-resolution`, `04-dedupe`, `05-store`, `06-ingest`, `07-list`, `08-done`, `09-followup`, `10-gmail-draft-connector`, `11-cli-conventions`. |
| FR-D43.2 | Specs cite decisions as plain `D<n>.<m>` (for example `D1.1`). The prefix `FR-D1` to `FR-D6` is kept only for the `done` command, because `FR-D1.1` would clash with it. |

#### D44. Status is exclusive and computed (resolves the open point in D15)
| ID | Requirement |
|---|---|
| FR-D44.1 | Every item has exactly one status at read time: `done`, `overdue` or `open`. `overdue` is never stored. |
| FR-D44.2 | `--status open` shows open items that are **not** overdue. `--status overdue` shows overdue items. Plain `list` shows open and overdue (D15.1). |

#### D45. Gmail connector contract (resolves the open point in CLAUDE.md)
| ID | Requirement |
|---|---|
| FR-D45.1 | The tool launches the Gmail MCP server named by `ACTIONTRACK_GMAIL_MCP_CMD` over stdio and calls exactly one tool: `create_draft`. |
| FR-D45.2 | `create_draft` takes `{ to?, subject, body }` (`to` is omitted when there is no recipient, D6.3) and returns the draft id. |
| FR-D45.3 | Automated tests use a fake connector only. The real server is a manual check. |

#### D46. `Owner` placeholder and literal `<date>` (extends D25, D8.4)
| ID | Requirement |
|---|---|
| FR-D46.1 | The word `Owner` as an item's owner is a placeholder, stored as `(no owner)`, like `Someone` and `TBD`. |
| FR-D46.2 | A literal `by <date>` does not resolve. The item is kept with no due date and flagged. |
| Sample evidence | None. `Owner to remediate finding by <date>` in `2026-10-09-security-review.md` sits inside a fenced code block, so D27 ignores it (it is the NFR-A4 code-fence trap). D46 covers the same wording outside a code fence, and is tested with a fixture. |

#### D47. Weekday abbreviations (extends D8.3)
| ID | Requirement |
|---|---|
| FR-D47.1 | `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat` and `Sun` resolve like the full weekday names (D8.2). |
| Sample evidence | `by Mon` (2026-09-18), `by Wed` (2026-09-08), `by Wed 16 Sep` (2026-09-14). |

#### D48. Which phrase is the due date, and when to flag (extends D36, D8.4, D33.3)
| ID | Requirement |
|---|---|
| FR-D48.1 | When a line has several due phrases, the **last one that resolves to a date** is the due date. Only that phrase is removed from the task. A phrase that does not resolve stays in the task text and takes part in duplicate matching. |
| FR-D48.2 | An item is **flagged** (no date stored) only when a phrase introduced by `by` or `due`, or by `for <month name>`, fails to resolve and no later phrase resolves. |
| FR-D48.3 | A phrase introduced by `on` or `from` counts as a due phrase only when what follows resolves to a date (`from 9 Oct`, `on 2026-10-14`). Otherwise it is plain task text and is never flagged (`on the demo`, `from Acme`). |
| Sample evidence | `Sam to cut cloud costs by 10% — proposal by 2026-10-09` has due 2026-10-09 and the task keeps `by 10%`. `by mid-October`, `by <date>` and `for November` are flagged. |

#### D49. Stored task text (extends D39)
| ID | Requirement |
|---|---|
| FR-D49.1 | The task is the text after the owner and `to` (or after `@name:`), with the **resolved** due phrase and the dash or comma that joined it removed. |
| FR-D49.2 | `Priya N. to send revised quote to Acme — by Friday` stores the task `send revised quote to Acme`. |

#### D50. Unparseable action lines (resolves the open point in D5.2)
| ID | Requirement |
|---|---|
| FR-D50.1 | A checkbox line is skipped and reported at `file:line` **only when it has no text** after the checkbox, for example `- [ ]`. Reason: `empty action item`. |
| FR-D50.2 | A checkbox line with text but no recognisable owner pattern is **kept** as an item with owner `(no owner)` and the whole text as the task. |

#### D51. Repeat `followup` (resolves the open points in D19.5)
| ID | Requirement |
|---|---|
| FR-D51.1 | The store keeps a `drafts` record per created draft: owner, draft id, time and the ids of the items listed. |
| FR-D51.2 | A repeat is **any prior record for that owner**. It warns (showing the earlier draft id and date), creates no draft, and counts as a warning (exit 1). |
| FR-D51.3 | `--force` always creates a new draft and adds another record. The tool never deletes or edits the earlier Gmail draft. |

#### D52. Ingest never deletes (resolves the open point in D13)
| ID | Requirement |
|---|---|
| FR-D52.1 | `ingest` never removes a stored item. A line removed from a note leaves its item unchanged. |
| FR-D52.2 | A reworded line follows the D28 duplicate rule: it merges with the old item or becomes a new item. |

#### D53. Exit-code precedence and `--all` failures (resolves the open points in D20)
| ID | Requirement |
|---|---|
| FR-D53.1 | When several exit codes apply, the **highest** wins: 3, then 2, then 1, then 0. |
| FR-D53.2 | `followup --all` **continues** after a failed draft, reports each failure on stderr, and exits 3 at the end. A failed owner gets no `drafts` record. Drafts already created are still reported. |

#### D54. `--today` scope (resolves the open point in D1.3)
| ID | Requirement |
|---|---|
| FR-D54.1 | `--today YYYY-MM-DD` is accepted by **all four commands**. Only ISO format is accepted. An invalid value exits 2 with the valid format. |

#### D55. Encoding (resolves OQ-60)
| ID | Requirement |
|---|---|
| FR-D55.1 | A UTF-8 byte-order mark is stripped. A BOM is not a reason to skip a note. |
| FR-D55.2 | CRLF and LF line endings are treated alike. A lone CR is not supported. |
| FR-D55.3 | Bytes that fail UTF-8 decoding skip the note as `not valid UTF-8` (D5.1). |

#### D56. Owners file (resolves the open points in D6, D18)
| ID | Requirement |
|---|---|
| FR-D56.1 | The owners file is `owners.json` in the store directory, shaped `{"Priya Nair": "priya@example.com"}`. It is edited by the user and never written by the tool. |
| FR-D56.2 | An attendee email beats the file (D18.2). If two notes give different emails for one person, the **most recent meeting's** email is used and a warning is printed (D18.3). |
| FR-D56.3 | A missing owners file is fine. A malformed one is a warning (exit 1). Drafts are then created without recipients. It is never a crash. |

#### D57. Filename date fallback (resolves the open point in D2.2, D22)
| ID | Requirement |
|---|---|
| FR-D57.1 | The fallback matches only a **leading** `YYYY-MM-DD` at the start of the filename, and it must be a real calendar date. Anything else, such as `untitled.md`, stays malformed. |

#### D58. Source record (resolves the open point in D39)
| ID | Requirement |
|---|---|
| FR-D58.1 | Each item keeps a list of sources, each `{file, meetingDate, line}`. The line is the 1-based line of the checkbox. |
| FR-D58.2 | The `list` table shows file names only. `list --json` exposes the full source records. |

#### D59. Store location and concurrency (resolves the open points in D17)
| ID | Requirement |
|---|---|
| FR-D59.1 | The default store path is resolved from the **current working directory** on every run. A different directory is a separate store. |
| FR-D59.2 | Writes are atomic (write then rename). There is no lock file. Overlapping runs are last-writer-wins. |
| FR-D59.3 | A missing store is empty. `list` prints `No items match.` `ingest` creates it. `done` gives unknown id, exit 2. |
| FR-D59.4 | A corrupt store is a clear error, exit 2, and is **never overwritten**. |

#### D60. Name forms (resolves the open points in D24, D11.3)
| ID | Requirement |
|---|---|
| FR-D60.1 | An item that names a **full name** not among the note's attendees is accepted as that person when the full name is on the roster. Otherwise it is stored as `(unresolved)` and reported. |
| FR-D60.2 | Only `&` splits joint owners (D24.3). `A and B to ...` and comma lists are not split. Their owner text is stored as `(unresolved)` and reported. |

#### D61. Roster source (resolves the open point in D23, D41)
| ID | Requirement |
|---|---|
| FR-D61.1 | Notes skipped as malformed contribute **nothing** to the roster. |
| FR-D61.2 | The roster is rebuilt from the notes read in each ingest, plus the names already in the store from earlier runs. |

#### D62. Unexpected internal error (extends D20, D53)
| ID | Requirement |
|---|---|
| FR-D62.1 | Exit `4`: an unexpected internal error (a bug or an I/O failure such as a full disk), not caused by malformed input. A clear message goes to stderr and the store is left as it was. |
| FR-D62.2 | Highest code still wins (D53.1), so 4 beats 3, 2 and 1. |

### Decisions D63 to D76 (the spec defaults, confirmed by the requester, 2026-11-24)

D63 to D76 settle every "Defaults to confirm" item that was in the first draft of the specs. No such items remain.

#### D63. Header rules (extends D21)
| ID | Requirement |
|---|---|
| FR-D63.1 | Labelled `Date:` and `Attendees:` lines are read only in the lead of the note, **before the first `## ` heading**. |
| FR-D63.2 | Attendees are separated by **commas only**. In YAML, `attendees:` is `[a, b]` or a `- a` list. |
| FR-D63.3 | In `Monday, 14 September 2026` the weekday word is **ignored**. |

#### D64. Empty file, comments and code (extends D5.1, D27)
| ID | Requirement |
|---|---|
| FR-D64.1 | A file is **empty** when it has no non-whitespace content. |
| FR-D64.2 | A multi-line HTML comment is ignored from `<!--` to `-->`. |
| FR-D64.3 | An **indented code block is not special**: a checkbox line there is still an item (nested items count, D26.1). |

#### D65. Fixed strings and free wording
| ID | Requirement |
|---|---|
| FR-D65.1 | Skip reasons are exactly: `empty file`, `not valid UTF-8`, `missing date`, `unparseable date`, `empty action item`. |
| FR-D65.2 | The `list` table is plain aligned columns with a header row and no colour. |
| FR-D65.3 | All other wording is free: email greeting and closing, the "nothing to chase" message, ingest summary labels, the `done` confirmation. Tests assert content (numbers, names, ids, items), not wording. |

#### D66. Date wording leftovers (extends D8 to D10, D33)
| ID | Requirement |
|---|---|
| FR-D66.1 | Weekday names, month names, `EOD` and `EOM` are matched **case-insensitively**. |
| FR-D66.2 | `EOD tomorrow` resolves to the **meeting date + 1**. |
| FR-D66.3 | Unlisted wording (`in 3 days`, `this week`, `end of week`, `tomorrow morning`) is **flagged** with no date (D8.4). |

#### D67. Owner phrase (extends D24)
| ID | Requirement |
|---|---|
| FR-D67.1 | The owner phrase is the text before the **first ` to `** (lower-case `to`, a word of its own, case-sensitive). |
| FR-D67.2 | For `@name:` the owner is the text up to the first colon. A first name then follows the normal first-name rules (D4, D23, D41). |

#### D68. Merge leftovers (extends D40, D3.4)
| ID | Requirement |
|---|---|
| FR-D68.1 | `(unresolved)` items merge on the same label, the same unresolved name text and the same normalised task. |
| FR-D68.2 | A merged item takes the latest due date if any copy has one, and is then not flagged. It is flagged only when no copy has a date and at least one copy is flagged. |

#### D69. Id order and store version (extends D14, D59)
| ID | Requirement |
|---|---|
| FR-D69.1 | In one ingest, ids are assigned by file name, then line order, then the order people are named on a line (`Anita & Rahul` gives Anita the lower id). |
| FR-D69.2 | A store whose `version` is not 1 is treated like a corrupt store: clear error, exit 2, never overwritten (D59.4). |

#### D70. Which events make `ingest` exit 1 (extends D20.2, D30.3)
| ID | Requirement |
|---|---|
| FR-D70.1 | Exit 1 follows: skipped notes, skipped lines, a weekday-versus-date disagreement (D33.4), an email conflict (D56.2) and `(unresolved)` owners. |
| FR-D70.2 | Flagged dates and `(no owner)`, `(group)` and `(ambiguous)` items are listed in the summary but do **not** change the exit code on their own. |

#### D71. `list` display (resolves open points in D15)
| ID | Requirement |
|---|---|
| FR-D71.1 | In the `due` column an undated, unflagged item shows `-` and a flagged item shows `?`. |
| FR-D71.2 | Rows with equal due dates are ordered by id. |
| FR-D71.3 | `list --json` with no match prints `[]`, exit 0, with no text line. |

#### D72. `list --owner` with an unknown name (extends D31.3)
| ID | Requirement |
|---|---|
| FR-D72.1 | A name that matches no known person prints `No items match.` and exits 0. It is not an error. |

#### D73. `followup` arguments (extends D7, D42.3)
| ID | Requirement |
|---|---|
| FR-D73.1 | `followup` needs exactly one of `<owner>` or `--all`. Both, or neither, is a usage error, exit 2. |
| FR-D73.2 | `followup none`, `group`, `ambiguous` or `unresolved` is a usage error, exit 2. The message says there is no one to email and suggests `list --owner <token>`. |

#### D74. `followup` subject count and missing connector (extends D19.1, D20.4)
| ID | Requirement |
|---|---|
| FR-D74.1 | N in the subject is the number of items listed in the email (overdue plus open). |
| FR-D74.2 | An unset `ACTIONTRACK_GMAIL_MCP_CMD` is a Gmail connector failure, exit 3, with a message that names the variable. It is detected **before any draft is attempted**. |

#### D75. Draft id and the Gmail server (extends D45)
| ID | Requirement |
|---|---|
| FR-D75.1 | The draft id is read from `structuredContent.draftId`, else from the first text block parsed as JSON `{"draftId": "..."}`. Anything else is a connector failure. |
| FR-D75.2 | The server itself (name, package, auth flow) is outside the specs. The user supplies a command that meets this contract, which may be an adapter around any Gmail MCP server. |

#### D76. Connector timeout (extends D20.4, N2)
| ID | Requirement |
|---|---|
| FR-D76.1 | A single `create_draft` call, including server start-up, that takes longer than **60 seconds** is a connector failure: exit 3, nothing recorded. The value is fixed, not configurable. |
| FR-D76.2 | Total time for `followup --all` stays unbounded (N2). |

### Decisions D77 to D279 (made in the spec plans, 2026-11-24)

These decisions were chosen by the requester while the spec plans were reviewed. They are numbered in one sequence in spec order (spec 01 to spec 11), and they amend or extend earlier decisions as named in each block. D136 is intentionally not used: spec 03 has 20 decisions (D116 to D135), and spec 04 starts at D137.

#### D77. Blank Date value
| ID | Requirement |
|---|---|
| FR-D77.1 | A blank `Date:` value counts as no date; the filename fallback applies, else `missing date`. |
| Source | specs/01-note-parsing/plan.md |

#### D78. Unreadable file skip
| ID | Requirement |
|---|---|
| FR-D78.1 | An unreadable file (permission error, path is a directory) is skipped with reason `unreadable file`; this amends D65.1 so the skip reason strings are now six. |
| Source | specs/01-note-parsing/plan.md |
| Amends or extends | D65.1 |

#### D79. Case-insensitive .md match
| ID | Requirement |
|---|---|
| FR-D79.1 | `.md` is matched case-insensitively (so `.MD` is a note), dotfiles ending `.md` are notes, and a directory named `y.md` is not a note and is counted as ignored. |
| Source | specs/01-note-parsing/plan.md |

#### D80. Ignored counts in blocks
| ID | Requirement |
|---|---|
| FR-D80.1 | Ignored-line counts inside fences, quotes and comments count only checkbox-looking lines. |
| Source | specs/01-note-parsing/plan.md |

#### D81. Backtick and tilde fences
| ID | Requirement |
|---|---|
| FR-D81.1 | Both backtick and `~~~` fences are accepted, and an unclosed fence runs to end of file so later checkbox lines are ignored with no skip. |
| Source | specs/01-note-parsing/plan.md |

#### D82. Date with time part
| ID | Requirement |
|---|---|
| FR-D82.1 | A date with a time part (for example `2026-09-09 10:30`) is an `unparseable date`. |
| Source | specs/01-note-parsing/plan.md |

#### D83. Skipped note counts
| ID | Requirement |
|---|---|
| FR-D83.1 | A skipped note adds nothing to item or ignored counts, and only its skip entry is reported. |
| Source | specs/01-note-parsing/plan.md |

#### D84. Absolute line numbers
| ID | Requirement |
|---|---|
| FR-D84.1 | Line numbers are absolute 1-based file lines counting header lines after BOM strip, a CRLF line counts once, and this extends the Note type with the absolute first body line. |
| Source | specs/01-note-parsing/plan.md |

#### D85. Blank attendee entries
| ID | Requirement |
|---|---|
| FR-D85.1 | Empty attendee entries (`a,,b`, trailing comma) are dropped silently, and an email-only entry (`<x@y.z>`) is dropped. |
| Source | specs/01-note-parsing/plan.md |

#### D86. Impossible filename date
| ID | Requirement |
|---|---|
| FR-D86.1 | An impossible date in the filename (for example `2026-13-01-x.md`) with no date key is a `missing date` skip. |
| Source | specs/01-note-parsing/plan.md |

#### D87. Month name parsing
| ID | Requirement |
|---|---|
| FR-D87.1 | Month names are case-insensitive full English names only (`9 SEPTEMBER 2026` is accepted), and `9th September 2026` and `9 Sep 2026` are `unparseable date`. |
| Source | specs/01-note-parsing/plan.md |

#### D88. YAML wins over labels
| ID | Requirement |
|---|---|
| FR-D88.1 | When a note has both YAML front matter and labelled lines, the YAML wins and labelled lines are not read. |
| Source | specs/01-note-parsing/plan.md |

#### D89. Unclosed front matter
| ID | Requirement |
|---|---|
| FR-D89.1 | Unclosed YAML front matter (`---` with no closing `---`) is not a YAML block, so labelled lines are read from the lead. |
| Source | specs/01-note-parsing/plan.md |

#### D90. Lone CR is content
| ID | Requirement |
|---|---|
| FR-D90.1 | A lone CR is ordinary content, the file is treated as one line, and there is no crash (matches D55.2). |
| Source | specs/01-note-parsing/plan.md |

#### D91. Checkbox spacing rule
| ID | Requirement |
|---|---|
| FR-D91.1 | `-[ ]` with no space after the bullet is not an item, `- [ ]text` is an item with text `text`, and tabs count as indentation. |
| Source | specs/01-note-parsing/plan.md |

#### D92. First Date line wins
| ID | Requirement |
|---|---|
| FR-D92.1 | With several `Date:` lines in the lead, the first one wins and later ones are ignored. |
| Source | specs/01-note-parsing/plan.md |

#### D93. BOM-only file
| ID | Requirement |
|---|---|
| FR-D93.1 | A BOM-only file is an `empty file` skip, since the BOM is stripped before the empty check. |
| Source | specs/01-note-parsing/plan.md |

#### D94. Missing folder throws
| ID | Requirement |
|---|---|
| FR-D94.1 | A missing or unreadable folder makes `listNoteFiles` throw `ActiontrackError`, which spec 06 maps to exit 2 (extends FR-D20.3). |
| Source | specs/01-note-parsing/plan.md |
| Amends or extends | FR-D20.3 |

#### D95. D35.3 stub moves to spec 06
| ID | Requirement |
|---|---|
| FR-D95.1 | The D35.3 stub (`No notes found`, exit 2) moves to spec 06 tests, so this spec is scope only with no test here. |
| Source | specs/01-note-parsing/plan.md |

#### D96. Phrase resolver and whole-item finder
| ID | Requirement |
|---|---|
| FR-D96.1 | `resolveDue` resolves one due phrase, and the new export `findDuePhrase` scans a whole item text (extends D8 and D48). |
| Source | specs/02-date-resolution/plan.md |
| Amends or extends | D8 and D48 |

#### D97. Earlier resolved phrase kept on later failure
| ID | Requirement |
|---|---|
| FR-D97.1 | An earlier resolved phrase and a later failing `by`/`due`/`for <month>` phrase keep the resolved date and flag the item, e.g. `by Friday` plus `by mid-October` stores Friday, flagged (applies D48.2). |
| Source | specs/02-date-resolution/plan.md |

#### D98. ISO week for next week
| ID | Requirement |
|---|---|
| FR-D98.1 | `next week` is the Monday-to-Sunday ISO week after the meeting's week, so a Sunday meeting 2026-10-11 gives 2026-10-12 (applies D9.1 and D33.2). |
| Source | specs/02-date-resolution/plan.md |

#### D99. Bare weekday versus next weekday
| ID | Requirement |
|---|---|
| FR-D99.1 | A bare weekday is the next occurrence strictly after the meeting day, while `next <weekday>` falls in the following ISO week (applies D8.2 and D33.2). |
| Source | specs/02-date-resolution/plan.md |

#### D100. Case-insensitive wording
| ID | Requirement |
|---|---|
| FR-D100.1 | All wording is case-insensitive, and the owner `to` stays case-sensitive (extends D66.1 and D67.1). |
| Source | specs/02-date-resolution/plan.md |
| Amends or extends | D66.1 and D67.1 |

#### D101. Accepted month name forms
| ID | Requirement |
|---|---|
| FR-D101.1 | Month names accept full English names, three-letter abbreviations and `Sept`, and other spellings are unresolvable (extends D10.1 and D33.1). |
| Source | specs/02-date-resolution/plan.md |
| Amends or extends | D10.1 and D33.1 |

#### D102. Unlisted wording flagged
| ID | Requirement |
|---|---|
| FR-D102.1 | Unlisted wording such as `by today`, `tomorrow EOD`, `EOD Friday`, `end of the month`, `2026/10/09` and `10.10.2026` stores no date and is flagged after `by` or `due`, while `for 4 Mar` stays in the text unflagged (extends D8.4 and D66.3). |
| Source | specs/02-date-resolution/plan.md |
| Amends or extends | D8.4 and D66.3 |

#### D103. Slash dates never guessed
| ID | Requirement |
|---|---|
| FR-D103.1 | `03/04` is never guessed: it is flagged after `by`, `due` or `for`, and kept as plain text after `on` or `from` (applies D10.3 and D48.3). |
| Source | specs/02-date-resolution/plan.md |

#### D104. Ordinal suffix must match
| ID | Requirement |
|---|---|
| FR-D104.1 | An ordinal suffix must match its number (1st, 2nd, 3rd, 4th, 21st, 31st), so `Oct 2th` is unresolvable (extends D33.1). |
| Source | specs/02-date-resolution/plan.md |
| Amends or extends | D33.1 |

#### D105. Invalid and non-leap dates
| ID | Requirement |
|---|---|
| FR-D105.1 | Invalid or non-leap calendar dates are unresolvable and flagged after `by`, `due` or `for`, while `by 2028-02-29` resolves (extends D10.1). |
| Source | specs/02-date-resolution/plan.md |
| Amends or extends | D10.1 |

#### D106. Explicit ISO date stored as written
| ID | Requirement |
|---|---|
| FR-D106.1 | An explicit ISO date is stored as written even when it falls outside the meeting window (applies D10.1 and D34.1). |
| Source | specs/02-date-resolution/plan.md |

#### D107. Rollover cutoff
| ID | Requirement |
|---|---|
| FR-D107.1 | The rollover cutoff is the meeting date minus 6 calendar months, clamped to month end, and a date exactly on the cutoff does not roll (extends D34.1). |
| Source | specs/02-date-resolution/plan.md |
| Amends or extends | D34.1 |

#### D108. Rollover before weekday check
| ID | Requirement |
|---|---|
| FR-D108.1 | Year rollover runs before the weekday check, so `Tue 5 Jan` on a 2026-12-01 meeting gives 2027-01-05 with no warning (extends D33.4). |
| Source | specs/02-date-resolution/plan.md |
| Amends or extends | D33.4 |

#### D109. Stored flag is the boolean only
| ID | Requirement |
|---|---|
| FR-D109.1 | The stored flag is the `dueFlagged` boolean only, and unresolved wording is reported by ingest but not stored (applies spec 05 and spec 06). |
| Source | specs/02-date-resolution/plan.md |

#### D110. CLI date forms
| ID | Requirement |
|---|---|
| FR-D110.1 | The CLI accepts ISO dates, `4 Mar` and `4 March 2026`, and weekday names, `today` and slash dates are errors (extends D31.6 and D38.1). |
| Source | specs/02-date-resolution/plan.md |
| Amends or extends | D31.6 and D38.1 |

#### D111. Today is the local calendar date
| ID | Requirement |
|---|---|
| FR-D111.1 | `today` is the machine's local calendar date via `systemClock`'s local getters, and NFR-C4 stays open (applies D1.3). |
| Source | specs/02-date-resolution/plan.md |

#### D112. Far-future year-less date
| ID | Requirement |
|---|---|
| FR-D112.1 | A year-less date far in the future uses the meeting's year with no rollback (applies D34.1). |
| Source | specs/02-date-resolution/plan.md |

#### D113. Phrase removal from task text
| ID | Requirement |
|---|---|
| FR-D113.1 | The resolved phrase is removed together with one adjoining dash or comma, then spaces are trimmed (applies D49.1 and D49.2). |
| Source | specs/02-date-resolution/plan.md |

#### D114. Parenthesised dates in D47 sample
| ID | Requirement |
|---|---|
| FR-D114.1 | Parenthesised dates in the D47 sample, such as `by Mon (2026-09-18)`, are meeting dates and not due dates (applies D47). |
| Source | specs/02-date-resolution/plan.md |

#### D115. Month-name false positives
| ID | Requirement |
|---|---|
| FR-D115.1 | `for <month name>` in task text is flagged under D48.2, kept as specified, and recorded as a known false-positive class (applies D48.2). |
| Source | specs/02-date-resolution/plan.md |

#### D116. Spec names are authoritative
| ID | Requirement |
|---|---|
| FR-D116.1 | Function names follow the spec (resolveOwner, parseOwnerPhrase, buildRoster, resolveOwnerArg), so the stub matchOwnerArg is renamed and the missing stubs are added. |
| Source | specs/03-owner-resolution/plan.md |

#### D117. Joint owner gives one result per person
| ID | Requirement |
|---|---|
| FR-D117.1 | One owner text naming two people (Anita & Rahul) returns one result per person, so resolveOwner returns an array; extends D24.3. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D24.3 |

#### D118. Same person twice gives one item
| ID | Requirement |
|---|---|
| FR-D118.1 | Anita & Anita gives one result; extends D24.3. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D24.3 |

#### D119. Group joined with a person
| ID | Requirement |
|---|---|
| FR-D119.1 | Everyone & Rahul gives a group result plus Rahul's own result; extends D24.3. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D24.3 |

#### D120. Unresolved keeps raw owner text
| ID | Requirement |
|---|---|
| FR-D120.1 | The (unresolved) result carries the raw owner text in text, not firstName; applies D68.1. |
| Source | specs/03-owner-resolution/plan.md |

#### D121. Placeholder words are normalised
| ID | Requirement |
|---|---|
| FR-D121.1 | Placeholder words match case-insensitively with a trailing ., comma or colon stripped; follows the D66.1 precedent. |
| Source | specs/03-owner-resolution/plan.md |

#### D122. Output uses canonical spelling
| ID | Requirement |
|---|---|
| FR-D122.1 | A resolved owner is shown in the spelling from attendees or the roster, not the typed form. |
| Source | specs/03-owner-resolution/plan.md |

#### D123. Exact name match, no accent folding
| ID | Requirement |
|---|---|
| FR-D123.1 | Names match exactly after case folding, so Jose does not match José; hyphen and apostrophe are name characters; extends D4.1. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D4.1 |

#### D124. Same first name and initial is ambiguous
| ID | Requirement |
|---|---|
| FR-D124.1 | Two attendees sharing a first name and surname initial give (ambiguous); extends D24.1. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D24.1 |

#### D125. Initial form falls back to roster
| ID | Requirement |
|---|---|
| FR-D125.1 | If no attendee has the first name, the roster is used for the First N. form; extends D24.1 and spec rule 10. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D24.1 and spec rule 10 |

#### D126. Dot is optional in initial form
| ID | Requirement |
|---|---|
| FR-D126.1 | Priya N and Priya N. match alike, and several matches give (ambiguous); extends D24.1. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D24.1 |

#### D127. Owner word must precede ' to '
| ID | Requirement |
|---|---|
| FR-D127.1 | ' to ' splits owner from task only when the word before it is a known owner or roster name, @name: is tested first, and @name with no colon is an unresolved phrase; extends D67.1 and D67.2. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D67.1 and D67.2 |

#### D128. Non-owner word before ' to ' stays in task
| ID | Requirement |
|---|---|
| FR-D128.1 | A phrase with no capitalised owner before ' to ' gives owner (no owner) with the full text as the task, for example 'Schedule to review budget'; extends D50.2 and D67.1. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D50.2 and D67.1 |

#### D129. Collaborator in brackets stripped from owner
| ID | Requirement |
|---|---|
| FR-D129.1 | A trailing (with X) is stripped from each & part and the collaborator stays in the task text; extends D24.4. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D24.4 |

#### D130. Wrong surname is unresolved
| ID | Requirement |
|---|---|
| FR-D130.1 | A full name with a wrong surname (Priya Sharma when only Priya Shah is an attendee) gives (unresolved), with no fallback to the first name. |
| Source | specs/03-owner-resolution/plan.md |

#### D131. Roster dedupe keeps first spelling
| ID | Requirement |
|---|---|
| FR-D131.1 | Roster names compare case-insensitively and the first spelling seen wins (store names first, then notes in read order); extends D61.2. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D61.2 |

#### D132. resolveOwnerArg result shape
| ID | Requirement |
|---|---|
| FR-D132.1 | resolveOwnerArg returns person, label or no-match; an ambiguous first name throws a usage error and knownOwners is roster plus store names; extends D4.4, D31.3 and D72.1. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D4.4, D31.3 and D72.1 |

#### D133. Person named none keeps label
| ID | Requirement |
|---|---|
| FR-D133.1 | A person literally named none gives a warning and keeps the (no owner) label, with the warning returned as data; extends D42.2. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D42.2 |

#### D134. Roster full-name match is flagged
| ID | Requirement |
|---|---|
| FR-D134.1 | A full name matched on the roster sets viaRoster true so the ingest summary notes it; extends D60.1 and D41.1. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D60.1 and D41.1 |

#### D135. @ form is case-insensitive
| ID | Requirement |
|---|---|
| FR-D135.1 | @Anita: matches Anita, comparing case-insensitively; extends D67.2 and D24.2. |
| Source | specs/03-owner-resolution/plan.md |
| Amends or extends | D67.2 and D24.2 |

#### D137. Normalisation order
| ID | Requirement |
|---|---|
| FR-D137.1 | Normalise by lowercasing, removing punctuation, splitting on whitespace, dropping whole-word a, an and the, and joining with one space (extends D28.2, D36.2). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D28.2 and D36.2 |

#### D138. Apostrophes and hyphens
| ID | Requirement |
|---|---|
| FR-D138.1 | An apostrophe is removed with no space, a hyphen or dash becomes a space (follow-up = follow up), and e-mail and email stay different (extends D28.2). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D28.2 |

#### D139. Unicode and case folding
| ID | Requirement |
|---|---|
| FR-D139.1 | Text is Unicode NFC-normalised and then lowercased with locale-independent toLowerCase(), so non-ASCII tasks compare exactly as lowercased (extends D28.2). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D28.2 |

#### D140. Unresolved due phrase kept
| ID | Requirement |
|---|---|
| FR-D140.1 | An unresolved due phrase stays in the task text and takes part in matching, and only the resolved phrase is removed (extends D48.1). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D48.1 |

#### D141. Empty normalised task
| ID | Requirement |
|---|---|
| FR-D141.1 | A task that normalises to empty is not stored and is reported as an empty action item with file:line (extends D50.1). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D50.1 |

#### D142. One source per line
| ID | Requirement |
|---|---|
| FR-D142.1 | Each (file, line) gives one source, so the same task on two lines of one note gives two sources (extends D3.3). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D3.3 |

#### D143. Null due date
| ID | Requirement |
|---|---|
| FR-D143.1 | A null due date means no date, any dated copy beats undated copies, and ISO YYYY-MM-DD strings are compared (extends D3.4, D68.2). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D3.4 and D68.2 |

#### D144. Done status on merge
| ID | Requirement |
|---|---|
| FR-D144.1 | A done item merged with open copies keeps status done, its due date is the latest over all copies, and a later open copy updates wording and meeting date but not status (extends D3.5, D39.1). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D3.5 and D39.1 |

#### D145. Name comparison for ambiguous and unresolved
| ID | Requirement |
|---|---|
| FR-D145.1 | First name (ambiguous) and name text (unresolved) are compared case-insensitively with whitespace collapsed, and an ambiguous item never merges with a resolved item for the same person (extends D40.2, D68.1). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D40.2 and D68.1 |

#### D146. Owner label keys
| ID | Requirement |
|---|---|
| FR-D146.1 | The labels (no owner), (group), (ambiguous), (unresolved) and a resolved name are distinct keys, and Everyone and Team both store (group) and merge by D40.1 (extends D25.1, D40.1). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D25.1 and D40.1 |

#### D147. Same line, changed text
| ID | Requirement |
|---|---|
| FR-D147.1 | The same file and line with different normalised text is a new incoming item matched by the key rules, and old sources stay (extends D52.1, D13.3). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D52.1 and D13.3 |

#### D148. mergeItem change list
| ID | Requirement |
|---|---|
| FR-D148.1 | mergeItem returns a change list of add, merge or unchanged and never assigns an id, and spec 05 assigns ids in D69.1 order (extends D14.2). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D14.2 |

#### D149. Existing duplicates in store
| ID | Requirement |
|---|---|
| FR-D149.1 | Two stored items with the same key are not merged, and new copies match the lowest id (extends D52.1). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D52.1 |

#### D150. Most recent note
| ID | Requirement |
|---|---|
| FR-D150.1 | Wording and meeting date come from the most recent note as computed from source records (meeting date, then file name), not from read order (extends D39.1, D39.3). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D39.1 and D39.3 |

#### D151. New source counts as merged
| ID | Requirement |
|---|---|
| FR-D151.1 | Adding a new source to an existing item counts as merged, while an unchanged re-ingest does not (extends D30.2). |
| Source | specs/04-dedupe/plan.md |
| Amends or extends | D30.2 |

#### D152. Relative store path
| ID | Requirement |
|---|---|
| FR-D152.1 | A relative --store path is resolved against the cwd at call time with path.resolve (extends D17.2). |
| Source | specs/05-store/plan.md |
| Amends or extends | D17.2 |

#### D153. Empty store env/flag
| ID | Requirement |
|---|---|
| FR-D153.1 | --store "" and ACTIONTRACK_STORE="" are treated as unset and fall through to the next source (extends D17.2). |
| Source | specs/05-store/plan.md |
| Amends or extends | D17.2 |

#### D154. Store path is a directory
| ID | Requirement |
|---|---|
| FR-D154.1 | A store path that is an existing directory is a usage error (exit 2), and a failed mkdir of the parent gives exit 4 (extends D62.1). |
| Source | specs/05-store/plan.md |
| Amends or extends | D62.1 |

#### D155. Zero-byte store
| ID | Requirement |
|---|---|
| FR-D155.1 | A zero-byte store file is corrupt (exit 2), since D59.3 covers only an absent file (extends D59.4). |
| Source | specs/05-store/plan.md |
| Amends or extends | D59.4 |

#### D156. Unknown store keys
| ID | Requirement |
|---|---|
| FR-D156.1 | Unknown keys at the top level or on an item make the store corrupt: exit 2, never overwritten (extends D59.4). |
| Source | specs/05-store/plan.md |
| Amends or extends | D59.4 |

#### D157. Duplicate ids and nextId
| ID | Requirement |
|---|---|
| FR-D157.1 | Duplicate item ids make the store corrupt (exit 2, never overwritten), and nextId must be greater than every stored id (extends D59.4 and D14.1). |
| Source | specs/05-store/plan.md |
| Amends or extends | D59.4 and D14.1 |

#### D158. Legacy v1 store
| ID | Requirement |
|---|---|
| FR-D158.1 | A v1 file without roster or drafts reads them as empty arrays with no error (extends D69.2). |
| Source | specs/05-store/plan.md |
| Amends or extends | D69.2 |

#### D159. Roster entry shape
| ID | Requirement |
|---|---|
| FR-D159.1 | Roster entries are {name, email?, meetingDate?}, and meetingDate is required when email is present (extends D56.2). |
| Source | specs/05-store/plan.md |
| Amends or extends | D56.2 |

#### D160. itemIds and createdAt types
| ID | Requirement |
|---|---|
| FR-D160.1 | itemIds is number[] and createdAt is an ISO 8601 UTC timestamp string passed in by the caller (extends D51.1). |
| Source | specs/05-store/plan.md |
| Amends or extends | D51.1 |

#### D161. Store file format
| ID | Requirement |
|---|---|
| FR-D161.1 | On write the file uses 2-space indent, LF, a trailing newline and UTF-8 without BOM, and a leading BOM is tolerated on read (extends NFR-D3). |
| Source | specs/05-store/plan.md |
| Amends or extends | NFR-D3 |

#### D162. Temp file name and cleanup
| ID | Requirement |
|---|---|
| FR-D162.1 | The temp file is items.json.<pid>.<rand>.tmp in the same directory, removed on a failed write in the same run, and stale temps from crashed runs are ignored, never deleted (extends D59.2). |
| Source | specs/05-store/plan.md |
| Amends or extends | D59.2 |

#### D163. fsync of temp file
| ID | Requirement |
|---|---|
| FR-D163.1 | The temp file is fsynced before rename and the directory is not fsynced on Windows (extends D59.2). |
| Source | specs/05-store/plan.md |
| Amends or extends | D59.2 |

#### D164. Windows rename retry
| ID | Requirement |
|---|---|
| FR-D164.1 | A failed rename on Windows (EPERM, EBUSY) is retried 3 attempts in total with waits of 100 ms then 200 ms, then exit 4 with the old file intact (extends D62.1). |
| Source | specs/05-store/plan.md |
| Amends or extends | D62.1 |

#### D165. Id allocation and failed save
| ID | Requirement |
|---|---|
| FR-D165.1 | The pure allocator lives in store/store.ts and ids from a run that fails before saving are not consumed, so output prints ids only after a successful save (extends D14.1). |
| Source | specs/05-store/plan.md |
| Amends or extends | D14.1 |

#### D166. No changed-file check on save
| ID | Requirement |
|---|---|
| FR-D166.1 | Save does not check whether the file changed since load, and the overlapping-run risk is stated to the user (extends D59.2). |
| Source | specs/05-store/plan.md |
| Amends or extends | D59.2 |

#### D167. Owners file errors
| ID | Requirement |
|---|---|
| FR-D167.1 | An unreadable owners file is a warning, malformed JSON or a non-object top level gives one warning and no entries, and an invalid-email entry is skipped with a warning while the rest are kept (extends D56.3). |
| Source | specs/05-store/plan.md |
| Amends or extends | D56.3 |

#### D168. Owner key case duplicates
| ID | Requirement |
|---|---|
| FR-D168.1 | Owner keys differing only by case or surrounding spaces keep the first entry and report the second as a warning (extends D56.3). |
| Source | specs/05-store/plan.md |
| Amends or extends | D56.3 |

#### D169. Tool never writes owners.json
| ID | Requirement |
|---|---|
| FR-D169.1 | The tool never writes owners.json (extends D56.1). |
| Source | specs/05-store/plan.md |
| Amends or extends | D56.1 |

#### D170. EXIT.INTERNAL constant
| ID | Requirement |
|---|---|
| FR-D170.1 | EXIT.INTERNAL = 4 is added to domain/exit-codes.ts in spec 05's first implementation task, and spec 11 references the same constant (extends D62.1). |
| Source | specs/05-store/plan.md |
| Amends or extends | D62.1 |

#### D171. OS file permissions
| ID | Requirement |
|---|---|
| FR-D171.1 | Standard OS permissions apply with no chmod and no encryption, and Windows ACLs are not managed by the tool (extends NFR-SEC5). |
| Source | specs/05-store/plan.md |
| Amends or extends | NFR-SEC5 |

#### D172. Same item on re-run
| ID | Requirement |
|---|---|
| FR-D172.1 | A line with the same owner and normalised task as a stored item is the same item, and on a re-run its due date is updated from the newest copy. |
| Source | specs/06-ingest/plan.md |

#### D173. Removed line keeps item
| ID | Requirement |
|---|---|
| FR-D173.1 | A line removed from a note keeps its item and its source record; nothing is deleted (per D52.1). |
| Source | specs/06-ingest/plan.md |

#### D174. No-change re-run
| ID | Requirement |
|---|---|
| FR-D174.1 | A re-run with no change does not rewrite the store file. |
| Source | specs/06-ingest/plan.md |

#### D175. All notes skipped
| ID | Requirement |
|---|---|
| FR-D175.1 | If every .md note is skipped, ingest exits 1 with the skip report and creates the store empty if missing (per D59.3). |
| Source | specs/06-ingest/plan.md |

#### D176. Missing notes folder exit code
| ID | Requirement |
|---|---|
| FR-D176.1 | A missing or unreadable notes folder exits 2, not 4 (per D20.3). |
| Source | specs/06-ingest/plan.md |

#### D177. Unreadable note skip reason
| ID | Requirement |
|---|---|
| FR-D177.1 | A note that exists but cannot be read is skipped with reason "unreadable file", the sixth skip reason from spec 01 (spec 01 decision Q-02). |
| Source | specs/06-ingest/plan.md |

#### D178. Ignored line kinds
| ID | Requirement |
|---|---|
| FR-D178.1 | Ignored line kinds are table-row, action-line, block-quote, code-fence, html-comment and numbered-checkbox; plain prose is not counted, and a checkbox-looking line inside a fence or comment counts once under its own kind. |
| Source | specs/06-ingest/plan.md |

#### D179. Duplicate line in one note
| ID | Requirement |
|---|---|
| FR-D179.1 | The same owner and task twice in one note is merged and counted as merged. |
| Source | specs/06-ingest/plan.md |

#### D180. Added vs merged totals
| ID | Requirement |
|---|---|
| FR-D180.1 | Items added equals new ids this run; merged equals lines folded into an existing item, including every line on a re-run, so a second run reports 0 added. |
| Source | specs/06-ingest/plan.md |

#### D181. Note processing order
| ID | Requirement |
|---|---|
| FR-D181.1 | Notes are processed in plain code-unit, case-sensitive file-name order (per D69.1). |
| Source | specs/06-ingest/plan.md |

#### D182. Non-.md entries counted
| ID | Requirement |
|---|---|
| FR-D182.1 | Each top-level entry that is not a .md file counts as one ignored file, and a subfolder counts as one and its contents are not read. |
| Source | specs/06-ingest/plan.md |

#### D183. Read count
| ID | Requirement |
|---|---|
| FR-D183.1 | A note that is not skipped counts as read, even if it has skipped lines. |
| Source | specs/06-ingest/plan.md |

#### D184. Email conflict rule
| ID | Requirement |
|---|---|
| FR-D184.1 | On an email conflict, ingest warns and keeps the most recent meeting's email; this depends on specs 05 and 09 persisting attendee emails. |
| Source | specs/06-ingest/plan.md |

#### D185. Store path precedence
| ID | Requirement |
|---|---|
| FR-D185.1 | --store wins over ACTIONTRACK_STORE. |
| Source | specs/06-ingest/plan.md |

#### D186. No-notes message
| ID | Requirement |
|---|---|
| FR-D186.1 | "No notes found" is printed to stderr and exits 2. |
| Source | specs/06-ingest/plan.md |

#### D187. Roster match output
| ID | Requirement |
|---|---|
| FR-D187.1 | The roster match is listed as a count plus a file:line list. |
| Source | specs/06-ingest/plan.md |

#### D188. Roster contents
| ID | Requirement |
|---|---|
| FR-D188.1 | The roster holds only resolved full names from attendees and stored owners, never labels such as (no owner). |
| Source | specs/06-ingest/plan.md |

#### D189. Corrupt store
| ID | Requirement |
|---|---|
| FR-D189.1 | A corrupt store exits 2 with a clear error (per D59.4). |
| Source | specs/06-ingest/plan.md |

#### D190. Spec 06 ID references
| ID | Requirement |
|---|---|
| FR-D190.1 | In spec 06, D3 and D4 are FRD decisions; P1, P3, P4, O1, O3 and U6 mean NFR-P1, NFR-P3, NFR-P4, NFR-O1, NFR-O3 and NFR-U6; NFR-D3 is determinism; the spec text itself is not changed. |
| Source | specs/06-ingest/plan.md |

#### D191. Stdout totals include groups
| ID | Requirement |
|---|---|
| FR-D191.1 | The stdout totals include (group) and (unresolved); spec 06 overrides D30.2. |
| Source | specs/06-ingest/plan.md |
| Amends or extends | D30.2 |

#### D192. First occurrence gives id
| ID | Requirement |
|---|---|
| FR-D192.1 | For a line merged within one run, the first occurrence in file and line order gives the id, and later copies merge into it (per D69.1). |
| Source | specs/06-ingest/plan.md |

#### D193. Undated items order
| ID | Requirement |
|---|---|
| FR-D193.1 | Undated items are listed after all dated items, ordered by id. |
| Source | specs/07-list/plan.md |

#### D194. Undated never overdue
| ID | Requirement |
|---|---|
| FR-D194.1 | Undated items are never overdue, so they never appear under `--status overdue` (applies D1.2). |
| Source | specs/07-list/plan.md |

#### D195. JSON output shape
| ID | Requirement |
|---|---|
| FR-D195.1 | `--json` output is a bare array of item objects, with no envelope and keys in the order the spec lists. |
| Source | specs/07-list/plan.md |

#### D196. dueFlagged in JSON
| ID | Requirement |
|---|---|
| FR-D196.1 | `dueFlagged` in JSON reports the stored flag as it is. |
| Source | specs/07-list/plan.md |

#### D197. Empty result exit code
| ID | Requirement |
|---|---|
| FR-D197.1 | An empty result exits 0. |
| Source | specs/07-list/plan.md |

#### D198. Empty table output
| ID | Requirement |
|---|---|
| FR-D198.1 | A table with zero rows prints only `No items match.`, with no header row. |
| Source | specs/07-list/plan.md |

#### D199. First-name roster matching
| ID | Requirement |
|---|---|
| FR-D199.1 | First-name matching counts the stored roster and item owners, and a first name counts as a person only when a full name exists. |
| Source | specs/07-list/plan.md |

#### D200. First-name match rule
| ID | Requirement |
|---|---|
| FR-D200.1 | First-name matching is a case-insensitive exact match on the first word of a full name. |
| Source | specs/07-list/plan.md |

#### D201. Display-width columns
| ID | Requirement |
|---|---|
| FR-D201.1 | Column widths use display width (wide characters count as 2), task text and sources are not truncated, and no new dependency is added. |
| Source | specs/07-list/plan.md |

#### D202. --due-before accepted forms
| ID | Requirement |
|---|---|
| FR-D202.1 | `--due-before` accepts whatever `parseCliDate` accepts (spec 02 rule 11), including the D10.1 forms. |
| Source | specs/07-list/plan.md |

#### D203. Rollover boundary
| ID | Requirement |
|---|---|
| FR-D203.1 | Rollover follows D34.1, and a date exactly 6 months before today is not rolled forward (extends D34.1). |
| Source | specs/07-list/plan.md |
| Amends or extends | D34.1 |

#### D204. Invalid date input exit
| ID | Requirement |
|---|---|
| FR-D204.1 | An impossible calendar date, an empty `--due-before ""`, or `Feb 29` without a year in a non-leap year exits 2 with the valid forms listed. |
| Source | specs/07-list/plan.md |

#### D205. --status case-insensitive
| ID | Requirement |
|---|---|
| FR-D205.1 | `--status` values `open`, `done` and `overdue` are accepted in any case. |
| Source | specs/07-list/plan.md |

#### D206. Repeated flag value
| ID | Requirement |
|---|---|
| FR-D206.1 | A repeated flag takes its last value. |
| Source | specs/07-list/plan.md |

#### D207. Owner label not a token
| ID | Requirement |
|---|---|
| FR-D207.1 | A literal owner label is not accepted as `--owner`; only the tokens `none|group|ambiguous|unresolved` are. |
| Source | specs/07-list/plan.md |

#### D208. Missing store with --json
| ID | Requirement |
|---|---|
| FR-D208.1 | `--json` with a missing store prints `[]`, exits 0, and prints no text line. |
| Source | specs/07-list/plan.md |

#### D209. No stderr on valid run
| ID | Requirement |
|---|---|
| FR-D209.1 | `list` prints no warnings to stderr on a valid run. |
| Source | specs/07-list/plan.md |

#### D210. Exit 4 for list
| ID | Requirement |
|---|---|
| FR-D210.1 | Exit 4 (unexpected internal error, extends D62.1) applies to `list`, as spec 11 states. |
| Source | specs/07-list/plan.md |
| Amends or extends | D62.1 |

#### D211. Already-done message
| ID | Requirement |
|---|---|
| FR-D211.1 | `done` on an already-done item prints the already-done message with id, owner and task, exits 0, and does not rewrite the store (extends FR-D32.3 and Behaviour 4). |
| Source | specs/08-done/plan.md |
| Amends or extends | FR-D32.3 and Behaviour 4 |

#### D212. No reopen command
| ID | Requirement |
|---|---|
| FR-D212.1 | Spec 08 has no reopen command, and re-ingest never reopens a done item (confirms D13.2 and D3.5). |
| Source | specs/08-done/plan.md |

#### D213. One id per call
| ID | Requirement |
|---|---|
| FR-D213.1 | `done` takes exactly one id, and two or more ids is a usage error with exit 2 and nothing changed (extends Behaviour 1). |
| Source | specs/08-done/plan.md |
| Amends or extends | Behaviour 1 |

#### D214. Canonical id form
| ID | Requirement |
|---|---|
| FR-D214.1 | Only canonical decimal ids from 1 up are accepted (no sign, leading zero, decimal point or exponent), and anything else exits 2 (extends Behaviour 1 and FR-D32.2). |
| Source | specs/08-done/plan.md |
| Amends or extends | Behaviour 1 and FR-D32.2 |

#### D215. Unknown id beyond range
| ID | Requirement |
|---|---|
| FR-D215.1 | An id above the largest assigned id, or beyond the safe integer range, is an unknown id with exit 2 and no separate message (extends FR-D32.2 and D14.2). |
| Source | specs/08-done/plan.md |
| Amends or extends | FR-D32.2 and D14.2 |

#### D216. Already-done message content
| ID | Requirement |
|---|---|
| FR-D216.1 | The already-done message includes id, owner and task as the success message does, with free wording (extends FR-D32.3 and D65.3). |
| Source | specs/08-done/plan.md |
| Amends or extends | FR-D32.3 and D65.3 |

#### D217. Unknown-id message content
| ID | Requirement |
|---|---|
| FR-D217.1 | The unknown-id message names the id that was not found and states that nothing changed, with free wording (extends FR-D32.2 and D65.3). |
| Source | specs/08-done/plan.md |
| Amends or extends | FR-D32.2 and D65.3 |

#### D218. Validation order
| ID | Requirement |
|---|---|
| FR-D218.1 | Validation runs in the order id, then `--today`, then store load, then lookup, and all these failures exit 2 (extends D54.1 and Behaviour 1). |
| Source | specs/08-done/plan.md |
| Amends or extends | D54.1 and Behaviour 1 |

#### D219. Source note deleted or changed
| ID | Requirement |
|---|---|
| FR-D219.1 | `done` acts on the store only and exits 0 even if the source note was deleted or changed, and never checks notes (extends FR-D32.1). |
| Source | specs/08-done/plan.md |
| Amends or extends | FR-D32.1 |

#### D220. Non-open owner labels
| ID | Requirement |
|---|---|
| FR-D220.1 | `done` works on any stored item, including `(no owner)`, `(group)`, `(ambiguous)` and `(unresolved)`, with follow-up exclusion left to spec 09 (extends FR-D1). |
| Source | specs/08-done/plan.md |
| Amends or extends | FR-D1 |

#### D221. Unknown owner name
| ID | Requirement |
|---|---|
| FR-D221.1 | `followup <owner>` with a name that is not an attendee or on the roster exits 2, lists the known owners, and creates no draft. |
| Source | specs/09-followup/plan.md |

#### D222. Nothing to chase
| ID | Requirement |
|---|---|
| FR-D222.1 | A known owner with no open or overdue items via `followup <owner>` prints a message, creates no draft, and exits 0 (extends D7.3). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D7.3 |

#### D223. Missing store
| ID | Requirement |
|---|---|
| FR-D223.1 | A missing store file exits 2 with a message telling the user to run `ingest` first, and creates no draft. |
| Source | specs/09-followup/plan.md |

#### D224. Corrupt store
| ID | Requirement |
|---|---|
| FR-D224.1 | A corrupt store exits 2, is never overwritten, and `createDraft` is never called (extends D59.4). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D59.4 |

#### D225. Env var checked first
| ID | Requirement |
|---|---|
| FR-D225.1 | `ACTIONTRACK_GMAIL_MCP_CMD` is checked before any owner is processed or any draft is created, and unset exits 3 naming the variable (extends D74.2). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D74.2 |

#### D226. Repeat detection key
| ID | Requirement |
|---|---|
| FR-D226.1 | Repeat detection matches the resolved owner name as an exact string (closes the D19.5 open point for repeat detection). |
| Source | specs/09-followup/plan.md |

#### D227. --all repeat owner
| ID | Requirement |
|---|---|
| FR-D227.1 | Under `--all` a repeat owner gets a warning and no draft while other owners proceed, and the run exits 1 (extends D51.2 and D53.2). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D51.2 and D53.2 |

#### D228. Skipped labels and exit code
| ID | Requirement |
|---|---|
| FR-D228.1 | Skipped label items under `--all` do not change the exit code, and their count is printed (extends D16.3). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D16.3 |

#### D229. Recipient fallback
| ID | Requirement |
|---|---|
| FR-D229.1 | The recipient is the attendee email from the most recent note listing the owner, else the owners file, else the draft has no `to` and a warning is printed (extends D6.3). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D6.3 |

#### D230. Owners file lookup
| ID | Requirement |
|---|---|
| FR-D230.1 | Owners-file lookup uses the full name case-insensitively and an attendee email always wins (extends D18.2 and closes the D6.3 open point). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D18.2 and D6.3 |

#### D231. Greeting first token
| ID | Requirement |
|---|---|
| FR-D231.1 | The greeting uses the first whitespace-separated token of the owner's name, and a one-word name is used whole. |
| Source | specs/09-followup/plan.md |

#### D232. Source shown as file name
| ID | Requirement |
|---|---|
| FR-D232.1 | The source is shown as the file name only, never the path (extends D58.2 and NFR-SEC2). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D58.2 and NFR-SEC2 |

#### D233. Source tie on meeting date
| ID | Requirement |
|---|---|
| FR-D233.1 | When two sources share the latest meeting date, the file name that sorts last in ascending order is shown (extends D58.1 and D39.3). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D58.1 and D39.3 |

#### D234. Warnings omit addresses
| ID | Requirement |
|---|---|
| FR-D234.1 | Warnings name the owner and file, never an email address, and addresses appear only on stdout and in the draft (extends D35.1). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D35.1 |

#### D235. --all total line
| ID | Requirement |
|---|---|
| FR-D235.1 | `--all` with zero drafts still prints the total line ("0 drafts") and the skipped count, and exits 0 unless another warning applies (extends D35.2). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D35.2 |

#### D236. drafts timestamps
| ID | Requirement |
|---|---|
| FR-D236.1 | `drafts` timestamps are ISO 8601 strings taken from the injected clock, and the record shape is owned by spec 05. |
| Source | specs/09-followup/plan.md |

#### D237. Timeout or unparseable draft id
| ID | Requirement |
|---|---|
| FR-D237.1 | A timeout or unparseable draft id prints "A draft may have been created; check Gmail Drafts before running again.", exits 3, and writes no record (extends D75.1 and D76). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D75.1 and D76 |

#### D238. Draft created, record not saved
| ID | Requirement |
|---|---|
| FR-D238.1 | If the draft is created but the `drafts` record cannot be written, the run exits 4 with owner and draft id on stderr and the store is otherwise unchanged (extends D62). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D62 |

#### D239. Subject uses literal (N)
| ID | Requirement |
|---|---|
| FR-D239.1 | The subject uses the literal `(N)` form for every N (extends D19.1 and closes the D74.1 open point for this item). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D19.1 |

#### D240. Greeting always resolved
| ID | Requirement |
|---|---|
| FR-D240.1 | The greeting always has a resolved owner name, because only resolved people get drafts (settled by spec; extends D19.2). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D19.2 |

#### D241. --force with nothing to chase
| ID | Requirement |
|---|---|
| FR-D241.1 | `--force` for an owner with nothing to chase creates no draft, prints a message, and exits 0 (extends D7.3). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D7.3 |

#### D242. Env read through Deps
| ID | Requirement |
|---|---|
| FR-D242.1 | The env var check lives in `followup` and reads a value passed through `Deps`, while the real env read stays in `cli/index.ts` (extends D74.2). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D74.2 |

#### D243. Unknown first name recipient
| ID | Requirement |
|---|---|
| FR-D243.1 | Items with an unknown first name in the note (D41) get a recipient from the owners file by full name only, as in D230 (extends D41 and D18.2). |
| Source | specs/09-followup/plan.md |
| Amends or extends | D41 and D18.2 |

#### D244. Unset gmail MCP command is exit 3
| ID | Requirement |
|---|---|
| FR-D244.1 | An unset ACTIONTRACK_GMAIL_MCP_CMD is a GmailError (exit 3) whose message names the variable (extends FR-D74.2). |
| Source | specs/10-gmail-draft-connector/plan.md |
| Amends or extends | FR-D74.2 |

#### D245. Fixed 60 s connector timeout
| ID | Requirement |
|---|---|
| FR-D245.1 | The 60 s timeout is fixed for the CLI and includes start-up (extends FR-D76.1); a test-only internal constructor option timeoutMs (default 60000) may shorten it, and the CLI never sets it. |
| Source | specs/10-gmail-draft-connector/plan.md |
| Amends or extends | FR-D76.1 |

#### D246. Timeout restarts per call
| ID | Requirement |
|---|---|
| FR-D246.1 | The 60 s timer restarts for each createDraft call, so the limit applies per call, not to a whole run (extends D76.2). |
| Source | specs/10-gmail-draft-connector/plan.md |
| Amends or extends | D76.2 |

#### D247. Gmail MCP command run as shell string
| ID | Requirement |
|---|---|
| FR-D247.1 | ACTIONTRACK_GMAIL_MCP_CMD is run as a shell string (shell: true) so npx and quoted paths work; the value is user-controlled (relates to N3). |
| Source | specs/10-gmail-draft-connector/plan.md |

#### D248. One MCP server per createDraft call
| ID | Requirement |
|---|---|
| FR-D248.1 | Each createDraft call starts one MCP server and stops it in finally; the DraftConnector interface gets no close() method (Rule 6). |
| Source | specs/10-gmail-draft-connector/plan.md |

#### D249. create_draft contract and adapter rule
| ID | Requirement |
|---|---|
| FR-D249.1 | The connector implements the contract create_draft {to?, subject, body}, is tested with the fake only, and is confirmed in the manual smoke test; if the real server differs, an adapter is added and ALLOWED_MCP_TOOLS does not change (extends FR-D75.2). |
| Source | specs/10-gmail-draft-connector/plan.md |
| Amends or extends | FR-D75.2 |

#### D250. Child inherits parent environment
| ID | Requirement |
|---|---|
| FR-D250.1 | The child MCP server inherits the full parent process.env so it can find its own auth. |
| Source | specs/10-gmail-draft-connector/plan.md |

#### D251. Child stderr captured and never shown
| ID | Requirement |
|---|---|
| FR-D251.1 | Child stderr is captured and never shown or stored; errors name only the exit status and the variable (NFR-SEC1). |
| Source | specs/10-gmail-draft-connector/plan.md |

#### D252. assertAllowedTool is internal
| ID | Requirement |
|---|---|
| FR-D252.1 | The guard assertAllowedTool(name) is internal to mcp-connector.ts and not part of the package API; tests import it, and the safety test imports ALLOWED_MCP_TOOLS only. |
| Source | specs/10-gmail-draft-connector/plan.md |

#### D253. isError result is always a failure
| ID | Requirement |
|---|---|
| FR-D253.1 | An isError: true result is a failure even if it carries a draft id; no draft id is returned and nothing is retried (extends FR-D20.4). |
| Source | specs/10-gmail-draft-connector/plan.md |
| Amends or extends | FR-D20.4 |

#### D254. Missing create_draft detected before call
| ID | Requirement |
|---|---|
| FR-D254.1 | A missing create_draft tool is detected with tools/list before the call and fails with exit 3 (extends FR-D20.4). |
| Source | specs/10-gmail-draft-connector/plan.md |
| Amends or extends | FR-D20.4 |

#### D255. Raw result fallback for structuredContent
| ID | Requirement |
|---|---|
| FR-D255.1 | If the installed SDK type lacks structuredContent, the draft id is read from the raw result object; the contract does not change (relates to the SDK result type check). |
| Source | specs/10-gmail-draft-connector/plan.md |

#### D256. Draft id validity check
| ID | Requirement |
|---|---|
| FR-D256.1 | A draft id is valid when it is a non-empty string after trimming; no format check is applied. |
| Source | specs/10-gmail-draft-connector/plan.md |

#### D257. Blank to treated as absent
| ID | Requirement |
|---|---|
| FR-D257.1 | A to that is empty or whitespace is treated as absent and omitted from the arguments (extends FR-D6.3). |
| Source | specs/10-gmail-draft-connector/plan.md |
| Amends or extends | FR-D6.3 |

#### D258. Test file locations
| ID | Requirement |
|---|---|
| FR-D258.1 | New connector tests go in tests/unit/connector.test.ts with fixture tests/fixtures/fake-gmail-mcp/server.mjs; safety.test.ts is not edited. |
| Source | specs/10-gmail-draft-connector/plan.md |

#### D259. Existing safety test names kept
| ID | Requirement |
|---|---|
| FR-D259.1 | Existing safety.test.ts test names stay unchanged; new tests use the [TC-xx] name prefix. |
| Source | specs/10-gmail-draft-connector/plan.md |

#### D260. Sequential connector calls
| ID | Requirement |
|---|---|
| FR-D260.1 | Connector calls are sequential, one connector call per owner (spec 09). |
| Source | specs/10-gmail-draft-connector/plan.md |

#### D261. Subject and body passed as strings
| ID | Requirement |
|---|---|
| FR-D261.1 | Subject and body are passed as JS strings through MCP JSON with no extra encoding; a non-ASCII test is optional. |
| Source | specs/10-gmail-draft-connector/plan.md |

#### D262. No retry on any failure
| ID | Requirement |
|---|---|
| FR-D262.1 | No retry is made on any failure, including transient network errors (FR-F5, rule 8). |
| Source | specs/10-gmail-draft-connector/plan.md |

#### D263. Manual smoke test run by user
| ID | Requirement |
|---|---|
| FR-D263.1 | The user runs T38 with their own server and Gmail account, then confirms the draft is in Drafts and nothing is in Sent; the agent does not run it. |
| Source | specs/10-gmail-draft-connector/plan.md |

#### D264. Store path precedence
| ID | Requirement |
|---|---|
| FR-D264.1 | `--store` beats `ACTIONTRACK_STORE`, which beats the default path; relates to D17.2 (which does not state the order) and D59.1. |
| Source | specs/11-cli-conventions/plan.md |

#### D265. Empty store env var
| ID | Requirement |
|---|---|
| FR-D265.1 | An empty `ACTIONTRACK_STORE` is treated as unset. |
| Source | specs/11-cli-conventions/plan.md |

#### D266. Relative store path base
| ID | Requirement |
|---|---|
| FR-D266.1 | A relative `--store` or `ACTIONTRACK_STORE` path is resolved against the current working directory. |
| Source | specs/11-cli-conventions/plan.md |

#### D267. JSON output purity
| ID | Requirement |
|---|---|
| FR-D267.1 | With `--json`, stdout holds only the JSON document and warnings and errors stay on stderr (relates to D15.5, NFR-O3). |
| Source | specs/11-cli-conventions/plan.md |

#### D268. No version flag
| ID | Requirement |
|---|---|
| FR-D268.1 | There is no `--version` or `-V`, and an unknown flag exits 2. |
| Source | specs/11-cli-conventions/plan.md |

#### D269. No-command behaviour
| ID | Requirement |
|---|---|
| FR-D269.1 | When no command is given, help is printed to stdout and the exit code is 2. |
| Source | specs/11-cli-conventions/plan.md |

#### D270. Unknown command or flag
| ID | Requirement |
|---|---|
| FR-D270.1 | An unknown command or unknown flag exits 2. |
| Source | specs/11-cli-conventions/plan.md |

#### D271. Impossible --today date
| ID | Requirement |
|---|---|
| FR-D271.1 | `--today` with a valid format but an impossible date (for example `2026-02-30`) exits 2 and the message gives the valid format (relates to D54.1). |
| Source | specs/11-cli-conventions/plan.md |

#### D272. Error and exit-code ownership
| ID | Requirement |
|---|---|
| FR-D272.1 | Commands throw `ActiontrackError` subclasses for errors and may return `ExitCode` only for OK and WARNINGS, and only `cli/index.ts` maps them to exit codes (relates to D20, D62). |
| Source | specs/11-cli-conventions/plan.md |

#### D273. followup owner or --all
| ID | Requirement |
|---|---|
| FR-D273.1 | `followup` with neither or both of `<owner>` and `--all` exits 2 with a message naming the two valid forms (relates to spec 09 items 1-2). |
| Source | specs/11-cli-conventions/plan.md |

#### D274. Gmail MCP command unset
| ID | Requirement |
|---|---|
| FR-D274.1 | `followup` exits 2 with a message naming `ACTIONTRACK_GMAIL_MCP_CMD` when that variable is unset at run time. |
| Source | specs/11-cli-conventions/plan.md |

#### D275. EPIPE on stdout
| ID | Requirement |
|---|---|
| FR-D275.1 | EPIPE on stdout exits 0 silently, and any other stdout write error exits 4. |
| Source | specs/11-cli-conventions/plan.md |

#### D276. Today is local date
| ID | Requirement |
|---|---|
| FR-D276.1 | "Today" is the system local date and `--today` overrides it, which closes NFR-C4 under D1.3. |
| Source | specs/11-cli-conventions/plan.md |

#### D277. Full task text in list
| ID | Requirement |
|---|---|
| FR-D277.1 | `list` prints full task text with no truncation, as plain aligned columns (relates to D65.2). |
| Source | specs/11-cli-conventions/plan.md |

#### D278. list tie-break
| ID | Requirement |
|---|---|
| FR-D278.1 | `list` breaks equal due dates by ascending id (relates to D15.3, NFR-A9). |
| Source | specs/11-cli-conventions/plan.md |

#### D279. Default store path
| ID | Requirement |
|---|---|
| FR-D279.1 | The default store is `.actiontrack/items.json` under the working directory (D59.1), and spec 05 owns the exact name. |
| Source | specs/11-cli-conventions/plan.md |

### Resolved question index (after D1 to D42)
**Resolved (FRD):** OQ-01, 02, 03, 05, 07, 08, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 44, 45, 46, 47, 48, 49, 50, 51. NFRD OQ-61, OQ-65 and OQ-70 are resolved.
**Also resolved by D36 to D42:** OQ-04 and OQ-09 (meeting date part).
**Partly resolved:** OQ-06 (owner forms beyond D24), OQ-09 (line number per item), OQ-29 (display of same-first-name owners in `list` and drafts), OQ-60 (UTF-8 only is decided, other encodings are not).
**Still open:** the "Still open" rows inside D1 to D42. The NFRD and BRD questions are now resolved (NFRD section 13, BRD section 11).

> Corrections to earlier text: D21 amends D2.1 and D11.1. D22 clarifies D2.2. D26 amends D12. D28 amends D3.1. D34 amends D10.2. The earlier statement that the sample folder had "31 of 33" labelled notes was wrong. The folder has 35 `.md` files: 30 labelled, 2 YAML, 3 with no header.

> Where a "Still open" note in D1 to D8 is answered by a later decision, the later decision wins.

## 10. Revision note

BRD section 11 once used OQ-40 to OQ-45 for business-level questions, which clashed with FRD numbers. All BRD-level questions are now resolved (BRD section 11, B1 to B4), so no renumbering is needed.
