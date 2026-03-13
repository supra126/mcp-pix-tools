# mcp-pix-tools

> [繁體中文版](Home-zh-TW)

Programmatic image generation MCP tools — barcodes, word clouds, palettes, charts & more. Zero AI cost.

## What is mcp-pix-tools?

mcp-pix-tools is an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) Server that provides 7 programmatic image generation tools for any LLM.

Core philosophy: **AI-free image generation**. All tools are purely code-driven — fast, deterministic, and at zero additional cost.

## Available Tools

| Tool | Description |
|------|-------------|
| [`generate_barcode`](generate_barcode) | Barcode generation (QR Code, Code128, EAN-13, DataMatrix, and 15 formats total) |
| [`generate_isbn`](generate_isbn) | ISBN barcode generation + check digit validation + ISBN-10/13 conversion |
| [`generate_wordcloud`](generate_wordcloud) | Word cloud generation (5 color schemes) |
| [`generate_palette`](generate_palette) | Color palette/swatch generation (6 color theory schemes) |
| [`generate_placeholder`](generate_placeholder) | Placeholder images (for wireframes and mockups) |
| [`generate_identicon`](generate_identicon) | Hash-based geometric avatars |
| [`generate_chart`](generate_chart) | Simple charts (bar, pie, and line) |

All tools support both **PNG** (base64) and **SVG** (text) output formats.

## Quick Navigation

- **[Quick Start](Quick-Start)** — up and running in 2 minutes
- [Installation](Installation)
- [MCP Configuration](MCP-Configuration)
- [Docker Deployment](Docker-Deployment)
- [Development Guide](Development-Guide)
