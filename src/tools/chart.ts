import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import sharp from "sharp";
import { z } from "zod";
import { saveToTempFile } from "../save.js";

const DEFAULT_COLORS = [
  "#3498db",
  "#e74c3c",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#34495e",
  "#16a085",
  "#c0392b",
];

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface ChartDataItem {
  label: string;
  value: number;
}

function generateBarChartSVG(
  data: ChartDataItem[],
  title: string,
  width: number,
  height: number,
  colors: string[],
): string {
  const margin = { top: 40, right: 20, bottom: 60, left: 60 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(1, Math.min(60, chartW / data.length - 10));
  const barGap = Math.max(0, (chartW - barWidth * data.length) / (data.length + 1));

  // Y-axis ticks
  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((maxVal / tickCount) * i),
  );

  const bars = data
    .map((d, i) => {
      const x = margin.left + barGap + i * (barWidth + barGap);
      const barH = (d.value / maxVal) * chartH;
      const y = margin.top + chartH - barH;
      const color = colors[i % colors.length];
      const valueLabel =
        d.value > 0
          ? `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="10" font-family="Arial" fill="#333">${d.value}</text>`
          : "";
      return `
    <rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(barH, 1)}" fill="${color}" rx="3"/>
    <text x="${x + barWidth / 2}" y="${margin.top + chartH + 20}" text-anchor="middle" font-size="11" font-family="Arial" fill="#555">${escapeXml(d.label)}</text>
    ${valueLabel}`;
    })
    .join("");

  const gridLines = yTicks
    .map((tick) => {
      const y = margin.top + chartH - (tick / maxVal) * chartH;
      return `
    <line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" stroke="#eee" stroke-width="1"/>
    <text x="${margin.left - 8}" y="${y + 4}" text-anchor="end" font-size="10" font-family="Arial" fill="#888">${tick}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="white"/>
  <text x="${width / 2}" y="25" text-anchor="middle" font-size="16" font-weight="bold" font-family="Arial" fill="#333">${escapeXml(title)}</text>
  ${gridLines}
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#ccc" stroke-width="1"/>
  <line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#ccc" stroke-width="1"/>
  ${bars}
</svg>`;
}

function generatePieChartSVG(
  data: ChartDataItem[],
  title: string,
  width: number,
  height: number,
  colors: string[],
): string {
  const cx = width / 2;
  const cy = height / 2 + 15;
  const radius = Math.min(width, height) / 2 - 60;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    // All values are zero — render a grey placeholder circle with labels
    const sliceLabels = data
      .map((d, i) => {
        const angle = -Math.PI / 2 + ((i + 0.5) / data.length) * 2 * Math.PI;
        const labelR = radius + 25;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        return `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="10" font-family="Arial" fill="#333">${escapeXml(d.label)} (0.0%)</text>`;
      })
      .join("\n  ");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="white"/>
  <text x="${width / 2}" y="25" text-anchor="middle" font-size="16" font-weight="bold" font-family="Arial" fill="#333">${escapeXml(title)}</text>
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#eee" stroke="white" stroke-width="2"/>
  <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12" font-family="Arial" fill="#999">No data</text>
  ${sliceLabels}
</svg>`;
  }

  let startAngle = -Math.PI / 2;
  const slices = data
    .map((d, i) => {
      const fraction = d.value / total;
      const endAngle = startAngle + fraction * 2 * Math.PI;

      const color = colors[i % colors.length];

      // Skip zero-value slices — degenerate arcs with identical start/end points
      if (fraction === 0) {
        startAngle = endAngle;
        return "";
      }

      // Label position
      const midAngle = (startAngle + endAngle) / 2;
      const labelR = radius + 25;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);

      const label = `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="10" font-family="Arial" fill="#333">${escapeXml(d.label)} (${(fraction * 100).toFixed(1)}%)</text>`;

      let path: string;
      if (fraction >= 1) {
        // Full circle — SVG arc from a point to itself is degenerate, use circle instead
        path = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" stroke="white" stroke-width="2"/>`;
      } else {
        const largeArc = fraction > 0.5 ? 1 : 0;
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);
        path = `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}" stroke="white" stroke-width="2"/>`;
      }

      startAngle = endAngle;
      return path + label;
    })
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="white"/>
  <text x="${width / 2}" y="25" text-anchor="middle" font-size="16" font-weight="bold" font-family="Arial" fill="#333">${escapeXml(title)}</text>
  ${slices}
</svg>`;
}

function generateLineChartSVG(
  data: ChartDataItem[],
  title: string,
  width: number,
  height: number,
  colors: string[],
): string {
  const margin = { top: 40, right: 20, bottom: 60, left: 60 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const stepX = chartW / (data.length - 1 || 1);

  const points = data.map((d, i) => {
    const x = margin.left + i * stepX;
    const y = margin.top + chartH - (d.value / maxVal) * chartH;
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const color = colors[0];

  // Area fill
  const areaPath = `M ${points[0].x} ${margin.top + chartH} ${points.map((p) => `L ${p.x} ${p.y}`).join(" ")} L ${points[points.length - 1].x} ${margin.top + chartH} Z`;

  const dots = points
    .map(
      (p) =>
        `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" stroke="white" stroke-width="2"/>
    <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" font-size="10" font-family="Arial" fill="#333">${p.value}</text>`,
    )
    .join("\n  ");

  const labels = points
    .map(
      (p) =>
        `<text x="${p.x}" y="${margin.top + chartH + 20}" text-anchor="middle" font-size="11" font-family="Arial" fill="#555">${escapeXml(p.label)}</text>`,
    )
    .join("\n  ");

  // Y-axis ticks
  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((maxVal / tickCount) * i),
  );
  const gridLines = yTicks
    .map((tick) => {
      const y = margin.top + chartH - (tick / maxVal) * chartH;
      return `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" stroke="#eee" stroke-width="1"/>
    <text x="${margin.left - 8}" y="${y + 4}" text-anchor="end" font-size="10" font-family="Arial" fill="#888">${tick}</text>`;
    })
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="white"/>
  <text x="${width / 2}" y="25" text-anchor="middle" font-size="16" font-weight="bold" font-family="Arial" fill="#333">${escapeXml(title)}</text>
  ${gridLines}
  <path d="${areaPath}" fill="${color}" fill-opacity="0.1"/>
  <polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>
  ${dots}
  ${labels}
  <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#ccc" stroke-width="1"/>
  <line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#ccc" stroke-width="1"/>
</svg>`;
}

export function registerChartTool(server: McpServer): void {
  server.tool(
    "generate_chart",
    "Generate simple charts (bar, pie, line) from data. Pure SVG rendering, no external chart library needed.",
    {
      type: z.enum(["bar", "pie", "line"]).describe("Chart type"),
      data: z
        .array(
          z.object({
            label: z.string().describe("Data point label"),
            value: z.number().min(0).describe("Data point value"),
          }),
        )
        .min(1)
        .max(50)
        .describe("Chart data points"),
      title: z.string().default("Chart").describe("Chart title"),
      width: z.number().min(200).max(2000).default(600).describe("Chart width in px"),
      height: z.number().min(200).max(2000).default(400).describe("Chart height in px"),
      format: z.enum(["png", "svg"]).default("png").describe("Output format"),
      colors: z
        .array(z.string().regex(/^#[0-9a-fA-F]{6}$/))
        .optional()
        .describe("Custom color array (hex with #, e.g. ['#3498db', '#e74c3c'])"),
    },
    async ({ type, data, title, width, height, format, colors }) => {
      try {
        const palette = colors && colors.length > 0 ? colors : DEFAULT_COLORS;

        let svg: string;
        switch (type) {
          case "bar":
            svg = generateBarChartSVG(data, title, width, height, palette);
            break;
          case "pie":
            svg = generatePieChartSVG(data, title, width, height, palette);
            break;
          case "line":
            svg = generateLineChartSVG(data, title, width, height, palette);
            break;
          default: {
            const _exhaustive: never = type;
            throw new Error(`Unknown chart type: ${_exhaustive}`);
          }
        }

        if (format === "svg") {
          const filePath = saveToTempFile("chart", svg, "svg");
          return {
            content: [
              { type: "text" as const, text: svg },
              { type: "text" as const, text: `Saved to: ${filePath}` },
            ],
          };
        }

        const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
        const filePath = saveToTempFile("chart", pngBuffer, "png");
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
              text: `Failed to generate chart: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}
