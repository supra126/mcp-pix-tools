import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import cloud from "d3-cloud";
import sharp from "sharp";
import { z } from "zod";

const COLOR_SCHEMES: Record<string, string[]> = {
  vibrant: ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c"],
  ocean: ["#0077b6", "#00b4d8", "#90e0ef", "#023e8a", "#0096c7", "#48cae4"],
  sunset: ["#ff6b6b", "#ffa06b", "#ffd93d", "#ff8a5c", "#ea5455", "#f9c74f"],
  forest: ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2", "#b7e4c7"],
  mono: ["#212529", "#495057", "#6c757d", "#adb5bd", "#343a40", "#868e96"],
};

interface WordItem {
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  font: string;
}

function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.6;
}

function generateWordCloudSVG(
  words: WordItem[],
  width: number,
  height: number,
  colors: string[],
): string {
  const wordElements = words
    .map((w, i) => {
      const color = colors[i % colors.length];
      return `<text text-anchor="middle" transform="translate(${w.x},${w.y}) rotate(${w.rotate})" font-size="${w.size}" font-family="${escapeXml(w.font)}" fill="${color}">${escapeXml(w.text)}</text>`;
    })
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g transform="translate(${width / 2},${height / 2})">
    ${wordElements}
  </g>
</svg>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function registerWordcloudTool(server: McpServer): void {
  server.tool(
    "generate_wordcloud",
    "Generate a word cloud image from weighted words. Returns PNG (base64) or SVG.",
    {
      words: z
        .array(
          z.object({
            text: z.string().describe("Word text"),
            weight: z.number().min(1).describe("Word weight/frequency"),
          }),
        )
        .min(1)
        .max(500)
        .describe("Array of words with weights"),
      width: z.number().min(100).max(2000).default(800).describe("Canvas width in px"),
      height: z.number().min(100).max(2000).default(600).describe("Canvas height in px"),
      format: z.enum(["png", "svg"]).default("png").describe("Output format"),
      colorScheme: z
        .enum(["vibrant", "ocean", "sunset", "forest", "mono"])
        .default("vibrant")
        .describe("Color scheme for words"),
      fontFamily: z.string().default("Arial").describe("Font family name"),
      maxFontSize: z.number().min(10).max(200).default(80).describe("Maximum font size"),
      minFontSize: z.number().min(8).max(50).default(12).describe("Minimum font size"),
    },
    async ({ words, width, height, format, colorScheme, fontFamily, maxFontSize, minFontSize }) => {
      try {
        const colors = COLOR_SCHEMES[colorScheme];
        const maxWeight = Math.max(...words.map((w) => w.weight));
        const minWeight = Math.min(...words.map((w) => w.weight));
        const weightRange = maxWeight - minWeight || 1;

        const cloudWords = words.map((w) => ({
          text: w.text,
          size: minFontSize + ((w.weight - minWeight) / weightRange) * (maxFontSize - minFontSize),
        }));

        // Create a fake canvas context for d3-cloud text measurement
        // d3-cloud needs canvas.getContext("2d").measureText()
        let currentFontSize = 16;
        const fakeContext = {
          font: "",
          measureText(text: string) {
            // Parse font size from the CSS font string that d3-cloud sets
            const match = /(\d+)px/.exec(this.font);
            if (match) currentFontSize = parseInt(match[1], 10);
            return { width: estimateTextWidth(text, currentFontSize) };
          },
        };
        const fakeCanvas = {
          getContext: () => fakeContext,
        };

        const placedWords = await new Promise<WordItem[]>((resolve, reject) => {
          const layout = cloud<{ text: string; size: number }>()
            .size([width, height])
            .words(cloudWords)
            .padding(5)
            .rotate(() => (Math.random() > 0.5 ? 0 : 90))
            .font(fontFamily)
            .fontSize((d) => d.size!)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .canvas(() => fakeCanvas as any)
            .on(
              "end",
              (
                output: Array<{
                  text?: string;
                  size?: number;
                  x?: number;
                  y?: number;
                  rotate?: number;
                }>,
              ) => {
                resolve(
                  output.map((w) => ({
                    text: w.text!,
                    size: w.size!,
                    x: w.x!,
                    y: w.y!,
                    rotate: w.rotate!,
                    font: fontFamily,
                  })),
                );
              },
            );

          try {
            layout.start();
          } catch (e) {
            reject(e);
          }
        });

        if (placedWords.length === 0) {
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: "Word cloud layout produced no visible words. Try reducing font sizes or increasing canvas dimensions.",
              },
            ],
          };
        }

        const svg = generateWordCloudSVG(placedWords, width, height, colors);

        if (format === "svg") {
          return {
            content: [{ type: "text" as const, text: svg }],
          };
        }

        const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
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
              text: `Failed to generate word cloud: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}
