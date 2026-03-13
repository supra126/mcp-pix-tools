# mcp-pix-tools

Programmatic image generation MCP tools — barcodes, word clouds, palettes, charts & more. Zero AI cost.

[![npm version](https://img.shields.io/npm/v/mcp-pix-tools.svg)](https://www.npmjs.com/package/mcp-pix-tools)
[![Node.js](https://img.shields.io/node/v/mcp-pix-tools.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GHCR](https://img.shields.io/badge/GHCR-available-blue?logo=docker)](https://ghcr.io/supra126/mcp-pix-tools)

**[Documentation](https://github.com/supra126/mcp-pix-tools/wiki)** · **[繁體中文](https://github.com/supra126/mcp-pix-tools/wiki/Home-zh-TW)**

## What is this?

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that provides programmatic image generation tools to any LLM. No AI image generation — just fast, deterministic, code-driven visuals.

### Highlights

- **7 tools** — barcodes (15+ types), ISBN, word clouds, color palettes, placeholders, identicons, charts
- **Dual transport** — stdio for local clients, SSE for remote/Docker
- **PNG + SVG** — all tools output base64 PNG or SVG text
- **Zero canvas dependency** — no native `canvas` module required
- **CJK ready** — Docker image includes CJK fonts for word clouds and charts

## Available Tools

| Tool | Description |
|------|-------------|
| `generate_barcode` | QR Code, Code128, EAN-13, EAN-8, DataMatrix, PDF417, and more |
| `generate_isbn` | ISBN-10/13 barcode with validation and format conversion |
| `generate_wordcloud` | Word cloud from weighted word lists |
| `generate_palette` | Color palettes using color theory (complementary, analogous, triadic, etc.) |
| `generate_placeholder` | Placeholder images for wireframes and mockups |
| `generate_identicon` | Unique geometric avatars from hash strings |
| `generate_chart` | Bar, pie, and line charts from data |

## Quick Start

### npx (no install)

```bash
npx mcp-pix-tools
```

### Global install

```bash
npm install -g mcp-pix-tools
mcp-pix-tools
```

### SSE mode (for remote/Docker deployment)

```bash
mcp-pix-tools --transport sse --port 3100
```

## MCP Client Configuration

Add the following JSON to your client's MCP config file:

```json
{
  "mcpServers": {
    "pix-tools": {
      "command": "npx",
      "args": ["-y", "mcp-pix-tools"]
    }
  }
}
```

| Client | Config file |
|--------|-------------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) · `%APPDATA%\Claude\claude_desktop_config.json` (Windows) |
| Cursor | `~/.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Cline (VS Code) | Cline panel → MCP Servers → `cline_mcp_settings.json` |

**Claude Code:**

```bash
claude mcp add pix-tools -- npx -y mcp-pix-tools
```

**SSE (remote/Docker):**

```json
{
  "url": "http://localhost:3100/sse",
  "transport": "sse"
}
```

## Docker

### GHCR (recommended)

```bash
docker pull ghcr.io/supra126/mcp-pix-tools:latest
docker run -p 3100:3100 ghcr.io/supra126/mcp-pix-tools:latest
```

### Docker Compose

```bash
docker compose up -d
```

### Build locally

```bash
docker build -t mcp-pix-tools .
docker run -p 3100:3100 mcp-pix-tools
```

## Tool Examples

<details>
<summary><strong>generate_barcode</strong> — QR Code</summary>

```json
{
  "type": "qrcode",
  "text": "https://example.com",
  "format": "png",
  "scale": 5
}
```
</details>

<details>
<summary><strong>generate_isbn</strong> — ISBN-13 barcode</summary>

```json
{
  "isbn": "9780134685991",
  "format": "png"
}
```
</details>

<details>
<summary><strong>generate_wordcloud</strong> — Word cloud</summary>

```json
{
  "words": [
    { "text": "TypeScript", "weight": 100 },
    { "text": "JavaScript", "weight": 80 },
    { "text": "Node.js", "weight": 60 },
    { "text": "MCP", "weight": 90 }
  ],
  "colorScheme": "ocean",
  "format": "png"
}
```
</details>

<details>
<summary><strong>generate_palette</strong> — Triadic color palette</summary>

```json
{
  "baseColor": "#3498db",
  "scheme": "triadic",
  "count": 6,
  "format": "png"
}
```
</details>

<details>
<summary><strong>generate_placeholder</strong> — Placeholder image</summary>

```json
{
  "width": 800,
  "height": 600,
  "bgColor": "e0e0e0",
  "text": "Hero Image",
  "format": "png"
}
```
</details>

<details>
<summary><strong>generate_identicon</strong> — Geometric avatar</summary>

```json
{
  "value": "user@example.com",
  "size": 256,
  "format": "png"
}
```
</details>

<details>
<summary><strong>generate_chart</strong> — Pie chart</summary>

```json
{
  "type": "pie",
  "data": [
    { "label": "Chrome", "value": 65 },
    { "label": "Firefox", "value": 15 },
    { "label": "Safari", "value": 12 },
    { "label": "Other", "value": 8 }
  ],
  "title": "Browser Market Share",
  "format": "png"
}
```
</details>

## Development

```bash
git clone https://github.com/supra126/mcp-pix-tools.git
cd mcp-pix-tools
npm install
npm run build
npm test
npm run lint
```

## License

MIT
