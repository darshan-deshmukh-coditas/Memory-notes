import { existsSync } from "node:fs";
import { resolveToday } from "../../clock.js";
import { GmailError, UsageError } from "../../domain/errors.js";
import { EXIT, type ExitCode } from "../../domain/exit-codes.js";
import { OWNER_TOKENS, isOwnerLabel, type DraftRecord, type ActionItem } from "../../domain/types.js";
import { GMAIL_MCP_CMD_ENV } from "../../email/mcp-connector.js";
import { renderFollowup, compareDue } from "../../email/followup-template.js";
import { statusOf } from "../../dates/resolve.js";
import { knownOwners, loadOwnersFile, loadStore, resolveStorePath, saveStore, type OwnerEntry } from "../../store/store.js";
import { resolveOwnerArg } from "../../owners/resolve.js";
import type { Deps } from "../deps.js";

export interface FollowupOptions {
  /** Mutually exclusive with `all` (FRD D73.1). */
  owner?: string | undefined;
  all?: boolean | undefined;
  force?: boolean | undefined;
  today?: string | undefined;
  store?: string | undefined;
}

/**
 * Creates Gmail DRAFTS only, one connector call per owner (spec 09, spec 10). Never sends.
 * Open and overdue items only (FRD D7, D19). Owners with nothing to chase get no draft (D7.3).
 * A repeat for the same owner warns and creates nothing unless --force (D51.2). Label owners are
 * never emailed and are counted under --all (D16.3, D42.3). A connector failure exits 3 and the
 * stored items are untouched (D20.5). `--all` continues after a failure (D53.2).
 */
export async function followup(opts: FollowupOptions, deps: Deps): Promise<ExitCode> {
  const today = resolveToday(opts.today, deps.clock);
  const ownerArg = opts.owner?.trim() ?? "";
  const hasOwner = ownerArg !== "";
  if (hasOwner === Boolean(opts.all)) {
    throw new UsageError("Give exactly one of <owner> or --all. Example: followup \"Priya Nair\" or followup --all.");
  }
  if (hasOwner && OWNER_TOKENS[ownerArg.toLowerCase()] !== undefined) {
    throw new UsageError(
      `"${ownerArg}" is not a person, so there is no one to email. See the items with: list --owner ${ownerArg.toLowerCase()}`,
    );
  }

  const storePath = resolveStorePath(opts.store, deps.env);
  if (!existsSync(storePath)) {
    throw new UsageError(`No store found at ${storePath}. Run "actiontrack ingest <folder>" first.`);
  }
  const { store } = loadStore(storePath);

  // Checked before any owner is processed (FRD D74.2, plan 09 Q5). Exit 3.
  const gmailCmd = deps.env[GMAIL_MCP_CMD_ENV];
  if (gmailCmd === undefined || gmailCmd.trim() === "") {
    throw new GmailError(`Set ${GMAIL_MCP_CMD_ENV} to the command that starts your Gmail MCP server. No draft was created.`);
  }

  const known = knownOwners(store);
  const open = store.items.filter((i) => statusOf(i, today) !== "done");

  let targets: string[];
  let skippedLabelItems = 0;
  if (hasOwner) {
    const r = resolveOwnerArg(ownerArg, known);
    if (r.kind !== "person") {
      throw new UsageError(`No person named "${ownerArg}". Known owners: ${known.join(", ") || "(none)"}.`);
    }
    targets = [r.name];
  } else {
    skippedLabelItems = open.filter((i) => isOwnerLabel(i.owner)).length;
    targets = [];
    for (const i of open) {
      if (!isOwnerLabel(i.owner) && !targets.includes(i.owner)) targets.push(i.owner);
    }
  }

  const owners = loadOwnersFile(storePath);
  const warnings: string[] = [...owners.warnings];
  const recipients = recipientsByName(store.roster);

  const newRecords: DraftRecord[] = [];
  const gmailErrors: GmailError[] = [];

  const connector = deps.connector();
  for (const owner of targets) {
    const forOwner: { item: ActionItem; overdue: boolean }[] = open
      .filter((i) => i.owner === owner)
      .map((item) => ({ item, overdue: statusOf(item, today) === "overdue" }))
      .sort((a, b) => (a.overdue === b.overdue ? compareDue(a.item, b.item) : a.overdue ? -1 : 1));

    if (forOwner.length === 0) {
      deps.out(`Nothing to chase for ${owner}; no draft created.`);
      continue;
    }

    const prior = store.drafts.find((d) => d.owner === owner);
    if (prior !== undefined && !opts.force) {
      warnings.push(
        `a draft for ${owner} was already created on ${prior.createdAt.slice(0, 10)} (draft ${prior.draftId}); none created. Use --force to create another.`,
      );
      continue;
    }

    const email = pickEmail(owner, recipients.get(owner.toLowerCase()), owners.entries.get(owner.toLowerCase()), warnings);
    if (email === undefined) warnings.push(`no email address for ${owner}; the draft has no recipient.`);

    const { subject, body } = renderFollowup(owner, forOwner);
    try {
      const res = await connector.createDraft({ ...(email !== undefined ? { to: email } : {}), subject, body });
      newRecords.push({
        owner,
        draftId: res.draftId,
        createdAt: new Date().toISOString(),
        itemIds: forOwner.map((x) => x.item.id),
      });
      deps.out(
        `Draft created for ${owner}: recipient ${email ?? "(no recipient)"}, ${forOwner.length} items, draft id ${res.draftId}`,
      );
    } catch (e) {
      if (!(e instanceof GmailError)) throw e;
      gmailErrors.push(e);
      deps.err(`Draft not created for ${owner}: ${e.message}`);
    }
  }

  if (newRecords.length > 0) {
    saveStore(storePath, { ...store, drafts: [...store.drafts, ...newRecords] });
  }

  if (!hasOwner) {
    deps.out(
      `Total: ${newRecords.length} draft(s) created, ${gmailErrors.length} failed, ${skippedLabelItems} item(s) skipped (no one to email).`,
    );
  }
  for (const w of warnings) deps.err(`Warning: ${w}`);

  if (gmailErrors.length === 1) throw gmailErrors[0] as GmailError;
  if (gmailErrors.length > 1) {
    throw new GmailError(`${gmailErrors.length} drafts could not be created; see the messages above.`);
  }
  return warnings.length > 0 ? EXIT.WARNINGS : EXIT.OK;
}

function recipientsByName(roster: { name: string; email?: string | undefined }[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of roster) if (r.email) map.set(r.name.toLowerCase(), r.email);
  return map;
}

/** Attendee email first (FRD D18.2); the owners file otherwise. A difference is a warning that names no address (plan 09 Q14). */
function pickEmail(
  owner: string,
  fromNotes: string | undefined,
  fromFile: OwnerEntry | undefined,
  warnings: string[],
): string | undefined {
  if (fromNotes !== undefined && fromFile !== undefined && fromNotes.toLowerCase() !== fromFile.email.toLowerCase()) {
    warnings.push(`owners.json and the notes give different emails for ${owner}; the notes' email was used.`);
  }
  return fromNotes ?? fromFile?.email;
}

