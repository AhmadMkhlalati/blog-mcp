#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage } from "node:http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createBlogServer } from "./server.js";

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString();
  return raw ? JSON.parse(raw) : undefined;
}

async function main() {
  if (process.env.MCP_TRANSPORT !== "http") {
    await createBlogServer(process.env.BLOG_TOKEN).connect(new StdioServerTransport());
    return;
  }

  const port = Number(process.env.PORT ?? 3121);
  // One transport + one blog server (and therefore one API token) per MCP session.
  const transports = new Map<string, StreamableHTTPServerTransport>();

  const http = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain" }).end("ok");
      return;
    }
    if (url.pathname !== "/mcp") {
      res.writeHead(404).end("Not found");
      return;
    }

    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      const body = req.method === "POST" ? await readJson(req) : undefined;
      let transport = sessionId ? transports.get(sessionId) : undefined;

      if (!transport) {
        const isInit = (m: unknown) =>
          typeof m === "object" && m !== null && (m as { method?: string }).method === "initialize";
        const initializing = Array.isArray(body) ? body.some(isInit) : isInit(body);
        if (sessionId || !initializing) {
          res.writeHead(400, { "Content-Type": "application/json" }).end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32000, message: "Bad Request: missing or unknown session" },
              id: null,
            }),
          );
          return;
        }
        const created = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => void transports.set(id, created),
        });
        created.onclose = () => {
          if (created.sessionId) transports.delete(created.sessionId);
        };
        // The token is taken once, from the client's Authorization header on `initialize`.
        const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
        await createBlogServer(token).connect(created);
        transport = created;
      }

      await transport.handleRequest(req, res, body);
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.writeHead(500).end("Internal error");
    }
  });

  http.listen(port, "127.0.0.1", () => console.error(`blog-mcp listening on 127.0.0.1:${port}/mcp`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
