# Test cases: Spec 10, Gmail draft connector

Conventions
- Test names start with the TC ID in brackets. Existing `safety.test.ts` names are kept unchanged (D259 in plan.md), so their TC mapping is by the comment above them.
- "integration" means the real `McpDraftConnector` talks over stdio to the fake MCP server fixture (see Fixtures). No real Gmail, no network.
- "unit" means no process is started. "static" means the test reads source text.
- "(neg)" marks a negative case that must fail or refuse.
- Exit codes: a connector failure is `GmailError`, exit 3. Usage errors are exit 2.
- Automated tests never reach a real Gmail server (NFR-M3, FR-D45.3).

## A. Never sends (static and allow-list)

| TC ID | Spec/FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-01 | AC-F3, NFR-S1, D45 (contract 1) | `tests/unit/connector.test.ts` | `[TC-01] DraftConnector declares only createDraft (AC-F3, NFR-S1)` | static | Source text of `src/email/connector.ts` | Method names of `DraftConnector` are exactly `["createDraft"]` | n/a |
| TC-02 | NFR-S2, D45.1, RULE-1 | `tests/unit/safety.test.ts` | `MCP allow-list contains only create_draft` (existing) | safety | `ALLOWED_MCP_TOOLS` | equals `["create_draft"]` | n/a |
| TC-03 | NFR-S1, AC-F3 | `tests/unit/safety.test.ts` | `no source file references a send operation` (existing) | safety | All `.ts` under `src/` | no offenders | n/a |
| TC-04 | D45.1, NFR-S2 (neg) | `tests/unit/connector.test.ts` | `[TC-04] assertAllowedTool refuses send_email before any request (NFR-S2, D45.1)` | unit + fake server | Call the guard with `"send_email"` | throws `GmailError`; fake server records zero requests | 3 |
| TC-28 | AC-F3, NFR-S1 | `tests/unit/connector.test.ts` | `[TC-28] McpDraftConnector public surface is createDraft only (NFR-S1)` | static | Public members of the class in `src/email/mcp-connector.ts` | only `createDraft` (plus constructor) | n/a |
| TC-36 | NFR-S2, D45.1 | `tests/unit/connector.test.ts` | `[TC-36] a successful run calls only tools/call create_draft (NFR-S2)` | integration | Success mode; fake logs every JSON-RPC method and tool name | tool names seen: `["create_draft"]`; no method other than initialize, initialized notification, tools/list, tools/call | n/a |

## B. Arguments (`to` handling)

| TC ID | Spec/FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-05 | D45.2, D6.3 | `tests/unit/connector.test.ts` | `[TC-05] to is omitted from arguments when there is no recipient (D45.2)` | integration | `{subject, body}` with `to` undefined | recorded arguments have no `to` key (`"to" in args` is false) | 0 |
| TC-06 | D45.2 | `tests/unit/connector.test.ts` | `[TC-06] to is sent when the recipient is known (D45.2)` | integration | `{to:"a@x.test", subject, body}` | recorded arguments `to` equals `a@x.test` | 0 |
| TC-30 | D6.3, D45.2 (D257) | `tests/unit/connector.test.ts` | `[TC-30] blank to is treated as absent (D6.3)` | integration | `to: "   "` | `to` key absent in arguments | 0 |

## C. Draft id parsing (FR-D75.1)

| TC ID | Spec/FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-07 | D75.1 | `tests/unit/connector.test.ts` | `[TC-07] draft id read from structuredContent.draftId (D75.1)` | integration | Fake mode `structured` returns `structuredContent:{draftId:"d-1"}` | resolves `{draftId:"d-1"}` | 0 |
| TC-08 | D75.1 | `tests/unit/connector.test.ts` | `[TC-08] draft id read from first text block JSON when structuredContent absent (D75.1)` | integration | Fake mode `text-json` returns `content:[{type:"text", text:'{"draftId":"d-2"}'}]` | resolves `{draftId:"d-2"}` | 0 |
| TC-09 | D75.1 (neg) | `tests/unit/connector.test.ts` | `[TC-09] first text block that is not JSON is a failure (D75.1)` | integration | Fake mode `text-not-json` with a second text block that is valid JSON | rejects `GmailError`; second block is not used | 3 |
| TC-10 | D75.1 (neg) | `tests/unit/connector.test.ts` | `[TC-10] result with no draft id is a failure (D75.1, D20.4)` | integration | Fake mode `no-id` | rejects `GmailError`, message says no draft id | 3 |
| TC-11 | D75.1 (neg) | `tests/unit/connector.test.ts` | `[TC-11] empty draftId string is a failure (D75.1)` | integration | Fake mode `empty-id` (`draftId: ""`) | rejects `GmailError` | 3 |

## D. Configuration and failures (FR-D74.2, FR-D20.4)

| TC ID | Spec/FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-12 | D74.2, D20.4 (neg) | `tests/unit/connector.test.ts` | `[TC-12] unset ACTIONTRACK_GMAIL_MCP_CMD is a GmailError naming the variable (D74.2)` | unit | Env without the variable; spawn spy | throws `GmailError`; message contains `ACTIONTRACK_GMAIL_MCP_CMD`; spawn not called | 3 |
| TC-13 | D74.2, FR-F11 (neg) | `tests/unit/commands.test.ts` | `[TC-13] followup with unset variable exits 3 before any draft (D74.2)` | unit (fake deps, env {}) | `followup <owner>` with store containing one owner with open items | exit 3; no createDraft attempted; store file unchanged | 3 |
| TC-14 | D20.4 (neg) | `tests/unit/connector.test.ts` | `[TC-14] command that does not start is a GmailError (D20.4)` | integration | Command `definitely-missing-binary-xyz` | rejects `GmailError`; message says the server did not start | 3 |
| TC-15 | D20.4 (neg) | `tests/unit/connector.test.ts` | `[TC-15] server that exits during start-up is a GmailError (D20.4)` | integration | Fake mode `exit-on-start` | rejects `GmailError` | 3 |
| TC-16 | D20.4 (neg) | `tests/unit/connector.test.ts` | `[TC-16] isError result is a failure even when a draft id is present (D20.4, D253)` | integration | Fake mode `is-error` with `structuredContent.draftId` set | rejects `GmailError`; returns no draft id | 3 |
| TC-17 | D20.4 (neg) | `tests/unit/connector.test.ts` | `[TC-17] server without create_draft is a GmailError and no tools/call is sent (D20.4, D254)` | integration | Fake mode `no-tool` | rejects `GmailError`; zero tools/call requests | 3 |
| TC-18 | D20.4 (neg) | `tests/unit/connector.test.ts` | `[TC-18] connection dropped mid-call is a GmailError (D20.4)` | integration | Fake mode `drop` (exits after receiving tools/call) | rejects `GmailError` | 3 |

## E. Timeout (FR-D76)

| TC ID | Spec/FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-19 | D76.1 (neg) | `tests/unit/connector.test.ts` | `[TC-19] a call over the limit is a GmailError (D76.1)` | integration, test seam timeout 500 ms (D245) | Fake mode `hang` | rejects `GmailError` within about 1 s; message says timed out | 3 |
| TC-20 | D76.1, NFR-R4 (neg) | `tests/unit/connector.test.ts` | `[TC-20] timed-out server process is killed (D76.1)` | integration, seam 500 ms | Fake mode `hang` logs its pid | after rejection, that pid is not alive within 2 s | 3 |
| TC-32 | D76.2 (D246) | `tests/unit/connector.test.ts` | `[TC-32] the limit applies per call, not to a whole run (D76.2)` | integration, seam 500 ms | Two sequential `createDraft` calls, each 400 ms | both resolve; total over 500 ms is allowed | 0 |

## F. Store and retry (FR-D20.5, FR-F5, NFR-R4)

| TC ID | Spec/FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-21 | D20.5, NFR-R4 | `tests/unit/commands.test.ts` | `[TC-21] connector failure leaves the store byte-identical (D20.5, NFR-R4)` | unit (fake connector throws GmailError) | Store with items and one owner | store file bytes unchanged; no `drafts` record added | 3 |
| TC-22 | FR-F5, NFR-R4 (neg) | `tests/unit/connector.test.ts` | `[TC-22] each failure mode causes exactly one create_draft request (FR-F5)` | integration, one `it.each` over modes `exit-on-start`, `is-error`, `no-tool`, `drop`, `hang` | one createDraft call per mode | fake records exactly one tools/call per mode | 3 |
| TC-23 | FR-F5 (neg) | `tests/unit/commands.test.ts` | `[TC-23] createDraft is not called again after a GmailError (FR-F5)` | unit (fake connector throws once) | `followup <owner>` with connector failing on first call | fake connector call count is 1 | 3 |

## G. Process lifecycle and secrets (rule 6, NFR-SEC1, NFR-O3)

| TC ID | Spec/FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-24 | Rule 6, NFR-S1 | `tests/unit/connector.test.ts` | `[TC-24] server process is stopped on success and on failure (rule 6)` | integration | Modes `structured` and `is-error`; fake logs pid | after the promise settles, pid not alive within 2 s, in both modes | 0 / 3 |
| TC-38 | Rule 6 (D248) | `tests/unit/connector.test.ts` | `[TC-38] each createDraft call starts its own server process (D248)` | integration | Two sequential calls on one connector instance; fake logs pid | two different pids | 0 |
| TC-25 | NFR-SEC1, NFR-SEC2 | `tests/unit/connector.test.ts` | `[TC-25] connector writes no files (NFR-SEC1)` | integration | Temp dir as cwd and store dir; success mode | directory listing and file contents unchanged | 0 |
| TC-26 | NFR-SEC1, NFR-O3 (neg) | `tests/unit/connector.test.ts` | `[TC-26] child stderr secret does not appear in the error or output (NFR-SEC1, D251)` | integration | Fake mode `stderr-secret` writes `SECRET-TOKEN-123` to stderr, then exits non-zero | thrown message and captured stdout/stderr do not contain `SECRET-TOKEN-123` | 3 |
| TC-35 | NFR-O3 | `tests/unit/connector.test.ts` | `[TC-35] connector writes nothing to stdout (NFR-O3)` | integration, spy on process.stdout.write | Success mode, then `is-error` mode | no stdout writes in either | 0 / 3 |
| TC-37 | D250 | `tests/unit/connector.test.ts` | `[TC-37] child inherits the parent environment (D250)` | integration | Parent env sets `FAKE_MARKER=1`; fake echoes env into log | fake log shows `FAKE_MARKER=1` | 0 |

## H. Command, spawn and wiring

| TC ID | Spec/FRD ID | Test file | Test name | Type | Input | Expected | Exit |
|---|---|---|---|---|---|---|---|
| TC-27 | NFR-M3, D45.3, NFR-A10 | `tests/unit/commands.test.ts` | `[TC-27] followup tests use the fake connector and never spawn a process (NFR-M3)` | unit (child_process spy) | Full followup test run | spawn spy call count is 0 | n/a |
| TC-29 | D75.2 | `tests/unit/connector.test.ts` | `[TC-29] any server exposing create_draft with the contract works (D75.2)` | integration | Fake mode `alt-server`: different serverInfo name, extra tools present | resolves `{draftId}` | 0 |
| TC-31 | Risk (Windows), D247 | `tests/unit/connector.test.ts` | `[TC-31] command with a quoted path containing spaces starts the server (N3, D247)` | integration | Fixture copied into a temp dir with a space in its path; command `node "<path>"` | resolves `{draftId}` | 0 |
| TC-33 | NFR-C2, NFR-A10, D45.3 | manual (no file) | `MANUAL: real Gmail MCP server creates a draft (NFR-C2)` | MANUAL, run by the user | User's server in `ACTIONTRACK_GMAIL_MCP_CMD`; `actiontrack followup <owner>` | a draft appears in Gmail Drafts; nothing appears in Sent; exit 0 | 0 |
| TC-34 | NFR-S3 | manual (no file) | `MANUAL: created draft stays in Drafts until the user sends it (NFR-S3)` | MANUAL, run by the user | Draft from TC-33 | draft still in Drafts after the run; the tool did not send it | n/a |

## Fixtures needed

1. **`tests/fixtures/fake-gmail-mcp/server.mjs`** (plain ESM, no build step). A stdio MCP server built on `@modelcontextprotocol/sdk`. It must:
   - select behaviour from an environment variable `FAKE_GMAIL_MODE`. Modes: `structured`, `text-json`, `text-not-json`, `no-id`, `empty-id`, `is-error`, `no-tool`, `drop`, `hang`, `exit-on-start`, `stderr-secret`, `alt-server`, `slow-400` (used by TC-32).
   - append one JSON line per received request to the file in `FAKE_GMAIL_LOG` (method, tool name, arguments, pid, env marker). The test reads this log to count calls and check pids.
   - write its own `process.pid` to the log on start.
   - never write to any file other than `FAKE_GMAIL_LOG`, and never touch the network.
2. **Test helper** `tests/fixtures/fake-gmail-mcp/helpers.ts` (or inline in the test file). Builds the command string for a mode, creates the temp dir and log file, reads the log, and checks whether a pid is alive (`process.kill(pid, 0)` in a try/catch).
3. **Spawn spy**: a `vi.mock("node:child_process")` or `vi.spyOn` wrapper, used by TC-12 and TC-27. The module must be imported in a way that lets the spy see the call (decide during T02).
4. **Timeout seam**: a constructor option on `McpDraftConnector` (for example `timeoutMs`), default 60000, used only by tests (D245).5. **Temp dirs**: created inside the test with `mkdtempSync(join(tmpdir(), ...))`. Nothing committed to `tests/fixtures/notes/`.
6. **Store fixture** for TC-13, TC-21, TC-23: a tiny store JSON built in the test, not a shared file.

No fixture may contain a real credential or a real email address. Use `a@x.test` style addresses only.
