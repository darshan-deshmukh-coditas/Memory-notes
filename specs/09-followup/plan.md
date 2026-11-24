# Plan: spec 09, `actiontrack followup`

Planning only. No code, test or doc outside this folder is changed by this plan.
Source of truth: `spec.md` in this folder. Decisions: `docs/FRD.md` section 11 (D1..D76). Choices the spec left open are recorded in "Decisions".

## Goal

`actiontrack followup <owner> | --all` builds one follow-up email per owner (open and overdue items only) and creates it as a **Gmail draft** through `DraftConnector.createDraft`. It never sends. It records each created draft in the store so a repeat run can warn (D51).

## Scope

In scope (this spec):
- Argument handling for `followup` (D73, D4.4, D7).
- Item selection: open and overdue for the owner, done excluded (FR-F2, FR-F3, D1, D44).
- Pure rendering of subject and body in `email/followup-template.ts` (D19, D39.3, D65.3, D74.1).
- Recipient resolution order: attendee email, then owners file, else no recipient (D6, D18, D56).
- Repeat-run detection and `--force` (D51).
- One `createDraft` call per owner, no retry (FR-F5, D53.2).
- Writing a `drafts` record only after a successful call (D51.1).
- Output lines and total line (D35), exit codes 0, 1, 2, 3, 4 (D20, D53, D62).
- Safety tests: `tests/unit/safety.test.ts` (existing, must not be weakened).

Out of scope (owner in brackets):
- The MCP stdio client, tool allow-list enforcement at runtime, draft id parsing, 60 s timeout: `McpDraftConnector` (spec 10, D45, D75, D76).
- Store file format, atomic write, `drafts` record type, owners file loader, corrupt-store handling: spec 05 (D14, D17, D56, D59).
- Owner resolution and labels (`(no owner)`, `(group)`, `(ambiguous)`, `(unresolved)`): spec 03 (D4, D16, D23..D25, D41, D42).
- Owner first-name rules and roster: spec 03.
- Overdue computation and `--today` parsing: spec 02 and spec 11 (D1, D54).
- Global options and the injected clock: spec 11 (NFR-M2).
- Building the real dependencies (`McpDraftConnector`) in `cli/index.ts`: spec 10 and spec 11.
- Sample-folder acceptance run: spec 06 and `tests/acceptance/sample-notes.test.ts` (NFR-A10 is cited here, but the sample check is shared).

## Requirement map

| ID | Rule (one line) | Module | Test (see testcases.md) |
|---|---|---|---|
| FR-F1, D7.1, D7.2 | One draft per owner; `<owner>` for one, `--all` for all with open or overdue items | `cli/commands/followup.ts` | TC-07, TC-08 |
| FR-F2, FR-F3, AC-F2, D1, D44 | Overdue then open items; done never listed | `cli/commands/followup.ts` | TC-01, TC-45 |
| D7.3 | Nothing open or overdue: no draft, message, exit 0 | `cli/commands/followup.ts` | TC-09, TC-37 |
| D73.1 | Exactly one of `<owner>` or `--all`, else exit 2 | `cli/commands/followup.ts` | TC-22, TC-23 |
| D73.2 | `none`, `group`, `ambiguous`, `unresolved` as owner: exit 2 with suggestion | `cli/commands/followup.ts` | TC-24 |
| D4.4 | Ambiguous first name: exit 2, list the choices | `cli/commands/followup.ts` (via spec 03) | TC-11 |
| D16.3, D25.3, D42.3 | `--all` skips label items and prints a count | `cli/commands/followup.ts` | TC-10 |
| FR-F4, D45.1, D45.2 | Draft via `createDraft({to?, subject, body})` | `cli/commands/followup.ts`, `email/connector.ts` | TC-01, TC-12 |
| FR-F5, AC-F3, NFR-S1, NFR-S2, NFR-A10 | Only `createDraft`; no send, flag, retry or error path | `email/connector.ts`, `tests/unit/safety.test.ts` | TC-28, TC-29, TC-30, TC-31, TC-53 |
| D19.1, D74.1 | Subject `Follow-up: your open action items (N)`, N = items listed | `email/followup-template.ts` | TC-02, TC-25 |
| D19.2 | Greeting by owner's first name | `email/followup-template.ts` | TC-03, TC-47 |
| D19.3, D65.3 | Overdue list before Open list; entries show task, due, meeting date, file | `email/followup-template.ts` | TC-04, TC-46, TC-49 |
| D19.4 | Polite closing, no signature | `email/followup-template.ts` | TC-05 |
| D39.3 | Merged item shows latest meeting date and latest source | `cli/commands/followup.ts` (selection), template | TC-06, TC-42 |
| D6.1, D6.2, D18.2, D56.1 | Recipient: attendee email, then owners file | `cli/commands/followup.ts` | TC-12, TC-13 |
| D6.3 | No recipient: draft with no `to`, warning, exit 1 | `cli/commands/followup.ts` | TC-14 |
| D56.2, D18.3 | Conflicting attendee emails: most recent meeting wins, warning | `cli/commands/followup.ts` | TC-15 |
| D56.3 | Malformed owners file: warning, exit 1, drafts without recipient | `cli/commands/followup.ts` (via spec 05) | TC-34 |
| D51.1 | `drafts` record after successful call: owner, draft id, time, item ids | `cli/commands/followup.ts`, `store/store.ts` | TC-27 |
| D51.2, D19.5 | Any prior record for owner: warn, no draft, exit 1 | `cli/commands/followup.ts` | TC-16, TC-40 |
| D51.3 | `--force` creates a new draft and adds a record; earlier draft untouched | `cli/commands/followup.ts` | TC-17 |
| D74.2, D20.4 | Unset `ACTIONTRACK_GMAIL_MCP_CMD`: exit 3 naming it, before any draft | `cli/commands/followup.ts` | TC-26 |
| D20.5, NFR-R4 | Connector failure: exit 3, store unchanged, no record | `cli/commands/followup.ts` | TC-18 |
| D53.2 | `--all` continues after a failed owner, exits 3 at end | `cli/commands/followup.ts` | TC-19 |
| D76.1 | 60 s timeout is a connector failure (spec 10 owns the timer) | `email/mcp-connector.ts` | TC-32 |
| D75.1 | Unparseable draft id is a connector failure | `email/mcp-connector.ts` | TC-33 |
| D35.1, D35.2, NFR-O2 | Per draft: owner, recipient or `(no recipient)`, count, draft id; `--all` total line | `cli/commands/followup.ts` | TC-20, TC-21 |
| D53.1, D62 | Highest exit code wins; unexpected error is 4 | `cli/commands/followup.ts` | TC-35, TC-36 |
| NFR-SEC4 | Note text is data, rendered literally | `email/followup-template.ts` | TC-50 |
| NFR-M1, NFR-M3 | Template pure; connector replaceable by fake | `email/followup-template.ts`, tests | TC-51, TC-52 |

## Design approach

1. **Pure core.** `renderFollowup(owner, items, today)` in `email/followup-template.ts` takes already-selected items and returns `{subject, body}`. It does no I/O and imports neither the store nor a connector implementation.
2. **Selection.** A pure helper (exported from `cli/commands/followup.ts`) takes all items for one owner and the injected `today`, keeps `open` and `overdue` (D44), sorts overdue then open, each by due date ascending, undated last, ties by numeric id (rule 9). For a merged item, the displayed meeting date and file are the latest in `sources` (D39.3, D58.1).
3. **Imperative shell.** `followup()` in `cli/commands/followup.ts`:
   a. validate arguments (rule 3, D73.1, D73.2);
   b. load the store (spec 05) and resolve `<owner>` (spec 03); for `--all`, group open and overdue items by owner and count label items to skip (D16.3);
   c. check `ACTIONTRACK_GMAIL_MCP_CMD` before any draft is created or any owner is processed (D74.2, decision D225);
   d. for each owner in order: repeat check (D51.2) unless `--force`; resolve recipient (D6, D18, D56); render; call `createDraft` once; on success write one `drafts` record (D51.1) and print the output line; on failure record the failure and continue for `--all` (D53.2);
   e. print the total line for `--all` and the skipped count; return the highest exit code (D53.1).
4. **Dependencies are arguments.** `followup(opts, deps)` receives the store, the clock, the connector and the owners loader through `Deps`. Tests pass a fake connector and a fixed clock (NFR-M2, NFR-M3). `cli/index.ts` is the only place that builds `McpDraftConnector`.
5. **No send path.** The `DraftConnector` interface has only `createDraft`. The `followup` code calls it exactly once per owner, with no loop on error.
6. **Store writes.** Only the `drafts` record is written, after a successful call. Items are never modified by `followup` (rule 14, D20.5).

## Dependencies

- Spec 05 (store): `StoreFile`, `DraftRecord` with `itemIds` (see README "Types that must change"), atomic save, owners file loader, malformed-owners warning. Blocks T11, T13, T18, T21, T22.
- Spec 03 (owner resolution): `--owner`-style resolution, labels `(no owner)`, `(group)`, `(ambiguous)`, `(unresolved)`, roster. Blocks T10, T11.
- Spec 02 and spec 11: overdue computation and injected clock. Blocks T09.
- Spec 10 (gmail-draft-connector): the real connector, `ACTIONTRACK_GMAIL_MCP_CMD`, draft id parsing (D75), 60 s timeout (D76). This spec only uses the `DraftConnector` interface and a fake.
- `tests/unit/safety.test.ts`: must pass before and after. Blocks the release of any task that touches `src/email/`.
- Spec 11 `Deps` and `EXIT` (adds `INTERNAL: 4`, D62).

## Risks

| Risk | Effect | Mitigation |
|---|---|---|
| A second MCP tool (for example a send tool) is added to the connector | Email is sent | `ALLOWED_MCP_TOOLS` stays `["create_draft"]`; `safety.test.ts` fails on any `send` reference; TC-28 type-level check |
| Repeat `followup` run after a successful draft | Duplicate drafts in Gmail | `drafts` record checked before each owner (D51.2); `--force` is the only override (D51.3) |
| Timeout (D76) or unparseable id (D75.1) after Gmail already created the draft | No record, so a later run cannot see the draft; user may create a second one | Exit 3, message tells the user to check Gmail Drafts before re-running (decision D237) |
| Crash after draft created but before record saved (disk full, D62) | Draft exists, no record | Exit 4 with the draft id printed on stderr (decision D238) |
| Owner email or hostile note text leaks into logs | Personal data in stderr | Recipient printed only on stdout (D35.1). Warnings name the owner, not the address, where possible (decision D234). Note text is rendered as data (NFR-SEC4, TC-50) |
| Template imports store or connector | Pure core becomes untestable and may gain I/O | Static check in TC-51 |
| Wrong recipient when two people share an email or notes disagree | Draft goes to the wrong person | Most recent meeting wins with warning (D56.2); TC-15 |

## Decisions

Each decision below is settled and governs this plan. Record them in `docs/FRD.md` under their IDs (D221 to D243 for this spec) (task T02).

- **D221** `followup <owner>` with a name that is not an attendee or on the roster: exit 2, list the known owners, create no draft.
- **D222** Known owner with no open or overdue items via `followup <owner>`: message, no draft, exit 0 (D7.3).
- **D223** Store file missing: exit 2, message tells the user to run `ingest` first; no draft.
- **D224** Corrupt store: exit 2, store never overwritten, `createDraft` never called (D59.4).
- **D225** `ACTIONTRACK_GMAIL_MCP_CMD` is checked before any draft is created or any owner is processed; unset gives exit 3 naming the variable (D74.2).
- **D226** Repeat-detection key is the resolved owner name, exact string match.
- **D227** Under `--all`, a repeat owner gets a warning and no draft; other owners proceed; exit 1 (D51.2, D53.2).
- **D228** Skipped label items under `--all` do not change the exit code; the count is printed (D16.3).
- **D229** Attendee email comes from the most recent note that lists the owner. If that note has no email for them, the owners file is tried (D230); if neither gives one, the draft has no `to` field and a warning is printed (D6.3).
- **D230** Owners-file lookup uses the full name, case-insensitive; an attendee email always wins (D18.2).
- **D231** Greeting uses the first whitespace-separated token of the owner's name; a one-word name is used whole.
- **D232** Source is shown as the file name only, never the path (D58.2, NFR-SEC2).
- **D233** Two sources with the same latest meeting date: the file name that sorts last, ascending, is shown.
- **D234** Warnings name the owner and file, never an email address; addresses appear only on stdout and in the draft (D35.1).
- **D235** `--all` with zero drafts still prints the total line ("0 drafts") and the skipped count; exit 0 unless another warning applies.
- **D236** `drafts` timestamps are ISO 8601 strings from the injected clock; record shape is owned by spec 05.
- **D237** Timeout or unparseable draft id: stderr says "A draft may have been created; check Gmail Drafts before running again."; exit 3; no record.
- **D238** Draft created but the `drafts` record cannot be written: exit 4, owner and draft id printed on stderr; store otherwise unchanged.
- **D239** Subject uses the literal `(N)` form for every N (D19.1); settled by spec.
- **D240** Greeting always has a resolved owner name, since only resolved people get drafts; settled by spec.
- **D241** `--force` for an owner with nothing to chase: no draft, message, exit 0.
- **D242** The env var check lives in `followup` and reads a value passed through `Deps`; the real env read stays in `cli/index.ts`.
- **D243** Items with an unknown first name in the note (D41) get a recipient from the owners file by full name only, as in D230.

## Definition of done (summary)

Covered by the checklist at the end of `task.md`.
