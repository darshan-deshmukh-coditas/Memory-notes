# Business Requirements Document (BRD): actiontrack

| Field | Value |
|---|---|
| Document | BRD-actiontrack |
| Version | 0.1 (Draft for review) |
| Date | 2026-11-24 |
| Audience | Evaluators / reviewers |
| Companion documents | FRD.md, NFRD.md |
| Status | Draft v0.4. Thirty-five functional decisions (D1 to D35) were confirmed by the requester and are recorded in FRD.md section 11. Together they settle the handling of BR-04, BR-06, BR-08, BR-09, BR-10 and BR-11. The business-level questions are settled in section 11 (B1 to B4), except sponsor, approvers, timeline and budget, which were not provided. |

**Conventions.** Anything taken directly from the source scenario is stated as fact. Anything the scenario does not state is logged in section 11 as an Open Question (OQ-xx). No gap has been filled by assumption. Where the scenario text is truncated, this is flagged.

---

## 1. Purpose

This document defines the business need for **actiontrack**, a command-line tool that reads team meeting notes, tracks the action items found in them, and drafts follow-up emails for human review.

## 2. Background and problem statement

The team records meeting notes as markdown files. As these files accumulate:

1. Action items get lost.
2. Follow-up emails are written late, or not at all.

There is currently no single view of who owes what, by when, or what is overdue.

## 3. Business objectives

| ID | Objective | Success indicator |
|---|---|---|
| BO-1 | Make action items from meeting notes visible in one place | Every action item in ingested notes is retrievable with its owner, task, due date, source and status |
| BO-2 | Reduce items lost between meetings | Open and overdue items can be listed and filtered on demand |
| BO-3 | Make follow-up timely and low-effort | A follow-up email draft per owner can be produced with a single command |
| BO-4 | Keep a human in control of outbound communication | No email is ever sent by the tool. It only creates drafts for review |
| BO-5 | Tolerate messy real-world input | Bad notes and ambiguous items do not stop processing or corrupt results |

The scenario gives no targets for BO-1 to BO-5. By decision B4, success means the sample acceptance checks (NFRD section 10) pass and zero emails are ever sent.

## 4. Scope

### 4.1 In scope (from the scenario)

- A CLI named `actiontrack` with four commands: `ingest`, `list`, `done`, `followup`.
- Parsing of `.md` meeting notes in a given folder.
- Storage of action items with owner, task, due date (resolved to a real date), source file and status.
- Filtering by owner, status (open, done, overdue) and due date.
- Marking items as done.
- Drafting follow-up emails, one per owner, covering open and overdue items, through the Gmail MCP connector.
- Handling of the edge cases in section 8.
- Use of the sample `notes/` folder (30+ files, some long and messy, a few deliberately malformed).

### 4.2 Out of scope (from the scenario)

- **Sending email.** The tool never sends.

### 4.3 Not stated in the scenario

The source excludes only sending email. By decision B2 the following are also **out of scope**: reminders or scheduling, calendar sync, a multi-user or shared store, non-Gmail providers, a UI, editing source notes, exports other than `list --json`, and auto-detecting new notes.

## 5. Stakeholders

| Stakeholder | Interest | Source |
|---|---|---|
| Team members who own action items | Know what they owe and when | Implied by the scenario |
| Meeting organisers / note takers | Notes become a tracked, reliable record | Implied by the scenario |
| Person running `actiontrack` and reviewing drafts | Controls what is sent | Implied ("for review") |
| Evaluators / reviewers | Judge the solution against the scenario | Stated by the requester |

Named sponsor, product owner and approvers were **not provided** (B4). The tool is run by a single user on a local machine (B3).

## 6. Business requirements

| ID | Business requirement | Objective | Priority |
|---|---|---|---|
| BR-01 | The business shall be able to load all meeting notes from a folder of markdown files into a tracked set of action items. | BO-1 | Must |
| BR-02 | Each tracked item shall record owner, task, due date (resolved to a real calendar date), source file and status. | BO-1 | Must |
| BR-03 | Users shall be able to view items and narrow them by owner, status and due date. | BO-2 | Must |
| BR-04 | Overdue items shall be identifiable as a distinct status. | BO-2 | Must |
| BR-05 | Users shall be able to record that an item is complete. | BO-2 | Must |
| BR-06 | The tool shall prepare one follow-up email per owner covering that owner's open and overdue items. | BO-3 | Must |
| BR-07 | Follow-up emails shall be created as Gmail drafts through the Gmail MCP connector and shall never be sent by the tool. | BO-3, BO-4 | Must |
| BR-08 | The same action item mentioned in several meetings shall not be tracked or chased multiple times. | BO-1, BO-3 | Must |
| BR-09 | Items with a missing owner or a missing due date shall still be captured and not discarded. | BO-1, BO-5 | Must |
| BR-10 | Two different people who share a first name shall not be confused with each other. | BO-1, BO-3 | Must |
| BR-11 | Malformed notes shall be skipped and reported. They shall not crash the tool or block valid notes. | BO-5 | Must |

> BR-08 to BR-11 restate the four edge cases required by the scenario. The scenario only says the tool "must handle" them. The exact handling rules are open (see OQ-20 to OQ-33).

## 7. Business rules (stated in the scenario)

| ID | Rule |
|---|---|
| RULE-1 | The tool must never send email. |
| RULE-2 | Follow-up drafts are created through the Gmail MCP connector. |
| RULE-3 | A malformed note is skipped and reported. It is never a reason to crash. |
| RULE-4 | Due dates are resolved to a real date, not stored as free text such as "Friday". |
| RULE-5 | Follow-up content is one email per owner covering open and overdue items. |

## 8. Required edge-case coverage

| # | Edge case (from scenario) | Linked requirement |
|---|---|---|
| E1 | Duplicate items repeated across several meetings | BR-08 |
| E2 | Items with no owner or no date | BR-09 |
| E3 | Two people with the same first name | BR-10 |
| E4 | Malformed notes: skip, report, don't crash | BR-11 |

## 9. Assumptions, dependencies and constraints

**Assumptions.** None made. All unknowns are in section 11.

**Dependencies (from the scenario).**
- A Gmail MCP connector available to the tool at runtime.
- The sample `notes/` folder. It is now present: **35 `.md` files and 1 `.txt` file**, including an empty file, a binary file, a headerless file, and a note with an unparseable date. It was inspected on 2026-11-24, and FRD decisions D21 to D35 reflect it.

**Constraints (from the scenario).**
- No sending of email.
- Must run as a CLI.

## 10. Benefits and risks

**Expected benefits:** fewer lost action items, faster follow-up, a single source of truth for open work, and a review step that keeps people in control of email.

| Risk | Impact | Related question |
|---|---|---|
| Parsing misreads or drops items in messy notes | Lost or wrong items | OQ-01 to OQ-12 |
| Wrong date resolution, for example "Friday" | Wrong overdue status and wrong chasing | OQ-13 to OQ-19 |
| Wrong owner match for same-first-name people | Email drafted to the wrong person | OQ-26 to OQ-29 |
| Gmail connector unavailable or unauthorised | No drafts produced | OQ-34 to OQ-39 |
| Incorrect de-duplication merges distinct items | Items hidden | OQ-20 to OQ-25 |

## 11. Business decisions (previously open questions)

Chosen by the requester on 2026-11-24. Functional and non-functional decisions are in **FRD.md section 11** (D1 to D42) and **NFRD.md section 13** (N1 to N4).

| ID | Decision | Resolves |
|---|---|---|
| B1 | **Priority:** BR-01 to BR-11 are all **Must**, because the scenario requires each command and edge case. | OQ-43 |
| B2 | **Out of scope:** sending email (from the scenario), plus by decision: reminders or scheduling, calendar sync, multi-user or shared store, non-Gmail providers, a UI, editing source notes, exports other than `list --json`, and auto-detecting new notes. | OQ-41 |
| B3 | **Users:** a **single user** runs the CLI on their **own machine** with a local store. Follow-up drafts go to that person's Gmail. Team members receive the emails and do not use the tool. | OQ-44 |
| B4 | **Success targets:** success means the sample acceptance checks (NFRD section 10) pass and **zero emails are ever sent**. **Sponsor, approvers, timeline and budget were not provided** and are recorded as such. They are not invented. | OQ-40, 42, 45 |

**Remaining gap:** sponsor, approvers, timeline and budget. The requester chose to leave them as "not provided".

## 12. Approval

| Role | Name | Decision | Date |
|---|---|---|---|
| Sponsor | Not provided | | |
| Business owner | Not provided | | |
| Reviewer | Not provided | | |
