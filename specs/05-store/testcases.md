# Test cases: 05 Item store

Test file for all rows unless stated: `tests/unit/commands.test.ts`, `describe("store (...)")` section. Acceptance rows that need another spec's code are marked **cross-spec** and are blocked on that spec (see `task.md`). Names must start with the ID in brackets. Rows that cite a decision in this spec use the settled decisions D152 to D171 from `plan.md` section "Decisions".

Type key: U = unit, A = acceptance, P = property, F = fault injection. **Neg** = negative case (must fail or be refused).

## Path resolution (D17, D59.1)

| TC ID | Cites | Type | Test name | Input | Expected |
|---|---|---|---|---|---|
| TC-01 | D17.2 | U | [D17.2] --store wins over ACTIONTRACK_STORE | flag `/a/x.json`, env `/b/y.json` | resolves to `/a/x.json` |
| TC-02 | D17.2 | U | [D17.2] ACTIONTRACK_STORE used when no flag | flag undefined, env `/b/y.json` | resolves to `/b/y.json` |
| TC-03 | D17.1, D59.1 | U | [D59.1] default path is .actiontrack/items.json under cwd | no flag, no env, cwd = temp dir A | `<A>/.actiontrack/items.json` |
| TC-04 | D59.1 | U | [D59.1] a different cwd gives a separate store | same as TC-03 with cwd = temp dir B | path under B, not A |
| TC-05 | D17.2, D152 | U | [D17.2] relative --store is resolved against cwd | flag `sub/items.json` | absolute path `<cwd>/sub/items.json` |
| TC-06 | D153 **Neg** | U | [D17.2] empty env value is treated as unset | env `""`, no flag | default path used |

## Load (D59.3, D59.4, D69.2)

| TC ID | Cites | Type | Test name | Input | Expected |
|---|---|---|---|---|---|
| TC-07 | D154 **Neg** | U | [D17.2] store path that is a directory is a usage error | path = existing directory | throws, exit 2, message names the path |
| TC-08 | D59.3 | U | [D59.3] missing store loads as empty store | path to non-existent file | `{version:1, nextId:1, items:[], drafts:[], roster:[]}`; file not created |
| TC-09 | D59.3 | A | [D59.3] done on a missing store is an unknown id, exit 2 | empty temp dir, `done 1` | exit 2; no file created. **cross-spec** (08) |
| TC-10 | D59.4 **Neg** | U | [D59.4] corrupt JSON errors with exit 2 and is not overwritten | file contents `{"version":1,` | throws exit 2; file bytes identical afterwards |
| TC-11 | D69.2 **Neg** | U | [D69.2] version 2 errors with exit 2 and is not overwritten | valid store with `version: 2` | throws exit 2; bytes identical |
| TC-12 | D69.2 **Neg** | U | [D69.2] missing version errors with exit 2 | store JSON without `version` | throws exit 2; bytes identical |
| TC-13 | D155 **Neg** | U | [D59.4] zero-byte file is corrupt, not empty | empty file | throws exit 2; file not overwritten |
| TC-14 | D156 **Neg** | U | [D59.4] unknown top-level key is corrupt | valid store plus `"extra": 1` | throws exit 2 |
| TC-15 | D157 **Neg** | U | [D59.4] duplicate item ids are corrupt | two items with id 2 | throws exit 2 |
| TC-16 | D157 **Neg** | U | [D14.1] nextId not greater than max stored id is corrupt | items with ids 1..5, `nextId: 5` | throws exit 2 |
| TC-17 | D161 | U | [D59.4] leading UTF-8 BOM is tolerated on load | valid store prefixed with BOM | loads equal to the store without BOM |
| TC-18 | NFR-D2, RULE-4 **Neg** | U | [NFR-D2] due stored as free text is corrupt | item with `due: "10/03/2026"` | throws exit 2 |
| TC-19 | D1 **Neg** | U | [D1] stored status `overdue` is rejected | item with `status: "overdue"` | throws exit 2 (overdue is never stored) |

## Save and atomic write (D59.2, NFR-R3, D62.1)

| TC ID | Cites | Type | Test name | Input | Expected |
|---|---|---|---|---|---|
| TC-20 | D59.2 | U | [D59.2] save then load round-trips the store exactly | store with items, drafts, roster | loaded value deep-equals input |
| TC-21 | NFR-R3, D62.1 **Neg** F | F | [NFR-R3] write failure (ENOSPC) keeps previous file intact | previous valid file; injected `writeFile` throws ENOSPC | throws exit 4; previous bytes identical |
| TC-22 | NFR-R3, D62.1 **Neg** F | F | [NFR-R3] rename failure keeps previous file intact and removes temp | injected `rename` throws | throws exit 4; previous bytes identical; no `*.tmp` left in dir |
| TC-23 | NFR-R3 F | F | [NFR-R3] interrupted save leaves a loadable previous file | injected throw after temp write, before rename | `loadStore` returns previous store |
| TC-24 | D59.2, NFR-R3 | U | [D59.2] temp file is in the target directory and fsynced before rename | spy on fs calls | call order: writeFile(temp in same dir) < fsync < rename(temp, target) |
| TC-25 | D59.2 (Windows) | A | [D59.2] rename replaces an existing file on Windows | existing store, save new store; `skipIf(platform !== win32)` | new content present; no error |
| TC-26 | D164 F **Neg** | F | [D59.2] locked target on Windows retries then exits 4, old file intact | injected `rename` throws EPERM each time | exactly 3 attempts, waits of 100 ms and 200 ms; exit 4; previous bytes identical |
| TC-27 | D154, D59 | U | [D59.1] save creates the store directory when missing | path `<tmp>/new/dir/items.json` | directory created; file written |
| TC-28 | D162 | U | [NFR-R3] stale temp file from a crashed run is ignored on load | stray `items.json.123.abc.tmp` beside valid store | loads the valid store; stray file untouched |
| TC-29 | D59.2 | A | [D59.2] overlapping saves are last-writer-wins without error | two stores saved one after the other to one path | file equals second store; no error |
| TC-30 | NFR-D3, D161 | U | [NFR-D3] same store always serialises to identical bytes, 2-space JSON, trailing LF, no BOM | save same store twice | byte-identical files; file ends with `\n`; first 3 bytes not EF BB BF |
| TC-51 | NFR-D6 | A | [NFR-D6] done status persists across loads | save item with status `done`; load in a new call | status `done` |

## Ids (D14, D69.1)

| TC ID | Cites | Type | Test name | Input | Expected |
|---|---|---|---|---|---|
| TC-31 | D14.1 | U | [D14.1] new ids are sequential from nextId | store with `nextId: 5`, allocate 2 | ids 5 and 6; store `nextId` 7 |
| TC-32 | D14.2 | U | [D14.2] id of a done item is not reused | items 1..3, item 3 done, allocate 1 | new id 4, not 3 |
| TC-33 | D14.2, rule 8 | U | [D14.2] merged item keeps its original id | item 2 receives a new source (merge done by 04) | item id still 2; sources extended |
| TC-34 | D14.2 | U | [D14.2] ids are unchanged across save and load | store with ids 1,4,9 saved and loaded | ids 1,4,9 unchanged |
| TC-35 | D69.1 | U | [D69.1] allocator assigns ids in the order given by the caller | allocate for names `[Anita, Rahul]` in that order | Anita gets the lower id |
| TC-36 | D165 F | F | [D14.1] ids from a run that fails to save are not consumed | allocate, then injected save failure, then reload | file `nextId` equals the value before allocation |

## Owners file (D56.1, D56.3, rule 18)

| TC ID | Cites | Type | Test name | Input | Expected |
|---|---|---|---|---|---|
| TC-37 | D56.1 | U | [D56.1] owners path is owners.json beside the store file | store `/x/y/items.json` | `/x/y/owners.json` |
| TC-38 | D56.3 | U | [D56.3] missing owners file gives no entries and no warning | no owners file | empty map; warnings `[]` |
| TC-39 | D56.3 **Neg** | U | [D56.3] malformed owners JSON is a warning, not a crash | content `{"Priya Nair":` | empty map; one warning; exit-1 signal; no throw |
| TC-40 | D56.1 | U | [D56.1] tool never writes owners.json | run `saveStore` and load owners | owners file bytes unchanged |
| TC-41 | rule 18 | U | [D56.1] owner names match case-insensitively | owners `{"Priya Nair": "p@x.com"}`, lookup `priya nair` | returns the entry |
| TC-42 | D167 **Neg** | U | [D56.3] top level that is an array is malformed | `[ "a" ]` | one warning; empty map |
| TC-43 | D167 **Neg** | U | [D56.3] invalid email on one entry skips only that entry | `{"A B": "bad", "C D": "c@x.com"}` | `C D` kept; one warning for `A B` |
| TC-44 | D168 **Neg** | U | [D56.3] names differing only by case: first wins, second warned | `{"Priya Nair": "a@x", "priya nair": "b@x"}` | first kept; one warning |
| TC-45 | D167 **Neg** F | F | [D56.3] unreadable owners file is a warning, exit 1 | injected read throws EACCES | warning; empty map; no throw |

## Stored content and security (D58.1, D51.1, NFR-SEC1, NFR-SEC5, NFR-O3)

| TC ID | Cites | Type | Test name | Input | Expected |
|---|---|---|---|---|---|
| TC-46 | NFR-SEC5, NFR-SEC1 **Neg** | A | [NFR-SEC5] saved file contains no credential-like keys | save a full fixture store; regex scan for token, secret, password, refresh, credential | no match |
| TC-47 | D58.1 | U | [D58.1] sources keep file, meetingDate and line | item with two sources; save and load | all three fields equal |
| TC-48 | D51.1 | U | [D51.1] draft record keeps owner, draftId, createdAt and itemIds | draft `{owner, draftId, createdAt, itemIds:[1,4]}` | round-trips equal |
| TC-49 | D159 | U | [D56.2] roster entry keeps name, email and meetingDate | roster `[{name, email, meetingDate}]` | round-trips equal |
| TC-50 | D158 | U | [D69.2] v1 file without roster or drafts loads with empty arrays | valid v1 JSON without those keys | `roster: []`, `drafts: []` |
| TC-52 | NFR-D2, D1 | U | [NFR-D2] null due is stored as null and kept | item with `due: null`, `dueFlagged: true` | round-trips; due is `null` |
| TC-53 | NFR-O3, N4 | U | [NFR-O3] clean load and save write nothing to stderr and create no log file | spy stderr; load then save | stderr empty; dir holds only items.json and owners.json (if present) |
| TC-54 | NFR-R3 **Neg** | U | [NFR-R3] a malformed owners file does not block saving items | malformed owners file; save store | save succeeds; items written |
| TC-55 | NFR-R3 **Neg** | U | [NFR-R3] an invalid store is never partially written | corrupt store present; attempt save of valid store to same path | save replaces it only with valid content (no partial writes); temp removed |
| TC-56 | N3 (Windows, macOS, Linux) | U | [N3] paths with spaces and non-ASCII round-trip | path `<tmp>/my notes é/items.json` | save and load succeed |

## Row count check

Acceptance bullets in spec 05 (13): D14, D17.2, D59.1, D59.3, D59.4, D59.2 and NFR-R3, NFR-D6, D58.1, D51.1, D56.3, NFR-SEC5, D69.1, D69.2. Every bullet has at least one row: TC-16/35 (D14, D69.1), TC-01/02 (D17.2), TC-03/04 (D59.1), TC-08/09 (D59.3), TC-10 (D59.4), TC-20 to TC-26 (D59.2, NFR-R3), TC-51 (NFR-D6), TC-47 (D58.1), TC-48 (D51.1), TC-38/39 (D56.3), TC-46 (NFR-SEC5), TC-11/12 (D69.2).

## Fixtures needed

Folder: `tests/fixtures/store/` (new; does not exist yet). Keep fixtures tiny and synthetic.

- `valid-v1.json`: version 1, 3 items (one open, one done, one with `dueFlagged`), 1 draft with `itemIds`, 2 roster entries (one with email and meetingDate), `nextId` 4.
- `corrupt-truncated.json`: first 40 bytes of `valid-v1.json`.
- `version-2.json`: `valid-v1.json` with `version: 2`.
- `no-version.json`: `valid-v1.json` without `version`.
- `zero-byte.json`: empty file.
- `unknown-key.json`: `valid-v1.json` plus `"extra": 1`.
- `duplicate-ids.json`: two items with id 2.
- `nextId-too-low.json`: `nextId: 2` with items 1..3.
- `bom-v1.json`: `valid-v1.json` with a leading UTF-8 BOM.
- `overdue-status.json`: item with `status: "overdue"`.
- `free-text-due.json`: item with `due: "10/03/2026"`.
- `legacy-no-roster.json`: v1 without `roster` and `drafts`.
- `owners-valid.json`: `{"Priya Nair": "priya@example.com", "Rahul Mehta": "rahul@example.com"}`.
- `owners-malformed.json`: `{"Priya Nair":` (truncated).
- `owners-array.json`: `["Priya Nair"]`.
- `owners-bad-email.json`: `{"Anita Rao": "not-an-email", "Rahul Mehta": "rahul@example.com"}`.
- `owners-case-dup.json`: `{"Priya Nair": "a@example.com", "priya nair": "b@example.com"}`.

In-test temp dirs come from `fs.mkdtemp(os.tmpdir())`, not from the scratchpad. Fault injection uses fake fs adapters passed to `loadStore` and `saveStore`; no real disk-full or lock is needed.
