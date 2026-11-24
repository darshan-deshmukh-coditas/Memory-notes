# Tasks: 05 Item store

Order matters. Work red, then green, then refactor, per CLAUDE.md. Test IDs (TC-nn) refer to `testcases.md`. "Satisfies" lists the spec or FRD IDs. Decisions are in `plan.md` section "Decisions"; tasks marked **(gate)** must not start until those decisions are recorded in `docs/FRD.md`.

Format: `- [ ] Txx | Satisfies | File | Test | Depends`

## A. Decisions and types (no behaviour)

- [ ] T01 | D152..D171 | user | none | none: answered; recorded per decision D152 to D171 in `plan.md` section "Decisions".
- [ ] T02 | CLAUDE.md workflow step 1 | `docs/FRD.md` section 11 | none | T01 **(gate)**: record the decisions as D152, D153, ... in the same change. Verify every ID cited in `specs/05-store/*.md` exists in FRD, NFRD or the spec.
- [ ] T03 | D51.1, rule 4, rule 6 | `src/domain/types.ts` | none (compile check) | T02: add `itemIds: number[]` to `DraftRecord`; add `RosterEntry {name, email?, meetingDate?}` and `roster: RosterEntry[]` to `StoreFile`. Shapes per D159, D160. No `any`.
- [ ] T04 | D62.1, D59.4, D69.2 | `src/domain/exit-codes.ts`, `src/domain/errors.ts` | compile check | T03: add `EXIT.INTERNAL = 4` (D170). Add `StoreCorruptError` (exit 2) and `StoreIoError` (exit 4) extending `ActiontrackError`. Keep domain free of logic.
- [ ] T05 | NFR-M1, NFR-R3 | `src/store/store.ts` | TC-21..TC-23, TC-26 (fault seam) | T04: add an optional `fs` adapter parameter to `loadStore(path, fs?)` and `saveStore(path, store, fs?)` with a type `StoreFs` (writeFile, fsync, rename, unlink, mkdir, readFile). Default is `node:fs`. Behaviour unchanged; stubs still throw `NotImplementedError`.

## B. Red: convert the store `it.todo` stubs into failing tests

Replace the three `it.todo` lines in the `store` describe block of `tests/unit/commands.test.ts`. Each test name starts with the TC ID in brackets. Keep the existing ID-named todos where the TC covers them.

- [ ] T06 | D17.2, D59.1 | `tests/unit/commands.test.ts` | TC-01..TC-06 | T05: write path tests. Expect failure (NotImplementedError).
- [ ] T07 | D59.3, D59.4, D69.2 | same | TC-07..TC-14 | T05: write load tests for missing, directory, corrupt, version, zero-byte, unknown key. Use fixtures in `tests/fixtures/store/`. Expect failure.
- [ ] T08 | D14.1, NFR-D2, D1, D59.4 | same | TC-15..TC-19 | T05: write integrity tests (duplicate ids, nextId, BOM, non-ISO due, overdue status). Expect failure.
- [ ] T09 | D59.2, NFR-R3, D62.1 | same | TC-20..TC-26 | T05: write save and fault-injection tests (write fails, rename fails, interrupted save, call order, Windows rename gated with `skipIf`, retry count). Expect failure.
- [ ] T10 | D59.1, NFR-R3, D59.2, NFR-D3 | same | TC-27..TC-30 | T05: write directory creation, stale temp, overlap, deterministic bytes tests. Expect failure.
- [ ] T11 | D14.1, D14.2, D69.1 | same | TC-31..TC-36 | T05: write id tests (sequential, done not reused, merged keeps id, round trip, caller order, unsaved run). Expect failure. Requires a stub `allocateIds` export in `store.ts` (throws NotImplementedError).
- [ ] T12 | D56.1, D56.3, rule 18 | same | TC-37..TC-45 | T05: write owners tests. Add a stub `loadOwnersFile` export and `ownersPathFor` (both throw NotImplementedError) so the tests import real names.
- [ ] T13 | D58.1, D51.1, D56.2, NFR-SEC5, NFR-SEC1, NFR-O3, NFR-D6, NFR-D2, N3 | same | TC-46..TC-56, TC-51 | T03, T05: write content, security, stderr, path and done-persistence tests. TC-09 (done on missing store) is written as `it.todo` with a note "cross-spec 08" until spec 08 lands. Expect failure.
- [ ] T14 | all red | terminal | `npm test` | T06..T13: run `npm test`. Confirm the new store tests fail for the right reason (NotImplementedError or assertion), not for a typo. `npm run typecheck` must pass.

## C. Green: implement store behaviour

- [ ] T15 | D17.2, D152, D153 | `src/store/store.ts` `resolveStorePath` | TC-01, TC-02, TC-05, TC-06 | T14. Flag wins over env; empty string is unset; `path.resolve` for relative paths.
- [ ] T16 | D17.1, D59.1 | `src/store/store.ts` `DEFAULT_STORE_PATH` use | TC-03, TC-04 | T15. Default resolved from `process.cwd()` at call time, not at import.
- [ ] T17 | D56.1 | `src/store/store.ts` `ownersPathFor` | TC-37 | T16. `path.join(path.dirname(storePath), "owners.json")`.
- [ ] T18 | D154 | `src/store/store.ts` `loadStore` path checks | TC-07 | T15. Directory at store path gives `UsageError` (exit 2).
- [ ] T19 | D59.3 | `src/store/store.ts` `loadStore` | TC-08 | T18. ENOENT gives empty store; no file written.
- [ ] T20 | rule 4, D59.4, D69.2 | `src/store/schema.ts` (new file, zod) | none (used by T21) | T03. Zod schema for `StoreFile` with `version: literal 1`, `nextId` int >= 1, items, drafts, roster. Strict objects (D156). Missing `roster`/`drafts` default to `[]` (D158).
- [ ] T21 | D59.4, D69.2, NFR-D2, D1 | `src/store/store.ts` `loadStore` | TC-10..TC-14, TC-18, TC-19, TC-50 | T20. JSON parse plus schema; any failure throws `StoreCorruptError`. Read never writes.
- [ ] T22 | D157, D161 | `src/store/store.ts` `loadStore` | TC-15, TC-16, TC-17 | T21. Duplicate ids and `nextId` check; strip a leading BOM before parse.
- [ ] T23 | D155 | `src/store/store.ts` `loadStore` | TC-13 | T21. Zero-byte file is corrupt.
- [ ] T24 | NFR-R3 (no partial writes) | `src/store/store.ts` `saveStore` serialiser | TC-30 | T20. `JSON.stringify(store, null, 2) + "\n"` in fixed key order; UTF-8, no BOM.
- [ ] T25 | D59.2, NFR-R3, D59.1 | `src/store/store.ts` `saveStore` | TC-20, TC-24, TC-27, TC-29 | T24, T19. `mkdir -p`; write temp in same directory; fsync; rename. Temp name per D162.
- [ ] T26 | NFR-R3, D62.1 | `src/store/store.ts` `saveStore` | TC-21, TC-22, TC-23 | T25. On any failure, best-effort unlink temp, rethrow as `StoreIoError` (exit 4). Previous file untouched.
- [ ] T27 | D164 | `src/store/store.ts` `saveStore` | TC-26 | T26. Bounded retry (3 attempts in total, with waits of 100 ms and then 200 ms between them) only for EPERM, EBUSY on rename; then exit 4.
- [ ] T28 | NFR-R3, D162 | `src/store/store.ts` `loadStore` | TC-28, TC-55 | T26. Stale `*.tmp` files are ignored and never deleted by save.
- [ ] T29 | D14.1, D14.2, D69.1, D165 | `src/store/store.ts` `allocateIds` | TC-31..TC-35 | T14. Pure function: takes store and count, returns ids and updated store with `nextId` advanced. Never touches existing item ids.
- [ ] T30 | D165 | `src/store/store.ts` `saveStore` / ingest contract note | TC-36 | T25, T29. Verify ids from a failed save are not persisted; document in code comment that callers must print ids after a successful save.
- [ ] T31 | D56.3, D167, D168 | `src/store/store.ts` `loadOwnersFile` | TC-38, TC-39, TC-42, TC-43, TC-44 | T17. Returns `{entries, warnings}`. Never throws for file content.
- [ ] T32 | D167 | `src/store/store.ts` `loadOwnersFile` | TC-45 | T31, T05. Unreadable file gives a warning via the fs adapter.
- [ ] T33 | rule 18 | `src/store/store.ts` owner lookup helper | TC-41 | T31. Key is `name.trim().toLowerCase()`.
- [ ] T34 | D56.1, NFR-SEC5 | `src/store/store.ts` `saveStore` | TC-40, TC-46, TC-53 | T25, T31. Save never touches `owners.json`. No credential keys in the schema.
- [ ] T35 | NFR-D6, NFR-D2 | `src/store/store.ts` | TC-51, TC-52 | T25. Round-trip of `done` status and `due: null`.
- [ ] T36 | D58.1, D51.1, D56.2 | `src/store/schema.ts` | TC-47, TC-48, TC-49 | T20. Sources, draft `itemIds`, roster entries round-trip.
- [ ] T37 | N3 | `src/store/store.ts` | TC-56 | T25. Path tests use `path.join`; check Windows, macOS and Linux in CI or manually.
- [ ] T38 | D59.2 (Windows) | `src/store/store.ts` | TC-25 | T25. Real rename over an existing file on `win32`. Gated test; run on the Windows dev machine.
- [ ] T39 | D59.3 (cross-spec) | `tests/unit/commands.test.ts` | TC-09 | spec 08 `done` implemented. Turn the `it.todo` into a test; blocked until then.

## D. Refactor and clean up

- [ ] T40 | CLAUDE.md conventions | `src/store/store.ts` | all store tests | T15..T39: remove every `NotImplementedError` throw in `src/store/store.ts`. Remove unused stubs.
- [ ] T41 | NFR-M1, NFR-M2 | `src/store/store.ts` | all store tests | T40: check that pure helpers (`resolveStorePath`, `allocateIds`, serialiser, schema) take no hidden dependencies; fs and cwd are injected or passed in.
- [ ] T42 | CLAUDE.md "No any" | `src/store/*.ts` | `npm run typecheck` | T40: grep for `any` in new code; ensure strict mode passes.
- [ ] T43 | dependency direction | `src/store/*.ts`, `src/cli/**` | `tests/unit/safety.test.ts` | T40: confirm only `store/store.ts` and `store/schema.ts` touch the store file; `cli/index.ts` builds real deps only.

## E. Traceability and checks

- [ ] T44 | CLAUDE.md step 4 | `docs/TRACEABILITY.md` | none | T40: update the status column for rows owned by this spec (D14, D17, D51.1, D56, D58, D59, D69, NFR-R3, NFR-D6, NFR-SEC5). Use the spec 05 test IDs. Rows owned by other specs stay as they are.
- [ ] T45 | CLAUDE.md step 4 | `docs/TRACEABILITY.md` | none | T44: confirm the cross-spec row for TC-09 is noted as blocked on 08.
- [ ] T46 | Hard rule: never send | `tests/unit/safety.test.ts` | safety tests | T40: run; do not edit the test. Confirm `DraftConnector` still has no send method.
- [ ] T47 | Hard rule: no credentials | `tests/unit/commands.test.ts` | TC-46 | T34: run the scan test against a full fixture store.
- [ ] T48 | Hard rule: never edit source notes | `tests/unit/commands.test.ts` | none | T40: confirm no store function opens any file under the notes folder.
- [ ] T49 | CLAUDE.md "Current status" | `src/store/store.ts` | none | T40: the scaffold stub comment is removed and replaced with a one-line purpose comment only.
- [ ] T50 | NFR-O3 | `src/store/store.ts` | TC-53 | T40: confirm no `console.log`, no log file, warnings only through the caller.
- [ ] T51 | CLAUDE.md "npm run check" | repo root | `npm run check` | T44..T50: run `npm run check` (typecheck, tests, lint if any). All green except blocked TC-09 (`it.todo`).
- [ ] T52 | Manual Windows check | terminal | manual | T38, T51: run ingest twice on Windows in the sample folder; confirm `.actiontrack/items.json` is replaced and no `*.tmp` remains.

## Definition of done

- [ ] Every decision in `plan.md` section "Decisions" (D152 to D171) is recorded in `docs/FRD.md` (T01, T02).
- [ ] Every TC row in `testcases.md` has a real test with its ID in brackets, or is an explicit `it.todo` blocked on a named cross-spec task (TC-09 only).
- [ ] All non-blocked store tests are green on Windows, macOS and Linux.
- [ ] Fault-injection tests prove that a failed write or rename leaves the previous file byte-identical (TC-21 to TC-23, TC-26).
- [ ] A corrupt or wrong-version store is never overwritten (TC-10, TC-11, TC-12, TC-13).
- [ ] Ids are sequential and never reused (TC-31 to TC-34).
- [ ] No `NotImplementedError` remains in `src/store/store.ts`.
- [ ] `owners.json` is never written by the tool (TC-40).
- [ ] The store file holds no credential-like keys (TC-46).
- [ ] `docs/TRACEABILITY.md` status is updated for the IDs owned by spec 05.
- [ ] `npm run typecheck`, `npm test` and `npm run check` pass, with no new dependency added.
- [ ] `tests/unit/safety.test.ts` is unchanged and passes.
