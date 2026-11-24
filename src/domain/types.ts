/** Domain types. Spec refs: FRD section 2, D14, D16, D25, D41, D42. */

/** Special owner labels (FRD D16, D25, D41). Real people are stored by full name. */
export const OWNER_LABELS = {
  none: "(no owner)",
  group: "(group)",
  ambiguous: "(ambiguous)",
  unresolved: "(unresolved)",
} as const;
export type OwnerLabel = (typeof OWNER_LABELS)[keyof typeof OWNER_LABELS];

/** `--owner` tokens that select the special labels (FRD D42.1). */
export const OWNER_TOKENS: Record<string, OwnerLabel> = {
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
  email?: string;
}

export interface Note {
  file: string;
  meetingDate: IsoDate;
  attendees: Attendee[];
  body: string;
}

export interface Source {
  file: string;
  meetingDate: IsoDate;
  line: number;
}

export interface ActionItem {
  /** Short sequential number; never changes, never reused (FRD D14). */
  id: number;
  /** Full name, or a special OwnerLabel. */
  owner: string;
  /** Wording from the most recent note (FRD D39.1). */
  task: string;
  /** Normalised task: the duplicate key together with owner (FRD D28, D36, D40). */
  taskKey: string;
  due: IsoDate | null;
  /** True when due wording existed but could not be resolved (FRD D8.4, D33.3). */
  dueFlagged: boolean;
  status: StoredStatus;
  /** All notes the item appeared in, newest meeting last (FRD D3.3). */
  sources: Source[];
}

export interface DraftRecord {
  owner: string;
  draftId: string;
  createdAt: string;
}

export interface StoreFile {
  version: 1;
  nextId: number;
  items: ActionItem[];
  /** Drafts created, used for repeat detection (FRD D19.5). */
  drafts: DraftRecord[];
}

/** A skipped note or line, reported after ingest (FRD D30.1). */
export interface SkipReport {
  file: string;
  line?: number;
  reason: string;
}
