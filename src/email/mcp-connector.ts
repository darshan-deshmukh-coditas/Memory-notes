import { NotImplementedError } from "../domain/errors.js";
import type { DraftConnector, DraftRequest, DraftResult } from "./connector.js";

/** Only this MCP tool may ever be invoked. Anything else is refused (NFR-S2). */
export const ALLOWED_MCP_TOOLS = ["create_draft"] as const;

/** Env var holding the stdio command that launches the user's Gmail MCP server. */
export const GMAIL_MCP_CMD_ENV = "ACTIONTRACK_GMAIL_MCP_CMD";

/**
 * MCP client over stdio (@modelcontextprotocol/sdk). Launches the configured server, checks
 * the tool allow-list, calls `create_draft`. Auth stays in the connector (NFR-SEC1).
 * Connection or auth failure throws GmailError (exit 3): nothing sent, store untouched (FRD D20.5).
 * TODO: confirm the real tool name and argument shape of the chosen Gmail MCP server.
 */
export class McpDraftConnector implements DraftConnector {
  constructor(private readonly command: string) {}

  async createDraft(_req: DraftRequest): Promise<DraftResult> {
    void this.command;
    throw new NotImplementedError("McpDraftConnector.createDraft (FRD D19, D20, NFR-C2)");
  }
}
