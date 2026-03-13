# MCP 設定

各 MCP Client 的設定方式。

## stdio Client

將以下 JSON 加入你的 MCP 設定檔：

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

| Client | 設定檔位置 |
|--------|-----------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json`（macOS）· `%APPDATA%\Claude\claude_desktop_config.json`（Windows） |
| Cursor | `~/.cursor/mcp.json`（Windows: `%USERPROFILE%\.cursor\mcp.json`） |
| Windsurf | `~/.codeium/windsurf/mcp_config.json`（Windows: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`） |
| Cline（VS Code） | Cline 面板 → MCP Servers → Configure MCP Servers → `cline_mcp_settings.json` |

## Claude Code

```bash
claude mcp add pix-tools -- npx -y mcp-pix-tools
```

## SSE Client

適用於遠端或 Docker 部署：

```json
{
  "url": "http://localhost:3100/sse",
  "transport": "sse"
}
```

請將 `localhost:3100` 替換為你的伺服器位址。
