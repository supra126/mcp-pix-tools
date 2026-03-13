import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";

const BIN = resolve(import.meta.dirname, "../../dist/index.js");
const PORT = 13_579; // use an uncommon port to avoid conflicts

let child: ChildProcess;
let client: Client;
let transport: SSEClientTransport;

describe("SSE transport", () => {
  beforeAll(async () => {
    // Start the SSE server as a subprocess
    child = spawn("node", [BIN, "--transport", "sse", "--port", String(PORT)], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Wait for server to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout waiting for SSE server")), 10_000);
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

    // Connect MCP client via SSE
    transport = new SSEClientTransport(new URL(`http://localhost:${PORT}/sse`));
    client = new Client({ name: "test-sse", version: "0.0.1" });
    await client.connect(transport);
  });

  afterAll(async () => {
    await client?.close();
    child?.kill();
  });

  it("should respond to health check", async () => {
    const res = await fetch(`http://localhost:${PORT}/health`);
    const body = await res.json();
    expect(body).toEqual({ status: "ok", name: "mcp-pix-tools" });
  });

  it("should list tools via SSE", async () => {
    const { tools } = await client.listTools();
    expect(tools.length).toBe(7);
    expect(tools.map((t) => t.name)).toContain("generate_chart");
  });

  it("should call generate_barcode via SSE", async () => {
    const result = await client.callTool({
      name: "generate_barcode",
      arguments: { type: "qrcode", text: "sse-test" },
    });
    expect(result.isError).toBeFalsy();
    const img = (result.content as Array<{ type: string; data?: string; mimeType?: string }>).find(
      (c) => c.type === "image",
    );
    expect(img).toBeDefined();
    expect(img!.mimeType).toBe("image/png");
  });

  it("should call generate_identicon via SSE", async () => {
    const result = await client.callTool({
      name: "generate_identicon",
      arguments: { value: "sse-user", format: "svg" },
    });
    expect(result.isError).toBeFalsy();
    const txt = (result.content as Array<{ type: string; text?: string }>).find(
      (c) => c.type === "text",
    );
    expect(txt!.text).toContain("<svg");
  });

  it("should call generate_chart via SSE", async () => {
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
});
