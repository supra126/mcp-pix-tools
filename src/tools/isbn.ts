import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// @ts-expect-error bwip-js .d.ts uses `export =` but .mjs uses `export default`
import bwipjs from "bwip-js";
import { z } from "zod";
import { saveToTempFile } from "../save.js";

function validateISBN10(isbn: string): boolean {
  if (isbn.length !== 10) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const d = parseInt(isbn[i], 10);
    if (Number.isNaN(d)) return false;
    sum += d * (10 - i);
  }
  const last = isbn[9].toUpperCase();
  const lastVal = last === "X" ? 10 : parseInt(last, 10);
  if (Number.isNaN(lastVal)) return false;
  sum += lastVal;
  return sum % 11 === 0;
}

function validateISBN13(isbn: string): boolean {
  if (isbn.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const d = parseInt(isbn[i], 10);
    if (Number.isNaN(d)) return false;
    sum += d * (i % 2 === 0 ? 1 : 3);
  }
  return sum % 10 === 0;
}

function isbn10to13(isbn10: string): string {
  const base = `978${isbn10.slice(0, 9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return base + check;
}

function isbn13to10(isbn13: string): string | null {
  if (!isbn13.startsWith("978")) return null;
  const base = isbn13.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(base[i], 10) * (10 - i);
  }
  const check = (11 - (sum % 11)) % 11;
  return base + (check === 10 ? "X" : String(check));
}

export function registerIsbnTool(server: McpServer): void {
  server.tool(
    "generate_isbn",
    "Generate ISBN barcode with validation and ISBN-10/13 conversion. Returns barcode image + metadata.",
    {
      isbn: z.string().describe("ISBN-10 or ISBN-13 (digits only, no dashes)"),
      format: z.enum(["png", "svg"]).default("png").describe("Output format"),
      scale: z.number().min(1).max(10).default(3).describe("Scale factor"),
      includeText: z.boolean().default(true).describe("Show ISBN text below barcode"),
      bgColor: z
        .string()
        .regex(/^[0-9a-fA-F]{6}$/)
        .optional()
        .describe("Background color in hex (e.g. 'ffffff')"),
      padding: z
        .number()
        .min(0)
        .max(20)
        .optional()
        .describe(
          "Quiet-zone padding around the barcode (in barcode module-width units, 0-20). When set, a white background is automatically applied.",
        ),
    },
    async ({ isbn, format, scale, includeText, bgColor, padding }) => {
      const cleaned = isbn.replace(/[-\s]/g, "");

      // Validate structure: ISBN-10 allows digits + trailing X, ISBN-13 is digits only
      if (!/^[0-9]{9}[0-9Xx]$/.test(cleaned) && !/^[0-9]{13}$/.test(cleaned)) {
        const reason =
          cleaned.length !== 10 && cleaned.length !== 13
            ? `Invalid ISBN length: ${cleaned.length}. Expected 10 or 13 digits.`
            : `Invalid ISBN characters. Expected digits only${cleaned.length === 10 ? " (trailing X allowed for ISBN-10)" : ""}.`;
        return {
          isError: true,
          content: [{ type: "text" as const, text: reason }],
        };
      }

      const isISBN10 = cleaned.length === 10;

      try {
        const isValid = isISBN10 ? validateISBN10(cleaned) : validateISBN13(cleaned);

        // Convert between formats
        let isbn10: string | null = null;
        let isbn13: string;

        if (isISBN10) {
          isbn10 = cleaned;
          isbn13 = isbn10to13(cleaned);
        } else {
          isbn13 = cleaned;
          isbn10 = isbn13to10(cleaned);
        }

        // Build metadata
        const meta = [
          `ISBN Input: ${isbn}`,
          `Valid: ${isValid ? "Yes" : "No — check digit mismatch"}`,
          `ISBN-13: ${isbn13}`,
          isbn10 ? `ISBN-10: ${isbn10}` : `ISBN-10: N/A (not a 978 prefix)`,
        ];

        if (!isValid) {
          meta.push("⚠ Barcode generated with provided digits. The check digit may be incorrect.");
        }

        // Generate barcode using EAN-13 encoding (ISBN-13 is a subset of EAN-13)
        // bwip-js EAN-13 expects 12 digits and computes the check digit itself
        const bcid = "ean13";
        const barcodeText = isbn13.slice(0, 12);

        const options: bwipjs.RenderOptions = {
          bcid,
          text: barcodeText,
          scale,
          includetext: includeText,
          textxalign: "center",
          guardwhitespace: true,
        };
        if (bgColor) options.backgroundcolor = bgColor;
        if (padding != null) {
          options.paddingleft = padding;
          options.paddingright = padding;
          options.paddingtop = padding;
          options.paddingbottom = padding;
          if (!bgColor) options.backgroundcolor = "ffffff";
        }

        const content: Array<
          { type: "text"; text: string } | { type: "image"; data: string; mimeType: string }
        > = [];

        content.push({ type: "text" as const, text: meta.join("\n") });

        if (format === "svg") {
          const svg = bwipjs.toSVG(options);
          const filePath = saveToTempFile("isbn", svg, "svg");
          content.push({ type: "text" as const, text: svg });
          content.push({ type: "text" as const, text: `Saved to: ${filePath}` });
        } else {
          const pngBuffer = await bwipjs.toBuffer(options);
          const filePath = saveToTempFile("isbn", pngBuffer, "png");
          content.push({
            type: "image" as const,
            data: pngBuffer.toString("base64"),
            mimeType: "image/png",
          });
          content.push({ type: "text" as const, text: `Saved to: ${filePath}` });
        }

        return { content };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Failed to generate ISBN barcode: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}
