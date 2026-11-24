# specs/

One `spec.md` per capability (FRD D43). Docs in `docs/` stay the source of truth: every decision a spec relies on is in `docs/FRD.md` section 11 (D1 to D76). Specs cite decisions as `D<n>.<m>`.

| # | Spec | Covers |
|---|---|---|
| 01 | [note-parsing](01-note-parsing/spec.md) | files, headers, checkbox lines, malformed notes |
| 02 | [date-resolution](02-date-resolution/spec.md) | due wording, `--due-before` dates, overdue status |
| 03 | [owner-resolution](03-owner-resolution/spec.md) | owner phrases, owner labels, roster, same first name |
| 04 | [dedupe](04-dedupe/spec.md) | duplicate key, merge, idempotent re-ingest |
| 05 | [store](05-store/spec.md) | JSON store, ids, owners file, atomic write |
| 06 | [ingest](06-ingest/spec.md) | `ingest` command, report, sample-folder checks |
| 07 | [list](07-list/spec.md) | `list` filters, table, JSON |
| 08 | [done](08-done/spec.md) | `done` command |
| 09 | [followup](09-followup/spec.md) | `followup` command, email, repeat runs |
| 10 | [gmail-draft-connector](10-gmail-draft-connector/spec.md) | create-draft-only connector contract |
| 11 | [cli-conventions](11-cli-conventions/spec.md) | options, streams, exit codes, clock |

## Open decisions

None. Every default that the first draft of the specs listed (P1 to P34) was put to the requester and is now recorded as decisions D63 to D76 in `docs/FRD.md`. If the specs are silent on something, stop and ask (CLAUDE.md), then record the answer as D77 or later.

Types that must change when the specs are implemented: `Source` and `ActionItem` already match; add `itemIds` to `DraftRecord`, add `roster` to `StoreFile`, and add `INTERNAL: 4` to `EXIT` (D62).
