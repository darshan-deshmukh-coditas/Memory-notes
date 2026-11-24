#!/usr/bin/env node
import { Command, CommanderError, InvalidArgumentError, Option } from "commander";
import { systemClock } from "../clock.js";
import { ActiontrackError, GmailError } from "../domain/errors.js";
import { EXIT, type ExitCode } from "../domain/exit-codes.js";
import { GMAIL_MCP_CMD_ENV, McpDraftConnector } from "../email/mcp-connector.js";
import type { Deps } from "./deps.js";
import { done } from "./commands/done.js";
import { followup } from "./commands/followup.js";
import { ingest } from "./commands/ingest.js";
import { list } from "./commands/list.js";

const deps: Deps = {
  clock: systemClock,
  connector: () => {
    const cmd = process.env[GMAIL_MCP_CMD_ENV];
    if (cmd === undefined || cmd.trim() === "") {
      throw new GmailError(`Set ${GMAIL_MCP_CMD_ENV} to the command that starts your Gmail MCP server. No draft was created.`);
    }
    return new McpDraftConnector(cmd);
  },
  out: (line) => console.log(line),
  err: (line) => console.error(line),
  env: process.env,
};

/** Canonical decimal id from 1 up (plan 08 Q4). */
const parseId = (v: string): number => {
  if (!/^[1-9]\d*$/.test(v) || !Number.isSafeInteger(Number(v))) {
    throw new InvalidArgumentError("id must be a whole number of 1 or more, for example 3.");
  }
  return Number(v);
};

const storeOpt = () => new Option("--store <path>", "item store path (default .actiontrack/items.json, or $ACTIONTRACK_STORE)");
const todayOpt = () => new Option("--today <date>", "override today's date (YYYY-MM-DD) for repeatable runs");

const program = new Command("actiontrack")
  .description("Track action items from meeting notes and draft follow-up emails. Never sends email.")
  .exitOverride()
  .configureOutput({ writeErr: (s) => process.stderr.write(s) })
  .showHelpAfterError();

let exitCode: ExitCode = EXIT.OK;

program
  .command("ingest <folder>")
  .description("parse *.md meeting notes in <folder> and store their action items")
  .addOption(storeOpt())
  .addOption(todayOpt())
  .action(async (folder: string, o: { store?: string; today?: string }) => {
    exitCode = await ingest({ folder, store: o.store, today: o.today }, deps);
  });

program
  .command("list")
  .description("show action items (default: open and overdue)")
  .option("--owner <name>", "full name, unique first name, or none|group|ambiguous|unresolved")
  .option("--status <status>", "open, done or overdue")
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
  .addOption(todayOpt())
  .action(async (id: number, o: { store?: string; today?: string }) => {
    exitCode = await done({ id, store: o.store, today: o.today }, deps);
  });

program
  .command("followup [owner]")
  .description("create Gmail DRAFT follow-ups for open and overdue items. Never sends.")
  .option("--all", "one draft per owner with open or overdue items")
  .option("--force", "create a draft even if one was already created for this owner")
  .addOption(todayOpt())
  .addOption(storeOpt())
  .action(async (owner: string | undefined, o: { all?: boolean; force?: boolean; today?: string; store?: string }) => {
    exitCode = await followup({ owner, ...o }, deps);
  });

async function main(): Promise<void> {
  if (process.argv.length <= 2) {
    program.outputHelp();
    process.exitCode = EXIT.USAGE;
    return;
  }
  try {
    await program.parseAsync(process.argv);
    process.exitCode = exitCode;
  } catch (e) {
    if (e instanceof CommanderError) {
      // Help and version exit 0; any other parse problem is a usage error (plan O-5, O-7).
      process.exitCode = e.exitCode === 0 ? EXIT.OK : EXIT.USAGE;
      return;
    }
    if (e instanceof ActiontrackError) {
      console.error(`error: ${e.message}`);
      process.exitCode = e.exitCode;
      return;
    }
    console.error(`internal error: ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = EXIT.INTERNAL;
  }
}

await main();
