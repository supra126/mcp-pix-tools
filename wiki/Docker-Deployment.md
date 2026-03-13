# Docker Deployment

## Quick Start (GHCR)

```bash
docker pull ghcr.io/supra126/mcp-pix-tools:latest
docker run -p 3100:3100 ghcr.io/supra126/mcp-pix-tools:latest
```

## Build Locally

```bash
docker build -t mcp-pix-tools .
docker run -p 3100:3100 mcp-pix-tools
```

## Docker Compose

```bash
docker compose up -d
```

Uses the GHCR image by default. To build locally, edit `docker-compose.yml`:

```yaml
services:
  mcp-pix-tools:
    image: ghcr.io/supra126/mcp-pix-tools:latest
    # To build locally instead, comment out "image" and uncomment "build":
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

## Coolify Deployment

1. Add a new Application in Coolify
2. Point to the GitHub repo `supra126/mcp-pix-tools`
3. Coolify will auto-detect the Dockerfile and build it
4. Set the exposed port to `3100`
5. Once deployed, the SSE endpoint is `http://your-domain:3100/sse`

## Docker Image Details

The Dockerfile uses a multi-stage build:

1. **Builder** — Installs dependencies and compiles TypeScript
2. **Runner** — Contains only dist, node_modules, and fonts

The Runner stage includes:
- `font-noto` — Latin character base font
- `font-noto-cjk` — Chinese, Japanese, and Korean fonts

This ensures PNG output (word clouds, charts, etc.) renders CJK text correctly inside the container.

## Custom Port

```bash
docker run -p 8080:8080 mcp-pix-tools node dist/index.js --transport sse --port 8080
```

## Health Check

```bash
curl http://localhost:3100/health
# {"status":"ok","name":"mcp-pix-tools"}
```
