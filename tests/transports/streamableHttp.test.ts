import { type ChildProcess, spawn } from "node:child_process";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const BIN = resolve(import.meta.dirname, "../../dist/index.js");
const PORT = 13_579; // use an uncommon port to avoid conflicts

let child: ChildProcess;
let client: Client;
let transport: StreamableHTTPClientTransport;

describe("Streamable HTTP transport", () => {
  beforeAll(async () => {
    child = spawn("node", [BIN, "--transport", "http", "--port", String(PORT)], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Wait for server to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Timeout waiting for HTTP server")),
        10_000,
      );
      child.stderr!.on("data", (chunk: Buffer) => {
        if (chunk.toString().includes("listening on port")) {
          clearTimeout(timeout);
          resolve();
        }
      });
      child.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Connect MCP client via Streamable HTTP
    transport = new StreamableHTTPClientTransport(new URL(`http://localhost:${PORT}/mcp`));
    client = new Client({ name: "test-http", version: "0.0.1" });
    await client.connect(transport);
  });

  afterAll(async () => {
    await client?.close();
    await new Promise<void>((resolve) => {
      if (!child || child.exitCode !== null) return resolve();
      child.once("exit", () => resolve());
      child.kill();
    });
  });

  it("should respond to health check", async () => {
    const res = await fetch(`http://localhost:${PORT}/health`);
    const body = await res.json();
    expect(body).toEqual({ status: "ok", name: "mcp-pix-tools" });
  });

  it("should list tools via HTTP", async () => {
    const { tools } = await client.listTools();
    expect(tools.length).toBe(7);
    expect(tools.map((t) => t.name)).toContain("generate_chart");
  });

  it("should call generate_barcode via HTTP", async () => {
    const result = await client.callTool({
      name: "generate_barcode",
      arguments: { type: "qrcode", text: "http-test" },
    });
    expect(result.isError).toBeFalsy();
    const img = (result.content as Array<{ type: string; data?: string; mimeType?: string }>).find(
      (c) => c.type === "image",
    );
    expect(img).toBeDefined();
    expect(img!.mimeType).toBe("image/png");
  });

  it("should call generate_identicon via HTTP", async () => {
    const result = await client.callTool({
      name: "generate_identicon",
      arguments: { value: "http-user", format: "svg" },
    });
    expect(result.isError).toBeFalsy();
    const txt = (result.content as Array<{ type: string; text?: string }>).find(
      (c) => c.type === "text",
    );
    expect(txt!.text).toContain("<svg");
  });

  it("should call generate_chart via HTTP", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "bar",
        data: [
          { label: "X", value: 5 },
          { label: "Y", value: 10 },
        ],
      },
    });
    expect(result.isError).toBeFalsy();
  });

  it("should return 400 for DELETE with invalid session", async () => {
    const res = await fetch(`http://localhost:${PORT}/mcp`, {
      method: "DELETE",
      headers: { "mcp-session-id": "non-existent-session" },
    });
    expect(res.status).toBe(400);
  });

  it("should return 404 for unknown paths", async () => {
    const res = await fetch(`http://localhost:${PORT}/unknown`);
    expect(res.status).toBe(404);
  });

  it("should return 405 for unsupported methods", async () => {
    const res = await fetch(`http://localhost:${PORT}/mcp`, { method: "PUT" });
    expect(res.status).toBe(405);
  });
});
