import { createRequire } from "node:module";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../src/server.js";

const req = createRequire(import.meta.url);
const { version: PKG_VERSION } = req("../package.json");

const EXPECTED_TOOLS = [
  "generate_barcode",
  "generate_isbn",
  "generate_wordcloud",
  "generate_palette",
  "generate_placeholder",
  "generate_identicon",
  "generate_chart",
] as const;

describe("MCP Server", () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const server = createServer();
    client = new Client({ name: "test-client", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  afterAll(async () => {
    await cleanup();
  });

  describe("server creation", () => {
    it("should return an McpServer instance from createServer()", () => {
      const server = createServer();
      expect(server).toBeDefined();
      expect(typeof server.tool).toBe("function");
      expect(typeof server.connect).toBe("function");
      expect(typeof server.close).toBe("function");
    });
  });

  describe("server info", () => {
    it("should report correct name and version after initialization", () => {
      const info = client.getServerVersion();
      expect(info).toBeDefined();
      expect(info?.name).toBe("mcp-pix-tools");
      expect(info?.version).toBe(PKG_VERSION);
    });
  });

  describe("tool registration", () => {
    it("should register exactly 7 tools", async () => {
      const { tools } = await client.listTools();
      expect(tools).toHaveLength(7);
    });

    it("should register all expected tool names", async () => {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name).sort();
      expect(names).toEqual([...EXPECTED_TOOLS].sort());
    });

    it.each(EXPECTED_TOOLS)("should include tool '%s'", async (toolName) => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === toolName);
      expect(tool).toBeDefined();
    });
  });

  describe("tool descriptions", () => {
    it("every tool should have a non-empty description", async () => {
      const { tools } = await client.listTools();
      for (const tool of tools) {
        expect(tool.description).toBeTruthy();
        expect(tool.description!.length).toBeGreaterThan(10);
      }
    });
  });

  describe("tool input schemas", () => {
    it("every tool should have an inputSchema of type object", async () => {
      const { tools } = await client.listTools();
      for (const tool of tools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
      }
    });

    it("generate_barcode should require 'type' and 'text'", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === "generate_barcode")!;
      const props = tool.inputSchema.properties as Record<string, unknown>;
      expect(props).toHaveProperty("type");
      expect(props).toHaveProperty("text");
      expect(tool.inputSchema.required).toContain("type");
      expect(tool.inputSchema.required).toContain("text");
    });

    it("generate_isbn should require 'isbn'", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === "generate_isbn")!;
      const props = tool.inputSchema.properties as Record<string, unknown>;
      expect(props).toHaveProperty("isbn");
      expect(tool.inputSchema.required).toContain("isbn");
    });

    it("generate_wordcloud should require 'words'", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === "generate_wordcloud")!;
      const props = tool.inputSchema.properties as Record<string, unknown>;
      expect(props).toHaveProperty("words");
      expect(tool.inputSchema.required).toContain("words");
    });

    it("generate_palette should require 'baseColor'", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === "generate_palette")!;
      const props = tool.inputSchema.properties as Record<string, unknown>;
      expect(props).toHaveProperty("baseColor");
      expect(tool.inputSchema.required).toContain("baseColor");
    });

    it("generate_placeholder should require 'width' and 'height'", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === "generate_placeholder")!;
      const props = tool.inputSchema.properties as Record<string, unknown>;
      expect(props).toHaveProperty("width");
      expect(props).toHaveProperty("height");
      expect(tool.inputSchema.required).toContain("width");
      expect(tool.inputSchema.required).toContain("height");
    });

    it("generate_identicon should require 'value'", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === "generate_identicon")!;
      const props = tool.inputSchema.properties as Record<string, unknown>;
      expect(props).toHaveProperty("value");
      expect(tool.inputSchema.required).toContain("value");
    });

    it("generate_chart should require 'type' and 'data'", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === "generate_chart")!;
      const props = tool.inputSchema.properties as Record<string, unknown>;
      expect(props).toHaveProperty("type");
      expect(props).toHaveProperty("data");
      expect(tool.inputSchema.required).toContain("type");
      expect(tool.inputSchema.required).toContain("data");
    });

    it("generate_barcode should list supported barcode types in schema", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === "generate_barcode")!;
      const props = tool.inputSchema.properties as Record<string, { enum?: string[] }>;
      const typeEnum = props.type?.enum;
      expect(typeEnum).toBeDefined();
      expect(typeEnum).toContain("qrcode");
      expect(typeEnum).toContain("code128");
      expect(typeEnum).toContain("ean13");
      expect(typeEnum).toContain("datamatrix");
      expect(typeEnum).toContain("pdf417");
    });

    it("generate_chart should list chart types in schema", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === "generate_chart")!;
      const props = tool.inputSchema.properties as Record<string, { enum?: string[] }>;
      const typeEnum = props.type?.enum;
      expect(typeEnum).toEqual(["bar", "pie", "line"]);
    });

    it("generate_palette should list color scheme types in schema", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === "generate_palette")!;
      const props = tool.inputSchema.properties as Record<string, { enum?: string[] }>;
      const schemeEnum = props.scheme?.enum;
      expect(schemeEnum).toBeDefined();
      expect(schemeEnum).toContain("complementary");
      expect(schemeEnum).toContain("analogous");
      expect(schemeEnum).toContain("triadic");
      expect(schemeEnum).toContain("monochromatic");
    });

    it("tools with format option should support png and svg", async () => {
      const { tools } = await client.listTools();
      const toolsWithFormat = [
        "generate_barcode",
        "generate_isbn",
        "generate_wordcloud",
        "generate_palette",
        "generate_placeholder",
        "generate_identicon",
        "generate_chart",
      ];
      for (const toolName of toolsWithFormat) {
        const tool = tools.find((t) => t.name === toolName)!;
        const props = tool.inputSchema.properties as Record<string, { enum?: string[] }>;
        expect(props.format?.enum).toEqual(["png", "svg"]);
      }
    });
  });
});
