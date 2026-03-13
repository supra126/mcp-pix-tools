# 快速開始

2 分鐘內讓 mcp-pix-tools 跑起來。

## 1. 加入你的 MCP Client

**Claude Desktop / Cursor / Windsurf** — 加入設定檔（[在哪裡？](MCP-Configuration-zh-TW)）：

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

**Claude Code** — 在終端執行：

```bash
claude mcp add pix-tools -- npx -y mcp-pix-tools
```

## 2. 重啟 Client

儲存設定後，重啟你的 MCP Client 以載入新的 server。

## 3. 試試看

對 AI 助手說：

> 幫我生成一個 QR Code，內容是 https://github.com

完成。助手會呼叫 `generate_barcode` 並回傳圖片。

## 更多範例

| 提示 | 使用的工具 |
|------|-----------|
| 「幫我生成 https://github.com 的 QR Code」 | `generate_barcode` |
| 「產生 ISBN 978-0-306-40615-7 的條碼」 | `generate_isbn` |
| 「用這些詞做一個詞雲：TypeScript 100、React 80、Node.js 60」 | `generate_wordcloud` |
| 「從 #3498db 產生三等分配色」 | `generate_palette` |
| 「建立一個 800x600 的占位圖」 | `generate_placeholder` |
| 「幫 user@example.com 生成頭像」 | `generate_identicon` |
| 「畫一個長條圖：一月 120、二月 150、三月 180」 | `generate_chart` |

## 輸出格式

所有工具都支援 **PNG** 和 **SVG**。要取得 SVG 輸出，在提示中加上「SVG 格式」，或在工具參數中指定 `"format": "svg"`。

## 下一步

- [完整工具參考](Home-zh-TW) — 每個工具的參數和進階用法
- [Docker 部署](Docker-Deployment-zh-TW) — 作為遠端 SSE server 執行
