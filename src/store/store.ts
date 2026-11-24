import { randomBytes } from "node:crypto";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { z } from "zod";
import { InternalError, StoreError, UsageError } from "../domain/errors.js";
import { isIsoDate } from "../dates/calendar.js";
import { isOwnerLabel, type StoreFile } from "../domain/types.js";

/** The only module that reads or writes the store file (specs/05-store; FRD D14, D17, D56, D59, D69; plan 05). */

/** Default store, resolved from the working directory on every run (FRD D17.1, D59.1). */
export const DEFAULT_STORE_PATH = ".actiontrack/items.json";
export const STORE_ENV = "ACTIONTRACK_STORE";
export const OWNERS_FILE = "owners.json";

/** `--store` beats `ACTIONTRACK_STORE`, which beats the default. Empty values are unset (plan 05 S5-Q01, S5-Q02, O-1 to O-3). */
export function resolveStorePath(flag: string | undefined, env: NodeJS.ProcessEnv): string {
  if (flag !== undefined && flag.trim() !== "") return resolve(flag);
  const fromEnv = env[STORE_ENV];
  if (fromEnv !== undefined && fromEnv.trim() !== "") return resolve(fromEnv);
  return resolve(DEFAULT_STORE_PATH);
}

export function emptyStore(): StoreFile {
  return { version: 1, nextId: 1, items: [], drafts: [], roster: [] };
}

const isoDate = z.string().refine(isIsoDate, { message: "not a calendar date" });

const SourceSchema = z
  .object({ file: z.string(), meetingDate: isoDate, line: z.number().int().positive() })
  .strict();

const ItemSchema = z
  .object({
    id: z.number().int().positive(),
    owner: z.string(),
    task: z.string(),
    taskKey: z.string(),
    due: isoDate.nullable(),
    dueFlagged: z.boolean(),
    status: z.enum(["open", "done"]),
    sources: z.array(SourceSchema),
  })
  .strict();

const DraftSchema = z
  .object({
    owner: z.string(),
    draftId: z.string(),
    createdAt: z.string(),
    itemIds: z.array(z.number().int()),
  })
  .strict();

const RosterSchema = z
  .object({ name: z.string(), email: z.string().optional(), meetingDate: isoDate.optional() })
  .strict();

const StoreSchema = z
  .object({
    version: z.literal(1),
    nextId: z.number().int().positive(),
    items: z.array(ItemSchema),
    drafts: z.array(DraftSchema).default([]),
    roster: z.array(RosterSchema).default([]),
  })
  .strict();

function corrupt(path: string, why: string): StoreError {
  return new StoreError(
    `The store file is not usable (${why}): ${path}. Nothing was changed. Fix or move the file, then run again.`,
  );
}

/**
 * Loads the store. A missing file is an empty store (FRD D59.3). A corrupt file, a file whose version
 * is not 1, duplicate ids or an unknown key is a StoreError (exit 2) and is never overwritten (D59.4, D69.2).
 */
export function loadStore(path: string): { store: StoreFile; existed: boolean } {
  if (!existsSync(path)) return { store: emptyStore(), existed: false };
  if (statSync(path).isDirectory()) throw new UsageError(`The store path is a directory, not a file: ${path}`);

  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    throw new StoreError(`The store file could not be read: ${path}. Nothing was changed.`);
  }
  text = text.replace(/^﻿/, "");
  if (text.trim() === "") throw corrupt(path, "the file is empty");

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw corrupt(path, "not valid JSON");
  }
  const parsed = StoreSchema.safeParse(json);
  if (!parsed.success) throw corrupt(path, "unexpected content or version");

  const data = parsed.data;
  const ids = new Set<number>();
  let maxId = 0;
  for (const item of data.items) {
    if (ids.has(item.id)) throw corrupt(path, `duplicate item id ${item.id}`);
    ids.add(item.id);
    maxId = Math.max(maxId, item.id);
  }
  if (data.nextId <= maxId) throw corrupt(path, "nextId is not above every stored id");
  for (const r of data.roster) {
    if (r.email !== undefined && r.meetingDate === undefined) throw corrupt(path, "roster email without a meeting date");
  }
  return { store: data, existed: true };
}

const RETRY_WAITS_MS = [100, 200];

function sleepMs(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Atomic save: write a temp file beside the store, fsync it, then rename over the target (NFR-R3).
 * A failed rename on Windows is retried (plan 05 S5-Q13). On failure the old file is left intact and
 * the temp file is removed; the error is an InternalError (exit 4).
 */
export function saveStore(path: string, store: StoreFile): void {
  const dir = dirname(path);
  try {
    mkdirSync(dir, { recursive: true });
  } catch (e) {
    throw new InternalError(`Could not create the store folder ${dir}: ${errText(e)}`);
  }

  const tmp = `${path}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  const json = `${JSON.stringify(store, null, 2)}\n`;
  try {
    const fd = openSync(tmp, "w");
    try {
      writeSync(fd, json);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
  } catch (e) {
    safeUnlink(tmp);
    throw new InternalError(`Could not write the store file ${path}: ${errText(e)}. The previous file was kept.`);
  }

  for (let attempt = 0; ; attempt++) {
    try {
      renameSync(tmp, path);
      return;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      const retryable = code === "EPERM" || code === "EBUSY";
      if (retryable && attempt < RETRY_WAITS_MS.length) {
        sleepMs(RETRY_WAITS_MS[attempt] ?? 0);
        continue;
      }
      safeUnlink(tmp);
      throw new InternalError(`Could not replace the store file ${path}: ${errText(e)}. The previous file was kept.`);
    }
  }
}

function safeUnlink(path: string): void {
  try {
    unlinkSync(path);
  } catch {
    // Best effort: a stale temp file is harmless and is never deleted by later runs.
  }
}

function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export interface OwnerEntry {
  name: string;
  email: string;
}

/**
 * Reads owners.json beside the store (FRD D56). Never written by the tool. A missing file is fine;
 * a malformed one is a warning and is treated as empty (D56.3, plan 05 S5-Q16). Names match
 * case-insensitively; the first spelling wins (plan 05 S5-Q17).
 */
export function loadOwnersFile(storePath: string): { entries: Map<string, OwnerEntry>; warnings: string[] } {
  const entries = new Map<string, OwnerEntry>();
  const warnings: string[] = [];
  const path = join(dirname(storePath), OWNERS_FILE);
  if (!existsSync(path)) return { entries, warnings };

  let json: unknown;
  try {
    json = JSON.parse(readFileSync(path, "utf8").replace(/^﻿/, ""));
  } catch {
    warnings.push(`${OWNERS_FILE} could not be read or is not valid JSON; it was ignored.`);
    return { entries, warnings };
  }
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    warnings.push(`${OWNERS_FILE} must be an object of "Full Name": "email"; it was ignored.`);
    return { entries, warnings };
  }

  for (const [rawName, rawEmail] of Object.entries(json)) {
    const name = rawName.trim().replace(/\s+/g, " ");
    const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
    if (name === "" || !/^[^\s@]+@[^\s@]+$/.test(email)) {
      warnings.push(`${OWNERS_FILE}: entry for "${name}" has no valid email and was skipped.`);
      continue;
    }
    const key = name.toLowerCase();
    if (entries.has(key)) {
      warnings.push(`${OWNERS_FILE}: "${name}" appears twice; the first entry was used.`);
      continue;
    }
    entries.set(key, { name, email });
  }
  return { entries, warnings };
}

/** Names that can be used as owners: roster names plus full names stored on items (spec 09 rule 1, plan 07 Q7). */
export function knownOwners(store: StoreFile): string[] {
  const seen = new Map<string, string>();
  const add = (name: string): void => {
    const key = name.toLowerCase();
    if (!seen.has(key)) seen.set(key, name);
  };
  for (const r of store.roster) add(r.name);
  for (const item of store.items) if (!isOwnerLabel(item.owner)) add(item.owner);
  return [...seen.values()];
}
