# Traceability: requirement → module → test

Status: `todo` (not implemented or not tested), `wip` (implemented, some tests or checks outstanding), `done` (implemented and tests green). Update in the same change as the code.
Specs win over code; see `CLAUDE.md` for the workflow.

Last update: MVP implementation. `npm run check` is green (127 tests). The FRD decisions D77 onward that the plans in `specs/*/plan.md` name are **not yet recorded in `docs/FRD.md`**; two plans (04 and 05) both claim D77 to D96, so the numbering needs an owner's decision first.

| Business req | FRD / decisions | Spec | Module | Test file | Status |
|---|---|---|---|---|---|
| BR-01 load notes | FR-I1..I4, D2, D12, D21, D26, D27, D29, D50, D55, D57, D63–D65 | `specs/01-note-parsing`, `specs/06-ingest` | `parser/note.ts`, `parser/items.ts`, `cli/commands/ingest.ts` | `unit/ingest-parsing.test.ts`, `unit/edge-cases.test.ts`, `acceptance/sample-notes.test.ts` | done |
| BR-02 item fields, real dates | FR-I5..I7, D8–D11, D33, D34, D36, D46–D49, D66 | `specs/02-date-resolution` | `dates/resolve.ts`, `dates/calendar.ts`, `parser/header.ts` | `unit/dates.test.ts` | done |
| BR-03 view and filter | FR-L1..L9, D15, D31, D38, D44, D65, D71, D72 | `specs/07-list` | `cli/commands/list.ts` | `unit/commands.test.ts` | done |
| BR-04 overdue | FR-L5, D1, D44, D54 | `specs/07-list`, `specs/02-date-resolution` | `dates/resolve.ts` (`statusOf`), `cli/commands/list.ts` | `unit/dates.test.ts`, `unit/commands.test.ts` | done |
| BR-05 mark done | FR-D1..D6, D32 | `specs/08-done` | `cli/commands/done.ts`, `store/store.ts` | `unit/commands.test.ts` | done |
| BR-06 one email per owner | FR-F1..F3, D7, D19, D51, D73, D74 | `specs/09-followup` | `email/followup-template.ts`, `cli/commands/followup.ts` | `unit/commands.test.ts` | done |
| BR-07 drafts only, never send | FR-F4, F5, D20, D45, D75, D76, RULE-1/2 | `specs/10-gmail-draft-connector` | `email/connector.ts`, `email/mcp-connector.ts` | `unit/safety.test.ts`, `unit/connector.test.ts` (fixture server), `unit/commands.test.ts` (fake) | wip (real Gmail server not yet smoke-tested) |
| BR-08 / E1 duplicates | FR-I10, FR-E1, D3, D13, D28, D36, D39, D40, D48, D52, D68 | `specs/04-dedupe` | `dedupe/normalize.ts`, `dedupe/merge.ts` | `unit/dedupe.test.ts`, `acceptance/sample-notes.test.ts` | done |
| BR-09 / E2 no owner or date | FR-I11, FR-E2, D16, D25, D42, D46, D50 | `specs/03-owner-resolution`, `specs/07-list` | `owners/resolve.ts`, `cli/commands/*` | `unit/owners.test.ts`, `acceptance/sample-notes.test.ts` | done |
| BR-10 / E3 same first name | FR-I12, FR-E3, D4, D23, D24, D41, D60, D61, D67 | `specs/03-owner-resolution` | `owners/resolve.ts` | `unit/owners.test.ts`, `acceptance/sample-notes.test.ts` | done |
| BR-11 / E4 malformed notes | FR-I8, I9, FR-E4, D5, D22, D30, D50, D55 | `specs/01-note-parsing`, `specs/06-ingest` | `parser/note.ts`, `cli/commands/ingest.ts` | `unit/edge-cases.test.ts`, `acceptance/sample-notes.test.ts` | done |
| Cross-cutting: store, CLI | D14, D17, D20, D52–D54, D56, D58, D59, D62, D69, D70 | `specs/05-store`, `specs/11-cli-conventions` | `store/store.ts`, `cli/index.ts`, `clock.ts` | `unit/commands.test.ts` | wip (store-corruption and atomic-write edge cases have no dedicated tests yet) |

| Non-functional | Decisions | Where verified | Status |
|---|---|---|---|
| NFR-S1..S3 safety | N/A | `unit/safety.test.ts`, `unit/connector.test.ts` | done |
| NFR-R1..R5 robustness | D5, D20 | `unit/edge-cases.test.ts`, `unit/commands.test.ts` | wip (R3 atomic write is implemented but not tested with a failing rename) |
| NFR-D1..D7 integrity | D13, D14 | `unit/commands.test.ts`, `acceptance/sample-notes.test.ts` | wip |
| NFR-P1..P4 performance | N2 | not measured | todo |
| NFR-M1..M5 testability | N1 | structure, `clock.ts`, `email/connector.ts`, fake connector in tests | done |
| NFR-A1..A9 sample acceptance | N1 | `acceptance/sample-notes.test.ts` | done |
| NFR-A10 followup never sends | N1 | `unit/safety.test.ts`, `unit/commands.test.ts` | done |
| NFR-C1 cross-platform | N3 | run on Windows only so far | wip |
