import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../../src/server.js";

describe("generate_identicon", () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client({ name: "test-client", version: "1.0.0" });
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  afterAll(async () => {
    await cleanup();
  });

  it("should generate a basic identicon PNG", async () => {
    const result = await client.callTool({
      name: "generate_identicon",
      arguments: {
        value: "testuser@example.com",
      },
    });

    const content = result.content as Array<{ type: string; data?: string; mimeType?: string }>;
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe("image");
    expect(content[0].mimeType).toBe("image/png");
    const buf = Buffer.from(content[0].data!, "base64");
    // PNG magic bytes
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
    expect(buf[2]).toBe(0x4e);
    expect(buf[3]).toBe(0x47);
  });

  it("should generate SVG output", async () => {
    const result = await client.callTool({
      name: "generate_identicon",
      arguments: {
        value: "testuser@example.com",
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].type).toBe("text");
    expect(content[0].text).toContain("<svg");
    expect(content[0].text).toContain("</svg>");
  });

  it("should be deterministic - same input produces same output", async () => {
    const result1 = await client.callTool({
      name: "generate_identicon",
      arguments: {
        value: "deterministic-test",
        format: "svg",
      },
    });

    const result2 = await client.callTool({
      name: "generate_identicon",
      arguments: {
        value: "deterministic-test",
        format: "svg",
      },
    });

    const svg1 = (result1.content as Array<{ type: string; text?: string }>)[0].text;
    const svg2 = (result2.content as Array<{ type: string; text?: string }>)[0].text;
    expect(svg1).toBe(svg2);
  });

  it("should produce different output for different inputs", async () => {
    const result1 = await client.callTool({
      name: "generate_identicon",
      arguments: {
        value: "user-alpha",
        format: "svg",
      },
    });

    const result2 = await client.callTool({
      name: "generate_identicon",
      arguments: {
        value: "user-beta",
        format: "svg",
      },
    });

    const svg1 = (result1.content as Array<{ type: string; text?: string }>)[0].text;
    const svg2 = (result2.content as Array<{ type: string; text?: string }>)[0].text;
    expect(svg1).not.toBe(svg2);
  });

  it("should respect custom size", async () => {
    const result = await client.callTool({
      name: "generate_identicon",
      arguments: {
        value: "sized-user",
        size: 512,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const svg = content[0].text!;
    expect(svg).toContain('width="512"');
    expect(svg).toContain('height="512"');
  });

  it("should accept custom background color", async () => {
    const result = await client.callTool({
      name: "generate_identicon",
      arguments: {
        value: "bg-test",
        background: "ff0000",
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].type).toBe("text");
    expect(content[0].text).toContain("<svg");
  });

  it("should accept transparent background", async () => {
    const result = await client.callTool({
      name: "generate_identicon",
      arguments: {
        value: "transparent-test",
        background: "ffffff00",
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].type).toBe("text");
    expect(content[0].text).toContain("<svg");
  });

  it("should handle small size", async () => {
    const result = await client.callTool({
      name: "generate_identicon",
      arguments: {
        value: "small",
        size: 16,
        format: "png",
      },
    });

    const content = result.content as Array<{ type: string; data?: string; mimeType?: string }>;
    expect(content[0].type).toBe("image");
    const buf = Buffer.from(content[0].data!, "base64");
    expect(buf.length).toBeGreaterThan(0);
  });

  it("should handle large size", async () => {
    const result = await client.callTool({
      name: "generate_identicon",
      arguments: {
        value: "large",
        size: 1024,
        format: "png",
      },
    });

    const content = result.content as Array<{ type: string; data?: string; mimeType?: string }>;
    expect(content[0].type).toBe("image");
    const buf = Buffer.from(content[0].data!, "base64");
    expect(buf.length).toBeGreaterThan(0);
  });

  it("should accept saturation parameter", async () => {
    const result = await client.callTool({
      name: "generate_identicon",
      arguments: {
        value: "saturated",
        saturation: 0.8,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].type).toBe("text");
    expect(content[0].text).toContain("<svg");
  });
});
