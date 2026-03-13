import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../../src/server.js";

describe("generate_placeholder", () => {
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

  it("should generate a default placeholder showing WIDTHxHEIGHT as PNG", async () => {
    const result = await client.callTool({
      name: "generate_placeholder",
      arguments: {
        width: 400,
        height: 300,
      },
    });

    const content = result.content as Array<{ type: string; data?: string; mimeType?: string }>;
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe("image");
    expect(content[0].mimeType).toBe("image/png");
    const buf = Buffer.from(content[0].data!, "base64");
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });

  it("should show WIDTHxHEIGHT text in SVG when no custom text", async () => {
    const result = await client.callTool({
      name: "generate_placeholder",
      arguments: {
        width: 800,
        height: 600,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].type).toBe("text");
    const svg = content[0].text!;
    expect(svg).toContain("<svg");
    // The default text uses the multiplication sign
    expect(svg).toContain("800");
    expect(svg).toContain("600");
  });

  it("should display custom text", async () => {
    const result = await client.callTool({
      name: "generate_placeholder",
      arguments: {
        width: 300,
        height: 200,
        text: "Logo Here",
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain("Logo Here");
  });

  it("should apply custom background and text colors", async () => {
    const result = await client.callTool({
      name: "generate_placeholder",
      arguments: {
        width: 200,
        height: 200,
        bgColor: "ff0000",
        textColor: "ffffff",
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const svg = content[0].text!;
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('fill="#ffffff"');
  });

  it("should produce valid base64 PNG output", async () => {
    const result = await client.callTool({
      name: "generate_placeholder",
      arguments: {
        width: 100,
        height: 100,
        format: "png",
      },
    });

    const content = result.content as Array<{ type: string; data?: string; mimeType?: string }>;
    expect(content[0].type).toBe("image");
    expect(content[0].mimeType).toBe("image/png");
    expect(() => Buffer.from(content[0].data!, "base64")).not.toThrow();
    const buf = Buffer.from(content[0].data!, "base64");
    expect(buf.length).toBeGreaterThan(0);
  });

  it("should contain correct dimensions in SVG output", async () => {
    const result = await client.callTool({
      name: "generate_placeholder",
      arguments: {
        width: 640,
        height: 480,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const svg = content[0].text!;
    expect(svg).toContain('width="640"');
    expect(svg).toContain('height="480"');
    expect(svg).toContain('viewBox="0 0 640 480"');
  });

  it("should handle small dimensions", async () => {
    const result = await client.callTool({
      name: "generate_placeholder",
      arguments: {
        width: 1,
        height: 1,
        format: "png",
      },
    });

    const content = result.content as Array<{ type: string; data?: string; mimeType?: string }>;
    expect(content[0].type).toBe("image");
    const buf = Buffer.from(content[0].data!, "base64");
    expect(buf.length).toBeGreaterThan(0);
  });

  it("should handle large dimensions", async () => {
    const result = await client.callTool({
      name: "generate_placeholder",
      arguments: {
        width: 4096,
        height: 4096,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain('width="4096"');
    expect(content[0].text).toContain('height="4096"');
  });

  it("should include diagonal cross lines in SVG", async () => {
    const result = await client.callTool({
      name: "generate_placeholder",
      arguments: {
        width: 200,
        height: 100,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const svg = content[0].text!;
    expect(svg).toContain("<line");
    expect(svg).toContain('stroke-opacity="0.15"');
  });

  it("should escape XML special characters in custom text", async () => {
    const result = await client.callTool({
      name: "generate_placeholder",
      arguments: {
        width: 300,
        height: 200,
        text: "A & B <test>",
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const svg = content[0].text!;
    expect(svg).toContain("&amp;");
    expect(svg).toContain("&lt;test&gt;");
  });
});
