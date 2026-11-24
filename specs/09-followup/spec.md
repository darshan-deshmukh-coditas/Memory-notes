# Spec 09: `actiontrack followup <owner> | --all`

Builds one follow-up email per owner and creates it as a Gmail **draft** through the connector (spec 10). It never sends.

| Field | Value |
|---|---|
| Business reqs | BR-06, BR-07, BR-09, BR-10 |
| FRD | FR-F1 to F13, AC-F1 to F3, D6, D7, D16.3, D18, D19, D20, D25.3, D35, D39.3, D42.3, D51, D53, D56 |
| NFRD | NFR-S1 to S3, R4, M3, O1, O2, NFR-A10 |
| Modules | `cli/commands/followup.ts`, `email/followup-template.ts` (`renderFollowup`), `email/connector.ts` (interface only) |
| Tests | `tests/unit/commands.test.ts` (followup section), `tests/unit/safety.test.ts` |

## Usage
```
actiontrack followup <owner> [--force] [--store <path>] [--today <YYYY-MM-DD>]
actiontrack followup --all   [--force] [--store <path>] [--today <YYYY-MM-DD>]
```

## Behaviour

### Who gets a draft (D7, D16.3, D25.3, D42.3)
1. `followup <owner>` makes a draft for one person. The argument is resolved like `--owner`: a full name (case-insensitive) or a first name matching exactly one person; a first name matching several people is an error, exit 2, listing the choices (D4.4).
2. `followup --all` makes one draft per owner who has open or overdue items.
3. Both `<owner>` and `--all`, or neither, is a usage error, exit 2 (see Defaults).
4. The owner labels `(no owner)`, `(group)`, `(ambiguous)` and `(unresolved)` never get a draft. `followup none` (and the other three tokens) is a usage error. `--all` skips these items and prints a **count** of the skipped items (D16.3).
5. An owner with nothing open or overdue gets **no draft** and a message; exit 0 (D7.3). `--all` simply omits them.

### Which items (D1, D44, FR-F2, FR-F3)
6. The email lists the owner's `overdue` items, then `open` items, as computed on today (`--today` or system date). Done items are never listed.

### The email (D19, D39.3)
7. **Subject**: `Follow-up: your open action items (N)`, where N is the number of items listed (see Defaults).
8. **Greeting** uses the owner's **first name**.
9. **Body**: an `Overdue` list first, then an `Open` list; a list with no items is left out. Each entry shows the task, the due date (or that there is none), the meeting date and the source file. For a merged item the meeting date and source are the **latest** ones (D39.3). Entries in each list are ordered by due date, undated last, ties by id.
10. A polite closing and **no signature** (D19.4).

### Recipient (D6, D18, D56)
11. The recipient is the person's email from a note's attendee list; if notes disagree, the most recent meeting's email is used and a warning is printed (D56.2). Otherwise it comes from `owners.json`. If neither exists the draft is created **with no recipient** and a warning is printed (D6.3).

### Repeat runs (D51)
12. If the store has any draft record for the owner, the command warns (showing the earlier draft id and date), creates no draft, and the run counts as a warning (exit 1). `--force` creates a new draft anyway and adds a record. The earlier Gmail draft is never touched (D51.3).

### Creating drafts (D45, D53)
13. Each draft is created with one connector call (spec 10). After a **successful** call the tool writes a `drafts` record: owner, draft id, time, item ids (D51.1).
14. Failure (connector missing, unreachable, unauthorised, or an error result): a clear message on stderr, nothing is sent, no record is written, stored items are unchanged (D20.5, NFR-R4). `followup <owner>` exits 3.
15. `--all` **continues** after a failed owner, reports every failure on stderr, still reports the drafts that were created, and exits 3 at the end (D53.2).
16. **No send path exists** under any option, error or retry (FR-F5, NFR-S1, AC-F3). There is no retry.

### Output (D35, NFR-O2)
17. For each draft, print the owner, the recipient or `(no recipient)`, the item count and the Gmail draft id (D35.1). `--all` also prints a **total line** (D35.2) and the skipped-item count from rule 4.

### Exit codes
18. `0` all requested drafts created and no warnings; `1` completed with warnings (no recipient, repeat skipped, email conflict, malformed owners file); `2` bad arguments or unknown or ambiguous owner; `3` Gmail failure. Highest wins (D53.1).

## Acceptance tests
- `AC-F2` one draft per owner with every open and overdue item and no done item
- `D19.1`, `D19.2`, `D19.3`, `D19.4` subject, first-name greeting, Overdue before Open, no signature
- `D39.3` merged item shows the latest meeting date and source
- `AC-F1`, `AC-F3`, `NFR-A10` only `createDraft` is ever called, no send exists (with `safety.test.ts`)
- `D7.1`, `D7.2`, `D7.3` single owner, `--all`, nothing open gives no draft
- `D16.3`, `D25.3`, `D42.3` `--all` skips label items and prints the count
- `D4.4` ambiguous first name errors and lists the choices
- `D6.1`, `D6.2`, `D6.3`, `D56.2` recipient order, `(no recipient)` plus warning, email conflict warning
- `D51.2`, `D51.3` repeat warns and creates nothing; `--force` creates another and adds a record
- `D20.5`, `NFR-R4` connector failure: exit 3, store unchanged, no record
- `D53.2` `--all` continues after one failure and exits 3
- `D35.1`, `D35.2` per-draft output and total line

## Defaults to confirm
- P20. `followup` with both `<owner>` and `--all`, or neither, is a usage error (exit 2). The FRD assumed this ("assumed yes") but did not decide it.
- P21. N in the subject is the number of items listed in the email.
- P22. Exact greeting and closing wording is a template detail (for example `Hi Priya,` and `Thanks,`). Tests assert structure, not wording.
- P23. `followup none|group|ambiguous|unresolved` is a usage error, exit 2.
- P24. The "nothing to chase" message is `<name> has no open or overdue items.`
- P25. A missing `ACTIONTRACK_GMAIL_MCP_CMD` is a Gmail connector failure (exit 3) with a message that names the variable.
