import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../../src/server.js";

describe("generate_barcode tool", () => {
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
  // QR Code
  // ---------------------------------------------------------------------------

  describe("QR Code generation", () => {
    it("should generate a QR Code as PNG (base64 image)", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "qrcode", text: "https://example.com" },
      });

      expect(result.isError).toBeFalsy();
      expect((result.content as any[]).length).toBeGreaterThanOrEqual(1);

      const item = (result.content as any[])[0];
      expect(item.type).toBe("image");
      expect(item.mimeType).toBe("image/png");
      expect(item.data).toBeTruthy();

      // Verify valid base64 that decodes to a PNG (magic bytes: 89 50 4E 47)
      const buf = Buffer.from(item.data, "base64");
      expect(buf[0]).toBe(0x89);
      expect(buf[1]).toBe(0x50);
      expect(buf[2]).toBe(0x4e);
      expect(buf[3]).toBe(0x47);
    });

    it("should generate a QR Code as SVG (text content)", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "qrcode", text: "Hello World", format: "svg" },
      });

      expect(result.isError).toBeFalsy();
      expect((result.content as any[]).length).toBeGreaterThanOrEqual(1);

      const item = (result.content as any[])[0];
      expect(item.type).toBe("text");
      expect(item.text).toContain("<svg");
      expect(item.text).toContain("</svg>");
    });
  });

  // ---------------------------------------------------------------------------
  // Code128
  // ---------------------------------------------------------------------------

  describe("Code128 barcode generation", () => {
    it("should generate a Code128 barcode as PNG", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "code128", text: "ABC-12345" },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("image");
      expect(item.mimeType).toBe("image/png");
      expect(item.data).toBeTruthy();
    });

    it("should generate a Code128 barcode as SVG", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "code128", text: "ABC-12345", format: "svg" },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("text");
      expect(item.text).toContain("<svg");
    });
  });

  // ---------------------------------------------------------------------------
  // EAN-13
  // ---------------------------------------------------------------------------

  describe("EAN-13 barcode generation", () => {
    it("should generate an EAN-13 barcode with a valid 13-digit input", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "ean13", text: "5901234123457" },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("image");
      expect(item.mimeType).toBe("image/png");
    });

    it("should generate an EAN-13 barcode as SVG", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "ean13", text: "5901234123457", format: "svg" },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("text");
      expect(item.text).toContain("<svg");
    });
  });

  // ---------------------------------------------------------------------------
  // DataMatrix
  // ---------------------------------------------------------------------------

  describe("DataMatrix generation", () => {
    it("should generate a DataMatrix barcode as PNG", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "datamatrix", text: "DataMatrix Test" },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("image");
      expect(item.mimeType).toBe("image/png");
    });

    it("should generate a DataMatrix barcode as SVG", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: {
          type: "datamatrix",
          text: "DataMatrix Test",
          format: "svg",
        },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("text");
      expect(item.text).toContain("<svg");
    });
  });

  // ---------------------------------------------------------------------------
  // Custom options
  // ---------------------------------------------------------------------------

  describe("custom options", () => {
    it("should produce a larger image at higher scale", async () => {
      const [resultSmall, resultLarge] = await Promise.all([
        client.callTool({
          name: "generate_barcode",
          arguments: { type: "qrcode", text: "scale-test", scale: 1 },
        }),
        client.callTool({
          name: "generate_barcode",
          arguments: { type: "qrcode", text: "scale-test", scale: 5 },
        }),
      ]);

      expect(resultSmall.isError).toBeFalsy();
      expect(resultLarge.isError).toBeFalsy();

      const bufSmall = Buffer.from((resultSmall.content as any[])[0].data, "base64");
      const bufLarge = Buffer.from((resultLarge.content as any[])[0].data, "base64");
      expect(bufLarge.length).toBeGreaterThan(bufSmall.length);
    });

    it("should accept color and bgColor options", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: {
          type: "qrcode",
          text: "color-test",
          color: "ff0000",
          bgColor: "00ff00",
        },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("image");
      expect(item.mimeType).toBe("image/png");
    });

    it("should accept width and height options", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: {
          type: "code128",
          text: "size-test",
          width: 50,
          height: 20,
        },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("image");
    });

    it("should accept includeText as false", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: {
          type: "code128",
          text: "no-text",
          includeText: false,
        },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("image");
    });
  });

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------

  describe("error handling", () => {
    it("should return isError for an invalid barcode type", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "invalid_type", text: "test" },
      });

      expect(result.isError).toBe(true);
      const item = (result.content as any[])[0];
      expect(item.type).toBe("text");
      expect(item.text).toContain("invalid_enum_value");
    });

    it("should return isError for empty text", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "code128", text: "" },
      });

      expect(result.isError).toBe(true);
      const item = (result.content as any[])[0];
      expect(item.type).toBe("text");
      expect(item.text).toContain("bar code text not specified");
    });

    it("should return isError for invalid color format", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "qrcode", text: "test", color: "not-hex" },
      });

      expect(result.isError).toBe(true);
      const item = (result.content as any[])[0];
      expect(item.type).toBe("text");
      expect(item.text).toContain("Invalid");
    });

    it("should return isError for scale out of range", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "qrcode", text: "test", scale: 99 },
      });

      expect(result.isError).toBe(true);
      const item = (result.content as any[])[0];
      expect(item.type).toBe("text");
    });
  });

  // ---------------------------------------------------------------------------
  // Additional barcode types
  // ---------------------------------------------------------------------------

  describe("additional barcode types", () => {
    it("should generate a PDF417 barcode", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "pdf417", text: "PDF417 data" },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("image");
    });

    it("should generate an Aztec Code barcode", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "azteccode", text: "Aztec data" },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("image");
    });

    it("should generate a UPC-A barcode", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "upca", text: "012345678905" },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("image");
    });

    it("should generate a Code39 barcode", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "code39", text: "CODE39" },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("image");
    });

    it("should generate a Code93 barcode", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "code93", text: "CODE93" },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("image");
    });

    it("should generate an EAN-8 barcode", async () => {
      const result = await client.callTool({
        name: "generate_barcode",
        arguments: { type: "ean8", text: "96385074" },
      });

      expect(result.isError).toBeFalsy();
      const item = (result.content as any[])[0];
      expect(item.type).toBe("image");
    });
  });
});
