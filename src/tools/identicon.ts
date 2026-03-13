import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as jdenticon from "jdenticon";
import sharp from "sharp";
import { z } from "zod";
import { saveToTempFile } from "../save.js";

export function registerIdenticonTool(server: McpServer): void {
  server.tool(
    "generate_identicon",
    "Generate a unique geometric avatar (identicon) based on a hash string. Each unique input produces a distinct, symmetric pattern.",
    {
      value: z
        .string()
        .describe("Input string (username, email, etc.) — will be hashed to generate the pattern"),
      size: z.number().min(16).max(1024).default(256).describe("Image size in px (square)"),
      format: z.enum(["png", "svg"]).default("png").describe("Output format"),
      background: z
        .string()
        .regex(/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/)
        .optional()
        .describe("Background color hex (e.g. 'ffffff' or 'ffffff00' for transparent)"),
      saturation: z.number().min(0).max(1).optional().describe("Color saturation (0.0 - 1.0)"),
    },
    async ({ value, size, format, background, saturation }) => {
      try {
        const config: jdenticon.JdenticonConfig = {};
        if (background) {
          config.backColor = `#${background}`;
        }
        if (saturation !== undefined) {
          config.hues = undefined; // use default
          config.saturation = { color: saturation };
        }

        if (format === "svg") {
          const svg = jdenticon.toSvg(value, size, config);
          const filePath = saveToTempFile("identicon", svg, "svg");
          return {
            content: [
              { type: "text" as const, text: svg },
              { type: "text" as const, text: `Saved to: ${filePath}` },
            ],
          };
        }

        // Generate SVG then convert to PNG via sharp
        const svg = jdenticon.toSvg(value, size, config);
        const pngBuffer = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
        const filePath = saveToTempFile("identicon", pngBuffer, "png");

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
              text: `Failed to generate identicon: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}
