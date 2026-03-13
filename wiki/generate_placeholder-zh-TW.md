# generate_placeholder

生成占位圖片，適用於線框圖和 Mockup 設計。

## 參數

| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `width` | number (1-4096) | 是 | — | 圖片寬度（px） |
| `height` | number (1-4096) | 是 | — | 圖片高度（px） |
| `bgColor` | string | 否 | `"cccccc"` | 背景顏色（6 位 hex） |
| `textColor` | string | 否 | `"666666"` | 文字顏色（6 位 hex） |
| `text` | string | 否 | `"WIDTHxHEIGHT"` | 自訂文字 |
| `format` | `"png"` \| `"svg"` | 否 | `"png"` | 輸出格式 |

## 範例

### 預設占位圖

```json
{
  "width": 800,
  "height": 600
}
```

生成 800×600 灰色背景，中間顯示「800×600」文字。

### 自訂文字和顏色

```json
{
  "width": 1200,
  "height": 400,
  "bgColor": "1a1a2e",
  "textColor": "e0e0e0",
  "text": "Hero Banner"
}
```

### 小尺寸圖示占位

```json
{
  "width": 64,
  "height": 64,
  "bgColor": "3498db",
  "textColor": "ffffff",
  "text": "Icon"
}
```

### SVG 格式

```json
{
  "width": 400,
  "height": 300,
  "format": "svg"
}
```

## 圖片特徵

- 純色背景
- 對角交叉線（半透明，視覺上標示為占位圖）
- 置中文字（字體大小自動根據圖片尺寸調整）
