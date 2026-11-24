import { NotImplementedError } from "../domain/errors.js";
import type { Attendee } from "../domain/types.js";

export type OwnerResolution =
  | { kind: "person"; names: string[]; viaRoster?: boolean }
  | { kind: "none" }
  | { kind: "group" }
  | { kind: "ambiguous"; firstName: string }
  | { kind: "unresolved"; firstName: string };

/** Roster of full names built from attendees of ingested notes (FRD D23.1). */
export type Roster = ReadonlySet<string>;

/**
 * Split the owner phrase off a checkbox line and resolve it to people (FRD D4, D23-D25, D41):
 * `Priya N.` initial match, `@anita:`, `Anita & Rahul` gives one result per person,
 * `Lena (with Priya)` is Lena, Everyone/Team is group, Someone/TBD is none.
 * Ambiguous when several attendees (or roster names) share the first name.
 */
export function resolveOwner(
  _itemText: string,
  _attendees: Attendee[],
  _roster: Roster,
): { owner: OwnerResolution; task: string; dueWording: string | null } {
  throw new NotImplementedError("resolveOwner (FRD D4, D23, D24, D25, D41)");
}

/** Resolve a `--owner` / `followup <owner>` argument. An ambiguous first name is an error listing the choices (D4.4, D31.3, D42). */
export function matchOwnerArg(_arg: string, _knownOwners: string[]): string {
  throw new NotImplementedError("matchOwnerArg (FRD D4.4, D31.3, D42)");
}
