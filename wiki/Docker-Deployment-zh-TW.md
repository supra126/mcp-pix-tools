# Docker 部署

## 快速啟動（GHCR）

```bash
docker pull ghcr.io/supra126/mcp-pix-tools:latest
docker run -p 3100:3100 ghcr.io/supra126/mcp-pix-tools:latest
```

## 本地建置

```bash
docker build -t mcp-pix-tools .
docker run -p 3100:3100 mcp-pix-tools
```

## Docker Compose

```bash
docker compose up -d
```

預設使用 GHCR image。如需本地建置，編輯 `docker-compose.yml`：

```yaml
services:
  mcp-pix-tools:
    image: ghcr.io/supra126/mcp-pix-tools:latest
    # 本地建置請註解 "image" 並取消註解 "build":
    # build: .
    ports:
      - "3100:3100"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3100/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

## Docker 映像檔說明

Dockerfile 採用多階段建置：

1. **Builder** — 安裝依賴、編譯 TypeScript
2. **Runner** — 僅包含 dist、node_modules 和字型

Runner 階段已內建：
- `font-noto` — 拉丁字母基礎字型
- `font-noto-cjk` — 中日韓字型

確保 PNG 輸出（詞雲、圖表等）在容器中也能正確渲染 CJK 文字。

## 自訂連接埠

```bash
docker run -p 8080:8080 mcp-pix-tools node dist/index.js --transport http --port 8080
```

## 健康檢查

```bash
curl http://localhost:3100/health
# {"status":"ok","name":"mcp-pix-tools"}
```
