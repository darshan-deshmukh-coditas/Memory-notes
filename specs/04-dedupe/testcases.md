# Test cases 04: Duplicate handling

One row per acceptance bullet in `spec.md`, each sample-evidence row, and each settled decision in `plan.md` (D137 to D151). Test names must start with the bracketed ID. Type: `unit`, `acceptance` (sample folder or fixtures end to end), or `property` (fixed list of inputs, looped; no new dependency, per CLAUDE.md). Rows marked **negative** check that different work is NOT merged or that a rule does not over-fire.

Unit tests go in `tests/unit/edge-cases.test.ts` (the E1 block already exists there). Acceptance tests go in `tests/acceptance/sample-notes.test.ts`.

## Unit and property cases

| TC ID | Spec / FRD ID | Test file | Test name | Type | Input | Expected result |
|---|---|---|---|---|---|---|
| TC-01 | D28.2, D36.2 | tests/unit/edge-cases.test.ts | `[D28.2] normalises: drops a/an/the, punctuation and extra spaces` | unit | `"Send the  revised quote to Acme."` | `"send revised quote to acme"` |
| TC-02 | D28.2 (D139) | tests/unit/edge-cases.test.ts | `[D28.2] lowercases with NFC before comparing` | unit | `"Share THE Résumé"` (NFC and NFD forms) | Same output for both Unicode forms; lowercase. |
| TC-03 | D48.1 (D140) | tests/unit/edge-cases.test.ts | `[D48.1] keeps an unresolved due phrase in the normalised text` | unit | `"Sam to cut cloud costs by 10%"` task `"cut cloud costs by 10%"` | `"cut cloud costs by 10"` (the `%` removed, `by 10` kept, so it matches other copies). |
| TC-04 | D28.2 (D141) | tests/unit/edge-cases.test.ts | `[D28.2] task that normalises to empty is reported by the caller` | unit, negative | `"the a an."` | `""`. Caller must not store it (D141). |
| TC-05 | D28.3, NFR-D5 | tests/unit/edge-cases.test.ts | `[D28.3] "first" and "updated" wireframes normalise differently` | unit, negative | `"Share first wireframes"` vs `"share updated wireframes"` | Two different keys. |
| TC-06 | D28.2 | tests/unit/edge-cases.test.ts | `[D28.2] normalisation is idempotent over 20 sample strings` | property | 20 fixed strings incl. punctuation, CRLF remnants, tabs | `normalizeTask(normalizeTask(x)) === normalizeTask(x)` for each. |
| TC-07 | D28.1 | tests/unit/edge-cases.test.ts | `[D28.1] dedupe key cannot collide across owner and task boundary` | unit, negative | `("ab","c")` vs `("a","bc")` | Keys differ. |
| TC-08 | D28.1 | tests/unit/edge-cases.test.ts | `[D28.1] same resolved owner and normalised task merge into one item` | unit | Two items, owner `Priya Nair`, tasks `send the revised quote to Acme` and `send revised quote to Acme.` | One item after merge; `merged: true`. |
| TC-09 | D28.1 | tests/unit/edge-cases.test.ts | `[D28.1] same task for different owners stays two items` | unit, negative | Task `review the deck` for `Anita Rao` and `Rahul Shah` | Two items; `merged: false` on the second. |
| TC-10 | D40.1 | tests/unit/edge-cases.test.ts | `[D40.1] (no owner) items with the same task merge` | unit | Two `(no owner)` items, task `Confirm the budget` | One item. |
| TC-11 | D40.1 (D146) | tests/unit/edge-cases.test.ts | `[D40.1] (no owner) and a resolved owner with the same task do not merge` | unit, negative | `(no owner)` and `Priya Nair`, same task | Two items. |
| TC-12 | D40.2 | tests/unit/edge-cases.test.ts | `[D40.2] (ambiguous) items merge on the same first name and task` | unit | Two `(ambiguous)` items, first name `Priya`, task `Confirm the budget` | One item. |
| TC-13 | D40.2 | tests/unit/edge-cases.test.ts | `[D40.2] (ambiguous) items with different first names stay separate` | unit, negative | `Priya` and `Anita`, same task, both `(ambiguous)` | Two items. |
| TC-14 | D68.1 | tests/unit/edge-cases.test.ts | `[D68.1] (unresolved) items merge on label, name text and task` | unit | Two `(unresolved)` items, name text `Priya Nair-Rao`, same task | One item. |
| TC-15 | D40.2 | tests/unit/edge-cases.test.ts | `[D40.2] (ambiguous) item does not merge with a resolved item for the same person` | unit, negative | `(ambiguous)` `Priya` and `Priya Nair`, same task | Two items. |
| TC-16 | D3.3 | tests/unit/edge-cases.test.ts | `[D3.3] merged item keeps the sources of every copy` | unit | Three copies from three files | Item has three sources. |
| TC-17 | D3.3, D58.1 | tests/unit/edge-cases.test.ts | `[D58.1] sources have no repeated (file, line) and are ordered by meeting date then file name` | unit | Copies given out of order; one copy repeated with the same file and line | Sources sorted oldest first, newest last; no repeat. |
| TC-18 | D3.4 | tests/unit/edge-cases.test.ts | `[D3.4] merged item takes the latest due date` | unit | Due `2026-09-01` and `2026-09-10` | Due `2026-09-10`. |
| TC-19 | D3.4 (D143) | tests/unit/edge-cases.test.ts | `[D3.4] an undated copy does not override a dated one` | unit | Due `null` (newer note) and `2026-09-10` (older note) | Due `2026-09-10`. |
| TC-20 | D68.2 | tests/unit/edge-cases.test.ts | `[D68.2] a dated copy clears the flag` | unit | Copy A flagged, no date; copy B due `2026-10-09` | Due `2026-10-09`, `dueFlagged: false`. |
| TC-21 | D68.2 | tests/unit/edge-cases.test.ts | `[D68.2] flag survives only when no copy has a date` | unit, negative | Two copies, both no date, one flagged | Due `null`, `dueFlagged: true`. |
| TC-22 | D3.5 (D144) | tests/unit/edge-cases.test.ts | `[D3.5] done copy keeps the merged item done; later open copy does not reopen it` | unit | Copy 1 done (older), copy 2 open (newer) | Status `done`. Due is still the latest of both copies. |
| TC-23 | D39.1, D39.3 (D150) | tests/unit/edge-cases.test.ts | `[D39.1] wording and meeting date come from the most recent note, not ingest order` | unit | Newer note read first, older read second | Task text and meeting date of the newer note. |
| TC-24 | D14.2 (D149) | tests/unit/edge-cases.test.ts | `[D14.2] merged item keeps the id of the earliest item` | unit | Existing item id 7; incoming copy | Id 7 kept; no new id. |
| TC-25 | NFR-D3 | tests/unit/edge-cases.test.ts | `[NFR-D3] merge output is the same for any input order` | property | Same 6 items in 6 fixed permutations | Identical items, sources, due and status for every order. |
| TC-26 | NFR-P3 | tests/acceptance/sample-notes.test.ts | `[NFR-P3] merges 5,000 existing and 5,000 incoming items` | acceptance | Generated dataset (fixture helper, no file) | Completes; per-item lookup uses the index (no full scan). Time budget is a soft check, see risks in plan.md. |
| TC-27 | D13.1, D13.2, NFR-A9 | tests/unit/edge-cases.test.ts | `[D13.1] same (file, line) already stored changes nothing` | unit | Stored item with source `a.md:12`; same line again | `unchanged`; store identical. |
| TC-28 | D52.1 | tests/unit/edge-cases.test.ts | `[D52.1] a stored item is never removed when its line is absent` | unit, negative | Store has item from `a.md:12`; new input has no item for that file | Item still present, unchanged. |
| TC-29 | D13.3, D52.2 (D147) | tests/unit/edge-cases.test.ts | `[D13.3] a reworded line at the same file and line is treated as a new incoming item` | unit | Stored `a.md:12` `send quote`; new `a.md:12` `send the updated quote` | Merge rules applied to the new text (key differs, so new item). |
| TC-30 | D13.2 | tests/unit/edge-cases.test.ts | `[D13.2] re-ingest keeps a stored done status` | unit | Stored done item; same line re-read as `- [ ]` | Status stays `done`. |
| TC-31 | D14.2 (D148) | tests/unit/edge-cases.test.ts | `[D14.2] mergeItem returns a change kind and never assigns an id` | unit | New item with no match | Kind `add`; no `id` field on the change. |
| TC-32 | D40.1 (D146) | tests/unit/edge-cases.test.ts | `[D40.1] (group) items for Everyone and Team merge on the same task` | unit | `(group)` from `Everyone` and from `Team`, same task | One item (consequence of D25.1 + D40.1). |
| TC-33 | NFR-A5, FR-E1 | tests/acceptance/sample-notes.test.ts | `[NFR-A5] Priya Nair quote merges into one done item with 3 sources` | acceptance | Fixtures `priya-2026-09-01.md`, `priya-2026-09-08.md`, `priya-2026-09-15.md` (see Fixtures) | One item, status `done`, 3 sources, due = latest dated copy per D3.4 (value set per the note below). |
| TC-34 | NFR-D5, D28.3 | tests/acceptance/sample-notes.test.ts | `[NFR-D5] first and updated wireframes stay two items` | acceptance | Fixtures `wireframes-first.md`, `wireframes-updated.md` | Two items. |
| TC-35 | NFR-A9, D13.1 | tests/acceptance/sample-notes.test.ts | `[NFR-A9] ingest twice gives same items, ids and statuses` | acceptance | Fixtures folder, two runs | Second run changes nothing. Skipped with reason until specs 05 and 06 land. |
| TC-36 | NFR-R1 | tests/unit/edge-cases.test.ts | `[NFR-R1] mergeItem does not throw on empty store or empty task text` | unit, negative | Empty store; incoming with task `""` | Returns a result (`unchanged` or `add` per D141); no exception. |
| TC-37 | D28.2 (D137) | tests/unit/edge-cases.test.ts | `[D28.2] articles attached to punctuation follow the agreed order` | unit | `"the."` and `"(a) review"` | Output per D137: `""` and `"review"`. |
| TC-38 | D28.2 (D138) | tests/unit/edge-cases.test.ts | `[D28.2] hyphen becomes a space; apostrophe is removed` | unit | `"follow-up"`, `"don't"` | `"follow up"`, `"dont"` per D138. |
| TC-39 | D3.3 (D142) | tests/unit/edge-cases.test.ts | `[D3.3] same task on two lines of one note gives two sources` | unit | Same file, lines 4 and 9 | Two source records for that file. |
| TC-40 | D52.1 (D149) | tests/unit/edge-cases.test.ts | `[D52.1] existing duplicates already in the store are not merged or removed` | unit, negative | Store with two items, same key | Both kept; new copy matches the lower id. |
| TC-41 | D30.2 (D151) | tests/unit/edge-cases.test.ts | `[D30.2] a new source on an existing item counts as merged; an unchanged re-read does not` | unit | One new copy; one re-read copy | `merged: true` for first; `unchanged` for second. |
| TC-42 | D40.2 (D145) | tests/unit/edge-cases.test.ts | `[D40.2] ambiguous first name is compared case-insensitively` | unit | `Priya` and `priya`, same task, both `(ambiguous)` | One item. |

Note on TC-33: the stored due date follows D3.4 (latest non-empty) over the three copies. Write the expected value from the actual dated copies in the fixtures (2026-09-01 `by Friday` resolves per spec 02). Do not hard-code it before spec 02 is green.

## Negative cases (summary)

TC-05, TC-09, TC-11, TC-13, TC-15, TC-21, TC-28, TC-40 check that different work is not merged and that rules do not over-fire. They are the guard for NFR-D5.

## Fixtures needed

Location: `tests/fixtures/dedupe/`. All synthetic, no real names beyond the sample already used in `specs/04-dedupe/spec.md`.

- `priya-2026-09-01.md`: meeting 2026-09-01, `- [ ] Priya Nair to send the revised quote to Acme — by Friday`.
- `priya-2026-09-08.md`: meeting 2026-09-08, `- [ ] Priya N. to send the revised quote to Acme — by Friday`, no `the`.
- `priya-2026-09-15.md`: meeting 2026-09-15, `- [x] Priya Nair to send the revised quote to Acme`.
- `wireframes-first.md`: `- [ ] Anita to share first wireframes`.
- `wireframes-updated.md`: `- [ ] Anita to share updated wireframes`.
- `group-ambiguous.md`: `Everyone to review the prototype`, `Team to review the prototype`, `Priya to confirm the budget` with two Priyas in attendees.
- Generated (in test code, not a file): 5,000 `ActionItem` objects with varied owners and tasks for TC-26.

Sample-folder checks (TC-33 to TC-35 may also run against the read-only `notes/` folder, which is test data only; do not edit it).
