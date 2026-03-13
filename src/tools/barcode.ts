import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// @ts-expect-error bwip-js .d.ts uses `export =` but .mjs uses `export default`
import bwipjs from "bwip-js";
import { z } from "zod";

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
    },
    async ({ type, text, format, scale, includeText, color, bgColor, width, height }) => {
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

        if (format === "svg") {
          const svg = bwipjs.toSVG(options);
          return {
            content: [
              {
                type: "text" as const,
                text: svg,
              },
            ],
          };
        }

        const pngBuffer = await bwipjs.toBuffer(options);
        return {
          content: [
            {
              type: "image" as const,
              data: pngBuffer.toString("base64"),
              mimeType: "image/png",
            },
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
