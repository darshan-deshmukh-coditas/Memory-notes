# Plan: `actiontrack done <id>` (spec 08)

Source of truth: `spec.md` in this folder, then FRD section 11 (D1..D76, later wins).

## Goal

Let the user mark one stored action item as done. The change goes to the item store only, survives new runs, and never touches a source note. Unknown or invalid ids fail with exit 2 and change nothing.

## Scope

**In scope**
- `done <id> [--store <path>] [--today <YYYY-MM-DD>]` in `src/cli/commands/done.ts`.
- Id validation (whole number 1 or more), unknown-id error, already-done message.
- Save through `store/store.ts` (atomic write, D59.2).
- Confirmation message with id, owner and task (FR-D32.4).
- `--today` validation only (D54.1); no effect on `done`.

**Out of scope**
- Writing back to the source note, checking the box in markdown: out of scope, decided by FR-D32.1 (OQ-41 resolved). Not a future feature of this spec.
- Reopening a done item (no `undone` command exists in any spec). Re-ingest never reopens (D13.2, D3.5). See decision Q2.
- Store format, atomic write and corrupt-store handling: spec `05-store` (D17, D59, D69).
- Ingest, dedupe and id assignment: spec `06-ingest`, `04-dedupe`.
- The `list` display of done items: spec `07-list` (D15.4, D44.2).
- Global CLI conventions (exit code mapping, `--today` on all commands): spec `11-cli-conventions` (D54, D62).

## Requirement map

| ID | Rule (one line) | Module | Test (see testcases.md) |
|---|---|---|---|
| FR-D1, BR-05 | `done <id>` sets the item's status to done | `cli/commands/done.ts`, `store/store.ts` | TC-09, TC-11 |
| FR-D2, FR-D44.1, AC-D1 | Done item leaves open and overdue; shows under `--status done` | `store` (stored status), `cli/commands/list.ts` (spec 07) | TC-09 |
| FR-D3, NFR-D6 | Status persists across processes | `store/store.ts` | TC-17 |
| FR-D4, FR-D32.2, D59.3 | Unknown id: exit 2, store unchanged; missing store: exit 2 | `done.ts` | TC-12, TC-13, TC-14 |
| FR-D32.3 | Already done: message, exit 0, no change | `done.ts` | TC-15 |
| FR-D32.4, D65.3 | Confirmation shows owner and task; wording otherwise free | `done.ts` | TC-10 |
| FR-D32.1, FR-D5 | Source note never edited | `done.ts` (no note I/O) | TC-16, TC-29 |
| FR-D6, D3.5, D13.2 | Re-ingest never reopens; done kept | spec 06, `dedupe/*` | TC-18, TC-33 |
| D3.2, D3.3, D3.4, D3.5 | A merged item is one done item with all sources kept | `store` | TC-19 |
| D14.1, D14.2 | Ids are sequential and never change or get reused | `done.ts` (never renumbers) | TC-27 |
| D54.1 | Invalid `--today` exits 2; valid one accepted and ignored | `cli/index.ts` / shared validator | TC-20, TC-21, TC-22 |
| D59.4 | Corrupt store: exit 2, never overwritten | `store/store.ts` | TC-24 |
| D69.2 | Store `version` not 1: exit 2, never overwritten | `store/store.ts` | TC-25 |
| D62.1, D62.2, NFR-R3 | Save failure: exit 4, previous store intact | `store/store.ts`, `done.ts` | TC-26 |
| D17.2, D59.1 | `--store` and `ACTIONTRACK_STORE` select the store | `store/store.ts` | TC-23 |
| NFR-P2, N2 | `done` under 1 second with 5,000 items | `done.ts`, `store/store.ts` | TC-28 |
| NFR-O3 | Errors to stderr, no log file | `done.ts` | TC-30 |
| NFR-SEC4 | Task text from a note is data; printed, never interpreted | `done.ts` | TC-31 |

## Design approach

1. Parse `<id>` with a strict check: `^[1-9][0-9]*$`, within safe integer range. Otherwise usage error, exit 2, store untouched (Behaviour 1). Edge cases are settled in decisions Q4 and Q5.
2. Validate `--today` if given (D54.1) with the same validator used by all commands. Do this before touching the store.
3. Load the store via `store/store.ts` `loadStore(path)`. A missing store is an unknown id (exit 2, D59.3). A corrupt or wrong-version store is exit 2 and is not written (D59.4, D69.2).
4. Look up the item by id. Unknown id: exit 2, no write (D32.2).
5. If stored status is already `done`: print the "already done" message with id, owner and task, exit 0, and do not call save (D32.3; Q1).
6. Otherwise set stored status to `done`, save atomically (D59.2), print confirmation with id, owner and task, exit 0.
7. Save failure: clear message to stderr, exit 4, previous store file left intact (D62.1, NFR-R3).
8. `done` never reads or writes a source note. It has no dependency on `parser/*`, `owners/*` or `dates/*`.
9. `done.ts` takes its store path, clock and output as arguments through `Deps` (NFR-M1, NFR-M2). `cli/index.ts` is the only place that builds real dependencies.

Ids are not renumbered or reassigned; `done` never creates an item (D14.2).

## Dependencies

- **Spec 05 `store`**: needs `loadStore`, `saveStore`, `resolveStorePath`, the item shape with stored status `open | done`, and the `version` check. Must land before `done` can go green. Store tests for D59.3, D59.4, D69.2 are owned there; `done` tests cover only the command-level exit codes.
- **Spec 07 `list`**: must show a done item under `--status done` and exclude it from `open` and `overdue` (AC-D1). `done` tests assert this through `list`, so spec 07 must be implemented, or the AC-D1 test is run against the store directly until it is.
- **Spec 06 `ingest`**: must keep stored status and id on re-ingest (D13.2, D3.5). TC-18 and TC-33 need ingest; they can be marked skipped until spec 06 lands.
- **Spec 11 CLI conventions**: exit code mapping (2 for usage errors, 4 for internal errors) and the shared `--today` validator.

## Risks

- **Accidental source-note write.** A future shortcut could "tick the box" in the note. Guard: TC-16 (hash before and after) and TC-29 (only the store file changes). Code review must reject any `fs` call on a notes folder path in `done.ts`.
- **Id reuse.** If the store is ever rebuilt or ids are derived from array position, `done 3` could hit a different item. Guard: TC-27 and the rule that ids are stored, not derived.
- **Silent reopen via ingest.** A later copy of a done item must not reopen it (spec 04 rule 11). Guard: TC-18, TC-33.
- **Store corruption on failed save.** Guard: atomic write (write temp, rename) and TC-26.
- **Concurrent runs.** Last writer wins (D59.2). A `done` racing an `ingest` could lose one change. Accepted by spec; documented, not fixed here.
- **Wrong exit code for "already done".** Easy to make it exit 1. Guard: TC-15 asserts exit 0.

## Decisions

- **Q1.** `done` on an item that is already done prints the already-done message (id, owner, task), exits 0, and does not rewrite the store file (FR-D32.3, spec Behaviour 4).
- **Q2.** No reopen command in this spec. Re-ingest never reopens a done item (D13.2, D3.5).
- **Q3.** One id per call. Two or more ids (e.g. `done 2 3`) is a usage error: exit 2, nothing changed.
- **Q4.** Only canonical decimal ids from `1` up are accepted: no sign, no leading zero, no decimal point. Anything else (`01`, `+1`, `1.0`, `0`, `-1`, `1e3`) is exit 2.
- **Q5.** An id beyond the largest assigned id, or beyond the safe integer range, is an unknown id: exit 2, no separate message (FR-D32.2).
- **Q6.** The already-done message includes id, owner and task, as the success message does. Wording is free (FR-D65.3).
- **Q7.** The unknown-id message names the id that was not found and states that nothing changed. Wording is free (FR-D65.3).
- **Q8.** Validation order: id, then `--today`, then store load, then lookup. All these failures are exit 2, so only the message differs.
- **Q9.** `done` acts on the store only and succeeds (exit 0) even if the source note was deleted or changed. It never checks notes (FR-D32.1).
- **Q10.** `done` works on any stored item, including `(no owner)`, `(group)`, `(ambiguous)` and `(unresolved)`. Follow-up exclusion is spec 09's concern.

## Definition of done

See the checklist at the end of `task.md`.
