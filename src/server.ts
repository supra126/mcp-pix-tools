import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBarcodeTool } from "./tools/barcode.js";
import { registerChartTool } from "./tools/chart.js";
import { registerIdenticonTool } from "./tools/identicon.js";
import { registerIsbnTool } from "./tools/isbn.js";
import { registerPaletteTool } from "./tools/palette.js";
import { registerPlaceholderTool } from "./tools/placeholder.js";
import { registerWordcloudTool } from "./tools/wordcloud.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mcp-pix-tools",
    version,
  });

  // Phase 1 - Barcodes
  registerBarcodeTool(server);
  registerIsbnTool(server);

  // Phase 2 - Visual tools
  registerWordcloudTool(server);
  registerPaletteTool(server);
  registerPlaceholderTool(server);
  registerIdenticonTool(server);
  registerChartTool(server);

  return server;
}
