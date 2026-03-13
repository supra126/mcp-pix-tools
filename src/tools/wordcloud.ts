import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import cloud from "d3-cloud";
import sharp from "sharp";
import { z } from "zod";
import { saveToTempFile } from "../save.js";

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

/**
 * Creates a headless canvas that satisfies d3-cloud's full canvas API requirements.
 *
 * d3-cloud uses canvas for two things:
 *   1. measureText() — estimate word widths
 *   2. Sprite-based collision detection — fillText() to paint glyphs,
 *      then getImageData() to read back pixels and build bitmasks.
 *
 * This implementation approximates fillText by filling the text's bounding
 * rectangle (red channel > 0), which is sufficient for collision detection.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createHeadlessCanvas(): any {
  let _width = 1;
  let _height = 1;
  let _pixels = new Uint8ClampedArray(4);

  let _tx = 0;
  let _ty = 0;
  let _rotation = 0;
  const _stack: Array<{ tx: number; ty: number; rotation: number }> = [];

  const context = {
    font: "",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,

    save() {
      _stack.push({ tx: _tx, ty: _ty, rotation: _rotation });
    },

    restore() {
      const state = _stack.pop();
      if (state) {
        _tx = state.tx;
        _ty = state.ty;
        _rotation = state.rotation;
      }
    },

    translate(x: number, y: number) {
      _tx += x;
      _ty += y;
    },

    rotate(angle: number) {
      _rotation += angle;
    },

    measureText(text: string) {
      const match = /(\d+)px/.exec(this.font);
      const fontSize = match ? parseInt(match[1], 10) : 16;
      return { width: estimateTextWidth(text, fontSize) };
    },

    clearRect(_x: number, _y: number, _w: number, _h: number) {
      _pixels.fill(0);
    },

    fillText(text: string, x: number, _y: number) {
      const match = /(\d+)px/.exec(this.font);
      const fontSize = match ? parseInt(match[1], 10) : 16;
      const textWidth = estimateTextWidth(text, fontSize);

      // Text bounding box in local coordinates (relative to current transform).
      // Baseline is at y=0; ascent is roughly 0.8em, descent roughly 0.2em.
      const x0 = x;
      const x1 = x + textWidth;
      const y0 = -fontSize * 0.8;
      const y1 = fontSize * 0.2;

      // Rotate corners and translate to canvas coordinates.
      const cos = Math.cos(_rotation);
      const sin = Math.sin(_rotation);

      const corners = [
        [x0, y0],
        [x1, y0],
        [x0, y1],
        [x1, y1],
      ].map(([cx, cy]) => [
        Math.round(_tx + cx * cos - cy * sin),
        Math.round(_ty + cx * sin + cy * cos),
      ]);

      const minX = Math.max(0, Math.min(...corners.map((c) => c[0])));
      const maxX = Math.min(_width, Math.max(...corners.map((c) => c[0])));
      const minY = Math.max(0, Math.min(...corners.map((c) => c[1])));
      const maxY = Math.min(_height, Math.max(...corners.map((c) => c[1])));

      // Paint the red channel so d3-cloud's pixel scan detects occupation.
      for (let py = minY; py < maxY; py++) {
        for (let px = minX; px < maxX; px++) {
          const idx = (py * _width + px) << 2;
          if (idx >= 0 && idx < _pixels.length) {
            _pixels[idx] = 255;
          }
        }
      }
    },

    strokeText() {},

    getImageData(_sx: number, _sy: number, sw: number, sh: number) {
      // d3-cloud always requests the full canvas (sx=0, sy=0),
      // so we can return the buffer directly for performance.
      return { data: _pixels, width: sw, height: sh };
    },
  };

  return {
    get width() {
      return _width;
    },
    set width(w: number) {
      _width = w;
      _pixels = new Uint8ClampedArray(w * _height * 4);
    },
    get height() {
      return _height;
    },
    set height(h: number) {
      _height = h;
      _pixels = new Uint8ClampedArray(_width * h * 4);
    },
    getContext: () => context,
  };
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

        const placedWords = await new Promise<WordItem[]>((resolve, reject) => {
          const layout = cloud<{ text: string; size: number }>()
            .size([width, height])
            .words(cloudWords)
            .padding(5)
            .rotate(() => (Math.random() > 0.5 ? 0 : 90))
            .font(fontFamily)
            .fontSize((d) => d.size!)
            .canvas(createHeadlessCanvas)
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
          const filePath = saveToTempFile("wordcloud", svg, "svg");
          return {
            content: [
              { type: "text" as const, text: svg },
              { type: "text" as const, text: `Saved to: ${filePath}` },
            ],
          };
        }

        const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
        const filePath = saveToTempFile("wordcloud", pngBuffer, "png");
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
              text: `Failed to generate word cloud: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}
