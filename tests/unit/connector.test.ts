import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { GmailError } from "../../src/domain/errors.js";
import { McpDraftConnector, assertAllowedTool, extractDraftId } from "../../src/email/mcp-connector.js";

// specs/10-gmail-draft-connector (TC-xx tests); FRD D45, D75, D76. Uses the fixture server over stdio.

const FIXTURE = resolve("tests/fixtures/fake-gmail-mcp/server.mjs");
const command = `node "${FIXTURE}"`;

afterEach(() => {
  delete process.env.FAKE_GMAIL_MODE;
});

describe("contract helpers (D45.1, D75.1)", () => {
  it("refuses any tool other than create_draft before a request (NFR-S2)", () => {
    expect(() => assertAllowedTool("create_draft")).not.toThrow();
    expect(() => assertAllowedTool("delete_draft")).toThrow(GmailError);
  });

  it("reads the draft id from structuredContent first, then from a JSON text block", () => {
    expect(extractDraftId({ structuredContent: { draftId: "s-1" } })).toBe("s-1");
    expect(extractDraftId({ content: [{ type: "text", text: '{"draftId":"t-2"}' }] })).toBe("t-2");
  });

  it("anything else is no draft id (D75.1)", () => {
    expect(extractDraftId({ content: [{ type: "text", text: "not json" }] })).toBeUndefined();
    expect(extractDraftId({ content: [{ type: "text", text: '{"draftId":"  "}' }] })).toBeUndefined();
    expect(extractDraftId({})).toBeUndefined();
  });
});

describe("McpDraftConnector against the fixture server", () => {
  it("creates a draft through create_draft and returns the draft id (FRD D45.2)", async () => {
    const c = new McpDraftConnector(command);
    const r = await c.createDraft({ to: "priya@example.com", subject: "Follow-up", body: "Hi Priya," });
    expect(r.draftId).toBe("fake-123");
  }, 20_000);

  it("an error result is a connector failure with no draft id (Q10)", async () => {
    process.env.FAKE_GMAIL_MODE = "error";
    await expect(new McpDraftConnector(command).createDraft({ subject: "s", body: "b" })).rejects.toBeInstanceOf(GmailError);
  }, 20_000);

  it("a result without a draft id is a connector failure (D75.1)", async () => {
    process.env.FAKE_GMAIL_MODE = "noid";
    await expect(new McpDraftConnector(command).createDraft({ subject: "s", body: "b" })).rejects.toThrow(/draft id/);
  }, 20_000);

  it("a call that takes too long is a connector failure after the timeout (D76.1)", async () => {
    process.env.FAKE_GMAIL_MODE = "hang";
    const c = new McpDraftConnector(command, 1500);
    await expect(c.createDraft({ subject: "s", body: "b" })).rejects.toThrow(/longer than/);
  }, 20_000);

  it("a server that does not start is a connector failure that names the variable (D74.2)", async () => {
    const c = new McpDraftConnector("definitely-not-a-real-command-xyz --serve");
    await expect(c.createDraft({ subject: "s", body: "b" })).rejects.toBeInstanceOf(GmailError);
  }, 20_000);
});
