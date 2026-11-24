import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALLOWED_MCP_TOOLS } from "../../src/email/mcp-connector.js";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? sourceFiles(p) : p.endsWith(".ts") ? [p] : [];
  });
}

// NFR-S1, NFR-S2, AC-F3, RULE-1: no code path can send email.
describe("never sends email", () => {
  it("MCP allow-list contains only create_draft", () => {
    expect([...ALLOWED_MCP_TOOLS]).toEqual(["create_draft"]);
  });

  it("no source file references a send operation", () => {
    const offenders = sourceFiles("src").filter((f) =>
      /send_?(email|message|draft)|messages\.send|drafts\.send|\bsendMail\b/i.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
