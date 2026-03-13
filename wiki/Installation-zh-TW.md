# 安裝指南

## npx（免安裝）

```bash
npx mcp-pix-tools
```

適合快速測試，每次執行會從 npm 下載最新版。

## 全域安裝

```bash
npm install -g mcp-pix-tools
mcp-pix-tools
```

安裝後可直接執行 `mcp-pix-tools` 指令。

## 專案內安裝

```bash
npm install mcp-pix-tools
```

## 啟動模式

### stdio（預設）

```bash
mcp-pix-tools
# 或明確指定
mcp-pix-tools --transport stdio
```

適用於 Claude Desktop、本地 MCP client 等透過 stdin/stdout 通訊的場景。

### HTTP（Streamable HTTP）

```bash
mcp-pix-tools --transport http --port 3100
```

啟動 HTTP server，使用 MCP Streamable HTTP transport。適用於遠端部署、Docker 環境及任何支援 HTTP 的 MCP Client。

啟動後可用端點：
- `POST /mcp` — MCP JSON-RPC 端點
- `GET /mcp` — 串流（server 主動推播）
- `DELETE /mcp` — 關閉 session
- `GET /health` — 健康檢查

## 系統需求

- Node.js >= 20
- 如需 PNG 輸出中文字型（詞雲等），系統需安裝對應字型
