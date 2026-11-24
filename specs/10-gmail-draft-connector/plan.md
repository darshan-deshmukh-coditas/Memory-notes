# Plan: Spec 10, Gmail draft connector

## Goal
Make the only door to Gmail create a draft and nothing else. The app sees `DraftConnector.createDraft({to?, subject, body}) -> {draftId}`. The real behaviour is an MCP stdio client that starts the server named in `ACTIONTRACK_GMAIL_MCP_CMD`, calls `create_draft` only, and maps every failure to a `GmailError` (exit 3). Nothing is sent, retried, or written to the store on failure.

## Scope
**In:**
- `src/email/connector.ts`: interface and types (already present, verify only; no new members).
- `src/email/mcp-connector.ts`: `ALLOWED_MCP_TOOLS`, env lookup, `McpDraftConnector.createDraft`, draft id parsing, 60 s timeout, process stop, error mapping.
- `src/cli/index.ts`: change the unset-variable error from `UsageError` (exit 2) to `GmailError` (exit 3), per FR-D74.2. This is the only CLI change in this spec.
- New fake MCP server fixture and new connector tests (see testcases.md).

**Out (owned elsewhere):**
- The followup command, template, recipient logic, repeat-run check, `drafts` record and `--all` loop: spec 09 (`specs/09-followup/spec.md`).
- Exit code precedence and `--all` continuation: FR-D53.1, FR-D53.2 (spec 09 / spec 11).
- Choosing or installing a real Gmail MCP server: FR-D75.2 (user's choice, outside the specs).
- Any send capability: never in scope (RULE-1).

## Requirement map

| ID | Rule (one line) | Module | Test ID(s) |
|---|---|---|---|
| BR-07, RULE-1, FR-F5, NFR-S1, AC-F3 | No send method, flag, retry or error path exists | `email/connector.ts`, `email/mcp-connector.ts` | TC-01, TC-03, TC-28 |
| NFR-S2, FR-D45.1 | Only `create_draft` is an allowed tool | `email/mcp-connector.ts` | TC-02, TC-04, TC-36 |
| FR-D45.2, FR-D6.3 | `to` omitted when there is no recipient | `email/mcp-connector.ts` | TC-05, TC-06, TC-30 |
| FR-D75.1 | Draft id from `structuredContent.draftId`, else first text block as JSON | `email/mcp-connector.ts` | TC-07 to TC-11 |
| FR-D75.2 | Any MCP server meeting the contract is acceptable | `email/mcp-connector.ts` | TC-29 |
| FR-D74.2, FR-D20.4 | Unset `ACTIONTRACK_GMAIL_MCP_CMD` is exit 3, checked before any draft | `cli/index.ts`, `email/mcp-connector.ts` | TC-12, TC-13 |
| FR-D20.4, NFR-R4 | Start failure, drop, error result, missing tool, no id: each exit 3 | `email/mcp-connector.ts` | TC-14 to TC-18 |
| FR-D20.5, NFR-R4 | Connector error leaves store unchanged | `commands/followup.ts` (fake) | TC-21 |
| FR-D76.1, FR-D76.2 | Single call over 60 s is exit 3; `--all` total unbounded | `email/mcp-connector.ts` | TC-19, TC-20, TC-32 |
| NFR-R4, FR-F5 | No retry after any failure | `email/mcp-connector.ts` | TC-22, TC-23 |
| NFR-S1 (rule 6) | Server process stopped on success and failure | `email/mcp-connector.ts` | TC-24 |
| NFR-SEC1, NFR-SEC2 | No credential written, no secret echoed | `email/mcp-connector.ts` | TC-25, TC-26 |
| NFR-M3, FR-D45.3 | Tests use a fake; no process started in followup tests | `tests/unit/commands.test.ts` | TC-27 |
| NFR-O3 | Connector messages on stderr path only, no log file | `cli/index.ts`, `email/mcp-connector.ts` | TC-26, TC-35 |
| NFR-A10 | Followup produces drafts only | acceptance (with spec 09) | TC-27, TC-33 |
| NFR-C2 | Gmail goes through the MCP connector | `email/mcp-connector.ts` | TC-04, TC-33 |

## Design approach

1. **Interface stays as is.** `DraftConnector` has one method. Nothing is added. The process-stop step lives inside `createDraft`, so the interface does not need a `close()` (decision Q5).
2. **Allow-list as a guard.** `ALLOWED_MCP_TOOLS = ["create_draft"]` stays exported and unchanged. A small internal guard `assertAllowedTool(name)` throws `GmailError` before any request is written. Every outgoing `tools/call` goes through it. The only call site passes the constant `"create_draft"`, so the guard is a seam for tests, not a feature (see Q9).
3. **Per-call server.** For each `createDraft`: read the env var, spawn the server over stdio (`StdioClientTransport`), initialise, check the tool exists, call `create_draft`, read the id, and stop the process in `finally`. This matches FR-D76.1 ("a single `create_draft` call, including server start-up"). Cost: one start-up per draft (Q5).
4. **Arguments.** `{ subject, body }` plus `to` only when `req.to` is set. The key must be absent, not `undefined` (TC-05 checks `"to" in args`).
5. **Result parsing (FR-D75.1).** Use `structuredContent.draftId` if it is a non-empty string. Otherwise read only the first `text` content block, parse as JSON, and take `draftId`. Anything else is a `GmailError`. No fallback to other blocks.
6. **Error mapping.** Every failure becomes `GmailError` (exit 3) with a message that names what failed and how to fix it. `isError: true` results are failures, even if they contain a draft id (Q10). Nothing is retried. The caller (spec 09) decides whether to continue (FR-D53.2).
7. **Timeout.** A timer of 60 s covers spawn, handshake and the call. On expiry, kill the child and reject with `GmailError`. The value is a module constant. A constructor option exists only so tests can shorten it; the CLI never sets it (Q2).
8. **Environment.** `ACTIONTRACK_GMAIL_MCP_CMD` is read by `cli/index.ts` (the only place that builds real dependencies, CLAUDE.md). The factory is lazy, but followup must call it before the first draft so an unset variable fails before any draft is attempted (FR-D74.2). The child inherits the parent environment so the server can find its own auth (Q7).
9. **No store writes, no file writes.** The connector returns `{draftId}` and touches nothing else. Writing the `drafts` record is spec 09 step 13.

## Dependencies
- Spec 09 (followup) is the only caller. It creates one draft per owner and reads `GmailError` to set exit 3 and to continue or stop (FR-D53.2).
- `@modelcontextprotocol/sdk` (already in `package.json`, `^1.12.0`). If the installed version does not expose `structuredContent` in the result type, read the raw result object (decision Q12).
- Configuration: `ACTIONTRACK_GMAIL_MCP_CMD` only. No other config.
- No credentials are stored. Auth lives in the external MCP server (NFR-SEC1).
- Spec 11 (cli-conventions): exit codes and stderr rules.

## Risks
| Risk | Effect | Mitigation |
|---|---|---|
| Real server's tool name or argument shape differs from `create_draft {to?, subject, body}` | Every real call fails with exit 3 | Manual smoke (T24) confirms before the spec is closed. A user-side adapter is allowed (FR-D75.2). Automated tests use the fake only. |
| Spawn on Windows: `npx` is `npx.cmd`, and paths can contain spaces | `ENOENT` or a broken command line | Test a quoted Windows path (TC-31). Parsing rule per decision Q4 (shell string). |
| Child hangs and keeps the process alive | Tool never exits; `--all` runs forever | 60 s timeout with kill (FR-D76.1); test that the pid is gone (TC-20). |
| Orphan server processes after an error | Leaked processes | `finally` stop on every path (TC-24). |
| Credentials or tokens leak via child stderr or error messages | NFR-SEC1 breach | Capture child stderr, do not echo it (Q8). Test with a planted secret (TC-26). |
| A later change adds a send path or retry | RULE-1 breach | `safety.test.ts` unchanged and green (TC-02, TC-03); surface test (TC-28); no retry (TC-22, TC-23). |
| Tests start a real server by accident | Slow tests, real mailbox touched | Followup tests inject the fake connector (TC-27). Connector tests use the fixture only. |

## Decisions

Each decision below is settled. Each one is recorded as a new decision (FRD D77 onward) in `docs/FRD.md` in the task that depends on it (T01).

- **Q1** Unset `ACTIONTRACK_GMAIL_MCP_CMD` is exit 3 as `GmailError`, and the message names the variable (FR-D74.2). Code change in T23.
- **Q2** The 60 s timeout is fixed for the CLI and includes start-up (FR-D76.1). A test-only internal constructor option `timeoutMs` (default 60000) lets tests shorten it; the CLI never sets it.
- **Q3** The 60 s timer restarts for each `createDraft` call.
- **Q4** `ACTIONTRACK_GMAIL_MCP_CMD` is run as a shell string (`shell: true`), so `npx -y <pkg>` and quoted paths work. The value is user-controlled.
- **Q5** One MCP server per `createDraft` call, started and stopped in `finally`. No `close()` on the interface.
- **Q6** Implement to the contract `create_draft {to?, subject, body}` and test with the fake only. Confirm in the manual smoke (T38). If the real server differs, add an adapter (FR-D75.2); `ALLOWED_MCP_TOOLS` does not change.
- **Q7** The child server inherits the full parent `process.env`.
- **Q8** Child stderr is captured and never shown or stored. Errors name the exit status and the variable only.
- **Q9** The guard `assertAllowedTool(name)` is internal to `mcp-connector.ts`, not part of the package API; tests import it. The safety test imports `ALLOWED_MCP_TOOLS` only.
- **Q10** An `isError: true` result is a failure, even if it carries a draft id. No draft id is returned and nothing is retried (FR-D20.4).
- **Q11** A missing `create_draft` is detected with `tools/list` before the call; if it is absent, fail with exit 3 (FR-D20.4).
- **Q12** If the installed SDK type lacks `structuredContent`, read it from the raw result object. The contract does not change.
- **Q13** A draft id is valid when it is a non-empty string after trimming. No format check.
- **Q14** A `to` that is empty or whitespace is treated as absent and omitted (FR-D6.3).
- **Q15** New tests go in `tests/unit/connector.test.ts`, with fixture `tests/fixtures/fake-gmail-mcp/server.mjs`. `safety.test.ts` is not edited.
- **Q16** Existing `safety.test.ts` test names stay unchanged. New tests use the `[TC-xx]` prefix.
- **Q17** Calls are sequential, one connector call per owner (spec 09).
- **Q18** Subject and body are passed as JS strings through MCP JSON with no extra encoding. A non-ASCII test (TC-05 variant) is optional.
- **Q19** No retry on any failure, including transient network errors (FR-F5, rule 8).
- **Q20** The user runs T38 with their own server and Gmail account, then confirms the draft is in Drafts and nothing is in Sent. The agent does not run it.
