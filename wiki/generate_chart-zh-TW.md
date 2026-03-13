# generate_chart

從數據生成簡易圖表。支援長條圖、圓餅圖、折線圖。

## 參數

| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `type` | `"bar"` \| `"pie"` \| `"line"` | 是 | — | 圖表類型 |
| `data` | array (1-50) | 是 | — | 數據點陣列 |
| `data[].label` | string | 是 | — | 數據標籤 |
| `data[].value` | number | 是 | — | 數據值 |
| `title` | string | 否 | `"Chart"` | 圖表標題 |
| `width` | number (200-2000) | 否 | `600` | 圖表寬度（px） |
| `height` | number (200-2000) | 否 | `400` | 圖表高度（px） |
| `format` | `"png"` \| `"svg"` | 否 | `"png"` | 輸出格式 |
| `colors` | string[] | 否 | 內建 10 色 | 自訂色彩陣列（hex 含 #） |

## 圖表類型

### 長條圖 (bar)

- 垂直長條，每個數據點一條
- 自動 Y 軸刻度和格線
- 數值標示在長條頂部
- 標籤在 X 軸下方

### 圓餅圖 (pie)

- 每個數據點為一個扇形
- 標籤顯示名稱和百分比
- 自動計算各項佔比

### 折線圖 (line)

- 數據點以折線連接
- 含半透明填充區域
- 每個數據點有圓點標記和數值標示

## 範例

### 長條圖

```json
{
  "type": "bar",
  "title": "月營收",
  "data": [
    { "label": "一月", "value": 120 },
    { "label": "二月", "value": 150 },
    { "label": "三月", "value": 180 },
    { "label": "四月", "value": 90 },
    { "label": "五月", "value": 200 }
  ]
}
```

### 圓餅圖

```json
{
  "type": "pie",
  "title": "瀏覽器市佔率",
  "data": [
    { "label": "Chrome", "value": 65 },
    { "label": "Firefox", "value": 15 },
    { "label": "Safari", "value": 12 },
    { "label": "Edge", "value": 5 },
    { "label": "其他", "value": 3 }
  ],
  "width": 500,
  "height": 500
}
```

### 折線圖（自訂顏色）

```json
{
  "type": "line",
  "title": "每日活躍使用者",
  "data": [
    { "label": "Mon", "value": 1200 },
    { "label": "Tue", "value": 1350 },
    { "label": "Wed", "value": 1100 },
    { "label": "Thu", "value": 1500 },
    { "label": "Fri", "value": 1800 }
  ],
  "colors": ["#e74c3c"],
  "format": "svg"
}
```

## 內建色彩

未指定 `colors` 時使用以下 10 色循環：

1. `#3498db` 藍
2. `#e74c3c` 紅
3. `#2ecc71` 綠
4. `#f39c12` 橙
5. `#9b59b6` 紫
6. `#1abc9c` 青
7. `#e67e22` 深橙
8. `#34495e` 深灰藍
9. `#16a085` 深青
10. `#c0392b` 深紅

## 注意事項

- 圖表為純 SVG 繪製，無外部圖表庫依賴
- 適合簡易數據視覺化，不適合複雜的統計圖表
- 圓餅圖在數據項過多時標籤可能重疊，建議控制在 8 項以內
