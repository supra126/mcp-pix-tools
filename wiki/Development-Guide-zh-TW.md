# 開發指南

## 環境設置

```bash
git clone https://github.com/supra126/mcp-pix-tools.git
cd mcp-pix-tools
npm install
```

## 建置

```bash
npm run build        # 單次建置
npm run dev          # 監聽模式
```

建置產出在 `dist/` 目錄，使用 tsup 打包為 ESM 格式。

## 測試

```bash
npm test             # 執行所有測試
npm run test:watch   # 監聽模式
```

測試框架使用 vitest，測試檔案在 `tests/` 目錄。

## Lint & Format

```bash
npm run lint         # 檢查 lint 錯誤
npm run lint:fix     # 自動修復 lint 錯誤
npm run format       # 格式化所有檔案
```

使用 [Biome](https://biomejs.dev/) 統一處理 linting 和 formatting（空格縮排、雙引號、100 字元行寬）。

## 專案結構

```
src/
├── index.ts              # CLI 進入點，解析 --transport / --port
├── server.ts             # McpServer 建立 + 所有 tool 註冊
├── transports/
│   ├── stdio.ts          # stdio 傳輸
│   └── streamableHttp.ts # Streamable HTTP 傳輸
└── tools/
    ├── barcode.ts        # generate_barcode
    ├── isbn.ts           # generate_isbn
    ├── wordcloud.ts      # generate_wordcloud
    ├── palette.ts        # generate_palette
    ├── placeholder.ts    # generate_placeholder
    ├── identicon.ts      # generate_identicon
    └── chart.ts          # generate_chart
```

## 新增 Tool

1. 在 `src/tools/` 建立新檔案，例如 `my-tool.ts`
2. 匯出 `registerMyTool(server: McpServer)` 函式
3. 在 `src/server.ts` 中 import 並呼叫 register
4. 在 `tests/tools/` 中新增對應測試

範例結構：

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerMyTool(server: McpServer): void {
  server.tool(
    "my_tool_name",
    "Tool description for LLM to understand when to use it.",
    {
      param1: z.string().describe("Parameter description"),
      param2: z.number().default(100).describe("Optional with default"),
    },
    async ({ param1, param2 }) => {
      // ... 實作邏輯

      return {
        content: [
          { type: "text", text: "Result text" },
          // 或圖片:
          // { type: "image", data: base64String, mimeType: "image/png" },
        ],
      };
    },
  );
}
```

## 技術選型

| 技術 | 用途 |
|------|------|
| `@modelcontextprotocol/sdk` | MCP Server SDK |
| `zod` | Tool 參數驗證 |
| `bwip-js` | 條碼生成 |
| `sharp` | SVG → PNG 轉換 |
| `d3-cloud` | 詞雲佈局 |
| `jdenticon` | Identicon 生成 |
| `node:http` | Streamable HTTP 傳輸（內建） |
| `tsup` | TypeScript 打包 |
| `vitest` | 測試框架 |
| `biome` | Linter + Formatter |
