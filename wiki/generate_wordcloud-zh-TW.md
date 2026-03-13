# generate_wordcloud

從加權文字陣列生成詞雲圖片。

## 參數

| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `words` | array | 是 | — | 文字陣列（1-500 個） |
| `words[].text` | string | 是 | — | 文字內容 |
| `words[].weight` | number (>=1) | 是 | — | 權重/頻率 |
| `width` | number (100-2000) | 否 | `800` | 畫布寬度（px） |
| `height` | number (100-2000) | 否 | `600` | 畫布高度（px） |
| `format` | `"png"` \| `"svg"` | 否 | `"png"` | 輸出格式 |
| `colorScheme` | string (enum) | 否 | `"vibrant"` | 配色方案 |
| `fontFamily` | string | 否 | `"Arial"` | 字型名稱 |
| `maxFontSize` | number (10-200) | 否 | `80` | 最大字體大小 |
| `minFontSize` | number (8-50) | 否 | `12` | 最小字體大小 |

## 配色方案

| colorScheme | 色彩風格 |
|-------------|----------|
| `vibrant` | 鮮豔多彩（紅、藍、綠、橙、紫、青） |
| `ocean` | 海洋藍色系 |
| `sunset` | 日落暖色系 |
| `forest` | 森林綠色系 |
| `mono` | 灰階單色 |

## 範例

### 基本詞雲

```json
{
  "words": [
    { "text": "TypeScript", "weight": 100 },
    { "text": "JavaScript", "weight": 80 },
    { "text": "Node.js", "weight": 60 },
    { "text": "MCP", "weight": 90 },
    { "text": "React", "weight": 50 },
    { "text": "Docker", "weight": 40 }
  ]
}
```

### 自訂配色和尺寸

```json
{
  "words": [
    { "text": "人工智慧", "weight": 100 },
    { "text": "機器學習", "weight": 85 },
    { "text": "深度學習", "weight": 70 },
    { "text": "自然語言處理", "weight": 60 }
  ],
  "colorScheme": "ocean",
  "width": 1200,
  "height": 800,
  "maxFontSize": 120,
  "format": "svg"
}
```

## 輸出範例

<img src="images/wordcloud_example.svg" width="400">

*使用 vibrant 配色方案的詞雲*

## 佈局演算法

使用 d3-cloud 進行詞彙佈局：
- 權重越高的詞，字體越大
- 文字會自動旋轉（0° 或 90°）以填充空間
- 文字間自動保持 5px 間距

## 字型注意事項

- `fontFamily` 寫入 SVG 的 `font-family` 屬性
- **SVG 輸出**：字型由顯示端渲染，可用任何該環境有的字型
- **PNG 輸出**：依賴執行環境的系統字型
- Docker 環境已內建 Noto Sans CJK（中日韓字型）
