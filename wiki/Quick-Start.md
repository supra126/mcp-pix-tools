# Quick Start

Get mcp-pix-tools running in under 2 minutes.

## 1. Add to your MCP client

**Claude Desktop / Cursor / Windsurf** — add to config file ([where?](MCP-Configuration)):

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

**Claude Code** — run in terminal:

```bash
claude mcp add pix-tools -- npx -y mcp-pix-tools
```

## 2. Restart your client

After saving the config, restart your MCP client to load the new server.

## 3. Try it

Ask your AI assistant:

> Generate a QR code for https://github.com

That's it. The assistant will call `generate_barcode` and return the image.

## More examples to try

| Prompt | Tool used |
|--------|-----------|
| "Generate a QR code for https://github.com" | `generate_barcode` |
| "Create a barcode for ISBN 978-0-306-40615-7" | `generate_isbn` |
| "Make a word cloud from: TypeScript 100, React 80, Node.js 60" | `generate_wordcloud` |
| "Generate a triadic color palette from #3498db" | `generate_palette` |
| "Create a 800x600 placeholder image" | `generate_placeholder` |
| "Generate an avatar for user@example.com" | `generate_identicon` |
| "Make a bar chart: Jan 120, Feb 150, Mar 180" | `generate_chart` |

## Output formats

All tools support both **PNG** and **SVG**. To get SVG output, add "in SVG format" to your prompt, or specify `"format": "svg"` in the tool parameters.

## Next steps

- [Full tool reference](Home) — parameters and advanced usage for each tool
- [Docker deployment](Docker-Deployment) — run as a remote SSE server
