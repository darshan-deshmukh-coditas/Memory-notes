# Spec 08: `actiontrack done <id>`

Marks one item as done. It changes the store only.

| Field | Value |
|---|---|
| Business reqs | BR-05 |
| FRD | FR-D1 to FR-D6, AC-D1, D3.5, D14, D32, D54, D59.3 |
| NFRD | NFR-D6, P2, R3 |
| Module | `cli/commands/done.ts` (uses `store/store.ts`) |
| Tests | `tests/unit/commands.test.ts` (done section) |

## Usage
```
actiontrack done <id> [--store <path>] [--today <YYYY-MM-DD>]
```

## Behaviour
1. `<id>` is the item's permanent id (D14). It must be a whole number of 1 or more; anything else is a usage error, exit 2.
2. A known open or overdue item is set to done in the store and saved. The message shows the item's id, owner and task (D32.4). Exit 0.
3. An **unknown id** is an error, exit 2, and nothing is changed (D32.2). This includes any id in a missing store (D59.3).
4. An item that is **already done** prints a message saying so and exits 0, with no change (D32.3).
5. `done` writes **only** to the store. It never edits the source note (D32.1).
6. A done item is no longer open or overdue. `list --status done` shows it and `list --status open` and `--status overdue` do not (D44.1, AC-D1).
7. The change persists across runs (NFR-D6). A later `ingest` never reopens it (D3.5, spec 04 rule 11).
8. A merged item is marked done as one item, whatever number of sources it has.
9. `--today` is accepted and validated like for all commands (D54.1) but has no effect here.

## Acceptance tests
- `AC-D1` after `done <id>`, `--status done` includes it; `--status open` and `--status overdue` exclude it
- `D32.2` unknown id: exit 2, store unchanged
- `D32.3` already done: message, exit 0
- `D32.4` confirmation shows owner and task
- `D32.1` the source note file is byte-identical afterwards
- `NFR-D6` the status survives a new process
- `D3.5` re-ingest does not reopen the item
- `D59.3` `done` with no store: exit 2
- `D54.1` invalid `--today` value: exit 2

## Defaults to confirm
- P31. The confirmation wording is not fixed; tests assert that the id, owner and task appear in the output.
