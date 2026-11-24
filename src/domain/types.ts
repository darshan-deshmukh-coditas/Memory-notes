/** Domain types. Spec refs: FRD section 2, specs/05-store, specs/04-dedupe. */

/** Special owner labels (FRD D16, D25, D41, D46). Real people are stored by full name. */
export const OWNER_LABELS = {
  none: "(no owner)",
  group: "(group)",
  ambiguous: "(ambiguous)",
  unresolved: "(unresolved)",
} as const;
export type OwnerLabel = (typeof OWNER_LABELS)[keyof typeof OWNER_LABELS];

/** `--owner` tokens that select the special labels (FRD D42.1). */
export const OWNER_TOKENS: Readonly<Record<string, OwnerLabel>> = {
  none: OWNER_LABELS.none,
  group: OWNER_LABELS.group,
  ambiguous: OWNER_LABELS.ambiguous,
  unresolved: OWNER_LABELS.unresolved,
};

export type ItemStatus = "open" | "done" | "overdue";
/** `overdue` is computed at read time, never persisted (FRD D1). */
export type StoredStatus = "open" | "done";

/** ISO calendar date, `YYYY-MM-DD`. Never free text (RULE-4, NFR-D2). */
export type IsoDate = string;

export interface Attendee {
  name: string;
  email?: string | undefined;
}

export interface Note {
  /** File name only (never a path in output, NFR-SEC2). */
  file: string;
  meetingDate: IsoDate;
  attendees: Attendee[];
  /** Whole note text after BOM strip and CRLF normalisation. Line numbers are absolute (Q-08). */
  body: string;
}

export interface Source {
  file: string;
  meetingDate: IsoDate;
  /** 1-based absolute line of the checkbox. */
  line: number;
}

export interface ActionItem {
  /** Sequential, never changes, never reused (FRD D14). */
  id: number;
  /** Full name, or a special OwnerLabel. */
  owner: string;
  /** Wording from the most recent note (FRD D39.1). */
  task: string;
  /** Duplicate key: owner key plus normalised task (specs/04). */
  taskKey: string;
  due: IsoDate | null;
  /** True when due wording existed but could not be resolved (FRD D8.4). */
  dueFlagged: boolean;
  status: StoredStatus;
  /** All notes the item appeared in, oldest first (FRD D3.3). */
  sources: Source[];
}

export interface DraftRecord {
  owner: string;
  draftId: string;
  createdAt: string;
  itemIds: number[];
}

export interface RosterEntry {
  name: string;
  email?: string | undefined;
  /** Required when email is present (specs/05 S5-Q08). */
  meetingDate?: IsoDate | undefined;
}

export interface StoreFile {
  version: 1;
  nextId: number;
  items: ActionItem[];
  drafts: DraftRecord[];
  roster: RosterEntry[];
}

/** A skipped note or line (FRD D30.1). */
export interface SkipReport {
  file: string;
  line?: number;
  reason: string;
}

const LABEL_VALUES: readonly string[] = Object.values(OWNER_LABELS);

/** True for the four special owner labels, false for a person's full name (FRD D16, D25, D41). */
export function isOwnerLabel(owner: string): boolean {
  return LABEL_VALUES.includes(owner);
}
