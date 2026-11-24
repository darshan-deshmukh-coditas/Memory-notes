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

Gmail drafts need a Gmail MCP server: set `ACTIONTRACK_GMAIL_MCP_CMD` to the command that starts it.

**Status: scaffold.** Behaviour is specified but not yet implemented; see "Current status" in `CLAUDE.md`.
