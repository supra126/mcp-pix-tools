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

### HTTP (Streamable HTTP)

```bash
mcp-pix-tools --transport http --port 3100
```

Starts an HTTP server with the MCP Streamable HTTP transport. Suitable for remote deployments, Docker environments, and any HTTP-compatible MCP client.

Available endpoints after startup:
- `POST /mcp` — MCP JSON-RPC endpoint
- `GET /mcp` — Stream for server-initiated notifications
- `DELETE /mcp` — Close session
- `GET /health` — Health check

## System Requirements

- Node.js >= 20
- For PNG output with CJK characters (word clouds, etc.), the corresponding fonts must be installed on the system
