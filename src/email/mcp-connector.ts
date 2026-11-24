import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport, type StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import { GmailError } from "../domain/errors.js";
import type { DraftConnector, DraftRequest, DraftResult } from "./connector.js";

/** Only this MCP tool may ever be invoked. Anything else is refused before any request (NFR-S2, FRD D45.1). */
export const ALLOWED_MCP_TOOLS = ["create_draft"] as const;

/** Env var holding the command that starts the user's Gmail MCP server (plan 10 Q4). */
export const GMAIL_MCP_CMD_ENV = "ACTIONTRACK_GMAIL_MCP_CMD";

/** Fixed for the CLI; start-up is included (FRD D76.1). */
export const DRAFT_TIMEOUT_MS = 60_000;

/** Internal guard, exported for tests only (plan 10 Q9). */
export function assertAllowedTool(name: string): void {
  if (!(ALLOWED_MCP_TOOLS as readonly string[]).includes(name)) {
    throw new GmailError(`Refused to call MCP tool "${name}": only ${ALLOWED_MCP_TOOLS.join(", ")} is allowed.`);
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function validId(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

/** FRD D75.1: `structuredContent.draftId`, else the first text block parsed as JSON `{"draftId": ...}`. */
export function extractDraftId(result: unknown): string | undefined {
  if (!isRecord(result)) return undefined;
  const sc = result.structuredContent;
  if (isRecord(sc)) {
    const id = validId(sc.draftId);
    if (id) return id;
  }
  const content = result.content;
  if (Array.isArray(content)) {
    const first = content.find((c): c is { type: string; text: string } => isRecord(c) && c.type === "text" && typeof c.text === "string");
    if (first) {
      try {
        const parsed: unknown = JSON.parse(first.text);
        if (isRecord(parsed)) return validId(parsed.draftId);
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

/**
 * Gmail draft connector over stdio MCP (FRD D20, D45, D75, D76; plan 10). The command is run through
 * the shell so `npx -y <pkg>` and quoted paths work. One server per call, stopped in `finally`.
 * The server inherits the environment; its stderr is discarded. No retry on any failure.
 */
export class McpDraftConnector implements DraftConnector {
  constructor(
    private readonly command: string,
    private readonly timeoutMs: number = DRAFT_TIMEOUT_MS,
  ) {}

  async createDraft(req: DraftRequest): Promise<DraftResult> {
    const args: Record<string, string> = { subject: req.subject, body: req.body };
    const to = req.to?.trim();
    if (to) args.to = to;

    let transport: StdioClientTransport | undefined;
    let timer: NodeJS.Timeout | undefined;

    const work = async (): Promise<DraftResult> => {
      transport = new StdioClientTransport(this.spawnParams());
      const client = new Client({ name: "actiontrack", version: "0.1.0" });
      await client.connect(transport);

      const tools = await client.listTools();
      if (!tools.tools.some((t) => t.name === "create_draft")) {
        throw new GmailError("The Gmail MCP server does not provide create_draft. No draft was created.");
      }
      assertAllowedTool("create_draft");

      const result: unknown = await client.callTool({ name: "create_draft", arguments: args });
      if (isRecord(result) && result.isError === true) {
        throw new GmailError("The Gmail MCP server returned an error for create_draft. No draft was created.");
      }
      const draftId = extractDraftId(result);
      if (draftId === undefined) {
        throw new GmailError("The Gmail MCP server did not return a draft id. Check Gmail Drafts before running again.");
      }
      return { draftId };
    };

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new GmailError(
            `The Gmail draft call took longer than ${Math.round(this.timeoutMs / 1000)} seconds. ` +
              "A draft may have been created; check Gmail Drafts before running again.",
          ),
        );
      }, this.timeoutMs);
    });

    try {
      return await Promise.race([work(), timeout]);
    } catch (e) {
      if (e instanceof GmailError) throw e;
      throw new GmailError(
        `Could not create the draft through the Gmail MCP server (${e instanceof Error ? e.message : "unknown error"}). ` +
          `Check ${GMAIL_MCP_CMD_ENV} and that the server is signed in. Nothing was sent.`,
      );
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      await transport?.close().catch(() => undefined);
    }
  }

  private spawnParams(): StdioServerParameters {
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) if (v !== undefined) env[k] = v;
    const [command, ...args] = splitCommand(this.command);
    if (command === undefined) {
      throw new GmailError(`${GMAIL_MCP_CMD_ENV} is empty. Nothing was sent.`);
    }
    // No shell: the SDK transport cannot pass shell or verbatim arguments, and a shell would
    // interpret note-derived or user-supplied text. Quoted arguments are split as in a shell.
    return { command, args, env, stderr: "ignore" };
  }
}

/**
 * Splits the command string into program and arguments. Whitespace separates arguments; double
 * quotes group them and are removed. Backslashes are kept as-is so Windows paths work.
 */
export function splitCommand(cmd: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  let started = false;
  for (const ch of cmd) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      started = true;
    } else if (!inQuotes && /\s/.test(ch)) {
      if (started) out.push(current);
      current = "";
      started = false;
    } else {
      current += ch;
      started = true;
    }
  }
  if (inQuotes) throw new GmailError(`${GMAIL_MCP_CMD_ENV} has an unmatched double quote. Nothing was sent.`);
  if (started) out.push(current);
  return out;
}
