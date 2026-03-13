import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// @ts-expect-error bwip-js .d.ts uses `export =` but .mjs uses `export default`
import bwipjs from "bwip-js";
import { z } from "zod";
import { saveToTempFile } from "../save.js";

const SUPPORTED_TYPES = [
  "qrcode",
  "code128",
  "ean13",
  "ean8",
  "upca",
  "upce",
  "code39",
  "interleaved2of5",
  "datamatrix",
  "pdf417",
  "azteccode",
  "maxicode",
  "gs1-128",
  "code93",
  "codabar",
] as const;

export function registerBarcodeTool(server: McpServer): void {
  server.tool(
    "generate_barcode",
    "Generate barcodes in various formats (QR Code, Code128, EAN-13, DataMatrix, PDF417, etc.). Returns PNG (base64) or SVG.",
    {
      type: z.enum(SUPPORTED_TYPES).describe("Barcode symbology type"),
      text: z.string().describe("Text or data to encode"),
      format: z.enum(["png", "svg"]).default("png").describe("Output format"),
      scale: z.number().min(1).max(10).default(3).describe("Scale factor (1-10)"),
      includeText: z.boolean().default(true).describe("Show human-readable text below barcode"),
      color: z
        .string()
        .regex(/^[0-9a-fA-F]{6}$/)
        .optional()
        .describe("Bar color in hex (e.g. '000000')"),
      bgColor: z
        .string()
        .regex(/^[0-9a-fA-F]{6}$/)
        .optional()
        .describe("Background color in hex (e.g. 'ffffff')"),
      width: z.number().optional().describe("Width in mm (optional)"),
      height: z.number().optional().describe("Height in mm (optional)"),
      padding: z
        .number()
        .min(0)
        .max(20)
        .optional()
        .describe(
          "Quiet-zone padding around the barcode (in barcode module-width units, 0-20). When set, a white background is automatically applied unless bgColor is specified.",
        ),
    },
    async ({ type, text, format, scale, includeText, color, bgColor, width, height, padding }) => {
      try {
        const options: bwipjs.RenderOptions = {
          bcid: type,
          text,
          scale,
          includetext: includeText,
          textxalign: "center",
        };

        if (color) options.barcolor = color;
        if (bgColor) options.backgroundcolor = bgColor;
        if (width) options.width = width;
        if (height) options.height = height;
        if (padding != null) {
          options.paddingleft = padding;
          options.paddingright = padding;
          options.paddingtop = padding;
          options.paddingbottom = padding;
          if (!bgColor) options.backgroundcolor = "ffffff";
        }

        if (format === "svg") {
          const svg = bwipjs.toSVG(options);
          const filePath = saveToTempFile("barcode", svg, "svg");
          return {
            content: [
              { type: "text" as const, text: svg },
              { type: "text" as const, text: `Saved to: ${filePath}` },
            ],
          };
        }

        const pngBuffer = await bwipjs.toBuffer(options);
        const filePath = saveToTempFile("barcode", pngBuffer, "png");
        return {
          content: [
            {
              type: "image" as const,
              data: pngBuffer.toString("base64"),
              mimeType: "image/png",
            },
            { type: "text" as const, text: `Saved to: ${filePath}` },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Failed to generate barcode: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}
