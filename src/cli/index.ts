#!/usr/bin/env node
import { Command, InvalidArgumentError, Option } from "commander";
import { systemClock } from "../clock.js";
import { ActiontrackError, NotImplementedError } from "../domain/errors.js";
import { EXIT, type ExitCode } from "../domain/exit-codes.js";
import { McpDraftConnector, GMAIL_MCP_CMD_ENV } from "../email/mcp-connector.js";
import { UsageError } from "../domain/errors.js";
import type { Deps } from "./deps.js";
import { done } from "./commands/done.js";
import { followup } from "./commands/followup.js";
import { ingest } from "./commands/ingest.js";
import { list } from "./commands/list.js";

const deps: Deps = {
  clock: systemClock,
  connector: () => {
    const cmd = process.env[GMAIL_MCP_CMD_ENV];
    if (!cmd) throw new UsageError(`Set ${GMAIL_MCP_CMD_ENV} to the command that starts your Gmail MCP server.`);
    return new McpDraftConnector(cmd);
  },
  out: (line) => console.log(line),
  err: (line) => console.error(line),
  env: process.env,
};

const parseId = (v: string): number => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new InvalidArgumentError("id must be a positive integer.");
  return n;
};

const storeOpt = () => new Option("--store <path>", "item store path (default .actiontrack/items.json, or $ACTIONTRACK_STORE)");
const todayOpt = () => new Option("--today <date>", "override today's date (YYYY-MM-DD) for repeatable runs");

const program = new Command("actiontrack")
  .description("Track action items from meeting notes and draft follow-up emails. Never sends email.")
  .showHelpAfterError();

let exitCode: ExitCode = EXIT.OK;

program
  .command("ingest <folder>")
  .description("parse *.md meeting notes in <folder> and store their action items")
  .addOption(storeOpt())
  .action(async (folder: string, o: { store?: string }) => {
    exitCode = await ingest({ folder, store: o.store }, deps);
  });

program
  .command("list")
  .description("show action items (default: open and overdue)")
  .option("--owner <name>", "full name, unique first name, or none|group|ambiguous|unresolved")
  .addOption(new Option("--status <status>", "filter by status").choices(["open", "done", "overdue"]))
  .option("--due-before <date>", "items due strictly before this date (YYYY-MM-DD or 'Mar 4')")
  .option("--json", "machine-readable output")
  .addOption(todayOpt())
  .addOption(storeOpt())
  .action(async (o) => {
    exitCode = await list(o, deps);
  });

program
  .command("done")
  .description("mark an item as done (updates the store only)")
  .argument("<id>", "item id", parseId)
  .addOption(storeOpt())
  .action(async (id: number, o: { store?: string }) => {
    exitCode = await done({ id, store: o.store }, deps);
  });

program
  .command("followup [owner]")
  .description("create Gmail DRAFT follow-ups for open and overdue items. Never sends.")
  .option("--all", "one draft per owner with open or overdue items")
  .option("--force", "create a draft even if one was already created for this owner")
  .addOption(todayOpt())
  .addOption(storeOpt())
  .action(async (owner: string | undefined, o) => {
    exitCode = await followup({ owner, ...o }, deps);
  });

try {
  await program.parseAsync(process.argv);
  process.exitCode = exitCode;
} catch (e) {
  if (e instanceof ActiontrackError) {
    console.error(`error: ${e.message}`);
    process.exitCode = e.exitCode;
  } else if (e instanceof NotImplementedError) {
    console.error(e.message);
    process.exitCode = EXIT.USAGE;
  } else {
    console.error(`unexpected error: ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = EXIT.WARNINGS;
  }
}
