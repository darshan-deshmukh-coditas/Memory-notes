# actiontrack

CLI that reads markdown meeting notes, tracks action items, and creates Gmail **drafts** for follow-up. It never sends email.

```
actiontrack ingest <folder>
actiontrack list [--owner <name>] [--status open|done|overdue] [--due-before <date>] [--json]
actiontrack done <id>
actiontrack followup <owner> | --all [--force]
```

Specs: `docs/BRD.md`, `docs/FRD.md`, `docs/NFRD.md`. Architecture and working rules: `CLAUDE.md`.

## Develop

Requires Node 22+.

```
npm install
npm run dev -- --help
npm run check     # typecheck + tests
npm run build
```

Gmail drafts need a Gmail MCP server: set `ACTIONTRACK_GMAIL_MCP_CMD` to the command that starts it. The command is started directly, not through a shell. Quote paths that contain spaces. On Windows, `npx` is `npx.cmd`, so give its full path, or point the variable at a `.js` server with `node`. The server must offer a `create_draft` tool that takes `{ to?, subject, body }` and returns a draft id (FRD D45, D75).

**Status: MVP.** All four commands work against the sample folder (`npm run check` is green). The real Gmail server has not been smoke-tested yet, and the notes on which parts are still open are in `docs/TRACEABILITY.md`.
