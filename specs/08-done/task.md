# Tasks: `actiontrack done <id>` (spec 08)

Work in this order. Red first, then green, then refactor. Test IDs refer to `testcases.md`. Decisions D211 to D220 are recorded in plan.md's Decisions section; implement them as written, and record them as new decisions (D211 to D220 for this spec) in `docs/FRD.md` in the same change.

Legend: `dep` = earlier tasks that must be done first.

## Phase 0: preconditions

- [ ] **T01** Record decisions D211 to D220 (per decision ID in plan.md) in `docs/FRD.md` section 11. Spec: spec 08 Behaviour 1 to 9. File: `docs/FRD.md`. Test: none. Dep: none.
- [ ] **T02** Confirm spec 05 (`store`) status. `loadStore`, `saveStore`, `resolveStorePath` must exist or be stubbed with `NotImplementedError`. Spec: D17, D59. File: `src/store/store.ts` (read only here). Test: none. Dep: none.
- [ ] **T03** Confirm the shared `--today` validator (D54.1) exists or plan its location (spec 11). Spec: D54.1. File: `src/cli/index.ts` or the validator module named in spec 11. Test: none. Dep: none.
- [ ] **T04** Create fixtures listed in `testcases.md` "Fixtures needed" (store JSON files, notes-done folder, hostile task text). Spec: TC-09, TC-12, TC-19, TC-24, TC-25, TC-13. Files: `tests/fixtures/done/*`. Test: none. Dep: T01.

## Phase 1: red (failing tests first)

- [ ] **T05** Replace the `it.todo` "marks done; excluded from open and overdue..." with a real failing test named `[TC-09] AC-D1 ...`. Spec: AC-D1, FR-D2, FR-D44.1. File: `tests/unit/commands.test.ts`. Test: TC-09. Dep: T04.
- [ ] **T06** Replace the `it.todo` "unknown id exits 2; already done..." with failing tests `[TC-12]`, `[TC-15]`. Spec: FR-D32.2, FR-D32.3. File: `tests/unit/commands.test.ts`. Test: TC-12, TC-15. Dep: T04.
- [ ] **T07** Add failing test `[TC-01]` (id 1 valid) and `[TC-02]` to `[TC-08]` (id validation, usage errors). Spec: Behaviour 1. File: `tests/unit/commands.test.ts`. Test: TC-01 to TC-08. Dep: T04.
- [ ] **T08** Add failing test `[TC-10]` (confirmation shows id, owner, task). Spec: FR-D32.4, D65.3. File: `tests/unit/commands.test.ts`. Test: TC-10. Dep: T04.
- [ ] **T09** Add failing tests `[TC-11]` (overdue to done) and `[TC-13]`, `[TC-32]` (unassigned id, beyond safe integer). Spec: Behaviour 2, D14.2, D215. File: `tests/unit/commands.test.ts`. Test: TC-11, TC-13, TC-32. Dep: T04.
- [ ] **T10** Add failing test `[TC-14]` (missing store exits 2, no file created). Spec: D59.3. File: `tests/unit/commands.test.ts`. Test: TC-14. Dep: T04.
- [ ] **T11** Add failing test `[TC-16]` (source note SHA-256 identical after done, every .md in a temp copy). Spec: FR-D32.1. File: `tests/unit/commands.test.ts`. Test: TC-16, TC-29. Dep: T04.
- [ ] **T12** Add failing test `[TC-29]` (only the store file changes; no temp file left). Spec: Behaviour 5, D17.1. File: `tests/unit/commands.test.ts`. Test: TC-29. Dep: T04.
- [ ] **T13** Add failing integration test `[TC-17]` (status persists across two child processes). Spec: NFR-D6. File: `tests/unit/commands.test.ts`. Test: TC-17. Dep: T04.
- [ ] **T14** Add failing integration tests `[TC-18]` and `[TC-33]` (re-ingest does not reopen). Spec: D3.5, D13.2. File: `tests/unit/commands.test.ts`. Test: TC-18, TC-33. Dep: T04, spec 06 ingest stub.
- [ ] **T15** Add failing test `[TC-19]` (merged item with three sources is one done item, sources kept). Spec: Behaviour 8, D3.2 to D3.5. File: `tests/unit/commands.test.ts`. Test: TC-19. Dep: T04.
- [ ] **T16** Add failing tests `[TC-20]`, `[TC-21]`, `[TC-22]`, `[TC-34]` (`--today` validation and no effect). Spec: D54.1, Behaviour 9. File: `tests/unit/commands.test.ts`. Test: TC-20, TC-21, TC-22, TC-34. Dep: T03, T04.
- [ ] **T17** Add failing tests `[TC-24]` (corrupt store not overwritten), `[TC-25]` (version 2 not overwritten). Spec: D59.4, D69.2. File: `tests/unit/commands.test.ts`. Test: TC-24, TC-25. Dep: T04.
- [ ] **T18** Add failing test `[TC-26]` (injected save failure exits 4, previous store intact). Spec: D62.1, NFR-R3. File: `tests/unit/commands.test.ts`. Test: TC-26. Dep: T04.
- [ ] **T19** Add failing test `[TC-27]` (ids unchanged, no item created). Spec: D14.1, D14.2. File: `tests/unit/commands.test.ts`. Test: TC-27. Dep: T04.
- [ ] **T20** Add failing test `[TC-23]` (`--store` and `ACTIONTRACK_STORE` select the store). Spec: D17.2. File: `tests/unit/commands.test.ts`. Test: TC-23. Dep: T04.
- [ ] **T21** Add failing test `[TC-30]` (errors on stderr, nothing on stdout, no log file). Spec: NFR-O3. File: `tests/unit/commands.test.ts`. Test: TC-30. Dep: T04.
- [ ] **T22** Add failing test `[TC-31]` (hostile task text printed as data). Spec: NFR-SEC4. File: `tests/unit/commands.test.ts`. Test: TC-31. Dep: T04.
- [ ] **T23** Add failing tests for decisions D219 and D220 `[TC-35]`, `[TC-36]`. Spec: decisions D219, D220. File: `tests/unit/commands.test.ts`. Test: TC-35, TC-36. Dep: T01, T04.
- [ ] **T24** Add failing acceptance test `[TC-28]` (5,000-item store, `done` under 1 second). Spec: NFR-P2, N2. File: `tests/acceptance/sample-notes.test.ts`. Test: TC-28. Dep: T04.
- [ ] **T25** Run `npm test`. Confirm every new test fails for the right reason (`NotImplementedError`, not a syntax or import error). Test: all. Dep: T05 to T24.

## Phase 2: green (implement)

- [ ] **T26** Implement strict id parsing (`^[1-9][0-9]*$`, safe integer, D214/D215). Usage error exit 2. Spec: Behaviour 1, D32.2. File: `src/cli/commands/done.ts`. Test: TC-01 to TC-08, TC-32. Dep: T25, T01.
- [ ] **T27** Implement store-path resolution through `resolveStorePath`. Spec: D17.2, D59.1. File: `src/store/store.ts`, `src/cli/commands/done.ts`. Test: TC-23. Dep: T02, T26.
- [ ] **T28** Implement `loadStore` error mapping: missing store means unknown id (exit 2), corrupt or wrong version exit 2 without overwrite. Spec: D59.3, D59.4, D69.2. File: `src/store/store.ts`. Test: TC-14, TC-24, TC-25. Dep: T27.
- [ ] **T29** Implement `--today` validation before the store is read (D218). Spec: D54.1. File: `src/cli/index.ts` or shared validator. Test: TC-20, TC-34. Dep: T03, T16.
- [ ] **T30** Implement the lookup and the "set done" path with confirmation message (id, owner, task). Spec: Behaviour 2, FR-D32.4. File: `src/cli/commands/done.ts`. Test: TC-09, TC-10, TC-11, TC-27, TC-36. Dep: T28.
- [ ] **T31** Implement unknown id: exit 2, no save call. Spec: FR-D32.2. File: `src/cli/commands/done.ts`. Test: TC-12, TC-13, TC-32. Dep: T30.
- [ ] **T32** Implement already-done: message, exit 0, no save call (D211). Spec: FR-D32.3. File: `src/cli/commands/done.ts`. Test: TC-15. Dep: T30.
- [ ] **T33** Implement `saveStore` as atomic write (temp file, rename), and map save failure to exit 4 with stderr message (D62.1). Spec: D59.2, NFR-R3. File: `src/store/store.ts`, `src/cli/commands/done.ts`. Test: TC-26, TC-29. Dep: T30.
- [ ] **T34** Ensure `done.ts` has no import of `parser/*`, `owners/*`, `dates/*`, `dedupe/*` and no `fs` call on the notes folder. Spec: FR-D32.1. File: `src/cli/commands/done.ts`. Test: TC-16, TC-35. Dep: T30.
- [ ] **T35** Make `--store` and env var behave per D17.2 and print errors only to stderr (NFR-O3). Spec: NFR-O3. File: `src/cli/commands/done.ts`. Test: TC-30. Dep: T27, T33.
- [ ] **T36** Wire the real command in `cli/index.ts` (commander, `done <id>` with `--store`, `--today`). Exit code mapping only here. Spec: spec 11, D53.1. File: `src/cli/index.ts`. Test: TC-06, TC-22. Dep: T29, T35.
- [ ] **T37** Run `npm test`. Confirm TC-01 to TC-36 green except those that depend on spec 05, 06 or 07 work (see T38). Test: all. Dep: T36.
- [ ] **T38** For tests that depend on spec 06 (ingest) or spec 07 (list): either wait, or mark with `it.skip` plus a comment citing the spec and TC ID. Do not delete them. Tests: TC-09, TC-16, TC-17, TC-18, TC-19, TC-33, TC-35. Dep: T37.

## Phase 3: refactor and verify

- [ ] **T39** Refactor: move the id parser and the `--today` validator into one shared function used by all commands (D54.1). Keep the function pure. Spec: D54.1, spec 11. File: shared validator module. Test: TC-02 to TC-08, TC-20 still green. Dep: T37.
- [ ] **T40** Check the store write path once more for TC-29 (no leftover temp file on success or failure). Spec: D59.2. File: `src/store/store.ts`. Test: TC-29, TC-26. Dep: T39.
- [ ] **T41** Remove any leftover `NotImplementedError` in `done.ts`. Spec: CLAUDE.md scaffold rule. File: `src/cli/commands/done.ts`. Test: none. Dep: T37.

## Phase 4: documentation and traceability

- [ ] **T42** Update `docs/TRACEABILITY.md` row `BR-05 mark done`: status `wip` while T38 skips remain, `done` once all green. Spec: CLAUDE.md workflow step 4. File: `docs/TRACEABILITY.md`. Test: none. Dep: T41.
- [ ] **T43** Update the TRACEABILITY row `NFR-D1..D7 integrity` if the done tests change its status. File: `docs/TRACEABILITY.md`. Test: none. Dep: T42.
- [ ] **T44** Record any answers from T01 as decisions within D211 to D220 for this spec in `docs/FRD.md`, and keep `specs/08-done/spec.md` consistent with them (cite the new decision in the spec, do not rewrite its rules). File: `docs/FRD.md`, `specs/08-done/spec.md`. Test: none. Dep: T01.
- [ ] **T45** Run `npm run check` (typecheck, lint, tests). Fix anything it reports. Test: all. Dep: T42, T44.

## Definition of done

- [ ] All TC-01 to TC-36 exist in `tests/` with names starting `[TC-nn]`, and none is an `it.todo`.
- [ ] Every test that depends on spec 05, 06 or 07 is either green or `it.skip` with a reason and a TC ID.
- [ ] TC-16 and TC-29 pass: the source note bytes are unchanged and only the store file changes.
- [ ] TC-12, TC-14, TC-24, TC-25 and TC-34 pass: no store write on any exit-2 path.
- [ ] TC-15 passes: already done is exit 0 with no write.
- [ ] TC-17 passes: the status survives a new process (NFR-D6).
- [ ] TC-18 and TC-33 pass, or are skipped with a reason pending spec 06 (D3.5).
- [ ] TC-28 passes: `done` under 1 second with 5,000 items (NFR-P2).
- [ ] Decisions D211 to D220 in plan.md are recorded in `docs/FRD.md` under their IDs.
- [ ] `done.ts` imports nothing from `parser`, `owners`, `dates` or `dedupe`, and does no file I/O on notes.
- [ ] `docs/TRACEABILITY.md` row BR-05 shows the correct status.
- [ ] `npm run check` passes.
- [ ] No file in `src/`, `tests/` or `docs/` was edited outside the tasks above, and no other spec folder changed.
