# Spec 04: Duplicate handling

Decides when two items are the same, and how they merge. This is edge case E1 and must never hide different work (NFR-D5).

| Field | Value |
|---|---|
| Business reqs | BR-08 (E1) |
| FRD | FR-I10, FR-E1, D3, D13, D28, D36, D39, D40, D48, D49, D52, D58, D68 |
| NFRD | NFR-D3, D4, D5, NFR-A5, A9 |
| Modules | `dedupe/normalize.ts` (`normalizeTask`, `dedupeKey`), `dedupe/merge.ts` (`mergeItem`) |
| Tests | `tests/unit/edge-cases.test.ts` (E1) |

## Behaviour

### Normalised task (D28.2, D36.2, D48.1)
1. The task text is already stripped of its **resolved** due phrase (spec 02, D49). Unresolved phrases such as `by 10%` or `by mid-October` stay and take part in matching (D48.1).
2. `normalizeTask` then: lowercases, removes the articles `a`, `an`, `the`, removes punctuation, and collapses spaces.
3. A difference in any other word keeps items separate (D28.3). `share first wireframes` and `share updated wireframes` are two items.

### Duplicate key (D28.1, D40)
4. A duplicate has the same **resolved owner** and the same normalised task.
5. `(no owner)` and `(group)` items merge with the same label and the same normalised task (D40.1).
6. An `(ambiguous)` item merges only with another `(ambiguous)` item of the **same first name** and the same normalised task (D40.2).
7. `(unresolved)` items merge on the same label, the same unresolved name text and the same normalised task (D68.1).
8. The same task for two different owners stays as two items (D28.1).

### Merging (D3, D39, D58)
9. A merged item keeps **all sources** (`{file, meetingDate, line}`), no repeats of the same file and line, ordered by meeting date then file name, newest last (D3.3).
10. The **due date** is the **latest** non-empty due date of the copies (D3.4). If no copy has a date, there is none. A merged item that has a date is **not flagged**; it is flagged only when no copy has a date and at least one copy is flagged (D68.2).
11. **Done wins**: if any copy is done, the merged item is done (D3.5, D12 leftover). A later open copy never reopens it.
12. The displayed **task wording** and the **meeting date for the email** are those of the most recent note, by meeting date, then file name (D39.1, D39.3).
13. The **id** is the id of the earliest created item; the other copies never get one (D14).

### Re-ingest (D13, D52)
14. Ingesting a source (file and line) that is already stored changes nothing, so ids, statuses and sources stay the same (D13.1, D13.2, NFR-A9).
15. A reworded or newly added line is added or merged by rules 4 to 13 (D13.3, D52.2).
16. Ingest never removes a stored item (D52.1, ADR 0001).

## Sample evidence
| Case | Result |
|---|---|
| Priya Nair, `send the revised quote to Acme`: 2026-09-01 (`by Friday`), 2026-09-08 (`Priya N.`, no `the`, `— by Friday`), 2026-09-15 (done) | **one done item with 3 sources** (NFR-A5) |
| `Share first wireframes` (Anita) vs `share updated wireframes` | two items (NFR-D5) |
| `Everyone to review the prototype`, `Someone to update the CRM notes` and later repeats | merge within their label (D40) |
| Running ingest twice on the sample folder | same items, ids and statuses (NFR-A9) |

## Acceptance tests
- `D28.1` same resolved owner and normalised task merge
- `D28.2`, `D48.1` normalisation drops articles, punctuation, spaces; keeps unresolved due wording
- `D28.3`, `NFR-D5` `first` vs `updated` wireframes stay separate
- `D28.1` same task, different owners: two items
- `D3.3`, `D3.4`, `D3.5` all sources kept, latest due date, done stays done
- `D39.1` most recent wording and meeting date shown
- `D40.1`, `D40.2` labels merge within the label; ambiguous only on the same first name
- `D13.1`, `D13.2` re-ingest is idempotent; ids and done status are kept
- `D52.1` removing a line from a note leaves the stored item unchanged
- `D14` merged item keeps the earliest id; ids are never reused
- `D68.1` `(unresolved)` items merge on label, name text and normalised task
- `D68.2` a dated copy clears a flag; a flag survives only when no copy has a date
