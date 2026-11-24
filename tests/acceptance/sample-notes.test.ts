import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { ingest } from "../../src/cli/commands/ingest.js";
import type { Deps } from "../../src/cli/deps.js";
import { fixedClock } from "../../src/clock.js";
import { statusOf } from "../../src/dates/resolve.js";
import type { ActionItem } from "../../src/domain/types.js";
import { loadStore } from "../../src/store/store.js";

// NFR-A1 to NFR-A9 (specs/06-ingest, sample folder). Runs against the read-only notes/ folder
// with a store in a temp directory, so the sample notes are never changed.

const NOTES = resolve("notes");
const TODAY = "2026-10-20";

interface Run {
  code: number;
  out: string[];
  err: string[];
  store: string;
}

async function runIngest(store: string): Promise<Omit<Run, "store">> {
  const out: string[] = [];
  const err: string[] = [];
  const deps: Deps = {
    clock: fixedClock(TODAY),
    connector: () => {
      throw new Error("ingest must not create a connector");
    },
    out: (l) => out.push(l),
    err: (l) => err.push(l),
    env: {},
  };
  const code = await ingest({ folder: NOTES, store }, deps);
  return { code, out, err };
}

let first: Run;
let storePath: string;

beforeAll(async () => {
  storePath = join(mkdtempSync(join(tmpdir(), "at-sample-")), "items.json");
  const r = await runIngest(storePath);
  first = { ...r, store: storePath };
});

const items = (): ActionItem[] => loadStore(storePath).store.items;
const find = (pred: (i: ActionItem) => boolean): ActionItem | undefined => items().find(pred);

describe("sample folder acceptance (NFR-A1 to NFR-A4)", () => {
  it("NFR-A1 completes without crashing (exit 1 because notes were skipped)", () => {
    expect(first.code).toBe(1);
  });

  it("NFR-A2 skips 4 notes with the right reasons and reads 31", () => {
    expect(first.out).toContain("Notes read: 31");
    expect(first.out).toContain("Notes skipped: 4");
    const skipped = first.err.filter((l) => l.startsWith("Skipped note:")).join("\n");
    expect(skipped).toContain("2026-09-09-notes-final-v2.md: empty file");
    expect(skipped).toContain("scratch.md: not valid UTF-8");
    expect(skipped).toContain("untitled.md: missing date");
    expect(skipped).toContain("2026-10-03-sales-pipeline.md: unparseable date");
  });

  it("NFR-A3 counts the .txt file as an ignored file", () => {
    expect(first.out).toContain("Ignored files: 1");
  });

  it("NFR-A4 trap lines are not ingested: quote, fence, HTML comment, table row, ACTION line", () => {
    const sources = items().flatMap((i) => i.sources.map((s) => `${s.file}:${s.line}`));
    expect(sources).not.toContain("2026-09-21-incident-review.md:9");
    expect(items().some((i) => /remediate|hardware tokens|circulate the offsite/.test(i.task))).toBe(false);
    expect(find((i) => i.task === "refund affected customers")?.sources.map((s) => s.line)).toEqual([17]);
  });
});

describe("sample folder acceptance (NFR-A5 to NFR-A9)", () => {
  it("NFR-A5 Priya Nair's revised quote is one done item with three sources", () => {
    const item = find((i) => i.task === "send the revised quote to Acme");
    expect(item?.owner).toBe("Priya Nair");
    expect(item?.status).toBe("done");
    expect(item?.sources).toHaveLength(3);
  });

  it("NFR-A6 bare Priya and Rahul are ambiguous; Priya N. and Priya S. resolve", () => {
    expect(find((i) => i.task === "share the Q4 roadmap draft")?.owner).toBe("Priya Nair");
    expect(find((i) => i.task === "run the invoice rounding tests")?.owner).toBe("Priya Shah");
    expect(items().some((i) => i.owner === "(ambiguous)")).toBe(true);
  });

  it("NFR-A7 Someone and TBD are (no owner), Everyone and Team are (group); undated items are never overdue", () => {
    expect(find((i) => i.task === "update the CRM notes")?.owner).toBe("(no owner)");
    expect(find((i) => i.task === "review the prototype before the next review")?.owner).toBe("(group)");
    for (const i of items().filter((x) => x.due === null)) {
      expect(statusOf(i, TODAY)).not.toBe("overdue");
    }
  });

  it("NFR-A8 Sam (no attendees on 2026-09-23) resolves from the roster; Rahul stays ambiguous", () => {
    expect(find((i) => i.task === "rotate the staging credentials")?.owner).toBe("Sam Okafor");
    expect(find((i) => i.task === "rebase the feature branch")?.owner).toBe("(ambiguous)");
    expect(first.out.join("\n")).toContain("2026-09-23-standup.md:9");
  });

  it("NFR-A9 a second ingest gives the same items, ids and statuses, adding nothing", async () => {
    const before = JSON.stringify(items());
    const again = await runIngest(storePath);
    expect(again.out).toContain("Items added: 0");
    expect(JSON.stringify(items())).toBe(before);
  });
});
