import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

const MAX_BODY_BYTES = 4 * 1024 * 1024; // 4 MB

export function startHTTP(createMcpServer: () => McpServer, port: number): Promise<void> {
  const transports = new Map<string, StreamableHTTPServerTransport>();

  const httpServer = createServer(async (req, res) => {
    try {
      await handleRequest(req, res, transports, createMcpServer, port);
    } catch {
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal error" },
            id: null,
          }),
        );
      }
    }
  });

  return new Promise<void>((resolve, reject) => {
    httpServer
      .listen(port, () => {
        console.error(`mcp-pix-tools HTTP server listening on port ${port}`);
        console.error(`  MCP endpoint:  http://localhost:${port}/mcp`);
        console.error(`  Health check:  http://localhost:${port}/health`);
        resolve();
      })
      .on("error", reject);
  });
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  transports: Map<string, StreamableHTTPServerTransport>,
  createMcpServer: () => McpServer,
  port: number,
): Promise<void> {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);

  // Health check
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", name: "mcp-pix-tools" }));
    return;
  }

  // Only handle /mcp endpoint
  if (url.pathname !== "/mcp") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  // GET — server-initiated notifications stream
  if (req.method === "GET") {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res);
    } else {
      res.writeHead(400);
      res.end("Invalid session");
    }
    return;
  }

  // DELETE — close session
  if (req.method === "DELETE") {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.close();
      transports.delete(sessionId);
      res.writeHead(200);
      res.end();
    } else {
      res.writeHead(400);
      res.end("Invalid session");
    }
    return;
  }

  // POST — JSON-RPC messages
  if (req.method === "POST") {
    const body = await readBody(req, res);
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32700, message: "Parse error" },
          id: null,
        }),
      );
      return;
    }

    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // Existing session
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res, parsed);
      return;
    }

    // New session (initialize request)
    if (!sessionId && isInitializeRequest(parsed)) {
      const newSessionId = randomUUID();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: (id) => {
          transports.set(id, transport);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          transports.delete(transport.sessionId);
        }
      };

      const server = createMcpServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, parsed);
      return;
    }

    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Invalid session" },
        id: null,
      }),
    );
    return;
  }

  res.writeHead(405);
  res.end("Method not allowed");
}

function readBody(req: IncomingMessage, res: ServerResponse): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        if (!res.headersSent) {
          res.writeHead(413, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32600, message: "Payload too large" },
              id: null,
            }),
          );
        }
        req.destroy();
        reject(new Error("Payload too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}
