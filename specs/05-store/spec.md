# Spec 05: Item store

The one place that reads and writes the persistent file. Nothing else touches it.

| Field | Value |
|---|---|
| Business reqs | BR-05 (persistence), BR-02 |
| FRD | FR-D3 (done persists), D14, D17, D51.1, D56, D58, D59, D61.2 |
| NFRD | NFR-D3, D6, R3, R4, SEC1, SEC5, P3, P4, O3 |
| Modules | `store/store.ts` (`loadStore`, `saveStore`, `resolveStorePath`, `loadOwnersFile`), types in `domain/types.ts` |
| Tests | `tests/unit/commands.test.ts` (store section) |

## File and path (D17, D59)
1. The default store is `.actiontrack/items.json`, resolved from the **current working directory on every run**. A different directory is a separate store (D59.1).
2. The path can be overridden by `--store <path>` or the environment variable `ACTIONTRACK_STORE`. The option wins over the variable (D17.2).
3. The owners file is `owners.json` **in the same directory as the store file** (D56.1).

## Contents (all keys; see `domain/types.ts`)
4. `version` (1), `nextId`, `items`, `drafts`, and `roster` (people from notes read, spec 03 rule 14). A roster entry is a full name, plus an optional email and the meeting date that email came from, so the most recent meeting's email can win (D56.2).
5. `items[]` hold id, owner, task, taskKey, due (`YYYY-MM-DD` or `null`), dueFlagged, stored status (`open` or `done`), and `sources[] {file, meetingDate, line}` (D58.1). Overdue is never stored.
6. `drafts[]` hold owner, draftId, createdAt and `itemIds` (D51.1). `types.ts` must gain `itemIds` and `roster`.
7. The file is human-readable JSON. It holds names and tasks only, never credentials (NFR-SEC1, SEC5). There is no encryption at rest and no log file (N4).

## Ids (D14)
8. Ids are sequential numbers starting at 1, taken from `nextId`. An id never changes and is never reused, even for a merged item.
9. Within one ingest, ids are assigned in this order: notes by file name, then lines in file order, then people in the order named on a line (so `Anita & Rahul` gives Anita the lower id).

## Reading and writing (D59, NFR-R3)
10. A missing file is an **empty store** (D59.3): `list` prints `No items match.`, `ingest` creates the file, `done <id>` is an unknown id (exit 2).
11. A corrupt or unsupported-version file is a clear error, exit 2, and is **never overwritten** (D59.4).
12. Writes are atomic: write a temporary file in the same directory, then rename over the target. A failed write leaves the previous file intact (NFR-R3). There is no lock. Overlapping runs are last-writer-wins (D59.2).
13. The store directory is created when needed.
14. A failure in one note, item or owner never corrupts or loses items already stored (NFR-R3). The store is saved once at the end of a command.
15. A Gmail failure never changes stored data (NFR-R4, D20.5). A `drafts` record is written only after a draft was created.

## Owners file (D56, D6, D18)
16. `owners.json` is `{"Full Name": "email@example.com"}`, edited by the user and never written by the tool (D56.1).
17. A missing file is fine. A malformed file is a warning (exit 1) and the tool carries on as if there were no entries (D56.3).
18. Names are matched case-insensitively, as full names.

## Acceptance tests
- `D14` ids are sequential and never reused
- `D17.2` `--store` and `ACTIONTRACK_STORE` override; the option wins
- `D59.1` default path follows the working directory
- `D59.3` missing store is empty; `done` on it gives exit 2
- `D59.4` corrupt store errors with exit 2 and is not overwritten
- `D59.2`, `NFR-R3` atomic write; a failed write keeps the previous file
- `NFR-D6` done status persists across runs
- `D58.1` sources keep file, meetingDate and line
- `D51.1` draft record has itemIds
- `D56.3` missing owners file is fine; malformed is a warning
- `NFR-SEC5` the file holds no credentials

## Defaults to confirm
- P14. Item ids within one ingest follow rule 9 (files by name, lines in order, people in the order named).
- P15. A store at an older or newer `version` than 1 is treated like a corrupt file (rule 11).
