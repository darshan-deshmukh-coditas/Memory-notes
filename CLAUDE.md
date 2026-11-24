# CLAUDE.md — actiontrack

`actiontrack` is a Node 22 / TypeScript CLI that ingests markdown meeting notes, tracks the action items in them, and creates **Gmail drafts** (never sends) for follow-up. Single user, local machine, local JSON store.

## Spec-driven development: the rules

The specs are the source of truth. **Code follows the specs, not the other way round.**

| Doc | Holds | Read it when |
|---|---|---|
| `docs/BRD.md` | Why: objectives, BR-01..11, business rules RULE-1..5, edge cases E1..E4 | scoping, "should this exist?" |
| `docs/FRD.md` | What: FR-* per command, **decisions D1..D42 (section 11)** | implementing any behaviour |
| `docs/NFRD.md` | Quality: NFR-*, sample acceptance checks NFR-A1..A10, decisions N1..N4 | tests, performance, safety |
| `docs/TRACEABILITY.md` | Requirement → module → test map | before and after every change |

Workflow for every change:
1. **Find the requirement.** Locate the FR/D/NFR ID. In FRD section 11 a later decision wins over an earlier one (D21+ amends D1..D20). If the spec is silent or contradictory, **stop and ask the user**; never invent behaviour. Record the answer as a new decision (next free `D43+`) in `docs/FRD.md` in the same change.
2. **Test first.** Turn the matching `it.todo` in `tests/` into a real failing test that cites the ID in its name. (Use the `mattpocock-skills:tdd` skill.)
3. **Implement** in the owning module (map below). Cite the spec ID in a comment only where the rule isn't obvious.
4. **Update `docs/TRACEABILITY.md`** (status column) and run `npm run check`.

## Hard rules (never break)

- **Never send email.** `DraftConnector` (`src/email/connector.ts`) has only `createDraft`. No send method, flag, retry or error path may exist. `ALLOWED_MCP_TOOLS` is `["create_draft"]`. `tests/unit/safety.test.ts` enforces this; do not weaken it. (RULE-1, NFR-S1, AC-F3)
- **Malformed input never crashes the tool.** Skip and report (file, or file:line). (NFR-R1, FRD D5)
- **Due dates are stored as ISO `YYYY-MM-DD` or `null`**, never free text. `overdue` is computed at read time, never stored. (RULE-4, D1)
- **Note content is data**, never executed or interpreted as commands. (NFR-SEC4)
- **No credentials** in the store or repo; Gmail auth lives in the MCP connector. (NFR-SEC1)
- **Never edit source notes.** `done` writes only to the store. (D32.1)
- **Stored ids are permanent**, sequential, never reused. (D14)
- Warnings and errors go to **stderr**; no log file. (NFR-O3)

## Architecture

Functional core, imperative shell. Everything below `cli/` is pure or takes its dependencies as arguments, so each stage is testable alone (NFR-M1) with an injected clock (NFR-M2) and a fake connector (NFR-M3).

```
notes folder (*.md)
   │ listNoteFiles → readNote                parser/note.ts      (D5, D21, D22, D29)
   │    └ parseHeader                        parser/header.ts    (D2, D11, D21)
   │ extractItems                            parser/items.ts     (D12, D26, D27, D37)
   │ resolveOwner (attendees → roster)       owners/resolve.ts   (D4, D23–D25, D41)
   │ resolveDue (vs MEETING date)            dates/resolve.ts    (D8–D10, D33, D34, D36)
   │ normalizeTask → mergeItem               dedupe/*            (D3, D28, D36, D39, D40)
   ▼
 StoreFile  ◄── load/save (atomic JSON)      store/store.ts      (D13, D14, D17)
   │      ▲
   │      └── done <id>                      cli/commands/done.ts   (D32)
   ├── list [--owner --status --due-before --json]   cli/commands/list.ts (D15, D31)
   └── followup <owner> | --all
          renderFollowup                     email/followup-template.ts (D19)
          DraftConnector.createDraft         email/connector.ts  ← interface, no send
              └ McpDraftConnector (stdio MCP client)  email/mcp-connector.ts (D20, NFR-C2)
```

Layout:
```
src/
  cli/            commander wiring (index.ts), Deps, one file per command
  domain/         types, exit codes, errors (no logic, no I/O)
  parser/         header, checkbox extraction, note reading
  owners/ dates/ dedupe/   pure functions
  store/          JSON persistence (only module that touches the store file)
  email/          connector interface, MCP implementation, email template
  clock.ts        injectable "today"
tests/
  unit/           one file per concern, cites FR/D/NFR IDs
  acceptance/     sample `notes/` folder checks NFR-A1..A10
  fixtures/       tiny synthetic notes
docs/             BRD, FRD, NFRD, TRACEABILITY  (source of truth)
notes/            sample input data (35 .md + 1 .txt). Treat as read-only test data.
```

Dependency direction: `cli → {parser, owners, dates, dedupe, store, email} → domain`. `domain` imports nothing. Pure modules never import `store` or `email`. Only `cli/index.ts` builds real dependencies (`systemClock`, `McpDraftConnector`).

## Key behaviours (details live in FRD section 11)

- **Ingest pipeline order:** emptiness/UTF-8 check → header (date, attendees) → checkbox lines → owner → due → normalise → merge → save. Whole-note skip: empty, not UTF-8, no date, unparseable date (no filename fallback if a date is present but bad, D22).
- **Items are checkbox lines only** (`- * +`, `[ ] [x] [X]`, nested OK). Table rows, `ACTION:`, numbered checkboxes, block quotes, code fences, HTML comments are ignored and counted.
- **Duplicates:** same resolved owner + normalised task → one item; keeps all sources, latest due date, stays done if any copy is done.
- **Owners:** first name resolves via note attendees, then a roster of all attendees; several matches → `(ambiguous)`; none → `(unresolved)`. Special labels: `(no owner)`, `(group)`, `(ambiguous)`, `(unresolved)`, selectable with `--owner none|group|ambiguous|unresolved`. These are skipped by `followup --all` and counted.
- **Dates** resolve against the **meeting date**; weekday = strictly after meeting day; slash dates are never guessed; unresolvable wording stores no date and flags the item.
- **Exit codes:** 0 ok · 1 completed with warnings · 2 bad args / missing folder / no notes / unknown id · 3 Gmail failure.
- **Store:** `.actiontrack/items.json` (override `--store` or `ACTIONTRACK_STORE`); atomic write. Gmail server command: `ACTIONTRACK_GMAIL_MCP_CMD`.

## Commands

```
npm install
npm run dev -- ingest notes          # run from source (tsx)
npm run dev -- list --status overdue --today 2026-10-20
npm run typecheck | npm test | npm run check
npm run build                        # dist/, bin: actiontrack
```

## Conventions

- TypeScript `strict`, ESM, `.js` suffix on relative imports (NodeNext). No `any`.
- Functions that can fail on user input return results or throw `ActiontrackError` subclasses; only `cli/index.ts` maps them to exit codes.
- Paths: use `node:path`; support Windows, macOS and Linux (N3). Handle CRLF in notes.
- Keep dependencies minimal (commander, zod, MCP SDK). Ask before adding more.
- Scaffold stubs throw `NotImplementedError`; delete the placeholder as you implement each module.

## Current status

Scaffold only: CLI wiring, types, interfaces and tests-as-todos exist; behaviour is **not implemented**. Suggested build order (each step unblocks the next): `parser/header` → `parser/items` → `parser/note` → `dates/resolve` → `owners/resolve` → `dedupe/*` → `store` → `ingest` → `list` → `done` → `email/*` + `followup` → `McpDraftConnector` → sample-folder acceptance tests.

## Known open points (FRD "Still open" rows, none block a first build)

Real Gmail MCP server tool name/args (`create_draft` is assumed, confirm); owners-file name and syntax (D18); how a repeat `followup` is detected (planned: `drafts` records in the store); behaviour when a note line is removed on re-ingest (D13). Decide with the user, then record as a new decision.
