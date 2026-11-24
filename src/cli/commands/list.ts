import { parseCliDate, statusOf } from "../../dates/resolve.js";
import { resolveToday } from "../../clock.js";
import { UsageError } from "../../domain/errors.js";
import { EXIT, type ExitCode } from "../../domain/exit-codes.js";
import { OWNER_TOKENS, type ActionItem, type ItemStatus } from "../../domain/types.js";
import { compareDue } from "../../email/followup-template.js";
import { resolveOwnerArg } from "../../owners/resolve.js";
import { knownOwners, loadStore, resolveStorePath } from "../../store/store.js";
import type { Deps } from "../deps.js";

export interface ListOptions {
  owner?: string | undefined;
  status?: string | undefined;
  dueBefore?: string | undefined;
  json?: boolean | undefined;
  today?: string | undefined;
  store?: string | undefined;
}

const STATUSES: readonly ItemStatus[] = ["open", "done", "overdue"];

/**
 * Shows stored items (specs/07). Default: open and overdue (FRD D15.1). Filters combine with AND
 * (D31.4). Sorted by due date, undated last, ties by id (D15.3, plan 07 Q1). Never changes the store.
 */
export async function list(opts: ListOptions, deps: Deps): Promise<ExitCode> {
  const today = resolveToday(opts.today, deps.clock);
  const storePath = resolveStorePath(opts.store, deps.env);

  let status: ItemStatus | undefined;
  if (opts.status !== undefined) {
    const s = opts.status.trim().toLowerCase() as ItemStatus;
    if (!STATUSES.includes(s)) {
      throw new UsageError(`Invalid --status "${opts.status}". Use one of: open, done, overdue.`);
    }
    status = s;
  }

  let before: string | undefined;
  if (opts.dueBefore !== undefined) {
    if (opts.dueBefore.trim() === "") throw new UsageError("--due-before needs a date, for example 2026-03-04 or \"Mar 4\".");
    before = parseCliDate(opts.dueBefore, today);
  }

  const { store } = loadStore(storePath);

  let ownerMatch: ((item: ActionItem) => boolean) | undefined;
  if (opts.owner !== undefined) {
    const token = OWNER_TOKENS[opts.owner.trim().toLowerCase()];
    if (token !== undefined) {
      ownerMatch = (item) => item.owner === token;
    } else {
      const r = resolveOwnerArg(opts.owner, knownOwners(store));
      if (r.kind === "person") {
        const name = r.name.toLowerCase();
        ownerMatch = (item) => item.owner.toLowerCase() === name;
      } else if (r.kind === "label") {
        const label = r.label;
        ownerMatch = (item) => item.owner === label;
      } else {
        ownerMatch = () => false;
      }
    }
  }

  const rows = store.items
    .map((item) => ({ item, status: statusOf(item, today) }))
    .filter(({ item, status: st }) => {
      if (status === undefined ? st === "done" : st !== status) return false;
      if (ownerMatch && !ownerMatch(item)) return false;
      if (before !== undefined && (item.due === null || item.due >= before)) return false;
      return true;
    })
    .sort((a, b) => compareDue(a.item, b.item));

  if (opts.json) {
    const out = rows.map(({ item, status: st }) => ({
      id: item.id,
      owner: item.owner,
      task: item.task,
      due: item.due,
      dueFlagged: item.dueFlagged,
      status: st,
      sources: item.sources,
    }));
    deps.out(JSON.stringify(out, null, 2));
    return EXIT.OK;
  }

  if (rows.length === 0) {
    deps.out("No items match.");
    return EXIT.OK;
  }

  const header = ["id", "owner", "task", "due", "status", "source(s)"];
  const body = rows.map(({ item, status: st }) => [
    String(item.id),
    item.owner,
    item.task,
    item.due ?? (item.dueFlagged ? "?" : "-"),
    st,
    item.sources.map((s) => s.file).join(", "),
  ]);
  for (const line of alignColumns([header, ...body])) deps.out(line);
  return EXIT.OK;
}

/** Plain aligned columns, no colour (FRD D65.2). Widths use display width, so wide characters count as 2 (plan 07 Q9). */
export function alignColumns(rows: string[][]): string[] {
  const widths: number[] = [];
  for (const row of rows) {
    row.forEach((cell, i) => {
      widths[i] = Math.max(widths[i] ?? 0, displayWidth(cell));
    });
  }
  return rows.map((row) =>
    row
      .map((cell, i) => (i === row.length - 1 ? cell : cell + " ".repeat((widths[i] ?? 0) - displayWidth(cell))))
      .join("  "),
  );
}

function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    const wide =
      (cp >= 0x1100 && cp <= 0x115f) ||
      (cp >= 0x2e80 && cp <= 0xa4cf) ||
      (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0xffe0 && cp <= 0xffe6) ||
      (cp >= 0x1f300 && cp <= 0x1faff);
    w += wide ? 2 : 1;
  }
  return w;
}

