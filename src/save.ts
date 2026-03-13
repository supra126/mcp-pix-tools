import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const OUTPUT_DIR = join(tmpdir(), "mcp-pix-tools");

// Ensure the output directory exists once at startup.
mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Saves generated output to a temp file and returns the file path.
 *
 * @param toolName - Tool identifier used as filename prefix (e.g. "barcode")
 * @param data     - Raw bytes (PNG buffer) or string (SVG)
 * @param ext      - File extension without dot: "png" or "svg"
 */
export function saveToTempFile(toolName: string, data: Buffer | string, ext: string): string {
  const id = randomBytes(4).toString("hex");
  const filename = `${toolName}-${id}.${ext}`;
  const filePath = join(OUTPUT_DIR, filename);
  writeFileSync(filePath, data);
  return filePath;
}
