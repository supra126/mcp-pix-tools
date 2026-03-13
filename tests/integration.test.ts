import { existsSync } from "node:fs";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestClient } from "./helpers.js";

type ContentItem = { type: string; text?: string; data?: string; mimeType?: string };

function getSavedPath(content: ContentItem[]): string | undefined {
  const item = content.find((c) => c.type === "text" && c.text?.startsWith("Saved to: "));
  return item?.text?.replace("Saved to: ", "");
}

let client: Client;
let cleanup: () => Promise<void>;

beforeAll(async () => {
  ({ client, cleanup } = await createTestClient());
});

afterAll(async () => {
  await cleanup();
});

/* ------------------------------------------------------------------ */
/*  Tool listing                                                       */
/* ------------------------------------------------------------------ */

describe("tool listing", () => {
  it("should list all 7 tools", async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "generate_barcode",
      "generate_chart",
      "generate_identicon",
      "generate_isbn",
      "generate_palette",
      "generate_placeholder",
      "generate_wordcloud",
    ]);
  });
});

/* ------------------------------------------------------------------ */
/*  File saving                                                        */
/* ------------------------------------------------------------------ */

describe("file saving", () => {
  it("should save PNG to temp file and include path", async () => {
    const result = await client.callTool({
      name: "generate_barcode",
      arguments: { type: "qrcode", text: "save-test" },
    });
    const content = result.content as ContentItem[];
    const filePath = getSavedPath(content);
    expect(filePath).toBeDefined();
    expect(filePath).toMatch(/barcode-.*\.png$/);
    expect(existsSync(filePath!)).toBe(true);
  });

  it("should save SVG to temp file and include path", async () => {
    const result = await client.callTool({
      name: "generate_barcode",
      arguments: { type: "code128", text: "save-test", format: "svg" },
    });
    const content = result.content as ContentItem[];
    const filePath = getSavedPath(content);
    expect(filePath).toBeDefined();
    expect(filePath).toMatch(/barcode-.*\.svg$/);
    expect(existsSync(filePath!)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  generate_barcode                                                   */
/* ------------------------------------------------------------------ */

describe("generate_barcode", () => {
  it("should generate a QR code PNG", async () => {
    const result = await client.callTool({
      name: "generate_barcode",
      arguments: { type: "qrcode", text: "https://example.com" },
    });
    expect(result.isError).toBeFalsy();
    const img = (result.content as ContentItem[]).find((c) => c.type === "image");
    expect(img).toBeDefined();
    expect(img!.mimeType).toBe("image/png");
    expect(img!.data!.length).toBeGreaterThan(0);
  });

  it("should generate a barcode SVG", async () => {
    const result = await client.callTool({
      name: "generate_barcode",
      arguments: { type: "code128", text: "ABC-123", format: "svg" },
    });
    expect(result.isError).toBeFalsy();
    const txt = (result.content as ContentItem[]).find((c) => c.type === "text");
    expect(txt).toBeDefined();
    expect(txt!.text).toContain("<svg");
  });

  it("should return error for invalid barcode data", async () => {
    const result = await client.callTool({
      name: "generate_barcode",
      arguments: { type: "ean13", text: "invalid" },
    });
    expect(result.isError).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  generate_isbn                                                      */
/* ------------------------------------------------------------------ */

describe("generate_isbn", () => {
  it("should generate an ISBN barcode PNG", async () => {
    const result = await client.callTool({
      name: "generate_isbn",
      arguments: { isbn: "9780306406157" },
    });
    expect(result.isError).toBeFalsy();
    const contents = result.content as ContentItem[];
    const img = contents.find((c) => c.type === "image");
    expect(img).toBeDefined();
    expect(img!.data!.length).toBeGreaterThan(0);
  });

  it("should generate an ISBN barcode SVG", async () => {
    const result = await client.callTool({
      name: "generate_isbn",
      arguments: { isbn: "9780306406157", format: "svg" },
    });
    expect(result.isError).toBeFalsy();
    const contents = result.content as ContentItem[];
    const svg = contents.find((c) => c.type === "text" && c.text?.includes("<svg"));
    expect(svg).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/*  generate_wordcloud                                                 */
/* ------------------------------------------------------------------ */

describe("generate_wordcloud", () => {
  const manyWords = [
    { text: "hello", weight: 10 },
    { text: "world", weight: 8 },
    { text: "test", weight: 6 },
    { text: "cloud", weight: 5 },
    { text: "word", weight: 4 },
    { text: "data", weight: 3 },
    { text: "code", weight: 2 },
    { text: "node", weight: 1 },
  ];

  it("should generate a wordcloud PNG", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: manyWords,
        width: 800,
        height: 600,
        maxFontSize: 40,
        minFontSize: 10,
      },
    });
    expect(result.isError).toBeFalsy();
    const img = (result.content as ContentItem[]).find((c) => c.type === "image");
    expect(img).toBeDefined();
    expect(img!.mimeType).toBe("image/png");
  });

  it("should generate a wordcloud SVG", async () => {
    const result = await client.callTool({
      name: "generate_wordcloud",
      arguments: {
        words: manyWords,
        format: "svg",
      },
    });
    expect(result.isError).toBeFalsy();
    const txt = (result.content as ContentItem[]).find((c) => c.type === "text");
    expect(txt).toBeDefined();
    expect(txt!.text).toContain("<svg");
  });
});

/* ------------------------------------------------------------------ */
/*  generate_palette                                                   */
/* ------------------------------------------------------------------ */

describe("generate_palette", () => {
  it("should generate a palette PNG", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: { baseColor: "#3498db" },
    });
    expect(result.isError).toBeFalsy();
    const contents = result.content as ContentItem[];
    const img = contents.find((c) => c.type === "image");
    expect(img).toBeDefined();
  });

  it("should generate a palette with different scheme", async () => {
    const result = await client.callTool({
      name: "generate_palette",
      arguments: { baseColor: "e74c3c", scheme: "triadic", count: 3, format: "svg" },
    });
    expect(result.isError).toBeFalsy();
    const contents = result.content as ContentItem[];
    const meta = contents.find((c) => c.type === "text" && c.text?.includes("#"));
    expect(meta).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/*  generate_placeholder                                               */
/* ------------------------------------------------------------------ */

describe("generate_placeholder", () => {
  it("should generate a placeholder PNG", async () => {
    const result = await client.callTool({
      name: "generate_placeholder",
      arguments: { width: 200, height: 100 },
    });
    expect(result.isError).toBeFalsy();
    const img = (result.content as ContentItem[]).find((c) => c.type === "image");
    expect(img).toBeDefined();
    expect(img!.mimeType).toBe("image/png");
  });

  it("should generate a placeholder SVG with custom text", async () => {
    const result = await client.callTool({
      name: "generate_placeholder",
      arguments: { width: 300, height: 200, text: "Preview", format: "svg" },
    });
    expect(result.isError).toBeFalsy();
    const txt = (result.content as ContentItem[]).find((c) => c.type === "text");
    expect(txt).toBeDefined();
    expect(txt!.text).toContain("<svg");
    expect(txt!.text).toContain("Preview");
  });
});

/* ------------------------------------------------------------------ */
/*  generate_identicon                                                 */
/* ------------------------------------------------------------------ */

describe("generate_identicon", () => {
  it("should generate an identicon PNG", async () => {
    const result = await client.callTool({
      name: "generate_identicon",
      arguments: { value: "user@example.com" },
    });
    expect(result.isError).toBeFalsy();
    const img = (result.content as ContentItem[]).find((c) => c.type === "image");
    expect(img).toBeDefined();
    expect(img!.mimeType).toBe("image/png");
  });

  it("should generate an identicon SVG", async () => {
    const result = await client.callTool({
      name: "generate_identicon",
      arguments: { value: "test-user", format: "svg" },
    });
    expect(result.isError).toBeFalsy();
    const txt = (result.content as ContentItem[]).find((c) => c.type === "text");
    expect(txt).toBeDefined();
    expect(txt!.text).toContain("<svg");
  });
});

/* ------------------------------------------------------------------ */
/*  generate_chart                                                     */
/* ------------------------------------------------------------------ */

describe("generate_chart", () => {
  const sampleData = [
    { label: "A", value: 10 },
    { label: "B", value: 20 },
    { label: "C", value: 15 },
  ];

  it("should generate a bar chart PNG", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: { type: "bar", data: sampleData, title: "Test Bar" },
    });
    expect(result.isError).toBeFalsy();
    const img = (result.content as ContentItem[]).find((c) => c.type === "image");
    expect(img).toBeDefined();
    expect(img!.mimeType).toBe("image/png");
  });

  it("should generate a pie chart SVG", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: { type: "pie", data: sampleData, format: "svg" },
    });
    expect(result.isError).toBeFalsy();
    const txt = (result.content as ContentItem[]).find((c) => c.type === "text");
    expect(txt).toBeDefined();
    expect(txt!.text).toContain("<svg");
  });

  it("should generate a line chart", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: { type: "line", data: sampleData },
    });
    expect(result.isError).toBeFalsy();
  });

  it("should handle bar chart with zero-value items", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "bar",
        data: [
          { label: "A", value: 10 },
          { label: "B", value: 0 },
          { label: "C", value: 5 },
        ],
        format: "svg",
      },
    });
    expect(result.isError).toBeFalsy();
    const txt = (result.content as ContentItem[]).find((c) => c.type === "text");
    expect(txt!.text).toContain("<svg");
    expect(txt!.text).toContain('height="1"');
  });

  it("should handle pie chart with some zero-value items", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "pie",
        data: [
          { label: "A", value: 10 },
          { label: "B", value: 0 },
          { label: "C", value: 5 },
        ],
        format: "svg",
      },
    });
    expect(result.isError).toBeFalsy();
    const txt = (result.content as ContentItem[]).find((c) => c.type === "text");
    expect(txt!.text).toContain("<svg");
  });

  it("should handle pie chart with all zero values", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "pie",
        data: [
          { label: "A", value: 0 },
          { label: "B", value: 0 },
        ],
        format: "svg",
      },
    });
    expect(result.isError).toBeFalsy();
    const txt = (result.content as ContentItem[]).find((c) => c.type === "text");
    expect(txt!.text).toContain("<svg");
    expect(txt!.text).toContain("No data");
  });
});
