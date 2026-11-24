import { normalizeTask } from "../../dedupe/normalize.js";
import { mergeItem, type IncomingItem } from "../../dedupe/merge.js";
import { findDuePhrase } from "../../dates/resolve.js";
import { resolveToday } from "../../clock.js";
import { UsageError } from "../../domain/errors.js";
import { EXIT, type ExitCode } from "../../domain/exit-codes.js";
import { IGNORED_KINDS, extractItems } from "../../parser/items.js";
import { listNoteFiles, notePath, readNote } from "../../parser/note.js";
import { ownerDisplay, ownerKeyFor, resolveOwner } from "../../owners/resolve.js";
import { loadStore, resolveStorePath, saveStore } from "../../store/store.js";
import type { Attendee, Note, RosterEntry, SkipReport, StoreFile } from "../../domain/types.js";
import { isOwnerLabel } from "../../domain/types.js";
import type { Deps } from "../deps.js";

export interface IngestOptions {
  folder: string;
  store?: string | undefined;
  today?: string | undefined;
}

/**
 * Pipeline (CLAUDE.md, specs/06): list notes, read each (skips), roster, then per item: owner, due,
 * normalise, merge. The store is saved once, and only when something changed (plan 06 Q3).
 * Exit 0 clean; 1 when anything was skipped or needs attention (D70.1); 2 for a missing folder or no notes.
 */
export async function ingest(opts: IngestOptions, deps: Deps): Promise<ExitCode> {
  resolveToday(opts.today, deps.clock);
  const storePath = resolveStorePath(opts.store, deps.env);

  const listing = listNoteFiles(opts.folder);
  if (listing.notes.length === 0) {
    throw new UsageError(`No notes found: no .md files at the top level of ${opts.folder}.`);
  }

  const { store, existed } = loadStore(storePath);

  // Pass 1: read every note. Skipped notes contribute nothing further (FRD D61.1, plan 01 Q-07).
  const skippedNotes: SkipReport[] = [];
  const notes: Note[] = [];
  for (const name of listing.notes) {
    const r = readNote(notePath(opts.folder, name));
    if (r.ok) notes.push(r.note);
    else skippedNotes.push(r.skip);
  }

  // Roster: stored names, then stored owners, then attendees of notes read in this run (FRD D23.1, D61.2).
  const roster = buildRosterNames(store, notes);

  // Pass 2: items, in note order then line order (specs/05 rule 9, FRD D69.1).
  let items = store.items;
  let nextId = store.nextId;
  let added = 0;
  let merged = 0;
  const ignoredByKind = new Map<string, number>();
  const skippedLines: SkipReport[] = [];
  const warnings: string[] = [];
  const attention: { owner: string; file: string; line: number }[] = [];
  const flagged: { file: string; line: number }[] = [];
  const rosterMatches: { file: string; line: number }[] = [];

  for (const note of notes) {
    const extracted = extractItems(note.body, 1);
    for (const ig of extracted.ignored) {
      ignoredByKind.set(ig.kind, (ignoredByKind.get(ig.kind) ?? 0) + 1);
    }
    for (const line of extracted.emptyLines) {
      skippedLines.push({ file: note.file, line, reason: "empty action item" });
    }

    for (const raw of extracted.items) {
      const owner = resolveOwner(raw.text, note.attendees, roster);
      for (const w of owner.warnings) warnings.push(`${note.file}:${raw.line}: ${w}`);

      const phrase = findDuePhrase(owner.task, note.meetingDate);
      if (phrase.warning) warnings.push(`${note.file}:${raw.line}: ${phrase.warning}`);

      const normalized = normalizeTask(phrase.task);
      if (normalized === "") {
        skippedLines.push({ file: note.file, line: raw.line, reason: "empty action item" });
        continue;
      }

      if (phrase.dueFlagged) flagged.push({ file: note.file, line: raw.line });

      for (const o of owner.owners) {
        const display = ownerDisplay(o);
        const incoming: IncomingItem = {
          owner: display,
          task: phrase.task,
          taskKey: `${ownerKeyFor(o)}|${normalized}`,
          due: phrase.due,
          dueFlagged: phrase.dueFlagged,
          status: raw.done ? "done" : "open",
          source: { file: note.file, meetingDate: note.meetingDate, line: raw.line },
        };
        const outcome = mergeItem(items, incoming, nextId);
        items = outcome.items;
        nextId = outcome.nextId;
        if (outcome.change === "add") added++;
        else merged++;

        if (o.kind === "person" && o.viaRoster) rosterMatches.push({ file: note.file, line: raw.line });
        if (o.kind !== "person") attention.push({ owner: display, file: note.file, line: raw.line });
        if (o.kind === "unresolved") {
          warnings.push(`${note.file}:${raw.line}: owner "${o.text}" matches no attendee or known person`);
        }
      }
    }
  }

  // Roster update from the notes read (FRD D56.2): most recent meeting's email wins, with a warning on conflict.
  const { roster: newRoster, warnings: rosterWarnings } = updateRoster(store.roster, notes);
  warnings.push(...rosterWarnings);

  const next: StoreFile = { version: 1, nextId, items, drafts: store.drafts, roster: newRoster };
  if (!existed || JSON.stringify(next) !== JSON.stringify(store)) {
    saveStore(storePath, next);
  }

  // Report (specs/06 rule 8 and 9). Warnings and skips go to stderr; totals to stdout.
  for (const s of skippedNotes) deps.err(`Skipped note: ${s.file}: ${s.reason}`);
  if (skippedLines.length > 0) {
    deps.err("Skipped lines:");
    for (const s of skippedLines) deps.err(`  ${s.file}:${s.line}: ${s.reason}`);
  }
  for (const w of warnings) deps.err(`Warning: ${w}`);

  deps.out(`Notes read: ${notes.length}`);
  deps.out(`Notes skipped: ${skippedNotes.length}`);
  deps.out(`Items added: ${added}`);
  deps.out(`Merged as duplicates: ${merged}`);
  deps.out(`Ignored files: ${listing.ignored}`);
  const ignoredText = IGNORED_KINDS.map((k) => `${k} ${ignoredByKind.get(k) ?? 0}`).join(", ");
  deps.out(`Ignored lines: ${ignoredText}`);
  if (attention.length > 0) {
    deps.out("Owners needing attention:");
    for (const a of attention) deps.out(`  ${a.owner}: ${a.file}:${a.line}`);
  }
  if (flagged.length > 0) {
    deps.out("Due dates flagged (no date stored):");
    for (const f of flagged) deps.out(`  ${f.file}:${f.line}`);
  }
  if (rosterMatches.length > 0) {
    deps.out("Owners matched from the roster:");
    for (const r of rosterMatches) deps.out(`  ${r.file}:${r.line}`);
  }

  const unresolved = attention.some((a) => a.owner === "(unresolved)");
  const needsWarning =
    skippedNotes.length > 0 || skippedLines.length > 0 || warnings.length > 0 || unresolved;
  return needsWarning ? EXIT.WARNINGS : EXIT.OK;
}

/** Roster names in first-seen order, case-insensitive (plan 03 Q12, FRD D61.2). */
export function buildRosterNames(store: StoreFile, notes: Note[]): string[] {
  const seen = new Map<string, string>();
  const add = (name: string): void => {
    const key = name.toLowerCase();
    if (!seen.has(key)) seen.set(key, name);
  };
  for (const r of store.roster) add(r.name);
  for (const item of store.items) if (!isOwnerLabel(item.owner)) add(item.owner);
  for (const note of notes) for (const a of note.attendees) add(a.name);
  return [...seen.values()];
}

/** Adds attendees to the roster. The email from the most recent meeting wins; a conflict is a warning (FRD D56.2, plan 06 Q13). */
export function updateRoster(current: RosterEntry[], notes: Note[]): { roster: RosterEntry[]; warnings: string[] } {
  const roster = current.map((r) => ({ ...r }));
  const warnings: string[] = [];
  const indexOf = (name: string): number => roster.findIndex((r) => r.name.toLowerCase() === name.toLowerCase());

  for (const note of notes) {
    for (const a of note.attendees) {
      let i = indexOf(a.name);
      if (i === -1) {
        roster.push({ name: a.name });
        i = roster.length - 1;
      }
      const entry = roster[i];
      if (entry === undefined || !hasEmail(a)) continue;
      const email = a.email ?? "";
      if (entry.email === undefined) {
        roster[i] = { name: entry.name, email, meetingDate: note.meetingDate };
      } else if (entry.email.toLowerCase() === email.toLowerCase()) {
        if (entry.meetingDate === undefined || note.meetingDate > entry.meetingDate) {
          roster[i] = { name: entry.name, email: entry.email, meetingDate: note.meetingDate };
        }
      } else {
        warnings.push(`attendee email for "${entry.name}" differs between notes; the most recent meeting's email is used`);
        if (entry.meetingDate === undefined || note.meetingDate > entry.meetingDate) {
          roster[i] = { name: entry.name, email, meetingDate: note.meetingDate };
        }
      }
    }
  }
  return { roster, warnings };
}

function hasEmail(a: Attendee): boolean {
  return typeof a.email === "string" && a.email !== "";
}
