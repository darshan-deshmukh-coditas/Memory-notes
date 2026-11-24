import { describe, expect, it } from "vitest";
import { normalizeTask } from "../../src/dedupe/normalize.js";
import { mergeItem, type IncomingItem } from "../../src/dedupe/merge.js";
import type { ActionItem } from "../../src/domain/types.js";

// specs/04-dedupe (E1, NFR-D5); FRD D3, D13, D28, D39, D40, D52, D68; plan 04 D77 to D91.

function incoming(over: Partial<IncomingItem> & { file: string; date: string; line: number }): IncomingItem {
  const { file, date, line, ...rest } = over;
  return {
    owner: "Priya Nair",
    task: "send the revised quote to Acme",
    taskKey: `person:priya nair|${normalizeTask("send the revised quote to Acme")}`,
    due: null,
    dueFlagged: false,
    status: "open",
    source: { file, meetingDate: date, line },
    ...rest,
  };
}

describe("normalizeTask (D28.2, D77, D78)", () => {
  it("lowercases, drops articles and punctuation, collapses spaces", () => {
    expect(normalizeTask("  Send THE revised  quote, to Acme!  ")).toBe("send revised quote to acme");
  });

  it("apostrophes vanish, hyphens become spaces, e-mail stays different from email (D78)", () => {
    expect(normalizeTask("Acme's follow-up")).toBe("acmes follow up");
    expect(normalizeTask("send e-mail")).not.toBe(normalizeTask("send email"));
  });

  it("keeps other word differences separate (D28.3, NFR-D5)", () => {
    expect(normalizeTask("share first wireframes")).not.toBe(normalizeTask("share updated wireframes"));
  });
});

describe("mergeItem (D3, D13, D39, D68, D84)", () => {
  it("adds a new item with the next id", () => {
    const r = mergeItem([], incoming({ file: "a.md", date: "2026-09-01", line: 9 }), 1);
    expect(r.change).toBe("add");
    expect(r.items[0]?.id).toBe(1);
    expect(r.nextId).toBe(2);
  });

  it("merges the same owner and task from another note: all sources kept, latest due date (D3.3, D3.4)", () => {
    const first = mergeItem([], incoming({ file: "a.md", date: "2026-09-01", line: 9, due: "2026-09-04" }), 1);
    const second = mergeItem(first.items, incoming({ file: "b.md", date: "2026-09-08", line: 9, due: "2026-09-11" }), 2);
    expect(second.change).toBe("merge");
    expect(second.items).toHaveLength(1);
    const item = second.items[0] as ActionItem;
    expect(item.id).toBe(1);
    expect(item.sources.map((s) => s.file)).toEqual(["a.md", "b.md"]);
    expect(item.due).toBe("2026-09-11");
  });

  it("done wins over a later open copy (D3.5, plan 04 D84)", () => {
    const first = mergeItem([], incoming({ file: "a.md", date: "2026-09-01", line: 9, status: "done" }), 1);
    const second = mergeItem(first.items, incoming({ file: "b.md", date: "2026-09-08", line: 9 }), 2);
    expect(second.items[0]?.status).toBe("done");
  });

  it("re-ingesting the same source changes nothing (D13.1, specs/04 rule 14)", () => {
    const first = mergeItem([], incoming({ file: "a.md", date: "2026-09-01", line: 9 }), 1);
    const again = mergeItem(first.items, incoming({ file: "a.md", date: "2026-09-01", line: 9 }), 2);
    expect(again.change).toBe("unchanged");
    expect(again.nextId).toBe(2);
    expect(again.items).toEqual(first.items);
  });

  it("the most recent note's wording is shown (D39.1, plan 04 D90)", () => {
    const old = mergeItem([], incoming({ file: "a.md", date: "2026-09-01", line: 9, task: "old wording" }), 1);
    const newer = mergeItem(old.items, incoming({ file: "b.md", date: "2026-09-08", line: 9, task: "new wording" }), 2);
    expect(newer.items[0]?.task).toBe("new wording");
    const older = mergeItem(newer.items, incoming({ file: "0.md", date: "2026-08-01", line: 9, task: "ancient" }), 3);
    expect(older.items[0]?.task).toBe("new wording");
  });

  it("a dated copy clears a flag; a flag survives only when no copy has a date (D68.2)", () => {
    const flagged = mergeItem([], incoming({ file: "a.md", date: "2026-09-01", line: 9, dueFlagged: true }), 1);
    expect(flagged.items[0]?.dueFlagged).toBe(true);
    const dated = mergeItem(flagged.items, incoming({ file: "b.md", date: "2026-09-08", line: 9, due: "2026-09-11" }), 2);
    expect(dated.items[0]?.dueFlagged).toBe(false);
  });

  it("the same task for two different owners stays as two items (D28.1)", () => {
    const a = mergeItem([], incoming({ file: "a.md", date: "2026-09-01", line: 9 }), 1);
    const b = mergeItem(
      a.items,
      incoming({ file: "a.md", date: "2026-09-01", line: 10, owner: "Anita Desai", taskKey: `person:anita desai|${normalizeTask("send the revised quote to Acme")}` }),
      2,
    );
    expect(b.items).toHaveLength(2);
  });
});
