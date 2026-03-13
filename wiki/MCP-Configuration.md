# MCP Configuration

Configuration instructions for various MCP clients.

## stdio Clients

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
| Cursor | `~/.cursor/mcp.json` (Windows: `%USERPROFILE%\.cursor\mcp.json`) |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` (Windows: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`) |
| Cline (VS Code) | Cline panel → MCP Servers → Configure MCP Servers → `cline_mcp_settings.json` |

## Claude Code

```bash
claude mcp add pix-tools -- npx -y mcp-pix-tools
```

## HTTP Clients

For remote or Docker deployments, use the Streamable HTTP transport:

```json
{
  "url": "http://localhost:3100/mcp",
  "transport": "streamable-http"
}
```

Replace `localhost:3100` with your server address as needed.
