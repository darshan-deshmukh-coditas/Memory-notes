// Test-only stand-in for a Gmail MCP server. It offers only create_draft, as the contract requires (specs/10).
// FAKE_GMAIL_MODE selects the behaviour: ok (default), error, noid, hang.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const mode = process.env.FAKE_GMAIL_MODE ?? "ok";
const server = new McpServer({ name: "fake-gmail", version: "0.0.1" });

server.registerTool(
  "create_draft",
  {
    description: "Create a draft (test fixture)",
    inputSchema: { to: z.string().optional(), subject: z.string(), body: z.string() },
  },
  async () => {
    if (mode === "hang") await new Promise(() => {});
    if (mode === "error") return { isError: true, content: [{ type: "text", text: "auth failed" }] };
    if (mode === "noid") return { content: [{ type: "text", text: "not json" }] };
    return { content: [{ type: "text", text: JSON.stringify({ draftId: "fake-123" }) }] };
  },
);

await server.connect(new StdioServerTransport());
