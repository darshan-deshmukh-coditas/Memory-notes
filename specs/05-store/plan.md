# Plan: 05 Item store

Planning only. No source, test or FRD change is made by this file. The decisions in the last section are recorded as new decisions D152 to D171 for this spec in `docs/FRD.md` before the affected tasks in `task.md` start.

## Goal

Provide the single module that reads and writes the persistent store file (`StoreFile`) and the owners file, with: a predictable file location, sequential ids that are never reused, atomic writes that never damage the previous file, and clear, non-destructive handling of missing, corrupt or wrong-version files.

## Scope

In scope (this spec):
- Resolve the store path (`--store`, `ACTIONTRACK_STORE`, default `.actiontrack/items.json` under the cwd). Spec rules 1-3, D17.2, D59.1.
- Load: missing file is empty; corrupt or wrong-version file is an error that is never overwritten. Spec rules 10-11, D59.3, D59.4, D69.2.
- Save: atomic temp-file-then-rename; failed write keeps the old file; directory creation. Spec rules 12-14, D59.2, NFR-R3.
- Id allocation rules: sequential from `nextId`, never reused. Spec rules 8-9, D14, D69.1.
- Persisted shape: `version`, `nextId`, `items`, `drafts`, `roster`; sources; no credentials. Spec rules 4-7, D51.1, D58.1, NFR-SEC5.
- Owners file load: `owners.json` beside the store, missing is fine, malformed is a warning. Spec rules 16-18, D56.1, D56.3.
- Types: add `itemIds` to `DraftRecord` and `roster` to `StoreFile` in `domain/types.ts`.

Out of scope (owned elsewhere):
- Parsing notes and building items: 01-note-parsing, 06-ingest.
- Date resolution and owner resolution: 02-date-resolution, 03-owner-resolution.
- Duplicate merge rules (taskKey, merge): 04-dedupe.
- Ingest command flow, exit-code wiring, save-once-at-end call site: 06-ingest, 11-cli-conventions.
- `list` filtering and output: 07-list.
- `done` command: 08-done (its tests cover NFR-D6 end to end).
- `followup`, draft creation, repeat detection, writing a `drafts` record after success: 09-followup (store only provides the save).
- Gmail connector: 10-gmail-draft-connector.

## Requirement map

| ID | Rule (one line) | Module | Test IDs (testcases.md) |
|---|---|---|---|
| D17.2 | `--store` wins over `ACTIONTRACK_STORE`; both override default | `store/store.ts` `resolveStorePath` | TC-01, TC-02, TC-05, TC-06 |
| D17.1 / D59.1 | Default `.actiontrack/items.json` from cwd on every run | `store/store.ts` | TC-03, TC-04 |
| D59.3 | Missing store is empty; load does not create the file | `store/store.ts` `loadStore` | TC-08, TC-09 |
| D59.4 | Corrupt store: exit 2, never overwritten | `store/store.ts` `loadStore` | TC-10, TC-13, TC-15, TC-16, TC-18 |
| D69.2 | `version` not 1: exit 2, never overwritten | `store/store.ts` | TC-11, TC-12 |
| D59.2 / NFR-R3 | Atomic write; failed write keeps previous file; last writer wins | `store/store.ts` `saveStore` | TC-20 to TC-24, TC-26, TC-27, TC-29 |
| D14.1 | Ids sequential from `nextId` | `store/store.ts` id allocator | TC-31 |
| D14.2 | Ids never change or get reused, including after `done` and merge | `store/store.ts` id allocator | TC-32, TC-33, TC-34 |
| D69.1 | Id order inside one ingest follows the order given by the caller | `store/store.ts` id allocator | TC-35 |
| D58.1 | Sources keep `file`, `meetingDate`, `line` | `domain/types.ts`, `store/store.ts` | TC-47 |
| D51.1 | Draft record keeps owner, draftId, time, itemIds | `domain/types.ts`, `store/store.ts` | TC-48 |
| D56.1 | `owners.json` sits in the store directory; tool never writes it | `store/store.ts` `loadOwnersFile` | TC-37, TC-40 |
| D56.3 | Missing owners file is fine; malformed is a warning, exit 1 | `store/store.ts` `loadOwnersFile` | TC-38, TC-39, TC-42 to TC-45 |
| rule 18 | Owner names matched case-insensitively, full names | `store/store.ts` `loadOwnersFile` | TC-41 |
| NFR-D6 | `done` status persists across runs | `store/store.ts` | TC-51 |
| NFR-D3 | Same input gives same bytes (deterministic serialisation) | `store/store.ts` serialiser | TC-30 |
| NFR-SEC5 / NFR-SEC1 | Store holds no credentials | `store/store.ts` schema | TC-46 |
| NFR-O3 / N4 | No log file; no stderr on clean load/save | `store/store.ts` | TC-54 |
| D62.1 | I/O failure on save: exit 4, store left as it was | `store/store.ts`, `domain/errors.ts` | TC-21, TC-22, TC-26 |

## Design approach

**Location.** `resolveStorePath(flag, env)` returns `path.resolve(flag ?? env.ACTIONTRACK_STORE ?? DEFAULT_STORE_PATH)`, using `node:path` only. The owners file path is `path.join(path.dirname(storePath), "owners.json")` (D56.1). The default is resolved against `process.cwd()` at call time, never cached at import (D59.1).

**Schema and version.** A zod schema (zod is already a dependency) describes `StoreFile`: `version: literal 1`, `nextId: int >= 1`, `items`, `drafts`, `roster`. `loadStore` parses JSON, validates with the schema, then applies the cross-field checks in D157. Any failure is a `StoreCorruptError` (extends `ActiontrackError`, exit 2). The schema is the single place that defines what may be on disk, which also makes NFR-SEC5 checkable (no credential-like keys).

**Load.** Three outcomes only: (a) file absent (`ENOENT`) returns an empty store `{version:1, nextId:1, items:[], drafts:[], roster:[]}` and writes nothing; (b) file present and valid returns the parsed store; (c) anything else (unreadable, invalid JSON, schema failure, wrong version) throws and leaves the file untouched. The load never writes.

**Save (atomic).** Injected fs operations (`writeFile`, `fsync`, `rename`, `unlink`, `mkdir`) with real `node:fs` defaults, so fault injection needs no real disk failure. Steps: `mkdir -p` the directory; write the serialised JSON to a temp file in the same directory (`items.json.<pid>.<rand>.tmp`); fsync the temp file; `rename(temp, target)`; on any failure, best-effort `unlink` the temp file and rethrow as an I/O error mapped to exit 4 (D62.1). Same-directory temp keeps the rename on one volume. On Windows, `fs.rename` replaces an existing target, but it fails with `EPERM`/`EBUSY` if another process holds the target open; this is handled by the retry policy in D164.

**Serialisation.** `JSON.stringify(store, null, 2) + "\n"`, UTF-8, no BOM, fixed key order defined by the schema, so the same store always gives the same bytes (NFR-D3).

**Ids.** A pure function `allocateIds(store, count)` returns the ids and the store with `nextId` advanced. It never reads or writes ids of existing items, so a merged or done item keeps its id (rule 8). `saveStore` persists `nextId` only when the whole command saves, so ids handed out in a run that fails to save are not consumed (D165). Order of ids within one ingest is decided by the caller (06), which must pass notes by file name, then lines, then names on a line (D69.1); this module only preserves the order it is given.

**Saves are once per command** (rule 14). Callers (06, 08, 09) call `saveStore` once at the end, after all in-memory changes succeeded.

**Owners file.** `loadOwnersFile(path)` returns `{ entries: Map<lowercasedFullName, {name, email}>, warnings: string[] }`. Missing file gives no entries and no warning. Malformed gives a warning and no entries. The function never throws for user-owned content. Callers print warnings to stderr and set exit 1 (D70 is owned by 06).

**Testability seams.** `loadStore(path, fs?)` and `saveStore(path, store, fs?)` take an optional fs adapter; tests inject failing ones. `now` is not needed here (createdAt is passed in by the caller, NFR-M2).

**Platform.** Path logic uses `node:path`. Tests build paths with `path.join` and must pass on Windows, macOS and Linux (N3). The Windows rename-over-existing test is gated to `win32`.

## Dependencies

- Consumes types from 01 (`Note`, `Attendee`), 02 (`IsoDate`), 03 (`OwnerLabel`, roster names), 04 (`ActionItem.taskKey`, merge output). Shapes already exist in `domain/types.ts`; this spec only adds `itemIds` and `roster`.
- Served by: 06 ingest (load, allocate, save once); 07 list (load only, read-only path must not save); 08 done (load, mutate status, save); 09 followup (load owners, load store, save `drafts` after a successful draft only).
- Needs `EXIT.INTERNAL = 4` (D62.1) in `domain/exit-codes.ts`; the constant is not in the scaffold yet. Ownership of the constant is decided in D170.

## Risks

1. **Windows rename over an open file.** Editors, indexers or antivirus can hold the store file, so `rename` fails with `EPERM`/`EBUSY`. Mitigation: bounded retry (D164), then exit 4 with the old file intact. Residual risk: the user sees an error and reruns.
2. **Concurrent runs.** No lock (D59.2). Two overlapping `ingest` runs both allocate from the same `nextId`; the later write wins and the earlier run's new items disappear. Ids printed by the lost run may later name a different item. Accepted by D59.2; this is the single biggest data-integrity risk and must be stated to the user (D166).
3. **Corrupt JSON.** A hand-edited or truncated file blocks all commands until fixed (D59.4). Mitigation: the error names the path and the parse position; the file is never overwritten, so the user can repair it.
4. **Crash between write and rename.** Leaves a stale `*.tmp` file. It is ignored on load and never deleted by a later save (D162). Disk fills up with stale temps only if many crashes occur.
5. **Stale fsync semantics on some file systems.** fsync is best effort on network drives. Not testable here; noted only.
6. **Schema drift.** Adding fields later without a version bump would break old files. Any shape change requires a new decision and a version decision, since `version` must be 1 (D69.2).

## Decisions

D152 and D153 (cited in `task.md` T02) are the first two of the new decisions this spec adds to `docs/FRD.md` section 11. The 20 decisions below take D152 to D171 in the order listed, and each is recorded there when T02 runs. The decision ID is the key this spec uses.

- **D152:** A relative `--store` path is resolved against the cwd at call time with `path.resolve`.
- **D153:** `--store ""` and `ACTIONTRACK_STORE=""` are treated as unset and fall through to the next source.
- **D154:** A store path that is an existing directory gives a usage error, exit 2. A failed `mkdir` of the parent gives exit 4.
- **D155:** A zero-byte store file is corrupt, exit 2. D59.3 covers only an absent file.
- **D156:** Unknown keys at the top level or on an item make the store corrupt: exit 2, never overwritten.
- **D157:** Duplicate item ids make the store corrupt: exit 2, never overwritten. `nextId` must be greater than every stored id. Duplicate `taskKey` is not checked here (dedupe is 04).
- **D158:** A v1 file without `roster` or `drafts` reads them as empty arrays. No error.
- **D159:** Roster entries are `{name, email?, meetingDate?}`. `meetingDate` is required when `email` is present (D56.2).
- **D160:** `itemIds` is `number[]`. `createdAt` is an ISO 8601 UTC timestamp string passed in by the caller.
- **D161:** On write: 2-space indent, LF line endings, trailing newline, UTF-8 without BOM. A leading BOM is tolerated on read.
- **D162:** The temp file is `items.json.<pid>.<rand>.tmp` in the same directory. It is removed on a failed write in the same run. Stale temps from crashed runs are ignored, never deleted.
- **D163:** The temp file is fsynced. The directory is not fsynced on Windows.
- **D164:** A failed rename on Windows (EPERM, EBUSY) is retried: 3 attempts in total, with waits of 100 ms and then 200 ms between them. If the third attempt fails, exit 4 and the old file is left intact.
- **D165:** The pure allocator lives in `store/store.ts` and 06 calls it. Ids from a run that fails before saving are not consumed: the allocator commits only on successful save. Output prints ids only after a successful save.
- **D166:** Save does not check whether the file changed since load (D59.2). The overlapping-run risk (Risks 2) is stated to the user.
- **D167:** An unreadable owners file (EACCES, EISDIR, etc.) is a warning. Invalid JSON, or a top level that is not an object of string values, is malformed: one warning, no entries. An entry with an invalid email is skipped with a warning; the rest are kept.
- **D168:** Owner keys that differ only by case or surrounding spaces: the first wins and the second is reported as a warning.
- **D169:** The tool never writes `owners.json` (D56.1).
- **D170:** `EXIT.INTERNAL = 4` is added to `domain/exit-codes.ts` in this spec's first implementation task. Spec 11 references the same constant.
- **D171:** Standard OS permissions apply: no chmod, no encryption (N4, NFR-SEC5). Windows ACLs are not managed by the tool.
