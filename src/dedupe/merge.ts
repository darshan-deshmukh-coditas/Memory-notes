import type { ActionItem, IsoDate, Source, StoredStatus } from "../domain/types.js";

/** Duplicate merging (specs/04; FRD D3, D13, D28, D39, D40, D52, D68; plan 04 D82 to D91). Pure. */

export interface IncomingItem {
  owner: string;
  task: string;
  /** Duplicate key from the owner key and the normalised task (specs/04 rule 4). */
  taskKey: string;
  due: IsoDate | null;
  dueFlagged: boolean;
  status: StoredStatus;
  source: Source;
}

export type MergeChange = "add" | "merge" | "unchanged";

export interface MergeOutcome {
  items: ActionItem[];
  change: MergeChange;
  /** Id of the item the line landed on. */
  itemId: number;
  nextId: number;
}

/** Order sources by meeting date, then file name, then line (specs/04 rule 9; plan 04 D90). */
export function compareSources(a: Source, b: Source): number {
  if (a.meetingDate !== b.meetingDate) return a.meetingDate < b.meetingDate ? -1 : 1;
  if (a.file !== b.file) return a.file < b.file ? -1 : 1;
  return a.line - b.line;
}

/**
 * Adds one parsed line to the store (specs/04 rules 4 to 16). Same key: the lowest id wins
 * (plan 04 D89). A source already recorded (same file and line) changes nothing (rule 14).
 * Done wins (FRD D3.5). The latest due date wins, and a dated copy clears a flag (FRD D68.2).
 */
export function mergeItem(existing: ActionItem[], incoming: IncomingItem, nextId: number): MergeOutcome {
  const target = existing
    .filter((i) => i.taskKey === incoming.taskKey)
    .sort((a, b) => a.id - b.id)[0];

  if (target === undefined) {
    const item: ActionItem = {
      id: nextId,
      owner: incoming.owner,
      task: incoming.task,
      taskKey: incoming.taskKey,
      due: incoming.due,
      dueFlagged: incoming.due === null && incoming.dueFlagged,
      status: incoming.status,
      sources: [incoming.source],
    };
    return { items: [...existing, item], change: "add", itemId: nextId, nextId: nextId + 1 };
  }

  const already = target.sources.some((s) => s.file === incoming.source.file && s.line === incoming.source.line);
  if (already) return { items: existing, change: "unchanged", itemId: target.id, nextId };

  const previousNewest = [...target.sources].sort(compareSources).pop();
  const sources = [...target.sources, incoming.source].sort(compareSources);
  const due = latestDue(target.due, incoming.due);
  const isNewest = previousNewest === undefined || compareSources(incoming.source, previousNewest) >= 0;

  const merged: ActionItem = {
    ...target,
    task: isNewest ? incoming.task : target.task,
    due,
    dueFlagged: due === null ? target.dueFlagged || incoming.dueFlagged : false,
    status: target.status === "done" || incoming.status === "done" ? "done" : "open",
    sources,
  };
  return {
    items: existing.map((i) => (i.id === target.id ? merged : i)),
    change: "merge",
    itemId: target.id,
    nextId,
  };
}

function latestDue(a: IsoDate | null, b: IsoDate | null): IsoDate | null {
  if (a === null) return b;
  if (b === null) return a;
  return a >= b ? a : b;
}
