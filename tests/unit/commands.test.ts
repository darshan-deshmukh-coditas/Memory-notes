import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fixedClock } from "../../src/clock.js";
import { GmailError, UsageError } from "../../src/domain/errors.js";
import type { DraftConnector, DraftRequest } from "../../src/email/connector.js";
import { GMAIL_MCP_CMD_ENV } from "../../src/email/mcp-connector.js";
import type { Deps } from "../../src/cli/deps.js";
import { done } from "../../src/cli/commands/done.js";
import { followup } from "../../src/cli/commands/followup.js";
import { ingest } from "../../src/cli/commands/ingest.js";
import { list } from "../../src/cli/commands/list.js";
import { loadStore } from "../../src/store/store.js";

// specs/05 to 09, 11 (commands.test.ts section). Fake connector only (NFR-M3).

class FakeConnector implements DraftConnector {
  requests: DraftRequest[] = [];
  failWith: string | undefined;
  async createDraft(req: DraftRequest): Promise<{ draftId: string }> {
    if (this.failWith !== undefined) throw new GmailError(this.failWith);
    this.requests.push(req);
    return { draftId: `draft-${this.requests.length}` };
  }
}

interface Harness {
  deps: Deps;
  out: string[];
  err: string[];
  connector: FakeConnector;
  dir: string;
  store: string;
}

function harness(env: Record<string, string> = { [GMAIL_MCP_CMD_ENV]: "fake" }): Harness {
  const dir = mkdtempSync(join(tmpdir(), "at-cmd-"));
  const out: string[] = [];
  const err: string[] = [];
  const connector = new FakeConnector();
  const deps: Deps = {
    clock: fixedClock("2026-10-20"),
    connector: () => connector,
    out: (l) => out.push(l),
    err: (l) => err.push(l),
    env,
  };
  return { deps, out, err, connector, dir, store: join(dir, "store", "items.json") };
}

function writeNote(h: Harness, name: string, text: string): string {
  const notes = join(h.dir, "notes");
  mkdirSync(notes, { recursive: true });
  writeFileSync(join(notes, name), text);
  return notes;
}

const MEETING_A = `Date: 2026-09-01
Attendees: Priya Nair <priya@example.com>, Sam Okafor, Anita Desai

- [ ] Priya N. to send the revised quote to Acme by Friday
- [ ] Anita to share wireframes
- [ ] Someone to update the CRM
- [x] Sam to rotate keys
`;

describe("ingest (specs/06)", () => {
  it("stores items with owners, due dates and sources; skips malformed notes; exit 1 (AC-I1, AC-I2)", async () => {
    const h = harness();
    const folder = writeNote(h, "2026-09-01-kickoff.md", MEETING_A);
    writeNote(h, "untitled.md", "- [ ] no date\n");
    const code = await ingest({ folder, store: h.store }, h.deps);
    expect(code).toBe(1);
    expect(h.out.join("\n")).toContain("Notes read: 1");
    expect(h.out.join("\n")).toContain("Notes skipped: 1");
    expect(h.err.join("\n")).toContain("untitled.md: missing date");

    const { store } = loadStore(h.store);
    expect(store.items.map((i) => [i.owner, i.task, i.due, i.status])).toEqual([
      ["Priya Nair", "send the revised quote to Acme", "2026-09-04", "open"],
      ["Anita Desai", "share wireframes", null, "open"],
      ["(no owner)", "update the CRM", null, "open"],
      ["Sam Okafor", "rotate keys", null, "done"],
    ]);
  });

  it("is idempotent: a second run adds nothing and keeps ids and statuses (D13.1, NFR-A9)", async () => {
    const h = harness();
    const folder = writeNote(h, "2026-09-01-kickoff.md", MEETING_A);
    await ingest({ folder, store: h.store }, h.deps);
    const before = readFileSync(h.store, "utf8");
    h.out.length = 0;
    await ingest({ folder, store: h.store }, h.deps);
    expect(h.out.join("\n")).toContain("Items added: 0");
    expect(readFileSync(h.store, "utf8")).toBe(before);
  });

  it("a folder with no .md files is a usage error (D35.3)", async () => {
    const h = harness();
    const folder = join(h.dir, "empty");
    mkdirSync(folder);
    await expect(ingest({ folder, store: h.store }, h.deps)).rejects.toBeInstanceOf(UsageError);
  });

  it("a missing folder is a usage error (D20.3)", async () => {
    const h = harness();
    await expect(ingest({ folder: join(h.dir, "nope"), store: h.store }, h.deps)).rejects.toThrow(/not found/);
  });

  it("a clean run with no skips and no warnings exits 0 (D70.2)", async () => {
    const h = harness();
    const folder = writeNote(h, "2026-09-01-kickoff.md", "Date: 2026-09-01\n- [ ] Priya to send the deck\n");
    expect(await ingest({ folder, store: h.store }, h.deps)).toBe(0);
  });
});

describe("list (specs/07)", () => {
  async function seeded(): Promise<Harness> {
    const h = harness();
    const folder = writeNote(h, "2026-09-01-kickoff.md", MEETING_A);
    await ingest({ folder, store: h.store }, h.deps);
    h.out.length = 0;
    return h;
  }

  it("default shows open and overdue, not done (D15.1)", async () => {
    const h = await seeded();
    await list({ store: h.store }, h.deps);
    const text = h.out.join("\n");
    expect(text).toContain("Priya Nair");
    expect(text).not.toContain("rotate keys");
  });

  it("status overdue is only past-due items; undated items are never overdue (D1.2, NFR-A7)", async () => {
    const h = await seeded();
    await list({ store: h.store, status: "overdue" }, h.deps);
    expect(h.out.join("\n")).toContain("send the revised quote to Acme");
    expect(h.out.join("\n")).not.toContain("share wireframes");
  });

  it("--due-before is strict and excludes undated items (D31.1, D31.2)", async () => {
    const h = await seeded();
    await list({ store: h.store, dueBefore: "2026-09-04", today: undefined }, h.deps);
    expect(h.out.join("\n")).toBe("No items match.");
  });

  it("filters combine with AND (D31.4)", async () => {
    const h = await seeded();
    await list({ store: h.store, owner: "Anita", status: "open" }, h.deps);
    const rows = h.out.join("\n");
    expect(rows).toContain("Anita Desai");
    expect(rows).not.toContain("Priya Nair");
  });

  it("--json is an array of items with computed status and full sources (D15.5, D58.2)", async () => {
    const h = await seeded();
    await list({ store: h.store, json: true }, h.deps);
    const parsed = JSON.parse(h.out.join("\n")) as { owner: string; sources: { line: number }[] }[];
    expect(parsed.length).toBe(3);
    expect(parsed[0]?.sources[0]?.line).toBe(4);
  });

  it("no match prints `No items match.` and exits 0 (D31.5); unknown owner too (D72.1)", async () => {
    const h = await seeded();
    expect(await list({ store: h.store, owner: "Zed" }, h.deps)).toBe(0);
    expect(h.out.join("\n")).toBe("No items match.");
  });

  it("an ambiguous first name is a usage error (D4.4)", async () => {
    const h = harness();
    const folder = writeNote(h, "2026-09-01-kickoff.md", "Date: 2026-09-01\nAttendees: Priya Nair, Priya Shah\n- [ ] Ship it\n");
    await ingest({ folder, store: h.store }, h.deps);
    await expect(list({ store: h.store, owner: "Priya" }, h.deps)).rejects.toBeInstanceOf(UsageError);
  });

  it("an invalid --status is a usage error (NFR-U3)", async () => {
    const h = await seeded();
    await expect(list({ store: h.store, status: "later" }, h.deps)).rejects.toBeInstanceOf(UsageError);
  });

  it("a missing store prints No items match. and creates no file (D59.3)", async () => {
    const h = harness();
    expect(await list({ store: h.store }, h.deps)).toBe(0);
    expect(existsSync(h.store)).toBe(false);
  });
});

describe("done (specs/08)", () => {
  it("marks an item done, persists it, and does not touch the note (D32.1, NFR-D6)", async () => {
    const h = harness();
    const folder = writeNote(h, "2026-09-01-kickoff.md", MEETING_A);
    await ingest({ folder, store: h.store }, h.deps);
    const noteBefore = readFileSync(join(folder, "2026-09-01-kickoff.md"), "utf8");
    h.out.length = 0;
    expect(await done({ id: 1, store: h.store }, h.deps)).toBe(0);
    expect(loadStore(h.store).store.items[0]?.status).toBe("done");
    expect(readFileSync(join(folder, "2026-09-01-kickoff.md"), "utf8")).toBe(noteBefore);
  });

  it("an unknown id is exit 2 and changes nothing (D32.2)", async () => {
    const h = harness();
    const folder = writeNote(h, "2026-09-01-kickoff.md", MEETING_A);
    await ingest({ folder, store: h.store }, h.deps);
    await expect(done({ id: 99, store: h.store }, h.deps)).rejects.toBeInstanceOf(UsageError);
  });

  it("an already-done item prints a message and exits 0 (D32.3)", async () => {
    const h = harness();
    const folder = writeNote(h, "2026-09-01-kickoff.md", MEETING_A);
    await ingest({ folder, store: h.store }, h.deps);
    h.out.length = 0;
    expect(await done({ id: 4, store: h.store }, h.deps)).toBe(0);
    expect(h.out.join("\n")).toContain("already done");
  });
});

describe("followup (specs/09)", () => {
  async function seeded(): Promise<Harness> {
    const h = harness();
    const folder = writeNote(h, "2026-09-01-kickoff.md", MEETING_A);
    await ingest({ folder, store: h.store }, h.deps);
    h.out.length = 0;
    h.err.length = 0;
    return h;
  }

  it("creates one draft per owner for open items, with the attendee's email, and never sends (AC-F1, AC-F2)", async () => {
    const h = await seeded();
    const code = await followup({ owner: "Priya Nair", store: h.store, today: "2026-10-20" }, h.deps);
    expect(code).toBe(0);
    expect(h.connector.requests).toHaveLength(1);
    const req = h.connector.requests[0];
    expect(req?.to).toBe("priya@example.com");
    expect(req?.subject).toBe("Follow-up: your open action items (1)");
    expect(req?.body).toContain("Hi Priya,");
    expect(req?.body).toContain("send the revised quote to Acme");
    expect(loadStore(h.store).store.drafts[0]?.draftId).toBe("draft-1");
  });

  it("--all makes drafts for persons only and counts label items (D16.3)", async () => {
    const h = await seeded();
    await followup({ all: true, store: h.store, today: "2026-10-20" }, h.deps);
    const owners = h.connector.requests.map((r) => r.subject);
    expect(owners).toHaveLength(2);
    expect(h.out.join("\n")).toContain("1 item(s) skipped (no one to email)");
  });

  it("a repeat warns and creates nothing; --force creates another (D51.2, D51.3)", async () => {
    const h = await seeded();
    await followup({ owner: "Priya Nair", store: h.store, today: "2026-10-20" }, h.deps);
    const code = await followup({ owner: "Priya Nair", store: h.store, today: "2026-10-20" }, h.deps);
    expect(code).toBe(1);
    expect(h.connector.requests).toHaveLength(1);
    await followup({ owner: "Priya Nair", store: h.store, today: "2026-10-20", force: true }, h.deps);
    expect(h.connector.requests).toHaveLength(2);
  });

  it("neither or both of owner and --all is a usage error (D73.1)", async () => {
    const h = await seeded();
    await expect(followup({ store: h.store }, h.deps)).rejects.toBeInstanceOf(UsageError);
    await expect(followup({ owner: "Priya Nair", all: true, store: h.store }, h.deps)).rejects.toBeInstanceOf(UsageError);
  });

  it("a label as the owner argument is a usage error (D73.2)", async () => {
    const h = await seeded();
    await expect(followup({ owner: "none", store: h.store }, h.deps)).rejects.toThrow(/no one to email/);
  });

  it("an unset Gmail command is exit 3 before any draft (D74.2)", async () => {
    const h = await seeded();
    h.deps.env = {};
    await expect(followup({ owner: "Priya Nair", store: h.store }, h.deps)).rejects.toThrow(GMAIL_MCP_CMD_ENV);
    expect(h.connector.requests).toHaveLength(0);
  });

  it("a connector failure exits 3 and records no draft (D20.5)", async () => {
    const h = await seeded();
    h.connector.failWith = "server down";
    await expect(followup({ owner: "Priya Nair", store: h.store }, h.deps)).rejects.toBeInstanceOf(GmailError);
    expect(loadStore(h.store).store.drafts).toHaveLength(0);
  });

  it("--all continues after a failed owner and still exits 3 (D53.2)", async () => {
    const h = await seeded();
    h.connector.failWith = "server down";
    await expect(followup({ all: true, store: h.store }, h.deps)).rejects.toBeInstanceOf(GmailError);
    expect(h.err.join("\n")).toContain("Draft not created");
  });

  it("without a store file, exit 2 with a hint to run ingest (plan 09 Q3)", async () => {
    const h = harness();
    await expect(followup({ owner: "Priya Nair", store: h.store }, h.deps)).rejects.toThrow(/Run "actiontrack ingest/);
  });

  it("no recipient gives a warning and a draft without `to` (D6.3)", async () => {
    const h = harness();
    const folder = writeNote(h, "2026-09-01-kickoff.md", "Date: 2026-09-01\nAttendees: Sam Okafor\n- [ ] Sam to write the plan\n");
    await ingest({ folder, store: h.store }, h.deps);
    h.out.length = 0;
    const code = await followup({ owner: "Sam Okafor", store: h.store, today: "2026-10-20" }, h.deps);
    expect(code).toBe(1);
    expect(h.connector.requests[0]?.to).toBeUndefined();
    expect(h.err.join("\n")).toContain("no email address for Sam Okafor");
  });
});
