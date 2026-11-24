import { describe, it } from "vitest";

// NFRD section 10. Runs the real CLI pipeline against the sample `notes/` folder
// (35 .md + 1 .txt) with a fixed clock and a fake DraftConnector. Expected counts must be
// confirmed against the first working build (NFRD section 10 preamble).
describe("sample notes/ folder acceptance (NFR-A1..A10, N1)", () => {
  it.todo("A1: ingest completes with no crash");
  it.todo("A2: exactly 4 notes skipped (empty, binary scratch.md, untitled.md, sales-pipeline) and 31 read");
  it.todo("A3: offsite-draft.txt ignored and counted");
  it.todo("A4: trap lines not ingested (block quote, code fence, HTML comment, table row, ACTION:)");
  it.todo("A5: Priya Nair 'send the revised quote to Acme' is ONE done item with 3 sources");
  it.todo("A6: bare Priya/Rahul ambiguous; `Priya N.` / `Priya S.` resolve to Nair / Shah");
  it.todo("A7: Someone/TBD (no owner), Everyone/Team (group), undated Sam item not overdue");
  it.todo("A8: 2026-09-23-standup.md: Sam resolves via roster, Rahul stays ambiguous");
  it.todo("A9: ingest twice gives the same items, ids and statuses");
  it.todo("A10: followup produces drafts only and sends nothing");
  it.todo("P1: ingest of the sample folder completes in under 5 seconds (N2)");
});
