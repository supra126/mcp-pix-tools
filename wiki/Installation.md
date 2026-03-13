# Installation

## npx (No Install Required)

```bash
npx mcp-pix-tools
```

Great for quick testing — downloads the latest version from npm each time.

## Global Install

```bash
npm install -g mcp-pix-tools
mcp-pix-tools
```

After installation, you can run the `mcp-pix-tools` command directly.

## Project-Level Install

```bash
npm install mcp-pix-tools
```

## Transport Modes

### stdio (Default)

```bash
mcp-pix-tools
# or explicitly specify
mcp-pix-tools --transport stdio
```

Suitable for Claude Desktop, local MCP clients, and other scenarios that communicate via stdin/stdout.

### SSE (Server-Sent Events)

```bash
mcp-pix-tools --transport sse --port 3100
```

Starts an HTTP server with an SSE endpoint. Suitable for remote deployments, Docker environments, and any SSE-compatible MCP client.

Available endpoints after startup:
- `GET /sse` — SSE connection endpoint
- `POST /messages?sessionId=xxx` — Message endpoint
- `GET /health` — Health check

## System Requirements

- Node.js >= 18
- For PNG output with CJK characters (word clouds, etc.), the corresponding fonts must be installed on the system
