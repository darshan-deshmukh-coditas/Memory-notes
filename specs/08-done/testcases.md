# Test cases: `actiontrack done <id>` (spec 08)

Every test name starts with its TC ID in brackets, then the cited spec ID, for example `[TC-12] D32.2 unknown id exits 2 and changes nothing`. Assert content (ids, owner, task, exit code, file bytes), not free wording (D65.3).

Type key: **unit** = pure or injected dependencies; **integration** = spawns the CLI as a child process against a temp store; **acceptance** = sample `notes/` folder or timed run.

Negative cases are marked **(neg)**. "Store unchanged" means the store file's SHA-256 is the same before and after the run.

## A. Id validation

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result | Exit |
|---|---|---|---|---|---|---|---|
| TC-01 | Behaviour 1, FR-D1 | `tests/unit/commands.test.ts` | `[TC-01] FR-D1 id 1 is a valid id` | unit | store with item 1 open; `done 1` | item 1 status done | 0 |
| TC-02 | Behaviour 1 | `tests/unit/commands.test.ts` | `[TC-02] Behaviour 1 id 0 is a usage error (neg)` | unit | `done 0` | error names the id rule; store unchanged | 2 |
| TC-03 | Behaviour 1 | `tests/unit/commands.test.ts` | `[TC-03] Behaviour 1 negative id is a usage error (neg)` | unit | `done -1` | store unchanged | 2 |
| TC-04 | Behaviour 1 | `tests/unit/commands.test.ts` | `[TC-04] Behaviour 1 non-numeric id is a usage error (neg)` | unit | `done abc` | store unchanged | 2 |
| TC-05 | Behaviour 1 | `tests/unit/commands.test.ts` | `[TC-05] Behaviour 1 fractional id is a usage error (neg)` | unit | `done 1.5` | store unchanged | 2 |
| TC-06 | Behaviour 1 | `tests/unit/commands.test.ts` | `[TC-06] Behaviour 1 missing id is a usage error (neg)` | integration | `done` with no argument | usage message; store unchanged | 2 |
| TC-07 | D214 | `tests/unit/commands.test.ts` | `[TC-07] D214 leading zero id is a usage error (neg)` | unit | `done 01` | store unchanged. Per plan D214 | 2 |
| TC-08 | D213 | `tests/unit/commands.test.ts` | `[TC-08] D213 two ids in one call is a usage error (neg)` | unit | `done 1 2` | neither item changed | 2 |
| TC-32 | D215 | `tests/unit/commands.test.ts` | `[TC-32] D215 id beyond safe integer is unknown id (neg)` | unit | `done 9007199254740993` | store unchanged | 2 |

## B. Marking done (core behaviour)

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result | Exit |
|---|---|---|---|---|---|---|---|
| TC-09 | AC-D1, FR-D2, FR-D44.1 | `tests/unit/commands.test.ts` | `[TC-09] AC-D1 done item shows under --status done and not under open or overdue` | integration | Store with ids 1 (open, future due), 2 (overdue), 3 (no due). `done 2`, then `list --status done`, `list --status open`, `list --status overdue` | `done` list has 2; open list has 1 and 3; overdue list is empty | 0 each |
| TC-10 | FR-D32.4, D65.3 | `tests/unit/commands.test.ts` | `[TC-10] FR-D32.4 confirmation shows id, owner and task` | unit | `done 1` on item 1, owner "Priya Nair", task "send revised quote to Acme" | stdout contains "1", "Priya Nair" and "send revised quote to Acme" | 0 |
| TC-11 | Behaviour 2 | `tests/unit/commands.test.ts` | `[TC-11] Behaviour 2 overdue item can be marked done` | unit | item 2 with due date before `--today` | status done; saved | 0 |
| TC-12 | FR-D32.2, FR-D4 | `tests/unit/commands.test.ts` | `[TC-12] D32.2 unknown id exits 2 and store is unchanged (neg)` | unit | store with items 1 and 2; `done 999`. Acceptance bullet D32.2 | stderr message; store SHA-256 unchanged | 2 |
| TC-13 | D14.2, FR-D32.2 | `tests/unit/commands.test.ts` | `[TC-13] D14.2 id never assigned is unknown, not reused (neg)` | unit | store whose highest id is 5; `done 6` | store unchanged; no item created | 2 |
| TC-14 | D59.3, Acceptance bullet D59.3 | `tests/unit/commands.test.ts` | `[TC-14] D59.3 done with no store file exits 2 (neg)` | integration | temp dir with no store file; `done 1` | no store file created | 2 |
| TC-15 | FR-D32.3, Behaviour 4 | `tests/unit/commands.test.ts` | `[TC-15] D32.3 already-done item prints a message, exits 0, store unchanged` | integration | item 1 already done; `done 1` twice | message says it is already done; second run store SHA-256 unchanged (D211) | 0 |
| TC-16 | FR-D32.1, FR-D5, Acceptance bullet D32.1 | `tests/unit/commands.test.ts` | `[TC-16] D32.1 source note file is byte-identical after done` | integration | temp copy of `tests/fixtures/notes`; ingest; hash every `.md` file; `done 1` on an item from a note; hash again | every source note SHA-256 identical before and after | 0 |
| TC-17 | NFR-D6, Acceptance bullet NFR-D6, FR-D3 | `tests/unit/commands.test.ts` | `[TC-17] NFR-D6 done status survives a new process` | integration | Process A: `done 1`. Process B (new child): `list --status done --json` | item 1 present with status done | 0 |
| TC-18 | D3.5, D13.2, FR-D6, Acceptance bullet D3.5 | `tests/unit/commands.test.ts` | `[TC-18] D3.5 re-ingest does not reopen a done item` | integration | ingest folder; `done 1`; ingest same folder again | item 1 still done, same id, no duplicate | 0 (ingest exit 0 or 1 per spec 06) |
| TC-19 | Behaviour 8, D3.2, D3.3, D3.4, D3.5 | `tests/unit/commands.test.ts` | `[TC-19] Behaviour 8 merged item with three sources is one item marked done` | integration | Fixture: Priya Nair "send the revised quote to Acme" in three notes, all open (sample 2026-09-15 line changed from `[x]` to `[ ]` in the fixture copy). `done <id>` | one item; status done; three sources kept | 0 |
| TC-33 | D3.5 (spec 04 rule 11), D13.2 | `tests/unit/commands.test.ts` | `[TC-33] D3.5 later open copy merges into a done item and does not reopen it` | integration | ingest note A with item 1; `done 1`; add note B with the same owner and task as `[ ]`; ingest | still one item, status done, sources now two | 0 or 1 |
| TC-36 | D220 | `tests/unit/commands.test.ts` | `[TC-36] D220 done works on a (no owner) item` | unit | item with owner `(no owner)` | status done | 0 |
| TC-35 | D219 | `tests/unit/commands.test.ts` | `[TC-35] D219 done still works after the source note is deleted` | integration | ingest, delete the source note, `done 1` | status done; no note read | 0 |
| TC-31 | NFR-SEC4 | `tests/unit/commands.test.ts` | `[TC-31] NFR-SEC4 task text is printed as data, not interpreted` | unit | item task `` $(touch pwned) `` and `"; rm -rf x` | output shows the text literally; no side effect; status done | 0 |

## C. Source note and store safety

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result | Exit |
|---|---|---|---|---|---|---|---|
| TC-29 | Behaviour 5, FR-D32.1, D17.1 | `tests/unit/commands.test.ts` | `[TC-29] FR-D32.1 done writes only the store file` | integration | temp folder with notes and store; list folder entries and hashes before; `done 1`; compare | only the store file changed; no temp file left behind | 0 |
| TC-26 | D62.1, D62.2, NFR-R3 | `tests/unit/commands.test.ts` | `[TC-26] D62.1 save failure exits 4 and keeps the previous store (neg)` | unit | injected fake `saveStore` that throws; `done 1` | stderr message; in-memory and on-disk store still show item 1 open | 4 |
| TC-24 | D59.4 | `tests/unit/commands.test.ts` | `[TC-24] D59.4 corrupt store exits 2 and is never overwritten (neg)` | integration | store file containing `{not json`; `done 1` | store SHA-256 unchanged | 2 |
| TC-25 | D69.2 | `tests/unit/commands.test.ts` | `[TC-25] D69.2 store with version 2 exits 2 and is never overwritten (neg)` | integration | store file with `"version": 2`; `done 1` | store SHA-256 unchanged | 2 |
| TC-27 | D14.1, D14.2 | `tests/unit/commands.test.ts` | `[TC-27] D14.2 done does not change any id or create items` | unit | store with ids 1, 2, 3; `done 2` | ids 1, 2, 3 unchanged; count unchanged | 0 |
| TC-23 | D17.2, D59.1 | `tests/unit/commands.test.ts` | `[TC-23] D17.2 --store and ACTIONTRACK_STORE select the store done changes` | integration | two stores A and B both with item 1; `done 1 --store A`; then with env var set to B | only the selected store changes | 0 |

## D. `--today` handling

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result | Exit |
|---|---|---|---|---|---|---|---|
| TC-20 | D54.1, Acceptance bullet D54.1 | `tests/unit/commands.test.ts` | `[TC-20] D54.1 invalid --today exits 2 and store is unchanged (neg)` | integration | `done 1 --today 20-10-2026` and `done 1 --today 2026-02-30` | valid format shown on stderr; store unchanged | 2 |
| TC-21 | Behaviour 9 | `tests/unit/commands.test.ts` | `[TC-21] Behaviour 9 valid --today has no effect on done` | unit | same store; `done 1` with and without `--today 2030-01-01` | same resulting store | 0 |
| TC-22 | D54.1 | `tests/unit/commands.test.ts` | `[TC-22] D54.1 valid --today is accepted by done` | integration | `done 1 --today 2026-10-20` | item 1 done | 0 |
| TC-34 | D218 | `tests/unit/commands.test.ts` | `[TC-34] D218 bad id and bad --today exit 2 with store unchanged (neg)` | integration | `done 999 --today bad` | store unchanged | 2 |

## E. Performance and output

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result | Exit |
|---|---|---|---|---|---|---|---|
| TC-28 | NFR-P2, N2 | `tests/acceptance/sample-notes.test.ts` | `[TC-28] NFR-P2 done finishes in under 1 second on a 5,000-item store` | acceptance | generated store with 5,000 items; `done 2500`; timed | elapsed under 1000 ms; item 2500 done | 0 |
| TC-30 | NFR-O3 | `tests/unit/commands.test.ts` | `[TC-30] NFR-O3 errors go to stderr, not stdout (neg)` | integration | `done 999` | stdout empty; stderr non-empty; no log file created | 2 |

## F. Decisions D211 to D220 with no dedicated test

D211, D212, D216 and D217 are covered by TC-15, TC-18 and TC-12 with wording not asserted. D212 (reopen command) has no test because no reopen command is specified.

## Summary

- 36 cases. Negative cases: TC-02 to TC-08, TC-12 to TC-14, TC-20, TC-24 to TC-26, TC-30, TC-32, TC-33, TC-34.
- Acceptance bullets covered: AC-D1 (TC-09), D32.2 (TC-12), D32.3 (TC-15), D32.4 (TC-10), D32.1 (TC-16), NFR-D6 (TC-17), D3.5 (TC-18), D59.3 (TC-14), D54.1 (TC-20).
- Behaviour items: 1 by TC-01 to TC-08; 2 by TC-09 to TC-11; 3 by TC-12 to TC-14; 4 by TC-15; 5 by TC-16 and TC-29; 6 by TC-09; 7 by TC-18 and TC-33; 8 by TC-19; 9 by TC-21 and TC-22.

## Fixtures needed

Place under `tests/fixtures/done/` unless stated.

1. `notes-done/` : small synthetic folder, 3 to 4 notes, one item with owner "Priya Nair" and task "send the revised quote to Acme" repeated in three notes (all open, for TC-19).
2. `notes-done/` copy used for TC-16 hashing: the same folder, copied into a temp dir per test. Never run against `notes/` (read-only sample data).
3. `store-open.json`: store with ids 1 (open, due in the future), 2 (open, overdue against `--today 2026-10-20`), 3 (open, no due date), in the current store version.
4. `store-done.json`: store with item 1 already `done`.
5. `store-corrupt.json`: contents `{not json`.
6. `store-version2.json`: valid JSON with `"version": 2`.
7. `store-ids-5.json`: store whose highest id is 5 (TC-13).
8. Generated at test time, not checked in: 5,000-item store for TC-28.
9. Hostile task text fixture for TC-31: an item whose task contains `$(touch pwned)` and `"; rm -rf x`.
10. Fake `saveStore` that throws `EIO`-like error, for TC-26, injected through `Deps`.
11. Helper: `sha256File(path)` and `listFolder(path)` in `tests/unit/helpers/` (new file; only if needed, otherwise inline in the test file).
