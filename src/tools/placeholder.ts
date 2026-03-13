import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import sharp from "sharp";
import { z } from "zod";
import { saveToTempFile } from "../save.js";

function generatePlaceholderSVG(
  width: number,
  height: number,
  bgColor: string,
  textColor: string,
  text: string,
): string {
  const fontSize = Math.max(12, Math.min(width, height) / 8);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#${bgColor}"/>
  <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="#${textColor}" stroke-opacity="0.15" stroke-width="2"/>
  <line x1="${width}" y1="0" x2="0" y2="${height}" stroke="#${textColor}" stroke-opacity="0.15" stroke-width="2"/>
  <text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" fill="#${textColor}">${escapeXml(text)}</text>
</svg>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function registerPlaceholderTool(server: McpServer): void {
  server.tool(
    "generate_placeholder",
    "Generate a placeholder image with dimensions label and optional custom text. Useful for wireframes and mockups.",
    {
      width: z.number().min(1).max(4096).describe("Image width in px"),
      height: z.number().min(1).max(4096).describe("Image height in px"),
      bgColor: z
        .string()
        .regex(/^[0-9a-fA-F]{6}$/)
        .default("cccccc")
        .describe("Background color hex (e.g. 'cccccc')"),
      textColor: z
        .string()
        .regex(/^[0-9a-fA-F]{6}$/)
        .default("666666")
        .describe("Text color hex (e.g. '666666')"),
      text: z.string().optional().describe("Custom text (defaults to 'WIDTHxHEIGHT')"),
      format: z.enum(["png", "svg"]).default("png").describe("Output format"),
    },
    async ({ width, height, bgColor, textColor, text, format }) => {
      try {
        const displayText = text ?? `${width}×${height}`;
        const svg = generatePlaceholderSVG(width, height, bgColor, textColor, displayText);

        if (format === "svg") {
          const filePath = saveToTempFile("placeholder", svg, "svg");
          return {
            content: [
              { type: "text" as const, text: svg },
              { type: "text" as const, text: `Saved to: ${filePath}` },
            ],
          };
        }

        const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
        const filePath = saveToTempFile("placeholder", pngBuffer, "png");
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
              text: `Failed to generate placeholder: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}
