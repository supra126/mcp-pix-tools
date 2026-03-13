import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Mock d3-cloud to bypass canvas getImageData requirement.
// The mock immediately fires the "end" callback with positioned words.
vi.mock("d3-cloud", () => {
  return {
    default: () => {
      let words: Array<{ text: string; size: number }> = [];
      let endCallback: (output: unknown[]) => void = () => {};

      const layout = {
        size: () => layout,
        words: (w: Array<{ text: string; size: number }>) => {
          words = w;
          return layout;
        },
        padding: () => layout,
        rotate: () => layout,
        font: () => layout,
        fontSize: () => layout,
        canvas: () => layout,
        on: (event: string, cb: (output: unknown[]) => void) => {
          if (event === "end") endCallback = cb;
          return layout;
        },
        start: () => {
          const placed = words.map((w, i) => ({
            text: w.text,
            size: w.size,
            x: i * 50 - 100,
            y: i * 30 - 50,
            rotate: i % 2 === 0 ? 0 : 90,
          }));
          endCallback(placed);
        },
      };
      return layout;
    },
  };
});

// Import createServer AFTER mock is set up (vi.mock is hoisted)
const { createServer } = await import("../../src/server.js");

type ContentItem = {
  type: string;
  text?: string;
  data?: string;
  mimeType?: string;
};

describe("generate_wordcloud (mocked d3-cloud)", () => {
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

  it("should generate valid SVG output", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: [
          { text: "hello", weight: 10 },
          { text: "world", weight: 5 },
        ],
        format: "svg",
      },
    });

    expect(result.isError).toBeFalsy();
    const content = result.content as ContentItem[];
    expect(content[0].type).toBe("text");
    expect(content[0].text).toContain("<svg");
    expect(content[0].text).toContain("</svg>");
    expect(content[0].text).toContain("hello");
    expect(content[0].text).toContain("world");
  });

  it("should generate valid PNG output", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: [
          { text: "png", weight: 10 },
          { text: "test", weight: 5 },
        ],
        format: "png",
      },
    });

    expect(result.isError).toBeFalsy();
    const content = result.content as ContentItem[];
    expect(content[0].type).toBe("image");
    expect(content[0].mimeType).toBe("image/png");
    expect(content[0].data).toBeDefined();
    // Verify PNG magic bytes
    const buf = Buffer.from(content[0].data!, "base64");
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });

  it("should use vibrant color scheme by default", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: [{ text: "color", weight: 10 }],
        format: "svg",
      },
    });

    const content = result.content as ContentItem[];
    expect(content[0].text).toMatch(/#e74c3c|#3498db|#2ecc71|#f39c12|#9b59b6|#1abc9c/);
  });

  it("should apply ocean color scheme", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: [
          { text: "sea", weight: 10 },
          { text: "wave", weight: 7 },
        ],
        format: "svg",
        colorScheme: "ocean",
      },
    });

    const content = result.content as ContentItem[];
    expect(content[0].text).toMatch(/#0077b6|#00b4d8|#90e0ef|#023e8a|#0096c7|#48cae4/);
  });

  it("should apply sunset color scheme", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: [{ text: "sun", weight: 10 }],
        format: "svg",
        colorScheme: "sunset",
      },
    });

    const content = result.content as ContentItem[];
    expect(content[0].text).toMatch(/#ff6b6b|#ffa06b|#ffd93d|#ff8a5c|#ea5455|#f9c74f/);
  });

  it("should apply forest color scheme", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: [{ text: "tree", weight: 10 }],
        format: "svg",
        colorScheme: "forest",
      },
    });

    const content = result.content as ContentItem[];
    expect(content[0].text).toMatch(/#2d6a4f|#40916c|#52b788|#74c69d|#95d5b2|#b7e4c7/);
  });

  it("should apply mono color scheme", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: [{ text: "gray", weight: 10 }],
        format: "svg",
        colorScheme: "mono",
      },
    });

    const content = result.content as ContentItem[];
    expect(content[0].text).toMatch(/#212529|#495057|#6c757d|#adb5bd|#343a40|#868e96/);
  });

  it("should escape XML special characters in words", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: [
          { text: "A&B", weight: 10 },
          { text: "<tag>", weight: 5 },
          { text: 'say "hi"', weight: 3 },
        ],
        format: "svg",
      },
    });

    const content = result.content as ContentItem[];
    const svg = content[0].text!;
    expect(svg).toContain("A&amp;B");
    expect(svg).toContain("&lt;tag&gt;");
    expect(svg).toContain("say &quot;hi&quot;");
    // Should NOT contain unescaped versions inside text elements
    expect(svg).not.toMatch(/<text[^>]*>.*<tag>.*<\/text>/);
  });

  it("should include correct SVG dimensions and viewBox", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: [{ text: "dim", weight: 10 }],
        format: "svg",
        width: 1000,
        height: 500,
      },
    });

    const content = result.content as ContentItem[];
    const svg = content[0].text!;
    expect(svg).toContain('width="1000"');
    expect(svg).toContain('height="500"');
    expect(svg).toContain('viewBox="0 0 1000 500"');
    expect(svg).toContain("translate(500,250)");
  });

  it("should handle words with equal weights", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: [
          { text: "equal1", weight: 5 },
          { text: "equal2", weight: 5 },
          { text: "equal3", weight: 5 },
        ],
        format: "svg",
      },
    });

    expect(result.isError).toBeFalsy();
    const content = result.content as ContentItem[];
    expect(content[0].text).toContain("equal1");
    expect(content[0].text).toContain("equal2");
    expect(content[0].text).toContain("equal3");
  });

  it("should include font-family in SVG text elements", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: [{ text: "font", weight: 10 }],
        format: "svg",
        fontFamily: "Helvetica",
      },
    });

    const content = result.content as ContentItem[];
    expect(content[0].text).toContain('font-family="Helvetica"');
  });

  it("should apply rotation transform in SVG", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: [
          { text: "norotate", weight: 10 },
          { text: "rotated", weight: 8 },
        ],
        format: "svg",
      },
    });

    const content = result.content as ContentItem[];
    const svg = content[0].text!;
    // Mock places even-index words at rotate=0, odd-index at rotate=90
    expect(svg).toContain("rotate(0)");
    expect(svg).toContain("rotate(90)");
  });
});
