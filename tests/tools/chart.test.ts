import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../../src/server.js";

describe("generate_chart", () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  const sampleData = [
    { label: "Apples", value: 30 },
    { label: "Bananas", value: 20 },
    { label: "Cherries", value: 50 },
    { label: "Dates", value: 15 },
  ];

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

  // --- Bar chart ---

  it("should generate a bar chart PNG", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "bar",
        data: sampleData,
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

  it("should generate a bar chart SVG", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "bar",
        data: sampleData,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].type).toBe("text");
    const svg = content[0].text!;
    expect(svg).toContain("<svg");
    expect(svg).toContain("<rect");
    // Should contain data labels
    expect(svg).toContain("Apples");
    expect(svg).toContain("Bananas");
    expect(svg).toContain("Cherries");
    expect(svg).toContain("Dates");
    // Should contain data values
    expect(svg).toContain(">30<");
    expect(svg).toContain(">50<");
  });

  // --- Pie chart ---

  it("should generate a pie chart PNG", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "pie",
        data: sampleData,
      },
    });

    const content = result.content as Array<{ type: string; data?: string; mimeType?: string }>;
    expect(content[0].type).toBe("image");
    expect(content[0].mimeType).toBe("image/png");
  });

  it("should generate a pie chart SVG with percentages", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "pie",
        data: sampleData,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const svg = content[0].text!;
    expect(svg).toContain("<svg");
    expect(svg).toContain("<path");
    // Pie chart shows percentages
    expect(svg).toMatch(/\d+\.\d+%/);
    expect(svg).toContain("Apples");
  });

  // --- Line chart ---

  it("should generate a line chart PNG", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "line",
        data: sampleData,
      },
    });

    const content = result.content as Array<{ type: string; data?: string; mimeType?: string }>;
    expect(content[0].type).toBe("image");
    expect(content[0].mimeType).toBe("image/png");
  });

  it("should generate a line chart SVG with polyline", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "line",
        data: sampleData,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const svg = content[0].text!;
    expect(svg).toContain("<svg");
    expect(svg).toContain("<polyline");
    expect(svg).toContain("<circle");
    expect(svg).toContain("Apples");
  });

  // --- Custom title ---

  it("should include custom title in bar chart", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "bar",
        data: sampleData,
        title: "Fruit Sales Q1",
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain("Fruit Sales Q1");
  });

  it("should include custom title in pie chart", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "pie",
        data: sampleData,
        title: "Market Share",
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain("Market Share");
  });

  // --- Custom colors ---

  it("should use custom colors", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "bar",
        data: sampleData,
        colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00"],
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const svg = content[0].text!;
    expect(svg).toContain("#ff0000");
    expect(svg).toContain("#00ff00");
    expect(svg).toContain("#0000ff");
    expect(svg).toContain("#ffff00");
  });

  // --- Single data point ---

  it("should handle a single data point for bar chart", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "bar",
        data: [{ label: "Only", value: 42 }],
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain("Only");
    expect(content[0].text).toContain(">42<");
  });

  it("should handle a single data point for pie chart", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "pie",
        data: [{ label: "Solo", value: 100 }],
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain("Solo");
    expect(content[0].text).toContain("100.0%");
  });

  it("should handle a single data point for line chart", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "line",
        data: [{ label: "One", value: 77 }],
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain("One");
  });

  // --- Many data points ---

  it("should handle many data points", async () => {
    const manyData = Array.from({ length: 20 }, (_, i) => ({
      label: `Item ${i + 1}`,
      value: Math.floor(Math.random() * 100) + 1,
    }));

    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "bar",
        data: manyData,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain("<svg");
    expect(content[0].text).toContain("Item 1");
    expect(content[0].text).toContain("Item 20");
  });

  // --- Custom dimensions ---

  it("should respect custom dimensions for bar chart", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "bar",
        data: sampleData,
        width: 1000,
        height: 800,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const svg = content[0].text!;
    expect(svg).toContain('width="1000"');
    expect(svg).toContain('height="800"');
  });

  it("should respect custom dimensions for pie chart", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "pie",
        data: sampleData,
        width: 500,
        height: 500,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const svg = content[0].text!;
    expect(svg).toContain('width="500"');
    expect(svg).toContain('height="500"');
  });

  it("should respect custom dimensions for line chart", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "line",
        data: sampleData,
        width: 900,
        height: 600,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const svg = content[0].text!;
    expect(svg).toContain('width="900"');
    expect(svg).toContain('height="600"');
  });

  it("should use default title when none provided", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "bar",
        data: sampleData,
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain("Chart");
  });

  it("should escape XML special characters in title", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "bar",
        data: [{ label: "A", value: 10 }],
        title: "Sales & Revenue <2024>",
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const svg = content[0].text!;
    expect(svg).toContain("Sales &amp; Revenue &lt;2024&gt;");
  });

  it("should escape XML special characters in data labels", async () => {
    const result = await client.callTool({
      name: "generate_chart",
      arguments: {
        type: "bar",
        data: [{ label: "A & B", value: 10 }],
        format: "svg",
      },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toContain("A &amp; B");
  });
});
