import { createRequire } from "node:module";
import { createServer } from "./server.js";
import { startStdio } from "./transports/stdio.js";
import { startHTTP } from "./transports/streamableHttp.js";

const require = createRequire(import.meta.url);
const { version: VERSION } = require("../package.json");
const args = process.argv.slice(2);

if (args.includes("--version") || args.includes("-v")) {
  console.log(`mcp-pix-tools v${VERSION}`);
  process.exit(0);
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(`mcp-pix-tools v${VERSION}

Usage: mcp-pix-tools [options]

Options:
  --transport <stdio|http>  Transport mode (default: stdio)
  --port <number>           Port for HTTP mode (default: 3100)
  --version, -v             Show version
  --help, -h                Show this help`);
  process.exit(0);
}

function getArg(name: string, defaultValue?: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return defaultValue;
  return args[idx + 1] ?? defaultValue;
}

const transport = getArg("transport", "stdio")!;
const port = parseInt(getArg("port", "3100")!, 10);

switch (transport) {
  case "stdio":
    await startStdio(createServer());
    break;
  case "http":
    await startHTTP(createServer, port);
    break;
  default:
    console.error(`Unknown transport: ${transport}. Use "stdio" or "http".`);
    process.exit(1);
}
