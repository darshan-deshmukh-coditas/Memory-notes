import { UsageError } from "../domain/errors.js";
import { OWNER_LABELS, OWNER_TOKENS, type Attendee, type OwnerLabel } from "../domain/types.js";

/** Owner resolution (specs/03-owner-resolution; FRD D4, D16, D23 to D25, D41, D42, D46, D50, D60, D67; plan 03 Q1 to Q16). Pure. */

export type OwnerResult =
  | { kind: "person"; name: string; viaRoster: boolean }
  | { kind: "label"; label: OwnerLabel }
  | { kind: "ambiguous"; firstName: string }
  | { kind: "unresolved"; text: string };

export interface OwnerParse {
  /** One result per person named (FRD D24.3). Never empty. */
  owners: OwnerResult[];
  /** Task text after the owner phrase (FRD D24, D67). */
  task: string;
  warnings: string[];
}

const PLACEHOLDER_NONE = new Set(["someone", "tbd", "owner"]);
const PLACEHOLDER_GROUP = new Set(["everyone", "team"]);

function cleanWord(s: string): string {
  return s.replace(/[.,:]+$/, "").trim().toLowerCase();
}

function firstWord(name: string): string {
  return (name.trim().split(/\s+/)[0] ?? "").toLowerCase();
}

function surnameInitial(name: string): string {
  const words = name.trim().split(/\s+/);
  return (words[words.length - 1] ?? "").charAt(0).toLowerCase();
}

function unique(names: string[]): string[] {
  const seen = new Map<string, string>();
  for (const n of names) {
    const key = n.toLowerCase();
    if (!seen.has(key)) seen.set(key, n);
  }
  return [...seen.values()];
}

/**
 * Resolves one name part (no `&`) to an owner result. The `(with X)` collaborator is removed first
 * (plan 03 Q10). The attendees are searched before the roster (FRD D4.1, D41.1).
 */
function resolvePart(part: string, attendees: Attendee[], roster: string[]): OwnerResult {
  const clean = part.replace(/\s*\(with [^)]*\)\s*$/i, "").trim();
  const key = cleanWord(clean);
  if (PLACEHOLDER_NONE.has(key)) return { kind: "label", label: OWNER_LABELS.none };
  if (PLACEHOLDER_GROUP.has(key)) return { kind: "label", label: OWNER_LABELS.group };

  const attendeeNames = attendees.map((a) => a.name);

  // `Priya N.` or `Priya N`: first name plus surname initial (FRD D24.1, plan 03 Q7c).
  const initial = /^(\S+)\s+([A-Za-z])\.?$/.exec(clean);
  if (initial) {
    const first = (initial[1] ?? "").toLowerCase();
    const letter = (initial[2] ?? "").toLowerCase();
    let pool = attendeeNames.filter((n) => firstWord(n) === first);
    let viaRoster = false;
    if (pool.length === 0) {
      pool = roster.filter((n) => firstWord(n) === first);
      viaRoster = true;
    }
    const matches = unique(pool.filter((n) => surnameInitial(n) === letter));
    if (matches.length === 1) return { kind: "person", name: matches[0] ?? clean, viaRoster };
    if (matches.length > 1) return { kind: "ambiguous", firstName: initial[1] ?? clean };
    return { kind: "unresolved", text: clean };
  }

  // Full name: must match exactly, ignoring case (plan 03 Q6, Q11). No fallback to the first name.
  if (clean.split(/\s+/).length >= 2) {
    const lower = clean.toLowerCase();
    const inAttendees = attendeeNames.find((n) => n.toLowerCase() === lower);
    if (inAttendees !== undefined) return { kind: "person", name: inAttendees, viaRoster: false };
    const inRoster = roster.find((n) => n.toLowerCase() === lower);
    if (inRoster !== undefined) return { kind: "person", name: inRoster, viaRoster: true };
    return { kind: "unresolved", text: clean };
  }

  // Bare first name (FRD D4.1, D4.2, D41).
  const first = clean.toLowerCase();
  const inAttendees = unique(attendeeNames.filter((n) => firstWord(n) === first));
  if (inAttendees.length === 1) return { kind: "person", name: inAttendees[0] ?? clean, viaRoster: false };
  if (inAttendees.length > 1) return { kind: "ambiguous", firstName: clean };
  const inRoster = unique(roster.filter((n) => firstWord(n) === first));
  if (inRoster.length === 1) return { kind: "person", name: inRoster[0] ?? clean, viaRoster: true };
  if (inRoster.length > 1) return { kind: "ambiguous", firstName: clean };
  return { kind: "unresolved", text: clean };
}

function isKnown(r: OwnerResult): boolean {
  return r.kind !== "unresolved";
}

function ownerKey(r: OwnerResult): string {
  switch (r.kind) {
    case "person":
      return `person:${r.name.toLowerCase()}`;
    case "label":
      return `label:${r.label}`;
    case "ambiguous":
      return `ambiguous:${r.firstName.toLowerCase()}`;
    case "unresolved":
      return `unresolved:${r.text.toLowerCase().replace(/\s+/g, " ")}`;
  }
}

/**
 * Splits the owner phrase off an item and resolves it (FRD D24, D25, D50.2, D60, D67).
 * Forms: `@name: task` (tested first, plan 03 Q8), and `<Owner> to <task>`, where the text before
 * the first ` to ` is an owner only if every part is a known owner or placeholder (plan 03 Q8, Q9).
 * Otherwise the whole text is the task with owner `(no owner)`.
 */
export function resolveOwner(itemText: string, attendees: Attendee[], roster: string[]): OwnerParse {
  const text = itemText.trim();
  const warnings: string[] = [];

  const at = /^@([^:]+):\s*(.*)$/.exec(text);
  if (at) {
    const parts = (at[1] ?? "").split("&").map((p) => p.trim()).filter((p) => p !== "");
    const owners = dedupe(parts.map((p) => resolvePart(p, attendees, roster)));
    return { owners, task: (at[2] ?? "").trim(), warnings };
  }

  const idx = text.indexOf(" to ");
  if (idx > 0) {
    const phrase = text.slice(0, idx).trim();
    const parts = phrase.split("&").map((p) => p.trim());
    if (parts.every((p) => p !== "")) {
      const results = parts.map((p) => resolvePart(p, attendees, roster));
      if (results.every(isKnown)) {
        return { owners: dedupe(results), task: text.slice(idx + 4).trim(), warnings };
      }
    }
  }

  return { owners: [{ kind: "label", label: OWNER_LABELS.none }], task: text, warnings };
}

function dedupe(results: OwnerResult[]): OwnerResult[] {
  const seen = new Set<string>();
  const out: OwnerResult[] = [];
  for (const r of results) {
    const k = ownerKey(r);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(r);
    }
  }
  return out;
}

/** Display string for an owner result, as stored in the item (FRD D16, D25). */
export function ownerDisplay(r: OwnerResult): string {
  switch (r.kind) {
    case "person":
      return r.name;
    case "label":
      return r.label;
    case "ambiguous":
      return OWNER_LABELS.ambiguous;
    case "unresolved":
      return OWNER_LABELS.unresolved;
  }
}

/** Duplicate-key part for an owner result (specs/04 D85, D86). */
export function ownerKeyFor(r: OwnerResult): string {
  return ownerKey(r);
}

export type OwnerArgResult =
  | { kind: "person"; name: string }
  | { kind: "label"; label: OwnerLabel }
  | { kind: "no-match" };

/**
 * Resolves a `--owner` or `followup <owner>` argument (specs/03 rule 15; FRD D4.4, D42, D31.3).
 * A full name matches case-insensitively. A bare first name matching several people is an error
 * that lists the choices (exit 2). The special tokens select the labels. Anything else is no-match.
 */
export function resolveOwnerArg(arg: string, knownOwners: string[]): OwnerArgResult {
  const text = arg.trim();
  const token = OWNER_TOKENS[text.toLowerCase()];
  if (token !== undefined) return { kind: "label", label: token };

  const lower = text.toLowerCase();
  const full = knownOwners.find((n) => n.toLowerCase() === lower);
  if (full !== undefined) return { kind: "person", name: full };

  if (text !== "" && !/\s/.test(text)) {
    const matches = unique(knownOwners.filter((n) => firstWord(n) === lower));
    if (matches.length === 1) return { kind: "person", name: matches[0] ?? text };
    if (matches.length > 1) {
      throw new UsageError(
        `"${text}" matches several people: ${matches.join(", ")}. Use the full name, for example "${matches[0]}".`,
      );
    }
  }
  return { kind: "no-match" };
}
