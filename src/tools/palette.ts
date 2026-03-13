import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import sharp from "sharp";
import { z } from "zod";
import { saveToTempFile } from "../save.js";

interface HSL {
  h: number;
  s: number;
  l: number;
}

function hexToHSL(hex: string): HSL {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `${f(0)}${f(8)}${f(4)}`;
}

type SchemeType =
  | "complementary"
  | "analogous"
  | "triadic"
  | "tetradic"
  | "monochromatic"
  | "split-complementary";

function generateScheme(base: HSL, scheme: SchemeType, count: number): string[] {
  const colors: string[] = [];

  switch (scheme) {
    case "complementary":
      colors.push(hslToHex(base.h, base.s, base.l));
      colors.push(hslToHex((base.h + 180) % 360, base.s, base.l));
      // Fill remaining with variations
      for (let i = 2; i < count; i++) {
        const lightness = base.l + (i % 2 === 0 ? 15 : -15);
        colors.push(
          hslToHex(
            colors.length % 2 === 0 ? base.h : (base.h + 180) % 360,
            base.s,
            Math.max(10, Math.min(90, lightness)),
          ),
        );
      }
      break;

    case "analogous":
      for (let i = 0; i < count; i++) {
        const offset = (i - Math.floor(count / 2)) * 30;
        colors.push(hslToHex((base.h + offset + 360) % 360, base.s, base.l));
      }
      break;

    case "triadic":
      for (let i = 0; i < count; i++) {
        const hue = (base.h + (i % 3) * 120) % 360;
        const lightness = base.l + Math.floor(i / 3) * (i % 2 === 0 ? 10 : -10);
        colors.push(hslToHex(hue, base.s, Math.max(10, Math.min(90, lightness))));
      }
      break;

    case "tetradic":
      for (let i = 0; i < count; i++) {
        const hue = (base.h + (i % 4) * 90) % 360;
        const lightness = base.l + Math.floor(i / 4) * (i % 2 === 0 ? 10 : -10);
        colors.push(hslToHex(hue, base.s, Math.max(10, Math.min(90, lightness))));
      }
      break;

    case "monochromatic":
      for (let i = 0; i < count; i++) {
        const lightness = 15 + (i * 70) / (count - 1 || 1);
        colors.push(hslToHex(base.h, base.s, lightness));
      }
      break;

    case "split-complementary":
      colors.push(hslToHex(base.h, base.s, base.l));
      colors.push(hslToHex((base.h + 150) % 360, base.s, base.l));
      colors.push(hslToHex((base.h + 210) % 360, base.s, base.l));
      for (let i = 3; i < count; i++) {
        const lightness = base.l + (i % 2 === 0 ? 15 : -15);
        colors.push(
          hslToHex((base.h + (i % 3) * 150) % 360, base.s, Math.max(10, Math.min(90, lightness))),
        );
      }
      break;
  }

  return colors.slice(0, count);
}

function generatePaletteSVG(colors: string[], swatchSize: number): string {
  const padding = 10;
  const labelHeight = 30;
  const cols = Math.min(colors.length, 6);
  const rows = Math.ceil(colors.length / cols);
  const width = cols * (swatchSize + padding) + padding;
  const height = rows * (swatchSize + labelHeight + padding) + padding;

  const swatches = colors
    .map((hex, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + col * (swatchSize + padding);
      const y = padding + row * (swatchSize + labelHeight + padding);
      return `
    <rect x="${x}" y="${y}" width="${swatchSize}" height="${swatchSize}" rx="8" fill="#${hex}" stroke="#ccc" stroke-width="1"/>
    <text x="${x + swatchSize / 2}" y="${y + swatchSize + 20}" text-anchor="middle" font-family="monospace" font-size="12" fill="#333">#${hex.toUpperCase()}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#fafafa" rx="12"/>
  ${swatches}
</svg>`;
}

export function registerPaletteTool(server: McpServer): void {
  server.tool(
    "generate_palette",
    "Generate a color palette/swatch card from a base color using color theory schemes (complementary, analogous, triadic, etc.).",
    {
      baseColor: z
        .string()
        .regex(/^#?[0-9a-fA-F]{6}$/)
        .describe("Base color in hex (e.g. '#3498db' or '3498db')"),
      scheme: z
        .enum([
          "complementary",
          "analogous",
          "triadic",
          "tetradic",
          "monochromatic",
          "split-complementary",
        ])
        .default("analogous")
        .describe("Color harmony scheme"),
      count: z.number().min(2).max(12).default(5).describe("Number of colors to generate"),
      format: z.enum(["png", "svg"]).default("png").describe("Output format"),
      swatchSize: z.number().min(40).max(200).default(100).describe("Swatch square size in px"),
    },
    async ({ baseColor, scheme, count, format, swatchSize }) => {
      try {
        const hex = baseColor.replace("#", "");
        const hsl = hexToHSL(hex);
        const colors = generateScheme(hsl, scheme, count);

        const colorList = colors.map((c, i) => `${i + 1}. #${c.toUpperCase()}`).join("\n");

        const svg = generatePaletteSVG(colors, swatchSize);

        const content: Array<
          { type: "text"; text: string } | { type: "image"; data: string; mimeType: string }
        > = [];

        content.push({
          type: "text" as const,
          text: `Palette: ${scheme} from #${hex.toUpperCase()}\n${colorList}`,
        });

        if (format === "svg") {
          const filePath = saveToTempFile("palette", svg, "svg");
          content.push({ type: "text" as const, text: svg });
          content.push({ type: "text" as const, text: `Saved to: ${filePath}` });
        } else {
          const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
          const filePath = saveToTempFile("palette", pngBuffer, "png");
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
              text: `Failed to generate palette: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}
