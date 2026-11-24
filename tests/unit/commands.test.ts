import { describe, it } from "vitest";

// FRD sections 4 to 6, D15, D19, D20, D31, D32, D35. Use fixedClock and a fake DraftConnector.
describe("list (BR-03, AC-L1..L3)", () => {
  it.todo("default shows open + overdue, sorted by due with undated last (D15)");
  it.todo("--status overdue returns only overdue; --status done returns done (AC-L1)");
  it.todo("--owner + --status combine with AND (AC-L2, D31.4)");
  it.todo("--due-before is strictly before (AC-L3, D31.1)");
  it.todo("--json is machine-readable (D15.5)");
  it.todo("no match prints `No items match.` and exits 0 (D31.5)");
});

describe("done (BR-05, AC-D1)", () => {
  it.todo("marks done; excluded from open and overdue, shown by --status done (AC-D1)");
  it.todo("unknown id exits 2; already done prints a message and exits 0 (D32)");
  it.todo("never edits the source note (D32.1)");
  it.todo("persists across runs (NFR-D6)");
});

describe("followup (BR-06, BR-07, AC-F1..F3)", () => {
  it.todo("one draft per owner with open + overdue items, no done items (AC-F2)");
  it.todo("subject, first-name greeting, Overdue then Open, no signature (D19)");
  it.todo("only createDraft is ever called (AC-F1, AC-F3, NFR-A10)");
  it.todo("owner with nothing to chase: no draft, message shown (D7.3)");
  it.todo("repeat run warns and creates no second draft unless --force (D19.5)");
  it.todo("recipient: attendee email, then owners file, else none with warning (D6, D18)");
  it.todo("connector failure: clear error, exit 3, store untouched (D20.4, D20.5, NFR-R4)");
  it.todo("prints owner, recipient or (no recipient), item count, draft id; --all adds total (D35)");
});

describe("store (NFR-D3, NFR-D6, NFR-R3)", () => {
  it.todo("ids are sequential and never reused (D14)");
  it.todo("write is atomic; a failed write leaves the previous file intact");
  it.todo("path override via --store and ACTIONTRACK_STORE (D17.2)");
});
