# Development Guide

## Environment Setup

```bash
git clone https://github.com/supra126/mcp-pix-tools.git
cd mcp-pix-tools
npm install
```

## Build

```bash
npm run build        # one-time build
npm run dev          # watch mode
```

Build output goes to the `dist/` directory, bundled as ESM format using tsup.

## Testing

```bash
npm test             # run all tests
npm run test:watch   # watch mode
```

The test framework is vitest, with test files in the `tests/` directory.

## Lint & Format

```bash
npm run lint         # check for lint errors
npm run lint:fix     # auto-fix lint errors
npm run format       # format all files
```

Uses [Biome](https://biomejs.dev/) for both linting and formatting (space indent, double quotes, 100 line width).

## Project Structure

```
src/
├── index.ts              # CLI entry point, parses --transport / --port
├── server.ts             # McpServer creation + all tool registration
├── transports/
│   ├── stdio.ts          # stdio transport
│   └── streamableHttp.ts # Streamable HTTP transport
└── tools/
    ├── barcode.ts        # generate_barcode
    ├── isbn.ts           # generate_isbn
    ├── wordcloud.ts      # generate_wordcloud
    ├── palette.ts        # generate_palette
    ├── placeholder.ts    # generate_placeholder
    ├── identicon.ts      # generate_identicon
    └── chart.ts          # generate_chart
```

## Adding a New Tool

1. Create a new file in `src/tools/`, e.g. `my-tool.ts`
2. Export a `registerMyTool(server: McpServer)` function
3. Import and call the register function in `src/server.ts`
4. Add corresponding tests in `tests/tools/`

Example structure:

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
      // ... implementation logic

      return {
        content: [
          { type: "text", text: "Result text" },
          // or image:
          // { type: "image", data: base64String, mimeType: "image/png" },
        ],
      };
    },
  );
}
```

## Technology Stack

| Technology | Purpose |
|------------|---------|
| `@modelcontextprotocol/sdk` | MCP Server SDK |
| `zod` | Tool parameter validation |
| `bwip-js` | Barcode generation |
| `sharp` | SVG to PNG conversion |
| `d3-cloud` | Word cloud layout |
| `jdenticon` | Identicon generation |
| `node:http` | Streamable HTTP transport (built-in) |
| `tsup` | TypeScript bundler |
| `vitest` | Test framework |
| `biome` | Linter + formatter |
