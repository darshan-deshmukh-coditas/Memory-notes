# Spec 10: Gmail draft connector

The only door to Gmail. It can create a draft and nothing else. The real server is chosen by the user; the tool defines the contract it must meet.

| Field | Value |
|---|---|
| Business reqs | BR-07 |
| FRD | FR-F4, F5, F11, AC-F3, D20, D45, D53 |
| NFRD | NFR-S1 to S3, R4, M3, SEC1, SEC2, C2, NFR-A10; RULE-1, RULE-2 |
| Modules | `email/connector.ts` (`DraftConnector`, `DraftRequest`, `DraftResult`), `email/mcp-connector.ts` (`McpDraftConnector`, `ALLOWED_MCP_TOOLS`) |
| Tests | `tests/unit/safety.test.ts` (**passing, must not be weakened**), `tests/unit/commands.test.ts` (fake connector) |

## Contract (D45)
1. The application sees only `DraftConnector.createDraft({to?, subject, body}) -> {draftId}`. The interface has **no** send method and none may be added (RULE-1, NFR-S1).
2. `ALLOWED_MCP_TOOLS` is exactly `["create_draft"]`. The MCP wrapper refuses to call any other tool name before any request leaves the process.
3. The MCP server is started over stdio from the command in `ACTIONTRACK_GMAIL_MCP_CMD`. Authentication stays inside that server. The tool holds no credentials and stores none (NFR-SEC1, N4).
4. Tool `create_draft` takes `{ to?, subject, body }`. `to` is left out when there is no recipient (D6.3, D45.2). It creates a Gmail draft and returns the draft id.
5. The draft id is read from the result's `structuredContent.draftId`, or, if absent, from the first text content that is JSON with a `draftId` string (see Defaults). Anything else is a failure.
6. The server process is stopped when the command ends, on success and on failure.

## Failures (D20.4, D20.5, NFR-R4)
7. These raise a connector error that maps to exit 3: the variable is unset, the process will not start, the connection drops, the tool is missing, the server returns an error result, or the result has no draft id.
8. A connector error never sends anything, never retries, and never changes the store. The message says what failed and how to fix it.

## Testing (NFR-M3)
9. All automated tests use a **fake** `DraftConnector` that records requests. The fake only has `createDraft`.
10. The real server is a **manual** check. It is not exercised in CI.
11. `safety.test.ts` fails if the interface gains a send method, if `ALLOWED_MCP_TOOLS` is not exactly `["create_draft"]`, or if any source file calls a send operation.

## Acceptance tests
- `AC-F3`, `NFR-S1` no send method, no reachable send call (inspection and test)
- `NFR-S2`, `D45.1` allowed tools are exactly `create_draft`; another tool name is refused before any request
- `D45.2` `to` is omitted when there is no recipient
- `D20.4` unset variable, startup failure, error result, no draft id: each is a connector error
- `NFR-R4`, `D20.5` a connector error leaves the store unchanged
- `NFR-M3` followup tests run with the fake and never start a process
- `NFR-SEC1` no credential appears in the repo, store or logs

## Defaults to confirm
- P26. The draft id is read from `structuredContent.draftId`, else the first text block parsed as JSON `{"draftId": "..."}`.
- P27. A single `create_draft` call that takes longer than 60 seconds is a connector failure. The FRD sets no time limit for `followup`; this only stops a hung server from hanging the tool.
- P32. The server's own name, package and auth flow are out of scope. The user supplies a command that meets rules 3 to 5, which may be an adapter around any Gmail MCP server.
