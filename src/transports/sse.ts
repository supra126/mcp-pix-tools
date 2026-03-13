import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

export function startSSE(createServer: () => McpServer, port: number): Promise<void> {
  const app = express();
  const transports = new Map<string, SSEServerTransport>();

  app.get("/sse", async (_req, res, next) => {
    try {
      const server = createServer();
      const transport = new SSEServerTransport("/messages", res);
      transports.set(transport.sessionId, transport);
      res.on("close", () => {
        transports.delete(transport.sessionId);
      });
      await server.connect(transport);
    } catch (err) {
      next(err);
    }
  });

  app.post("/messages", async (req, res, next) => {
    try {
      const sessionId = req.query.sessionId as string;
      const transport = transports.get(sessionId);
      if (!transport) {
        res.status(400).json({ error: "Invalid session" });
        return;
      }
      await transport.handlePostMessage(req, res);
    } catch (err) {
      next(err);
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", name: "mcp-pix-tools" });
  });

  return new Promise<void>((resolve, reject) => {
    app
      .listen(port, () => {
        console.error(`mcp-pix-tools SSE server listening on port ${port}`);
        console.error(`  SSE endpoint: http://localhost:${port}/sse`);
        console.error(`  Health check: http://localhost:${port}/health`);
        resolve();
      })
      .on("error", reject);
  });
}
