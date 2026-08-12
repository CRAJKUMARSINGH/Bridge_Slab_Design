/**
 * Health check endpoints — Week 13
 */
import type { Request, Response } from "express";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../../../../");
const START = Date.now();

function engineVersion(): string {
  try { return (JSON.parse(readFileSync(join(ROOT, "lib/engine/package.json"), "utf8")) as Record<string,string>)["version"] ?? "unknown"; }
  catch { return "unknown"; }
}

export function handleHealth(_req: Request, res: Response): void {
  res.json({ status: "ok", uptimeSeconds: Math.floor((Date.now()-START)/1000),
    engineVersion: engineVersion(), timestamp: new Date().toISOString() });
}

export function handleReadiness(_req: Request, res: Response): void {
  if (!process.env["DATABASE_URL"]) {
    res.status(503).json({ status: "not_ready", reason: "DATABASE_URL not set",
      note: "Calculation and report endpoints remain available." });
    return;
  }
  res.json({ status: "ready", timestamp: new Date().toISOString() });
}
