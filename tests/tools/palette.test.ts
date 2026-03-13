import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../../src/server.js";

describe("generate_palette", () => {
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

  it("should generate an analogous palette with PNG swatch", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: {
        baseColor: "3498db",
        scheme: "analogous",
      },
    });

    const content = result.content as Array<{
      type: string;
      text?: string;
      data?: string;
      mimeType?: string;
    }>;
    // First content is text with color list
    expect(content.length).toBeGreaterThanOrEqual(2);
    expect(content[0].type).toBe("text");
    expect(content[0].text).toContain("analogous");
    expect(content[0].text).toContain("#3498DB");
    // Second content is PNG image
    expect(content[1].type).toBe("image");
    expect(content[1].mimeType).toBe("image/png");
    expect(content[1].data).toBeDefined();
  });

  it("should generate a complementary palette", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: {
        baseColor: "e74c3c",
        scheme: "complementary",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].type).toBe("text");
    expect(content[0].text).toContain("complementary");
    expect(content[0].text).toContain("#E74C3C");
  });

  it("should generate a triadic palette", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: {
        baseColor: "2ecc71",
        scheme: "triadic",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain("triadic");
  });

  it("should generate a tetradic palette", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: {
        baseColor: "9b59b6",
        scheme: "tetradic",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain("tetradic");
  });

  it("should generate a monochromatic palette", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: {
        baseColor: "f39c12",
        scheme: "monochromatic",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain("monochromatic");
  });

  it("should generate a split-complementary palette", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: {
        baseColor: "1abc9c",
        scheme: "split-complementary",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain("split-complementary");
  });

  it("should respect custom count", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: {
        baseColor: "3498db",
        scheme: "analogous",
        count: 8,
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const text = content[0].text!;
    // Should have 8 numbered color entries
    expect(text).toContain("8. #");
    expect(text).not.toContain("9. #");
  });

  it("should output SVG format", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: {
        baseColor: "3498db",
        scheme: "analogous",
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content.length).toBeGreaterThanOrEqual(2);
    // First is the text list
    expect(content[0].type).toBe("text");
    expect(content[0].text).toContain("analogous");
    // Second is the SVG
    expect(content[1].type).toBe("text");
    expect(content[1].text).toContain("<svg");
    expect(content[1].text).toContain("<rect");
  });

  it("should include color hex list in text content", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: {
        baseColor: "3498db",
        scheme: "complementary",
        count: 3,
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const text = content[0].text!;
    // Should contain numbered hex colors
    expect(text).toMatch(/1\. #[0-9A-F]{6}/);
    expect(text).toMatch(/2\. #[0-9A-F]{6}/);
    expect(text).toMatch(/3\. #[0-9A-F]{6}/);
  });

  it("should handle baseColor with # prefix", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: {
        baseColor: "#3498db",
        scheme: "analogous",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].type).toBe("text");
    expect(content[0].text).toContain("3498DB");
  });

  it("should generate PNG with valid base64 data", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: {
        baseColor: "ff5733",
        scheme: "complementary",
        format: "png",
      },
    });

    const content = result.content as Array<{ type: string; data?: string; mimeType?: string }>;
    const image = content[1];
    expect(image.type).toBe("image");
    expect(image.mimeType).toBe("image/png");
    const buf = Buffer.from(image.data!, "base64");
    // PNG magic bytes
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });

  it("should handle minimum count of 2", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: {
        baseColor: "3498db",
        scheme: "complementary",
        count: 2,
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const text = content[0].text!;
    expect(text).toContain("1. #");
    expect(text).toContain("2. #");
    expect(text).not.toContain("3. #");
  });
});
