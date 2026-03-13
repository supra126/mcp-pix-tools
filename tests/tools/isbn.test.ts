import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../../src/server.js";

describe("generate_isbn tool", () => {
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

  // ---------------------------------------------------------------------------
  // Invalid ISBN length
  // ---------------------------------------------------------------------------

  describe("invalid ISBN length", () => {
    it("should return error for ISBN that is too short", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "12345" },
      });

      expect(result.isError).toBe(true);
      const textItem = (result.content as any[])[0];
      expect(textItem.type).toBe("text");
      expect(textItem.text).toContain("Invalid ISBN length");
      expect(textItem.text).toContain("5");
      expect(textItem.text).toContain("Expected 10 or 13 digits");
    });

    it("should return error for ISBN that is too long", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "97803064061571" },
      });

      expect(result.isError).toBe(true);
      const textItem = (result.content as any[])[0];
      expect(textItem.text).toContain("Invalid ISBN length");
      expect(textItem.text).toContain("14");
    });

    it("should return error for empty ISBN", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "" },
      });

      expect(result.isError).toBe(true);
      const textItem = (result.content as any[])[0];
      expect(textItem.text).toContain("Invalid ISBN length");
      expect(textItem.text).toContain("0");
    });

    it("should return error for a 12-digit string", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "123456789012" },
      });

      expect(result.isError).toBe(true);
      const textItem = (result.content as any[])[0];
      expect(textItem.text).toContain("Invalid ISBN length");
      expect(textItem.text).toContain("12");
    });
  });

  // ---------------------------------------------------------------------------
  // ISBN with dashes — dashes are stripped, so lengths should resolve correctly
  // ---------------------------------------------------------------------------

  describe("ISBN with dashes (should be stripped)", () => {
    it("should strip dashes from ISBN-13 and generate barcode", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "978-0-306-40615-7" },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as any[];
      expect(content[0].text).toContain("Valid: Yes");
      expect(content[1].type).toBe("image");
    });

    it("should strip dashes from ISBN-10 and generate barcode", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "0-306-40615-2" },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as any[];
      expect(content[0].text).toContain("Valid: Yes");
      expect(content[1].type).toBe("image");
    });

    it("should strip spaces from ISBN and generate barcode", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "978 0 306 40615 7" },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as any[];
      expect(content[0].text).toContain("Valid: Yes");
    });

    it("should still reject dashed ISBN that is the wrong length after stripping", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "978-0-306" },
      });

      expect(result.isError).toBe(true);
      const textItem = (result.content as any[])[0];
      expect(textItem.text).toContain("Invalid ISBN length");
    });
  });

  // ---------------------------------------------------------------------------
  // Valid ISBN-13 barcode generation
  // ---------------------------------------------------------------------------

  describe("valid ISBN-13 barcode generation", () => {
    it("should generate PNG barcode for valid ISBN-13", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "9780306406157" },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as any[];
      expect(content.length).toBe(2);
      expect(content[0].type).toBe("text");
      expect(content[0].text).toContain("Valid: Yes");
      expect(content[0].text).toContain("ISBN-13: 9780306406157");
      expect(content[1].type).toBe("image");
      expect(content[1].mimeType).toBe("image/png");
    });

    it("should generate SVG barcode for valid ISBN-13", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "9780306406157", format: "svg" },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as any[];
      expect(content.length).toBe(2);
      expect(content[0].type).toBe("text");
      expect(content[1].type).toBe("text");
      expect(content[1].text).toContain("<svg");
    });
  });

  // ---------------------------------------------------------------------------
  // Valid ISBN-10 barcode generation
  // ---------------------------------------------------------------------------

  describe("valid ISBN-10 barcode generation", () => {
    it("should generate barcode for valid ISBN-10 (converted to ISBN-13)", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "0306406152" },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as any[];
      expect(content[0].type).toBe("text");
      expect(content[0].text).toContain("ISBN-10: 0306406152");
      expect(content[0].text).toContain("ISBN-13: 9780306406157");
      expect(content[1].type).toBe("image");
    });

    it("should handle ISBN-10 with X check digit", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "155404295X" },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as any[];
      expect(content[0].text).toContain("ISBN-10: 155404295X");
      expect(content[1].type).toBe("image");
    });
  });

  // ---------------------------------------------------------------------------
  // ISBN-10 to ISBN-13 conversion
  // ---------------------------------------------------------------------------

  describe("ISBN-10 to ISBN-13 conversion", () => {
    it("should convert 0306406152 (ISBN-10) to 9780306406157 (ISBN-13)", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "0306406152" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as any[])[0].text;
      expect(text).toContain("ISBN-10: 0306406152");
      expect(text).toContain("ISBN-13: 9780306406157");
    });
  });

  // ---------------------------------------------------------------------------
  // ISBN-13 to ISBN-10 conversion
  // ---------------------------------------------------------------------------

  describe("ISBN-13 to ISBN-10 conversion", () => {
    it("should convert 978-prefix ISBN-13 to ISBN-10", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "9780306406157" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as any[])[0].text;
      expect(text).toContain("ISBN-10: 0306406152");
    });

    it("should show N/A for 979-prefix ISBN-13 (no ISBN-10 equivalent)", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "9790000000001" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as any[])[0].text;
      expect(text).toContain("ISBN-10: N/A");
    });
  });

  // ---------------------------------------------------------------------------
  // Invalid check digit
  // ---------------------------------------------------------------------------

  describe("invalid check digit", () => {
    it("should generate barcode for ISBN-13 with wrong check digit but show warning", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "9780306406158" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as any[])[0].text;
      expect(text).toContain("Valid: No");
      expect(text).toContain("check digit");
    });

    it("should generate barcode for ISBN-10 with wrong check digit but show warning", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "0306406153" },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as any[])[0].text;
      expect(text).toContain("Valid: No");
    });
  });

  // ---------------------------------------------------------------------------
  // Options
  // ---------------------------------------------------------------------------

  describe("options", () => {
    it("should accept custom scale", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "9780306406157", scale: 5 },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as any[];
      expect(content[1].type).toBe("image");
    });

    it("should accept includeText as false", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "9780306406157", includeText: false },
      });

      expect(result.isError).toBeFalsy();
      const content = result.content as any[];
      expect(content[1].type).toBe("image");
    });

    it("should reject scale out of range", async () => {
      const result = await client.callTool({
        name: "generate_isbn",
        arguments: { isbn: "9780306406157", scale: 99 },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as any[])[0].text;
      expect(text).toContain("Input validation error");
    });
  });
});
