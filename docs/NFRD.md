# Non-Functional Requirements Document (NFRD): actiontrack

| Field | Value |
|---|---|
| Document | NFRD-actiontrack |
| Version | 0.1 (Draft for review) |
| Date | 2026-11-24 |
| Audience | Evaluators / reviewers |
| Parent | BRD.md |
| Companion | FRD.md |
| Technology | Not specified, per the requester. |
| Decisions | v0.5. N1 to N4 (section 13) fix the quality bar, performance, platform and data handling. v0.4 applies FRD decisions D1 to D35 (D21 to D35 follow the sample-folder review). Header formats, ignored contexts, the skip report and empty-folder behaviour (exit 2) are in FRD D21 to D35. Earlier note, v0.3: applies FRD decisions D1 to D20. Effects here: UTF-8 is the supported encoding (narrows OQ-60 and NFR-R5). A `--today` override is required (supports NFR-M2). The Gmail draft may be created with no recipient and a warning (NFR-R4). **Exit codes are fixed** (resolves OQ-61): 0 success, 1 completed with warnings, 2 bad arguments or missing folder, 3 Gmail connector failure (FRD D20, replaces NFR-R6). **JSON output** is required for `list` (resolves OQ-65; FRD D15). **Idempotent re-ingest** and sequential, never-reused ids apply to NFR-D3 and NFR-D4 (FRD D13, D14). The store is a local human-readable file with an overridable path (FRD D17), which affects NFR-SEC5 and OQ-66. A repeat `followup` does not create a duplicate draft without `--force` (FRD D19). |

**Conventions.**
- The scenario states very few non-functional constraints. Requirements marked **Stated** come from the scenario. Requirements marked **Derived** follow necessarily from a stated item. Requirements marked **Proposed** are suggested quality targets. They are **not** from the scenario and need approval before they bind anyone.
- No numeric target has been invented. Where a number would be needed, the requirement is written as a measurable criterion with the value left as `TBC` and linked to an open question.

---

## 1. Safety and control

| ID | Requirement | Basis | Verification |
|---|---|---|---|
| NFR-S1 | The tool shall never send an email. No code path, flag, retry, or error handler may call a send operation. | Stated | Code inspection and a test that fails if a send call is reachable |
| NFR-S2 | The Gmail interaction shall be limited to creating drafts. | Stated | Review of the connector calls used |
| NFR-S3 | Every email produced shall require explicit human action in Gmail to be sent. | Derived | Manual check that a created draft stays in Drafts |

## 2. Reliability and robustness

| ID | Requirement | Basis | Verification |
|---|---|---|---|
| NFR-R1 | A malformed note shall never crash the tool or abort processing of other notes. | Stated | Run on the sample folder, including its deliberately malformed files |
| NFR-R2 | Every skipped note shall be reported. None shall be skipped silently. | Stated | Compare count of skipped files to count reported |
| NFR-R3 | A failure on one note, item or owner shall not corrupt or lose items already stored. | Derived | Fault injection during ingest |
| NFR-R4 | A failure to reach Gmail shall not affect stored data and shall not send anything. | Derived | Simulate connector failure |
| NFR-R5 | Unexpected input (empty files, very long lines, unusual characters, mixed encodings or line endings) shall be handled without an unhandled error. | Derived from "long and messy" notes | Test with messy samples. Encoding rules need OQ-60. |
| NFR-R6 | Failures shall produce a clear message and a non-zero exit code. The code scheme is open. | Proposed | OQ-61 |

## 3. Data integrity and accuracy

| ID | Requirement | Basis | Verification |
|---|---|---|---|
| NFR-D1 | Each action item shall be traceable to its source file. | Stated | Spot-check items against notes |
| NFR-D2 | Due dates shall be stored as real calendar dates, never as free text. | Stated | Inspect stored values |
| NFR-D3 | Parsing shall be deterministic: the same notes and the same reference date shall always give the same items, ids and statuses. | Derived | Re-run and compare |
| NFR-D4 | Re-ingesting a folder shall not silently lose or duplicate data. The exact behaviour is defined by FRD OQ-24 and OQ-25. | Derived | Ingest twice and compare |
| NFR-D5 | Duplicate handling shall not merge items that are different. A false merge hides work, so the rule needs a defined error tolerance. | Derived | Sample check NFR-A5, and a test that wording differences ("first" and "updated" wireframes) stay separate (N1) |
| NFR-D6 | Item status (done) shall persist between runs. | Derived | Run `done`, restart, then `list` |
| NFR-D7 | 100% of the real checkbox items in the sample shall be captured, with no trap lines ingested and no false merges (N1). | Decided | Sample checks NFR-A4 to NFR-A6 |

## 4. Performance and scalability

The scenario gives no volume or speed targets beyond a sample folder of 30+ files.

| ID | Requirement | Basis | Verification |
|---|---|---|---|
| NFR-P1 | `ingest` shall complete on the 35-note sample folder in **under 5 seconds**. | Decided (N2) | Timed run |
| NFR-P2 | `list` and `done` shall respond in **under 1 second**. | Decided (N2) | Timed run |
| NFR-P3 | The tool shall handle at least **500 notes and 5,000 action items**. | Decided (N2) | Generated dataset |
| NFR-P4 | Notes up to **1 MB each** shall be processed without failure. `followup` time depends on Gmail and is not bounded. | Decided (N2) | Large-note test |

## 5. Usability (CLI)

| ID | Requirement | Basis | Verification |
|---|---|---|---|
| NFR-U1 | The tool shall be invoked as `actiontrack` with the four commands `ingest`, `list`, `done`, `followup`. | Stated | Run each command |
| NFR-U2 | The filters `--owner`, `--status open\|done\|overdue` and `--due-before <date>` shall exist as named. | Stated | Run each filter |
| NFR-U3 | Invalid arguments, such as an unknown status value or a bad date, shall give a clear message that says what was wrong and the valid options. | Proposed | Negative tests |
| NFR-U4 | Built-in help shall describe each command and option. | Proposed | `--help` check |
| NFR-U5 | Output shall be readable in a terminal. A machine-readable option is open. | Proposed | OQ-65 |
| NFR-U6 | Progress and the skip report shall be visible during or after ingest. | Derived from "report" | Run on malformed sample |

## 6. Security and privacy

The notes contain names, attendees and work commitments, and the tool handles email addresses and Gmail access.

| ID | Requirement | Basis | Verification |
|---|---|---|---|
| NFR-SEC1 | The tool shall not store Gmail credentials in plain text in the project or in the notes store. Authentication is delegated to the MCP connector. | Proposed | Review |
| NFR-SEC2 | Meeting content and personal data shall stay local, except for the content of drafts the user asks to create in Gmail. | Derived | Review of network calls |
| NFR-SEC3 | The tool shall only read from the folder given to `ingest`. | Derived | Review |
| NFR-SEC4 | Note content shall be treated as data and never executed or interpreted as commands. | Proposed | Test with hostile note text |
| NFR-SEC5 | The store holds names and tasks only, with no credentials. It is kept until the user deletes it, with standard file permissions and no encryption at rest (N4). | Decided | Review |

## 7. Compatibility and portability

| ID | Requirement | Basis | Verification |
|---|---|---|---|
| NFR-C1 | The tool shall run on **Windows 10+, macOS and Linux**, handling paths, line endings and terminal output on each. Runtime and installation method stay unspecified (N3). | Decided | Run on each OS |
| NFR-C2 | The Gmail interaction shall use the **Gmail MCP connector**. | Stated | Review |
| NFR-C3 | Notes are markdown (`.md`). Markdown dialect and encoding support are not defined. | Stated / gap | OQ-60 |
| NFR-C4 | Date handling shall be explicit about timezone and locale. The rule is open. | Derived | OQ-18 |

## 8. Maintainability and testability

| ID | Requirement | Basis | Verification |
|---|---|---|---|
| NFR-M1 | Parsing, date resolution, de-duplication, storage and email drafting shall be separable so each can be tested alone. | Proposed | Review of structure |
| NFR-M2 | The current date shall be injectable so date resolution and overdue logic can be tested repeatably. | Derived from NFR-D3 | Test with fixed dates |
| NFR-M3 | The Gmail connector shall be replaceable by a test double, so `followup` can be tested without sending or touching a real mailbox. | Derived from NFR-S1 | Test with stub connector |
| NFR-M4 | A test set shall cover each edge case E1 to E4. | Derived | Test run |
| NFR-M5 | Automated tests shall cover E1 to E4, date resolution, overdue logic and a stubbed Gmail connector. No numeric coverage percentage is required (N1). | Decided | Test run |

## 9. Observability and auditability

| ID | Requirement | Basis | Verification |
|---|---|---|---|
| NFR-O1 | The tool shall tell the user what it did after each command, such as counts of notes read, skipped and items stored, drafts created. | Derived | Run each command |
| NFR-O2 | Each created draft shall be identifiable afterwards (for example by an id or link). | Derived | Run `followup` |
| NFR-O3 | Warnings and errors go to **stderr**. There is **no log file** (N4). | Decided | Run commands |

## 10. Acceptance of the sample dataset

The sample `notes/` folder is now present (inspected 2026-11-24). It holds **35 `.md` files and 1 `.txt` file**. Acceptance criteria below use it. Expected counts were taken from reading the notes and must be confirmed against the first working build.

| ID | Criterion |
|---|---|
| NFR-A1 | `ingest` runs to completion on the full sample folder with no crash. |
| NFR-A2 | Exactly **4 notes are skipped and reported**: `2026-09-09-notes-final-v2.md` (empty), `scratch.md` (binary, not valid UTF-8), `untitled.md` (no date), `2026-10-03-sales-pipeline.md` (`Date: sometime last week`). **31 notes are read.** |
| NFR-A3 | `2026-09-19-offsite-draft.txt` is ignored and counted as an ignored file. |
| NFR-A4 | The trap lines are **not** ingested: the block-quoted line in `2026-09-21-incident-review.md`, the code-fence line and HTML-comment line in `2026-10-09-security-review.md`, and the table row and `ACTION:` line in `2026-09-30-q4-offsite.md`. |
| NFR-A5 | Edge case E1 (duplicates): Priya Nair's "send the revised quote to Acme" (2026-09-01, 2026-09-08, 2026-09-15) appears as **one done item** with three sources. |
| NFR-A6 | Edge case E3 (same first name): bare "Priya" in `2026-09-17`, `2026-10-08` and the 2026-09-30 offsite, and bare "Rahul" in `2026-10-07` and the offsite, are stored as **ambiguous**. `Priya N.` and `Priya S.` in `2026-09-29` resolve to Priya Nair and Priya Shah. |
| NFR-A7 | Edge case E2 (no owner or date): "Someone" and "TBD" items are `(no owner)`. "Everyone" and "Team" items are `(group)`. Items such as "Sam to share the VPN guide" have no due date and are not overdue. |
| NFR-A8 | `2026-09-23-standup.md` has no attendees. "Sam" resolves to Sam Okafor through the roster and "Rahul" stays ambiguous (D23). |
| NFR-A9 | `ingest` run twice gives the same items, ids and statuses (D13). |
| NFR-A10 | `followup` produces drafts only and sends nothing. |

## 11. Constraints summary

| Type | Constraint | Source |
|---|---|---|
| Behavioural | Never send email | Scenario |
| Integration | Gmail MCP connector for drafts | Scenario |
| Interface | CLI with four named commands | Scenario |
| Input | Markdown notes in a folder | Scenario |
| Technology | Unspecified | Requester |

## 12. Open questions (non-functional)

| ID | Question |
|---|---|
| OQ-60 | **Partly resolved (FRD D5: UTF-8).** What file encodings and markdown variants must be supported (UTF-8 only, BOM, CRLF)? |
| OQ-61 | **Resolved (FRD D20).** What exit codes should the tool return for success, partial success (some notes skipped), and failure? |
| OQ-62 | **Resolved (N1).** What accuracy is required for parsing and for de-duplication, and what is the tolerance for false merges and missed items? |
| OQ-63 | **Resolved (N2).** What response-time expectations apply to each command? |
| OQ-64 | **Resolved (N2).** What maximum number of notes, note size and items must be supported? |
| OQ-65 | **Resolved (FRD D15).** Is machine-readable output (JSON, CSV) needed for `list`? |
| OQ-66 | **Resolved (N4).** Is the stored data sensitive, and what are the retention and access rules? |
| OQ-67 | **Resolved (N3).** Which operating systems, runtime and installation method apply? |
| OQ-68 | **Resolved (N1).** What testing, coverage and documentation standards apply? |
| OQ-69 | **Resolved (N4).** What logging is required, and where does it go? |
| OQ-70 | **Resolved 2026-11-24.** The sample `notes/` folder was provided. The malformed files are identified in section 10 (NFR-A2). |

---

## 13. Non-functional decisions (chosen by the requester, 2026-11-24)

| ID | Decision | Resolves |
|---|---|---|
| N1 | **Quality bar:** all ten sample checks (NFR-A1 to A10) pass. 100% of real checkbox items in the sample are captured, no trap lines are ingested, and no items that differ in wording are merged. Automated tests cover E1 to E4, date resolution, overdue logic and a stubbed Gmail connector. No numeric coverage percentage. | OQ-62, OQ-68 |
| N2 | **Performance and volume:** ingest of the sample folder under 5 seconds. `list` and `done` under 1 second. At least 500 notes and 5,000 items, with notes up to 1 MB. `followup` time is not bounded. | OQ-63, OQ-64 |
| N3 | **Platform:** Windows 10+, macOS and Linux. Runtime and installation method stay unspecified. | OQ-67 |
| N4 | **Data and logs:** local only, nothing leaves the machine except draft content sent to Gmail. No credentials in the store (Gmail auth stays in the MCP connector). Data is kept until the user deletes it. Standard file permissions, no encryption at rest. Warnings and errors go to stderr, with no log file. | OQ-66, OQ-69 |

## 14. Register of questions

| Document | Status |
|---|---|
| BRD | All questions resolved (B1 to B4). Sponsor, approvers, timeline and budget are recorded as "not provided". |
| FRD | All numbered questions resolved or narrowed by D1 to D42. Each decision lists its small leftovers under "Still open". |
| NFRD | All numbered questions resolved (N1 to N4, plus D20 for exit codes and D15 for JSON). |

**Remaining items are small, listed under each decision's "Still open" row, and none blocks a first build.**
