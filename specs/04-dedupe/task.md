# Tasks 04: Duplicate handling

Order matters. Each task lists the requirement it satisfies, the file it touches, the test it turns green (IDs in `testcases.md`), and what it depends on. Do not start a task until its dependencies are checked. Do not change any file outside the list. Decisions D77 to D91 (Q1 to Q15) are in `plan.md`; the tasks marked **(per decision Q-n)** follow that decision.

Rules for all tasks: test first (red), then implement (green), then refactor. Use the `mattpocock-skills:tdd` workflow. Keep imports `.js`-suffixed, no `any`, pure functions, injected clock if needed.

## Phase 0: record settled decisions

- [ ] **T01** Record Q1 to Q15 as decisions D77 to D91 (per decision Q1 to Q15, `plan.md`) in `docs/FRD.md` in the same change, as CLAUDE.md requires. Dependency: none. Blocks: T05 onwards for the points listed in the tasks below.
- [ ] **T02** Mark Q1 to Q15 as settled in `plan.md` Decisions (D77 to D91). Dependency: T01.

## Phase 1: red tests for normalisation

- [ ] **T03** Replace the `it.todo` for `D28.2, D36.2` (normalisation drops `by ...`, a/an/the, punctuation, extra spaces) in `tests/unit/edge-cases.test.ts` with a real failing test. Covers TC-01 to TC-03. Spec: D28.2, D36.2, D48.1. Dependency: T01 (per decision Q1, Q2, Q4).
- [ ] **T04** Add failing tests for case folding and NFC (TC-02). Spec: D28.2. Dependency: T03. (per decision Q3)
- [ ] **T05** Add failing test that an unresolved `by 10%` and `by mid-October` stay in the normalised text (TC-03). Spec: D48.1. Dependency: T03. (per decision Q4)
- [ ] **T06** Add failing test for empty normalised output (TC-04). Spec: D28.2, per decision Q5. Dependency: T03. (per decision Q5)
- [ ] **T07** Add failing test for `first` vs `updated` wireframes (TC-05). Spec: D28.3, NFR-D5. Dependency: T03.
- [ ] **T08** Add failing test that `normalizeTask` is idempotent over a fixed list of 20 strings (TC-06, property). Spec: D28.2. Dependency: T03.

## Phase 2: green normalisation

- [ ] **T09** Implement `normalizeTask` in `src/dedupe/normalize.ts` to pass TC-01 to TC-06 and TC-37, TC-38 (add these two red tests first, in T03 to T08). Remove the `NotImplementedError` throw for this function only. Spec: D28.2, D36.2, D48.1. Dependency: T03 to T08.
- [ ] **T10** Add `dedupeKey(owner, task)` in `src/dedupe/normalize.ts` with the NUL separator. Red test first: TC-07 (`ab`+`c` vs `a`+`bc` differ). Spec: D28.1. Dependency: T09.
- [ ] **T11** Refactor `normalize.ts` for readability; keep tests green. Dependency: T10.

## Phase 3: red tests for matching rules

- [ ] **T12** Turn the `D28.1` todo into a failing test: same resolved owner and normalised task merge (TC-08). Dependency: T11.
- [ ] **T13** Failing test: same task, different resolved owners stay two items (TC-09). Spec: D28.1. Dependency: T11.
- [ ] **T14** Failing test: `(no owner)` and `(group)` merge within their label, and do not merge across labels (TC-10, TC-11). Spec: D40.1. Dependency: T11. (per decision Q10)
- [ ] **T15** Failing test: `(ambiguous)` merges only with the same first name and same task (TC-12, TC-13). Spec: D40.2. Dependency: T11. (per decision Q9)
- [ ] **T16** Failing test: `(unresolved)` merges on label, name text and task (TC-14). Spec: D68.1. Dependency: T11. (per decision Q9)
- [ ] **T17** Failing test: `(ambiguous)` item does not merge with a resolved item for the same person (TC-15). Spec: D40.2. Dependency: T11. (per decision Q9)

## Phase 4: red tests for merge result

- [ ] **T18** Failing test: merged item keeps all sources, no repeats of (file, line), sorted by meeting date then file name, newest last (TC-16, TC-17). Spec: D3.3, D58.1. Dependency: T12.
- [ ] **T19** Failing test: latest non-empty due date wins; null is ignored (TC-18, TC-19). Spec: D3.4. Dependency: T12. (per decision Q7)
- [ ] **T20** Failing test: flag cleared by any dated copy; flag kept only when no copy is dated and one is flagged (TC-20, TC-21). Spec: D68.2. Dependency: T19.
- [ ] **T21** Failing test: done wins; later open copy does not reopen (TC-22). Spec: D3.5. Dependency: T12. (per decision Q8)
- [ ] **T22** Failing test: wording and meeting date come from the most recent note, not ingest order (TC-23). Spec: D39.1, D39.3. Dependency: T18. (per decision Q14)
- [ ] **T23** Failing test: earliest id kept; copies never get an id (TC-24). Spec: D14.2. Dependency: T18. (per decision Q12, Q13)
- [ ] **T24** Failing test: merge is deterministic for the same input in two different orders (TC-25, property). Spec: NFR-D3. Dependency: T18.
- [ ] **T25** Failing test: 5,000 existing items plus 5,000 incoming merge within a fixed time budget and make no full-array scan per item (TC-26). Spec: NFR-P3. Dependency: T18.

## Phase 5: red tests for re-ingest

- [ ] **T26** Failing test: same (file, line) already stored gives `unchanged`, no mutation (TC-27). Spec: D13.1, D13.2, NFR-A9. Dependency: T18.
- [ ] **T27** Failing test: a stored item is never removed when its line is absent from the input (TC-28). Spec: D52.1. Dependency: T26.
- [ ] **T28** Failing test: a reworded line at the same (file, line) is merged or added by the key rules (TC-29). Spec: D13.3, D52.2. Dependency: T26. (per decision Q11)
- [ ] **T29** Failing test: a stored done item keeps its status after re-ingest of its line (TC-30). Spec: D13.2. Dependency: T26.

## Phase 6: green merge

- [ ] **T30** Change the `mergeItem` signature in `src/dedupe/merge.ts` to the change-list form agreed under Q12. Red test first: TC-31 checks that the return kind is `add`, `merge` or `unchanged` and that no id is assigned. Dependency: T23, per decision Q12.
- [ ] **T31** Implement `mergeItem` in `src/dedupe/merge.ts` with a prebuilt key index. Pass TC-08 to TC-32, TC-36, TC-39 to TC-42 (TC-39 to TC-42 are red tests to add in Phase 4 and 5). Dependency: T12 to T30.
- [ ] **T32** Make the merge deterministic: sort sources and items explicitly; no reliance on `Map`/`Set` insertion order for output (TC-25). Dependency: T31.
- [ ] **T33** Refactor `merge.ts` into small pure helpers (sources union, due choice, done choice, wording choice). Tests stay green. Dependency: T32.

## Phase 7: acceptance and safety

- [ ] **T34** Failing acceptance test for the Priya Nair example in `tests/acceptance/sample-notes.test.ts`: one done item, 3 sources (TC-33). Spec: NFR-A5, FR-E1. Dependency: T31. Note: needs spec 06 for the full run; here test the merge step on the three parsed copies from `tests/fixtures`.
- [ ] **T35** Failing acceptance test: `Share first wireframes` and `share updated wireframes` give two items on the sample (TC-34). Spec: NFR-D5. Dependency: T31.
- [ ] **T36** Failing acceptance test: running the same ingest twice gives the same items, ids and statuses (TC-35). Spec: NFR-A9, D13.1. Dependency: spec 05 and 06 (mark as skipped until they land, do not delete it).
- [ ] **T37** Failing test: `mergeItem` never throws on an empty store or an empty task text (TC-36). Spec: NFR-R1 (no crash). Dependency: T31.

## Phase 8: wiring and status

- [ ] **T38** Remove the `NotImplementedError` throws in `src/dedupe/normalize.ts` and `src/dedupe/merge.ts` once their tests are green. No other source file changes. Dependency: T31, T09.
- [ ] **T39** Update `docs/TRACEABILITY.md`: row "BR-08 / E1 duplicates" status from `todo` to `done` for the IDs in this spec (D28, D36, D39, D40, D48, D52, D68, FR-E1). Leave other rows alone. Dependency: T38, T34 to T37 green (T36 may stay `wip` if spec 05/06 not done).
- [ ] **T40** Add the `D77+` decisions from T01 to `docs/FRD.md` section 11 if not already done in T01. Dependency: T01.
- [ ] **T41** Run `npm run check` (typecheck, lint, test). Fix only issues in the files of this spec. Dependency: T39.
- [ ] **T42** Confirm `tests/unit/safety.test.ts` is still green and unchanged. Dependency: T41.
- [ ] **T43** Confirm no file under `src/` other than `src/dedupe/` changed, and no `it.todo` for E1 remains. Dependency: T41.

## Phase 9: review

- [ ] **T44** Run the `mattpocock-skills:code-review` check against the spec: each `D` ID in `spec.md` has a passing test name starting with its ID. Dependency: T43.
- [ ] **T45** Record any new open point found in review as Q16+ in `plan.md`; do not code it. Dependency: T44.

## Definition of done

- [ ] Every `it.todo` in `tests/unit/edge-cases.test.ts` under "E1 duplicates" is a real test whose name cites its FRD/NFRD ID, and it passes.
- [ ] `normalizeTask` and `mergeItem` have no `NotImplementedError` throw left.
- [ ] Every row in `testcases.md` has a passing test, except T36 which waits for specs 05 and 06 and is marked skipped with a reason.
- [ ] D77 to D91 (Q1 to Q15) are each recorded as decisions in `docs/FRD.md`.
- [ ] `docs/TRACEABILITY.md` status for BR-08 / E1 is `done` (or `wip` with the reason written in the spec).
- [ ] `npm run check` passes on Windows, macOS and Linux (NFR-C1 is run by CI, not by this spec alone).
- [ ] No source note under `notes/` is modified (D32.1 spirit; this spec never writes notes).
- [ ] No email code, no store write, and no id assignment is added in `src/dedupe/`.
- [ ] Sample acceptance checks NFR-A5 and NFR-A9 are recorded as run, with the command used.
