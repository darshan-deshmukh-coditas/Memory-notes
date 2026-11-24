import type { ActionItem, IsoDate, Source } from "../domain/types.js";
import { compareSources } from "../dedupe/merge.js";

/**
 * Subject `Follow-up: your open action items (N)`, greeting by first name, Overdue list then Open
 * list, polite closing, no signature (FRD D19, D39.3; plan 09 Q11, Q12, Q13, Q19). Pure.
 * `items` must already be the open and overdue items for this owner, in the order to show.
 */
export function renderFollowup(
  owner: string,
  items: { item: ActionItem; overdue: boolean }[],
): { subject: string; body: string } {
  const n = items.length;
  const subject = `Follow-up: your open action items (${n})`;
  const greeting = `Hi ${owner.trim().split(/\s+/)[0] ?? owner},`;
  const overdue = items.filter((x) => x.overdue);
  const open = items.filter((x) => !x.overdue);

  const lines: string[] = [greeting, ""];
  if (overdue.length > 0) {
    lines.push("Overdue:");
    for (const x of overdue) lines.push(formatLine(x.item));
    lines.push("");
  }
  if (open.length > 0) {
    lines.push("Open:");
    for (const x of open) lines.push(formatLine(x.item));
    lines.push("");
  }
  lines.push("Thanks for your help with these.");
  return { subject, body: lines.join("\n") };
}

function formatLine(item: ActionItem): string {
  const latest = latestSource(item.sources);
  const due = item.due ?? "no due date";
  const meeting = latest ? latest.meetingDate : "unknown";
  const source = latest ? latest.file : "unknown";
  return `- ${item.task} (due: ${due}; meeting: ${meeting}; source: ${source})`;
}

/** The most recent source by meeting date, then file name (FRD D39.3, plan 09 Q13). */
export function latestSource(sources: Source[]): Source | undefined {
  return [...sources].sort(compareSources).pop();
}

/** Sort key for undated items last, then by due date, then id (spec 09 rule 9). */
export function compareDue(a: { due: IsoDate | null; id: number }, b: { due: IsoDate | null; id: number }): number {
  if (a.due !== null && b.due !== null && a.due !== b.due) return a.due < b.due ? -1 : 1;
  if (a.due !== null && b.due === null) return -1;
  if (a.due === null && b.due !== null) return 1;
  return a.id - b.id;
}
