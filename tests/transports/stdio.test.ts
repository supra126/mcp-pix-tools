import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const BIN = resolve(import.meta.dirname, "../../dist/index.js");

let client: Client;
let transport: StdioClientTransport;

describe("stdio transport", () => {
  beforeAll(async () => {
    transport = new StdioClientTransport({
      command: "node",
      args: [BIN, "--transport", "stdio"],
      stderr: "pipe",
    });
    client = new Client({ name: "test-stdio", version: "0.0.1" });
    await client.connect(transport);
  });

  afterAll(async () => {
    await client?.close();
  });

  it("should list tools via stdio", async () => {
    const { tools } = await client.listTools();
    expect(tools.length).toBe(7);
    expect(tools.map((t) => t.name)).toContain("generate_barcode");
  });

  it("should call generate_barcode via stdio", async () => {
    const result = await client.callTool({
      name: "generate_barcode",
      arguments: { type: "qrcode", text: "stdio-test" },
    });
    expect(result.isError).toBeFalsy();
    const img = (result.content as Array<{ type: string; data?: string; mimeType?: string }>).find(
      (c) => c.type === "image",
    );
    expect(img).toBeDefined();
    expect(img!.mimeType).toBe("image/png");
  });

  it("should call generate_placeholder via stdio", async () => {
    const result = await client.callTool({
      name: "generate_placeholder",
      arguments: { width: 100, height: 50, format: "svg" },
    });
    expect(result.isError).toBeFalsy();
    const txt = (result.content as Array<{ type: string; text?: string }>).find(
      (c) => c.type === "text",
    );
    expect(txt).toBeDefined();
    expect(txt!.text).toContain("<svg");
  });
});
