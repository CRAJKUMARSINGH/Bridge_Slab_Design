import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { calculateBridgeDesign } from "@workspace/engine";
import { renderHtmlReport } from "@workspace/report";

function readFlag(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const workspaceRoot = resolve(process.cwd(), "..");
const resolveWorkspacePath = (value: string) =>
  value.startsWith("/") ? value : resolve(workspaceRoot, value);
const inputPath = resolveWorkspacePath(readFlag("--input", "inputs/KHERWARA.json"));
const outputPath = resolveWorkspacePath(readFlag("--out", "out/KHERWARA-report.html"));
const input = JSON.parse(await readFile(inputPath, "utf8")) as unknown;
const result = calculateBridgeDesign(input);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, renderHtmlReport(result), "utf8");
process.stdout.write(
  `Generated ${outputPath}\nStatus: ${result.overallStatus}\nFailed checks: ${result.failedChecks.join(", ") || "none"}\n`,
);