# generate_barcode

生成各種格式的條碼圖片。支援 15 種條碼類型。

## 參數

| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `type` | string (enum) | 是 | — | 條碼類型 |
| `text` | string | 是 | — | 要編碼的文字或數據 |
| `format` | `"png"` \| `"svg"` | 否 | `"png"` | 輸出格式 |
| `scale` | number (1-10) | 否 | `3` | 縮放倍率 |
| `includeText` | boolean | 否 | `true` | 是否顯示條碼下方文字 |
| `color` | string | 否 | — | 條碼顏色（6 位 hex，如 `000000`） |
| `bgColor` | string | 否 | — | 背景顏色（6 位 hex，如 `ffffff`） |
| `width` | number | 否 | — | 寬度（mm） |
| `height` | number | 否 | — | 高度（mm） |

## 支援的條碼類型

| type 值 | 說明 |
|---------|------|
| `qrcode` | QR Code 二維碼 |
| `code128` | Code 128（通用一維碼） |
| `ean13` | EAN-13（國際商品條碼） |
| `ean8` | EAN-8（短版商品條碼） |
| `upca` | UPC-A（北美商品條碼） |
| `upce` | UPC-E（壓縮版 UPC） |
| `code39` | Code 39（工業用） |
| `code93` | Code 93 |
| `codabar` | Codabar（圖書館、血庫） |
| `interleaved2of5` | Interleaved 2 of 5 |
| `datamatrix` | Data Matrix 二維碼 |
| `pdf417` | PDF417 二維碼 |
| `azteccode` | Aztec Code 二維碼 |
| `maxicode` | MaxiCode（物流用） |
| `gs1-128` | GS1-128（物流/供應鏈） |

## 範例

### QR Code

```json
{
  "type": "qrcode",
  "text": "https://github.com/supra126/mcp-pix-tools",
  "format": "png",
  "scale": 5
}
```

### 彩色 Code128

```json
{
  "type": "code128",
  "text": "HELLO-2026",
  "color": "003366",
  "bgColor": "f5f5f5",
  "scale": 4
}
```

### EAN-13 商品條碼

```json
{
  "type": "ean13",
  "text": "4710088430404",
  "format": "svg"
}
```

### Data Matrix（不含文字）

```json
{
  "type": "datamatrix",
  "text": "Serial-ABC-12345",
  "includeText": false,
  "scale": 6
}
```

## 回傳格式

- **PNG**: `{ type: "image", data: "<base64>", mimeType: "image/png" }`
- **SVG**: `{ type: "text", text: "<svg>...</svg>" }`

## 注意事項

- 不同條碼類型對 `text` 有不同的格式要求（例如 EAN-13 需要 13 位數字）
- 如果文字格式不符合條碼規範，bwip-js 會回傳錯誤訊息
- `width` 和 `height` 單位是毫米（mm），非像素
