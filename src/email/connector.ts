/**
 * The ONLY Gmail surface the app can see. There is deliberately no send method:
 * no code path can send email (RULE-1, NFR-S1, AC-F3). Keep it that way.
 */
export interface DraftRequest {
  /** Absent when no recipient is known (FRD D6.3). */
  to?: string;
  subject: string;
  body: string;
}

export interface DraftResult {
  draftId: string;
}

export interface DraftConnector {
  createDraft(req: DraftRequest): Promise<DraftResult>;
}
