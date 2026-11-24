# Tasks: Spec 10, Gmail draft connector

Order matters. Red first (stubs become failing tests), then green one group at a time. Do not start a green task before its red tests exist. Decisions D244 to D263 are in plan.md; record each one as a new decision (D244 to D263 for this spec) in `docs/FRD.md` before the task that depends on it.

Format: `[ ] Txx | spec ID | file | test IDs (testcases.md) | depends on`

## Phase 0: decisions and fixtures

- [ ] T01 | D74.2, D244 | `docs/FRD.md` (section 11, new entries D244 to D263) | none | none
  Record D244 to D263 from the Decisions section of plan.md, per decision D244 to D263 for this spec, in `docs/FRD.md`. D244 is settled by FR-D74.2 (exit 3).
- [ ] T02 | D45.3, NFR-M3 | `tests/fixtures/fake-gmail-mcp/server.mjs` | used by TC-04, TC-07 to TC-11, TC-14 to TC-26, TC-29, TC-31, TC-32, TC-36, TC-37, TC-38 | T01
  Create the fake MCP stdio server with all modes from testcases.md Fixtures section 1. Check by hand that it starts and answers `tools/list`.
- [ ] T03 | NFR-M3 | `tests/fixtures/fake-gmail-mcp/helpers.ts` (or inline in test) | all integration TCs | T02
  Helpers: build the command for a mode, make temp dir and log, read log, check pid alive.
- [ ] T04 | D259 | `tests/unit/safety.test.ts` | TC-02, TC-03 (baseline) | none
  Run `npm test -- safety` and record that both tests pass. Record the file hash (`git hash-object tests/unit/safety.test.ts`). The file must not change after this point.

## Phase 1: red (failing tests, cite IDs)

- [ ] T05 | AC-F3, NFR-S1 | `tests/unit/connector.test.ts` (new) | TC-01, TC-28 | T02
  Convert to real failing tests: interface has only `createDraft`; class public surface is `createDraft` only. Expect red because of the stub text, or because the static check finds extra members.
- [ ] T06 | NFR-S2, D45.1 | `tests/unit/connector.test.ts` | TC-04, TC-36 | T02
  Guard refuses `send_email`; a successful run only calls `create_draft`. Red: guard not exported yet.
- [ ] T07 | D45.2, D6.3 | `tests/unit/connector.test.ts` | TC-05, TC-06, TC-30 | T02
  `to` present or absent in arguments; blank `to` treated as absent (D257). Red.
- [ ] T08 | D75.1 | `tests/unit/connector.test.ts` | TC-07, TC-08, TC-09, TC-10, TC-11 | T02
  Draft id parsing cases. Red.
- [ ] T09 | D74.2, D20.4 | `tests/unit/connector.test.ts`, `tests/unit/commands.test.ts` | TC-12, TC-13 | T02
  Unset variable: `GmailError` naming the variable, no spawn, exit 3 before any draft. Red.
- [ ] T10 | D20.4 | `tests/unit/connector.test.ts` | TC-14, TC-15, TC-16, TC-17, TC-18 | T02
  One failing test per failure mode. Red.
- [ ] T11 | D76.1, D76.2 | `tests/unit/connector.test.ts` | TC-19, TC-20, TC-32 | T02
  Timeout tests using the seam (D245). Red.
- [ ] T12 | D20.5, NFR-R4 | `tests/unit/commands.test.ts` (followup section, shared with spec 09) | TC-21 | T02
  Store byte-identical after a connector failure. Red until spec 09 wiring exists. Mark dependency on 09 in the test name comment.
- [ ] T13 | FR-F5, NFR-R4 | `tests/unit/connector.test.ts`, `tests/unit/commands.test.ts` | TC-22, TC-23 | T10
  Exactly one request per failure mode; no second `createDraft` after `GmailError`. Red.
- [ ] T14 | Rule 6, D248 | `tests/unit/connector.test.ts` | TC-24, TC-38 | T02
  Pid not alive after settle (success and failure); separate pids per call. Red.
- [ ] T15 | NFR-SEC1, NFR-O3, D250, D251 | `tests/unit/connector.test.ts` | TC-25, TC-26, TC-35, TC-37 | T02
  No files written; planted secret absent from output; no stdout writes; env inherited. Red.
- [ ] T16 | NFR-M3, D45.3 | `tests/unit/commands.test.ts` | TC-27 | T03
  Child-process spy shows zero spawns in followup tests. Red until followup test file uses the fake.
- [ ] T17 | D75.2, N3, D247 | `tests/unit/connector.test.ts` | TC-29, TC-31 | T02
  Alternative server accepted; quoted path with spaces starts the server. Red.
- [ ] T18 | Phase 1 check | all test files | all | T05 to T17
  Run `npm test`. Confirm every new TC name is red for the right reason (stub or missing behaviour), not a syntax error. Commit the red state if the user wants it recorded.

## Phase 2: green, in dependency order

- [ ] T19 | NFR-S2, D45.1 | `src/email/mcp-connector.ts` | TC-02, TC-04 | T06
  Keep `ALLOWED_MCP_TOOLS = ["create_draft"] as const` unchanged. Add `assertAllowedTool(name)` that throws `GmailError` (exit 3). Remove the `NotImplementedError` import if no longer used.
- [ ] T20 | D45.2, D6.3 | `src/email/mcp-connector.ts` | TC-05, TC-06, TC-30 | T07, T19
  Build arguments: `{subject, body}`; add `to` only when non-blank. Key must be absent when no recipient.
- [ ] T21 | D75.1 | `src/email/mcp-connector.ts` | TC-07 to TC-11 | T08
  `parseDraftId(result)`: `structuredContent.draftId` (non-empty string), else first text block JSON; else throw `GmailError`. Check SDK types first (D255).
- [ ] T22 | D74.2 | `src/email/mcp-connector.ts` (add `connectorFromEnv(env, deps?)`) | TC-12 | T09
  Reads `ACTIONTRACK_GMAIL_MCP_CMD`; throws `GmailError` naming it when unset or blank. Does not spawn.
- [ ] T23 | D74.2 | `src/cli/index.ts` | TC-13 | T22
  Replace the `UsageError` (exit 2) in the connector factory with `connectorFromEnv`. This fixes the mismatch with FR-D74.2 (exit 3). Keep the factory lazy, but spec 09 must call it before the first draft.
- [ ] T24 | D20.4 | `src/email/mcp-connector.ts` | TC-14, TC-15, TC-17, TC-18 | T10, T21
  Per-call flow: spawn `StdioClientTransport` (D247 parsing), connect, `tools/list` check (D254), `tools/call`, map every thrown error to `GmailError` with a message naming the failure.
- [ ] T25 | D20.4 | `src/email/mcp-connector.ts` | TC-16 | T24
  `isError: true` results throw `GmailError`, even with a draft id present.
- [ ] T26 | Rule 6, D248 | `src/email/mcp-connector.ts` | TC-24, TC-38 | T24
  `finally` closes the transport and kills the child on success and failure. One server per call.
- [ ] T27 | D76.1, D76.2 | `src/email/mcp-connector.ts` | TC-19, TC-20, TC-32 | T11, T26
  Timer of 60 s (constant) covering connect, list, call. Constructor seam `timeoutMs` default 60000 (D245). On timeout: kill child, throw `GmailError` saying it timed out after 60 seconds.
- [ ] T28 | NFR-SEC1, NFR-O3, D251 | `src/email/mcp-connector.ts` | TC-26, TC-35 | T24
  Capture child stderr into a bounded buffer; never print it; never include it in the thrown message. Error text says exit status and variable name only.
- [ ] T29 | D250 | `src/email/mcp-connector.ts` | TC-37 | T24
  Pass `process.env` to the child (D250). Confirm it matches the decision.
- [ ] T30 | NFR-SEC1 | `src/email/mcp-connector.ts` | TC-25 | T24
  Confirm the code path has no `fs` import. If it has one, remove it.
- [ ] T31 | D20.5, NFR-R4 | `tests/unit/commands.test.ts` and spec 09 wiring | TC-21, TC-23 | T23, T24, and spec 09 `followup` implemented
  Followup catches `GmailError`, writes nothing to the store, exits 3, and does not call `createDraft` again for that owner. Coordinate with spec 09 tasks.
- [ ] T32 | NFR-M3, D45.3 | `tests/unit/commands.test.ts` | TC-27 | T16, T31
  All followup tests inject the fake connector. Spawn spy count is 0.
- [ ] T33 | D75.2, N3 | `src/email/mcp-connector.ts` | TC-29, TC-31 | T24
  Confirm Windows spawn works for `node` and quoted paths. Adjust D247 parsing if needed.

## Phase 3: safety and refactor

- [ ] T34 | RULE-1, NFR-S1, AC-F3 | `tests/unit/safety.test.ts` | TC-02, TC-03 | T19 to T33
  Run the file. It must pass with an empty `git diff` against the hash from T04. Do not weaken it.
- [ ] T35 | NFR-S1, AC-F3 | `src/email/connector.ts` | TC-01 | T34
  Confirm the interface is unchanged from the scaffold (no added member). Refactor comments only.
- [ ] T36 | Refactor | `src/email/mcp-connector.ts` | all connector TCs | T34
  Remove duplicated error mapping; keep one `toGmailError` function. Keep behaviour identical; re-run the tests.
- [ ] T37 | NFR-O3 | `src/email/mcp-connector.ts`, `src/cli/index.ts` | TC-35 | T36
  Grep the connector and CLI for `console.log`. Only stderr output from the connector path.

## Phase 4: manual check (user only, agent does not run)

- [ ] T38 | NFR-C2, NFR-A10, NFR-S3, D45.3 | none (manual) | TC-33, TC-34 | T36 and user's Gmail server available
  **Needs the user's Gmail MCP server and account. Agent does not run this step.** User sets `ACTIONTRACK_GMAIL_MCP_CMD`, runs `actiontrack followup <owner>`, and confirms the draft is in Drafts and nothing is in Sent.
- [ ] T39 | D249 | `docs/FRD.md` (new decision within D244 to D263 for this spec if the contract differs), `tests/fixtures/fake-gmail-mcp/server.mjs` | TC-07, TC-29 | T38
  If the real server's tool name or argument shape differs, add an adapter per FR-D75.2 and record it as a decision. Do not change `ALLOWED_MCP_TOOLS`. Update the fake to match the decision.

## Phase 5: close out

- [ ] T40 | Traceability | `docs/TRACEABILITY.md` (row BR-07, and NFR-S1..S3 row) | all | T36, T34
  Set status to `done (automated)` for BR-07 once T34 passes. Keep manual check status as `pending user smoke` until T38 is done. Update the test column to list `unit/connector.test.ts`.
- [ ] T41 | Repo check | repo root | all | T40
  Run `npm run typecheck`, `npm test`, `npm run check`. All green; `safety.test.ts` unchanged.
- [ ] T42 | NFR-SEC1 | repo | none | T41
  Run a text search for token-like strings and `SECRET-TOKEN` across the repo (excluding `node_modules`). Only the fixture planted value should match, and only in test files.
- [ ] T43 | N3 | repo | all | T41
  Confirm the tests pass on Windows (the current platform). macOS and Linux runs are recorded as not yet done.
- [ ] T44 | Spec sync | `specs/10-gmail-draft-connector/spec.md`, `docs/FRD.md` | none | T39
  If any Q decision changed the spec wording (for example D248 or D247), add the decision reference in the spec's Contract section. Do not edit other spec folders.

## Definition of done

- [ ] `DraftConnector` has only `createDraft`. The interface is unchanged from the scaffold (TC-01).
- [ ] `ALLOWED_MCP_TOOLS` is exactly `["create_draft"]`; the guard refuses anything else before any request (TC-02, TC-04, TC-36).
- [ ] `tests/unit/safety.test.ts` is unchanged (empty diff against T04 hash) and passes (TC-02, TC-03).
- [ ] Unset `ACTIONTRACK_GMAIL_MCP_CMD` is exit 3, names the variable, and happens before any draft (TC-12, TC-13, FR-D74.2).
- [ ] Draft id is read per FR-D75.1; anything else is a failure (TC-07 to TC-11).
- [ ] Every connector failure mode is exit 3, leaves the store unchanged, and causes exactly one request (TC-14 to TC-18, TC-21, TC-22).
- [ ] 60 s timeout kills the child and exits 3; it applies per call (TC-19, TC-20, TC-32).
- [ ] Server process is stopped on success and on failure (TC-24).
- [ ] No credential or secret appears in output, files or stdout (TC-25, TC-26, TC-35).
- [ ] Followup tests never start a process (TC-27).
- [ ] Manual smoke (T38) done by the user, or explicitly recorded as pending.
- [ ] `docs/TRACEABILITY.md` status updated (T40). `npm run check` passes (T41).
- [ ] Every decision D244 to D263 is recorded in `docs/FRD.md` for this spec.
