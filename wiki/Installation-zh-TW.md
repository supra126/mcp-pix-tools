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

### SSE（Server-Sent Events）

```bash
mcp-pix-tools --transport sse --port 3100
```

啟動 HTTP server，提供 SSE 端點。適用於遠端部署、Docker 環境及任何支援 SSE 的 MCP Client。

啟動後可用端點：
- `GET /sse` — SSE 連線端點
- `POST /messages?sessionId=xxx` — 訊息端點
- `GET /health` — 健康檢查

## 系統需求

- Node.js >= 18
- 如需 PNG 輸出中文字型（詞雲等），系統需安裝對應字型
