# mcp-pix-tools

Programmatic image generation MCP tools — barcodes, word clouds, palettes, charts & more. Zero AI cost.

## 什麼是 mcp-pix-tools？

mcp-pix-tools 是一個 [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) Server，提供 7 個程式化圖片生成工具給任何 LLM 使用。

核心理念：**不依賴 AI 的圖片生成**。所有工具都是純程式碼驅動，快速、確定性、零額外成本。

## 可用工具

| 工具 | 說明 |
|------|------|
| [`generate_barcode`](generate_barcode) | 條碼生成（QR Code、Code128、EAN-13、DataMatrix 等 15 種格式） |
| [`generate_isbn`](generate_isbn) | ISBN 條碼生成 + 校驗碼驗證 + ISBN-10/13 互轉 |
| [`generate_wordcloud`](generate_wordcloud) | 詞雲生成（5 種配色方案） |
| [`generate_palette`](generate_palette) | 色票生成（6 種色彩理論方案） |
| [`generate_placeholder`](generate_placeholder) | 占位圖片（適用於線框圖、Mockup） |
| [`generate_identicon`](generate_identicon) | 基於 Hash 的幾何頭像 |
| [`generate_chart`](generate_chart) | 簡易圖表（長條圖、圓餅圖、折線圖） |

所有工具支援 **PNG**（base64）和 **SVG**（文字）兩種輸出格式。

## 快速導覽

- **[快速開始](Quick-Start-zh-TW)** — 2 分鐘內跑起來
- [安裝指南](Installation-zh-TW)
- [MCP 設定](MCP-Configuration-zh-TW)
- [Docker 部署](Docker-Deployment-zh-TW)
- [開發指南](Development-Guide-zh-TW)
