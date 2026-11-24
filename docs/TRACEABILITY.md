# Traceability: requirement → module → test

Status: `todo` (stub + `it.todo`), `wip`, `done` (tests green). Update in the same change as the code.
Specs win over code; see `CLAUDE.md` for the workflow.

| Business req | FRD / decisions | Spec | Module | Test file | Status |
|---|---|---|---|---|---|
| BR-01 load notes | FR-I1..I4, D2, D12, D21, D26, D27, D29, D50, D55, D57 | `specs/01-note-parsing`, `specs/06-ingest` | `parser/note.ts`, `parser/items.ts`, `cli/commands/ingest.ts` | `unit/ingest-parsing.test.ts` | todo |
| BR-02 item fields, real dates | FR-I5..I7, D8–D11, D33, D34, D36, D46–D49 | `specs/02-date-resolution` | `dates/resolve.ts`, `parser/header.ts` | `unit/dates.test.ts` | todo |
| BR-03 view and filter | FR-L1..L9, D15, D31, D38, D44 | `specs/07-list` | `cli/commands/list.ts`, `dates/resolve.ts` | `unit/commands.test.ts` | todo |
| BR-04 overdue | FR-L5, D1, D44, D54 | `specs/07-list`, `specs/02-date-resolution` | `cli/commands/list.ts` | `unit/dates.test.ts` | todo |
| BR-05 mark done | FR-D1..D6, D32 | `specs/08-done` | `cli/commands/done.ts`, `store/store.ts` | `unit/commands.test.ts` | todo |
| BR-06 one email per owner | FR-F1..F3, D7, D19, D51 | `specs/09-followup` | `email/followup-template.ts`, `cli/commands/followup.ts` | `unit/commands.test.ts` | todo |
| BR-07 drafts only, never send | FR-F4, F5, D20, D45, RULE-1/2 | `specs/10-gmail-draft-connector` | `email/connector.ts`, `email/mcp-connector.ts` | `unit/safety.test.ts` (**passing**), `unit/commands.test.ts` | wip |
| BR-08 / E1 duplicates | FR-I10, FR-E1, D3, D13, D28, D36, D39, D40, D48, D52 | `specs/04-dedupe` | `dedupe/normalize.ts`, `dedupe/merge.ts` | `unit/edge-cases.test.ts` | todo |
| BR-09 / E2 no owner or date | FR-I11, FR-E2, D16, D25, D42, D46, D50 | `specs/03-owner-resolution`, `specs/07-list` | `owners/resolve.ts`, `cli/commands/*` | `unit/edge-cases.test.ts` | todo |
| BR-10 / E3 same first name | FR-I12, FR-E3, D4, D23, D24, D41, D60, D61 | `specs/03-owner-resolution` | `owners/resolve.ts` | `unit/edge-cases.test.ts` | todo |
| BR-11 / E4 malformed notes | FR-I8, I9, FR-E4, D5, D22, D30, D50, D55 | `specs/01-note-parsing`, `specs/06-ingest` | `parser/note.ts`, `cli/commands/ingest.ts` | `unit/edge-cases.test.ts` | todo |
| Cross-cutting: store, CLI | D14, D17, D20, D52–D54, D56, D58, D59 | `specs/05-store`, `specs/11-cli-conventions` | `store/store.ts`, `cli/index.ts` | `unit/commands.test.ts` | todo |

| Non-functional | Decisions | Where verified | Status |
|---|---|---|---|
| NFR-S1..S3 safety | N/A | `unit/safety.test.ts` | wip |
| NFR-R1..R5 robustness | D5, D20 | `unit/edge-cases.test.ts`, `unit/commands.test.ts` | todo |
| NFR-D1..D7 integrity | D13, D14 | `unit/commands.test.ts`, acceptance | todo |
| NFR-P1..P4 performance | N2 | `acceptance/sample-notes.test.ts` (P1) | todo |
| NFR-M1..M5 testability | N1 | structure + `clock.ts`, `email/connector.ts` | wip |
| NFR-A1..A10 sample acceptance | N1 | `acceptance/sample-notes.test.ts` | todo |
| NFR-C1 cross-platform | N3 | run tests on Windows/macOS/Linux | todo |
