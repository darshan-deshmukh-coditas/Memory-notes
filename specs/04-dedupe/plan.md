# Plan 04: Duplicate handling

Source: `spec.md` in this folder. Requirements: `docs/FRD.md` section 11 (D3, D13, D14, D28, D36, D39, D40, D48, D49, D52, D58, D68, D69), `docs/NFRD.md` (NFR-D3, NFR-D4, NFR-D5, NFR-A5, NFR-A9), `docs/BRD.md` BR-08 / E1.

## Goal

Turn the parsed checkbox items of one ingest into store changes, so that the same action item written in several meetings is stored once, with all its sources, and different work is never merged (NFR-D5). Two pure functions: `normalizeTask` (`src/dedupe/normalize.ts`) and `mergeItem` (`src/dedupe/merge.ts`).

## Scope

In scope:
- Normalised task text and the duplicate key (resolved owner or label, plus normalised task).
- Merge rules: all sources, latest due date, done wins, wording and meeting date of the most recent note, earliest id kept.
- Idempotent re-ingest of the same source (file + line) and of a reworded line (D13, D52.2).
- Label-based merging for `(no owner)`, `(group)`, `(ambiguous)` and `(unresolved)` (D40, D68.1).

Out of scope (owning specs):
- Parsing checkbox lines, owner text, due phrases, stripping the due phrase from the task: spec 01, 02, 03 (this spec consumes their output).
- Assigning ids and writing the file (atomic write, store version): spec 05 (`store`). This spec never creates an id.
- Ingest orchestration, skip report, summary counts: spec 06.
- Resolving owners from attendees and roster: spec 03.
- Overdue computation and list filters: spec 07 (D1, D31).

## Requirement map

| ID | Rule (one line) | Module | Test ID (see testcases.md) |
|---|---|---|---|
| D28.2, D36.2, D48.1 | Normalise: lowercase, drop a/an/the, drop punctuation, collapse spaces; resolved due phrase already gone, unresolved phrase kept | `dedupe/normalize.ts` | TC-01, TC-02, TC-03 |
| D28.1 | Duplicate = same resolved owner + same normalised task | `dedupe/merge.ts` | TC-04, TC-05 |
| D28.3, NFR-D5 | `first` vs `updated` wireframes stay separate | `dedupe/normalize.ts` | TC-06 |
| D40.1 | `(no owner)` and `(group)` merge within their label | `dedupe/merge.ts` | TC-09 |
| D40.2 | `(ambiguous)` merges only with same first name + same task | `dedupe/merge.ts` | TC-10, TC-11 |
| D68.1 | `(unresolved)` merges on label, name text, task | `dedupe/merge.ts` | TC-12 |
| D3.3, D58.1 | Merged item keeps all sources, no repeats, ordered by meeting date then file | `dedupe/merge.ts` | TC-13, TC-14 |
| D3.4, D68.2 | Latest non-empty due date; flag only if no copy dated and one flagged | `dedupe/merge.ts` | TC-15, TC-16, TC-17 |
| D3.5 | Done wins; later open copy never reopens | `dedupe/merge.ts` | TC-18 |
| D39.1, D39.3 | Wording and meeting date from most recent note | `dedupe/merge.ts` | TC-19 |
| D14.2, spec #13 | Keep id of earliest item; copies never get an id | `dedupe/merge.ts` | TC-20 |
| D13.1, D13.2, NFR-D4, NFR-A9 | Same file + line again changes nothing | `dedupe/merge.ts` | TC-21, TC-22 |
| D13.3, D52.2 | Reworded or new line merges or is added by the key rules | `dedupe/merge.ts` | TC-23 |
| D52.1 | Ingest never removes a stored item | `dedupe/merge.ts` | TC-24 |
| FR-E1 / NFR-A5 | Priya Nair example: one done item, 3 sources | acceptance | TC-25 |
| NFR-D3 | Same input gives same output, independent of input order | `dedupe/merge.ts` | TC-26 |
| NFR-P3 | Several thousand items merge without quadratic scans | `dedupe/merge.ts` | TC-27 |

## Design approach

1. `normalizeTask(task: string): string` is pure and total. It takes the task text with the resolved due phrase already removed (spec #1). Steps are decided in D77 and D78. It never throws on odd input; an empty result is handled by the caller (D81).
2. `dedupeKey` is a pure helper: `owner + "\u0000" + normalizeTask(task)`. The NUL separator stops `ab`+`c` colliding with `a`+`bc`. Label owners use the label text as the owner part (spec #5, #6, #7).
3. `mergeItem` is a pure function over the store items and one incoming item. It builds a `Map<dedupeKey, index>` once per call (or the caller passes a prebuilt index) so that a 5,000-item store stays linear (NFR-P3).
4. Merge result per key:
   - sources: union by (file, line); sorted by meeting date, then file name; newest last (spec #9).
   - due: latest non-empty ISO date across copies; null is ignored (D83). `dueFlagged` = true only if no copy has a date and at least one copy is flagged (spec #10).
   - status: `done` if any copy is done (spec #11).
   - task wording and meeting date: taken from the source with the greatest (meeting date, file name) (spec #12, D90).
   - id: unchanged for an existing item (spec #13).
5. Re-ingest: an incoming item whose (file, line) is already in `sources` of the matching stored item changes nothing (spec #14). The function reports `merged: false` and no mutation.
6. Ids: `mergeItem` does not assign ids. Decision D88: it returns a change list (`add` / `merge` / `unchanged`) and spec 05 assigns ids in D69.1 order. The stub signature (`ActionItem[]`, `Omit<ActionItem,"id">`) changes to the change-list form.
7. Errors: merge never throws on user data. Items reaching `mergeItem` are already validated by specs 01 to 03.

## Dependencies

- Consumes: spec 02 (resolved due date, `dueFlagged`, task with resolved phrase removed; D49), spec 03 (resolved owner or label, first name for ambiguous; D28.1, D40, D68.1), spec 01 (file, line, 1-based, CRLF-safe text; D58.1).
- Feeds: spec 05 (store writes the change list and assigns ids), spec 06 (ingest calls merge per item, counts `merged` for the summary D30.2).
- Idempotence: spec 06 running the same folder twice must produce the same store (NFR-A9). This spec provides the "unchanged" outcome that makes this true.

## Risks

- False merge hides work (NFR-D5). Mitigation: no stemming, no fuzzy match, no synonym list; only the listed words are dropped; acceptance test on `first` vs `updated`.
- Too strict normalisation splits true duplicates (for example `Send the quote.` vs `send quote`). Mitigation: D77 and D78; sample check NFR-A5.
- Line numbers shift when a line is inserted above an existing one (D87). A reworded line at a reused line number could be ignored by a file+line rule. High priority.
- Non-deterministic order of `Map` or `Set` iteration leaks into ids or sources (NFR-D3). Mitigation: sort explicitly.
- Quadratic merge on large stores (NFR-P3). Mitigation: prebuilt index.
## Decisions

Settled by the user. Each line is a decision, not a question. Q-labels are local to this folder and are not requirement IDs. Decision IDs D77 to D91 are to be recorded in `docs/FRD.md` section 11 (task T01).

- **D77 (Q1).** Normalisation order: lowercase, remove punctuation, split on whitespace, drop whole-word `a`, `an`, `the`, join with one space.
- **D78 (Q2).** Apostrophe removed with no space; hyphen and dash replaced by a space (`follow-up` = `follow up`); `e-mail` and `email` stay different.
- **D79 (Q3).** Unicode NFC, then locale-independent `toLowerCase()`; non-ASCII tasks compare exactly as lowercased.
- **D80 (Q4).** An unresolved due phrase stays in the task and takes part in matching (D48.1). Only the resolved phrase is removed; `by 10%` and `by mid-October` stay.
- **D81 (Q5).** A task that normalises to empty is not stored; it is reported as an empty action item (D50.1 style) with file:line.
- **D82 (Q6).** One source per (file, line); the same task on two lines of one note gives two sources.
- **D83 (Q7).** A null due date means "no date", not an older date; any dated copy beats undated copies; ISO `YYYY-MM-DD` strings are compared (D68.2).
- **D84 (Q8).** A done item merged with open copies keeps status done; the due date is the latest over all copies, including the done one; a later open copy updates wording and meeting date (D39.1) but not status.
- **D85 (Q9).** First name (ambiguous) and name text (unresolved) are compared case-insensitively with whitespace collapsed; an ambiguous item never merges with a resolved item for the same person (spec #6).
- **D86 (Q10).** `(no owner)`, `(group)`, `(ambiguous)`, `(unresolved)` and a resolved name are different keys; `Everyone` and `Team` both store `(group)` (D25.1) and merge by D40.1.
- **D87 (Q11).** Same file and line with different normalised text is a new incoming item, matched by the key rules (rules 4 to 13); lines shifted by an insert are handled the same way; old sources stay (D52.1).
- **D88 (Q12).** `mergeItem` returns a change list (`add` / `merge` / `unchanged`) and spec 05 assigns ids in D69.1 order; the stub signature changes to this form.
- **D89 (Q13).** Two stored items with the same key are not merged (D52.1); new copies match the lowest id.
- **D90 (Q14).** "Most recent note" is computed from the source records (meeting date, then file name), not from read order; re-ingesting an older note does not change the shown wording.
- **D91 (Q15).** Adding a new source to an existing item counts as merged; an unchanged re-ingest does not (D30.2).
