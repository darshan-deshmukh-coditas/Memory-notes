import { resolveToday } from "../../clock.js";
import { UsageError } from "../../domain/errors.js";
import { EXIT, type ExitCode } from "../../domain/exit-codes.js";
import { loadStore, resolveStorePath, saveStore } from "../../store/store.js";
import type { Deps } from "../deps.js";

export interface DoneOptions {
  id: number;
  store?: string | undefined;
  today?: string | undefined;
}

/**
 * Marks one item done. Writes the store only, never the source note (FRD D32.1). Unknown id: exit 2
 * and nothing changes (D32.2). Already done: a message and exit 0 with no write (D32.3, plan 08 Q1).
 */
export async function done(opts: DoneOptions, deps: Deps): Promise<ExitCode> {
  resolveToday(opts.today, deps.clock);
  const storePath = resolveStorePath(opts.store, deps.env);
  const { store } = loadStore(storePath);

  const item = store.items.find((i) => i.id === opts.id);
  if (item === undefined) {
    throw new UsageError(`No item with id ${opts.id}. Nothing was changed.`);
  }
  const label = `${item.owner}: ${item.task}`;
  if (item.status === "done") {
    deps.out(`Item ${item.id} is already done (${label}). Nothing was changed.`);
    return EXIT.OK;
  }

  saveStore(storePath, {
    ...store,
    items: store.items.map((i) => (i.id === item.id ? { ...i, status: "done" } : i)),
  });
  deps.out(`Marked done: item ${item.id} (${label})`);
  return EXIT.OK;
}
