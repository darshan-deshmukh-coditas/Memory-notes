# Test cases: spec 09, `actiontrack followup`

Every test name starts with its TC ID in brackets, and cites the spec or FRD ID in the name or a comment (CLAUDE.md, step 2). Files:

- `tests/unit/commands.test.ts` (followup section): command and template tests. Per spec 09 "Tests" row, the template tests also live here.
- `tests/unit/safety.test.ts`: existing; must not be weakened.
- `tests/acceptance/sample-notes.test.ts`: NFR-A10 sample-folder check (shared with spec 06).

Types: **unit** (pure or with fake connector, fake clock, in-memory store), **safety**, **acceptance**, **integration** (real `McpDraftConnector` with a stub MCP server, owned by spec 10; listed here only for the cross-check). "Negative" marks a case where the expected result is that something does not happen.

Exit codes follow `specs/11-cli-conventions`: 0, 1, 2, 3, 4.

Cases marked **(to confirm)** test a recommended default from `plan.md` "Open questions". They must be finalised, or changed, once the requester answers.

## Commands and template

| TC ID | Cites | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-01 | AC-F2, FR-F1, FR-F2, FR-F4 | commands.test.ts | `[TC-01] AC-F2 one draft per owner with every open and overdue item and no done item` | unit | Store: Priya has 2 overdue, 1 open, 1 done. Fake connector | One `createDraft` call; body lists the 3 non-done items; done item absent | 0 |
| TC-02 | D19.1, D74.1 | commands.test.ts | `[TC-02] D19.1 subject is "Follow-up: your open action items (3)" for 3 listed items` | unit | As TC-01 (3 listed) | Subject equals the literal string with N = 3 | 0 |
| TC-03 | D19.2 | commands.test.ts | `[TC-03] D19.2 greeting uses the owner's first name` | unit | Owner "Priya Nair" | Greeting line contains "Priya"; the full name is not in the greeting line | - |
| TC-04 | D19.3 | commands.test.ts | `[TC-04] D19.3 Overdue list is placed before Open list` | unit | Owner with 1 overdue and 1 open | Position of overdue item text is before the open item text; the two section labels are in that order | - |
| TC-05 | D19.4 | commands.test.ts | `[TC-05] D19.4 closing is present and no signature follows it` | unit | Any owner with items | Last non-empty body line contains no owner name and no email address; a closing phrase precedes the list end | - |
| TC-06 | D39.3 | commands.test.ts | `[TC-06] D39.3 merged item shows the latest meeting date and latest source` | unit | One item, 2 sources: 2025-03-01 `a.md`, 2025-04-10 `b.md` | Entry shows 2025-04-10 and `b.md`; does not show `a.md` | - |
| TC-07 | D7.1 | commands.test.ts | `[TC-07] D7.1 followup <owner> drafts for that one owner only` | unit | Priya and Sam both have open items; `followup "Priya Nair"` | One `createDraft`, recipient for Priya only | 0 |
| TC-08 | D7.2 | commands.test.ts | `[TC-08] D7.2 --all drafts one per owner with open or overdue items and none for done-only owners` | unit | Priya (open), Sam (overdue), Lee (done only) | Two `createDraft` calls (Priya, Sam); none for Lee | 0 |
| TC-09 | D7.3 | commands.test.ts | `[TC-09] D7.3 owner with nothing open or overdue gets no draft and a message` | unit | Lee has only done items; `followup Lee` | Zero `createDraft` calls; a message is printed; no drafts record | 0 |
| TC-10 | D16.3, D25.3, D42.3 | commands.test.ts | `[TC-10] D16.3 D25.3 D42.3 --all skips no-owner, group, ambiguous and unresolved items and prints the count` | unit | Store: 1 `(no owner)`, 2 `(group)`, 1 `(ambiguous)`, 1 `(unresolved)`, plus Priya open | One draft (Priya); output shows skipped count 5 | 0 (see TC-39) |
| TC-11 | D4.4 | commands.test.ts | `[TC-11] D4.4 ambiguous first name is an error that lists the choices` | unit | `followup Priya` with roster "Priya Nair" and "Priya Shah" | Stderr lists both full names; no `createDraft`; no record | 2 |
| TC-12 | D6.1, D45.2 | commands.test.ts | `[TC-12] D6.1 recipient is the attendee email from the note` | unit | Note attendee `Priya Nair <priya@example.com>`; owner Priya | `createDraft` called with `to: "priya@example.com"` | 0 |
| TC-13 | D6.2, D18.2, D56.1 | commands.test.ts | `[TC-13] D6.2 D18.2 recipient from owners.json when no attendee email, and attendee email wins when both exist` | unit | Case A: no attendee email, owners file `{"Priya Nair": "p.file@example.com"}`. Case B: attendee `p.note@example.com` plus same file | A: `to` = file address. B: `to` = note address | 0 |
| TC-14 | D6.3 | commands.test.ts | `[TC-14] D6.3 no recipient from any source: draft has no to field, warning printed, output says (no recipient)` | unit | No attendee email, no owners file | `createDraft` request has no `to` key; stderr warning; stdout shows `(no recipient)` | 1 |
| TC-15 | D56.2, D18.3 | commands.test.ts | `[TC-15] D56.2 conflicting attendee emails: most recent meeting email is used and a warning is printed` | unit | Priya in 2025-01-05 note with `a@x.com` and 2025-03-02 note with `b@x.com` | `to` = `b@x.com`; warning on stderr; exit 1 | 1 |
| TC-16 | D51.2, D19.5 | commands.test.ts | `[TC-16] D51.2 D19.5 repeat run warns with earlier draft id and date and creates no draft` | unit | Store has `drafts` record for Priya (id `r-1`, 2025-11-01); `followup Priya` | Zero `createDraft`; stderr shows `r-1` and 2025-11-01; no new record | 1 |
| TC-17 | D51.3 | commands.test.ts | `[TC-17] D51.3 --force creates another draft and adds a record, earlier record kept` | unit | As TC-16 plus `--force` | One `createDraft`; store has 2 records for Priya; first record unchanged | 0 |
| TC-18 | D20.5, NFR-R4, D20.4 | commands.test.ts | `[TC-18] D20.5 NFR-R4 connector failure: exit 3, store file byte-identical, no drafts record` | unit | Fake connector throws GmailError on first call; `followup Priya` | Stderr clear message; store file bytes unchanged; no `drafts` record | 3 |
| TC-19 | D53.2 | commands.test.ts | `[TC-19] D53.2 --all continues after one owner fails, reports it, records the others, exits 3` | unit | Fake connector fails for Priya, succeeds for Sam | Two `createDraft` calls; Sam's record written; Priya has no record; stderr names Priya; Sam's draft id printed | 3 |
| TC-20 | D35.1, NFR-O2 | commands.test.ts | `[TC-20] D35.1 each draft prints owner, recipient or (no recipient), item count and draft id` | unit | Priya with recipient; Sam with none | Two output blocks with owner, address or `(no recipient)`, count, and fake draft id | 0 or 1 |
| TC-21 | D35.2 | commands.test.ts | `[TC-21] D35.2 --all prints a total line` | unit | Two owners drafted | One total line with 2 drafts and 5 items | 0 |
| TC-22 | D73.1 | commands.test.ts | `[TC-22] D73.1 followup with both <owner> and --all is a usage error` | unit | `followup Priya --all` | Exit 2; no `createDraft`; no record | 2 |
| TC-23 | D73.1 | commands.test.ts | `[TC-23] D73.1 followup with neither <owner> nor --all is a usage error` | unit | `followup` | Exit 2; no `createDraft` | 2 |
| TC-24 | D73.2 | commands.test.ts | `[TC-24] D73.2 followup none, group, ambiguous or unresolved is a usage error that suggests list --owner` | unit | Each of the four tokens, one case per token | Exit 2; message says there is no one to email; message contains `list --owner`; no `createDraft` | 2 |
| TC-25 | D74.1 | commands.test.ts | `[TC-25] D74.1 subject N counts overdue plus open items listed, not all owner items` | unit | Priya: 2 overdue, 3 open, 1 done | Subject `(5)` | 0 |
| TC-26 | D74.2, D20.4 | commands.test.ts | `[TC-26] D74.2 unset ACTIONTRACK_GMAIL_MCP_CMD: exit 3 naming the variable, before any draft` | unit | Deps with command unset; `followup Priya` | Exit 3; stderr contains `ACTIONTRACK_GMAIL_MCP_CMD`; no `createDraft`; no record | 3 |
| TC-27 | D51.1, D45.2 | commands.test.ts | `[TC-27] D51.1 drafts record written only after successful call, with owner, draft id, time and item ids` | unit | Fake returns `draftId: "d-9"`; fixed clock | Store has one record: owner Priya, `d-9`, clock time, item ids of listed items | 0 |
| TC-28 | AC-F3, FR-F5, NFR-S2 | commands.test.ts | `[TC-28] AC-F3 only createDraft is ever called; DraftConnector exposes no other method` | unit | Fake connector records every method call; `followup --all` on a 2-owner store | Recorded calls are only `createDraft`; the fake's type-level key set equals `createDraft` only | 0 |
| TC-29 | NFR-S2, D45.1 | safety.test.ts | `[TC-29] NFR-S2 MCP allow-list contains only create_draft` (existing) | safety | Constant | `["create_draft"]` | - |
| TC-30 | NFR-S1, AC-F3, RULE-1 | safety.test.ts | `[TC-30] NFR-S1 no source file references a send operation` (existing) | safety | All `src/**/*.ts` | No offenders | - |
| TC-31 | FR-F5, NFR-S1 | commands.test.ts | `[TC-31] FR-F5 a failed createDraft is not retried` | unit | Fake throws once for Priya | Exactly one `createDraft` call for Priya | 3 |
| TC-32 | D76.1 | commands.test.ts (stub) and integration (spec 10) | `[TC-32] D76.1 create_draft over 60 seconds is a connector failure with no record` | integration | Stub MCP server that delays past 60 s (fake timers in unit form) | Exit 3; no record; message suggests checking Gmail Drafts (Q17) | 3 |
| TC-33 | D75.1 | commands.test.ts (stub) and integration (spec 10) | `[TC-33] D75.1 unparseable draft id is a connector failure with no record` | integration | Stub returns text block that is not `{"draftId": ...}` | Exit 3; no record | 3 |
| TC-34 | D56.3 | commands.test.ts | `[TC-34] D56.3 malformed owners.json is a warning; drafts are created without recipients` | unit | Owners file is invalid JSON; `followup Priya` | Warning on stderr naming the file; draft without `to`; no crash | 1 |
| TC-35 | D59.4, D53.1 | commands.test.ts | `[TC-35] D59.4 corrupt store is exit 2, never overwritten, no draft created` | unit | Store file is invalid JSON | Exit 2; store bytes unchanged; no `createDraft` | 2 |
| TC-36 | D62.1, D62.2 | commands.test.ts | `[TC-36] D62.1 unexpected internal error (non-Gmail) is exit 4, store unchanged` | unit | Fake connector throws a plain `Error` | Exit 4; clear stderr message; store bytes unchanged | 4 |
| TC-37 | D7.3 | commands.test.ts | `[TC-37] D7.3 --all where no owner has open or overdue items: no draft, message, exit 0` | unit | Store with only done items and label items | Zero `createDraft`; message; skipped count printed if labels exist | 0 |
| TC-38 | rule 18, D4.4 (Q1) | commands.test.ts | `[TC-38] followup with a name that matches nobody exits 2 listing known names (to confirm)` | unit | `followup "Zed Ortiz"` | Exit 2; stderr lists known names; no `createDraft` | 2 |
| TC-39 | D20.2, D16.3 (Q8) | commands.test.ts | `[TC-39] --all with only skipped label items keeps exit 0 (to confirm)` | unit | Store: Priya has no items; one `(group)` item | Exit 0; skipped count 1 printed | 0 |
| TC-40 | D51.2, D53.2 (Q7) | commands.test.ts | `[TC-40] --all with one repeat owner warns for that owner, drafts the others, exits 1 (to confirm)` | unit | Priya has a prior record; Sam does not | One `createDraft` (Sam); warning for Priya; no record added for Priya | 1 |
| TC-41 | D51.2 (Q6) | commands.test.ts | `[TC-41] repeat detection matches the resolved owner name exactly (to confirm)` | unit | Record for "Priya Nair"; items resolved to "priya nair" | Treated as not a repeat (case-sensitive) | 0 |
| TC-42 | D39.3, D58.1 (Q13) | commands.test.ts | `[TC-42] latest source tie on meeting date picks the file name sorting last (to confirm)` | unit | Two sources, same meeting date, `a.md` and `b.md` | Shown source `b.md` | - |
| TC-43 | D62 (Q18) | commands.test.ts | `[TC-43] draft created but drafts record cannot be saved: exit 4 with the draft id on stderr (to confirm)` | unit | Fake creates `d-7`; store save throws | Exit 4; stderr contains `d-7` and owner; no duplicate draft attempted | 4 |
| TC-44 | D59.3 (Q3) | commands.test.ts | `[TC-44] missing store: --all exits 0 with nothing to chase; <owner> exits 2 (to confirm)` | unit | No store file | `--all`: exit 0, no draft. `followup Priya`: exit 2 | 0 / 2 |
| TC-45 | FR-F3, D44 | commands.test.ts | `[TC-45] FR-F3 done item past its due date is never listed` | unit | Priya: one done item due 2020-01-01 and one open item | Done item text absent from body; subject N = 1 | 0 |
| TC-46 | D19.3, rule 9 | commands.test.ts | `[TC-46] rule 9 entries ordered by due date, undated last, ties by id` | unit | Open items: id 4 undated, id 2 due 2026-12-01, id 7 due 2026-12-01 | Order: 2, 7, 4 within Open | - |
| TC-47 | D19.2 (Q11) | commands.test.ts | `[TC-47] greeting uses the first whitespace token; one-word name is used whole (to confirm)` | unit | "Priya Nair Rao" and "Madonna" | Greeting `Priya`; greeting `Madonna` | - |
| TC-48 | D19.3 | commands.test.ts | `[TC-48] undated entry shows that there is no due date` | unit | Open item with null due | Entry text states no due date (wording free; assert a no-due marker is present) | - |
| TC-49 | D19.3, D58.2 (Q12) | commands.test.ts | `[TC-49] each entry shows task, due, meeting date and file name only, not a path (to confirm)` | unit | Source stored as `notes/2025/a.md` | Body contains `a.md`, not `notes/2025/a.md` | - |
| TC-50 | NFR-SEC4 | commands.test.ts | `[TC-50] NFR-SEC4 note text containing command-like or markup text is rendered literally` | unit | Task text `rm -rf /; <b>send</b>` | Body contains the text as given; no execution; no extra items | 0 |
| TC-51 | NFR-M1 | commands.test.ts | `[TC-51] NFR-M1 email/followup-template.ts imports no store or connector implementation` | unit | Static read of the module source | Import list contains no `store/`, `mcp-connector` or `cli/` path | - |
| TC-52 | NFR-M3 | commands.test.ts | `[TC-52] NFR-M3 followup runs fully with the fake connector and no MCP process` | unit | Fake connector and in-memory store | Command completes; no child process spawned | 0 |
| TC-53 | NFR-A10, AC-F1 | acceptance/sample-notes.test.ts | `[TC-53] NFR-A10 followup on the sample folder produces drafts only and sends nothing` | acceptance | Sample `notes/` ingested into a temp store; fake connector | Only `createDraft` calls; count equals the sample's expected open and overdue owners (fixture decided in spec 06) | 0 or 1 |
| TC-54 | D51.1 vs D16.3 (Q15) | commands.test.ts | `[TC-54] --all creating zero drafts still prints a total line of zero (to confirm)` | unit | All owners have only label or done items | Total line shows 0 drafts; skipped count printed | 0 |
| TC-55 | D7.3 (Q21) | commands.test.ts | `[TC-55] --force for an owner with nothing to chase creates no draft (to confirm)` | unit | Lee has only done items; `followup Lee --force` | No `createDraft`; message; exit 0 | 0 |
| TC-56 | D19, D6.3 (Q14) | commands.test.ts | `[TC-56] stderr warnings name the owner and file, not the email address (to confirm)` | unit | Email conflict case from TC-15 | Stderr contains "Priya Nair" and file name; does not contain either address | 1 |
| TC-57 | D56.1, D18.2 (Q10) | commands.test.ts | `[TC-57] owners.json lookup by full name is case-insensitive (to confirm)` | unit | Owners file key "Priya Nair"; owner "priya nair" | `to` = file address | 0 |

## Cases in this spec that depend on other specs

| TC ID | Owner spec | Note |
|---|---|---|
| TC-29, TC-30 | spec 10 and this spec | Existing safety tests. Must stay green. |
| TC-32, TC-33 | spec 10 | Connector-level; listed here because `followup` must map them to exit 3 with no record. |
| TC-34 | spec 05 | Owners loader raises the warning; this spec must surface exit 1. |
| TC-35 | spec 05 | Corrupt store detection. |
| TC-11, TC-38 | spec 03 | Resolution rules; this spec only checks the command outcome. |

## Fixtures needed

Put new fixtures under `tests/fixtures/followup/`. Keep them synthetic (CLAUDE.md, fixtures are tiny).

1. **Fake connector** (`tests/fixtures/followup/fake-connector.ts`): implements `DraftConnector`; records each call by method name and request; returns a configurable `draftId` per call; can be set to throw a `GmailError`, throw a plain `Error`, or delay (for TC-32 with fake timers). It has no other method.
2. **In-memory store** with a fixed clock (`NFR-M2`): items for Priya (2 overdue, 1 open, 1 done, 1 merged with 2 sources), Sam (1 overdue), Lee (done only), and label items (`(no owner)`, `(group)`, `(ambiguous)`, `(unresolved)`). One variant with a prior `drafts` record for Priya (id `r-1`, 2025-11-01).
3. **Attendee sets**: Priya with email in one note; Priya with two different emails in two dates (TC-15); Priya with no email (TC-13, TC-14). Two people named Priya (TC-11).
4. **Owners file** variants: valid `{"Priya Nair": "p.file@example.com"}`; invalid JSON (TC-34); absent (TC-14).
5. **Hostile note text** (TC-50): a task containing shell-like and markup text.
6. **Sources with same meeting date** (TC-42): `a.md` and `b.md`, same date.
7. **Sample folder**: the existing `notes/` folder, for TC-53, read-only (CLAUDE.md). Use a temp copy of the store, never the source notes.
8. **Stub MCP server** for TC-32 and TC-33 belongs to spec 10's fixtures; reuse if it exists.

## Coverage check against the spec

- Acceptance bullets in `spec.md`: AC-F2 (TC-01), D19.1 to D19.4 (TC-02 to TC-05), D39.3 (TC-06), AC-F1, AC-F3, NFR-A10 (TC-28, TC-53), D7.1 to D7.3 (TC-07 to TC-09), D16.3, D25.3, D42.3 (TC-10), D4.4 (TC-11), D6.1 to D6.3, D56.2 (TC-12 to TC-15), D51.2, D51.3 (TC-16, TC-17), D20.5, NFR-R4 (TC-18), D53.2 (TC-19), D35.1, D35.2 (TC-20, TC-21), D73.1 (TC-22, TC-23), D73.2 (TC-24), D74.1 (TC-25), D74.2 (TC-26).
- Spec rules without a bullet: rule 13 (TC-27), rule 16 (TC-31), rule 17 (TC-20), rule 18 exit codes (TC-35, TC-36), rule 15 (TC-19).
- Open-question defaults: Q1 (TC-38), Q3 (TC-44), Q6 (TC-41), Q7 (TC-40), Q8 (TC-39), Q10 (TC-57), Q11 (TC-47), Q12 (TC-49), Q13 (TC-42), Q14 (TC-56), Q15 (TC-54), Q17 (TC-32), Q18 (TC-43), Q21 (TC-55).
- Negative cases: TC-09, TC-14 (no `to`), TC-18, TC-22, TC-23, TC-24, TC-26, TC-31, TC-45, TC-28, TC-29, TC-30, TC-37, TC-41.
