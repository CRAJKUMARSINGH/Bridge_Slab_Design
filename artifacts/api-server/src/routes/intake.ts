/**
 * Workbook intake routes — Week 12
 */
import type { Request, Response } from "express";
import crypto from "node:crypto";

const uploads = new Map<string, Record<string,unknown>>();

export async function handleWorkbookUpload(req: Request, res: Response): Promise<void> {
  const { originalName, projectId, sha256 } = req.body as Record<string,string>;
  if (!originalName || !sha256) { res.status(400).json({ error: "originalName and sha256 required" }); return; }
  const id = crypto.randomUUID();
  const upload = { id, projectId: projectId ?? null, originalName, sha256,
    storagePath: `/uploads/${id}/${originalName}`, classifierState: "pending",
    ambiguityCount: 0, ambiguities: [], uploadedAt: new Date().toISOString() };
  uploads.set(id, upload);
  res.status(201).json({ ...upload, nextStep: "Run classifier, then POST /api/intake/:id/confirm" });
}

export function handleGetUpload(req: Request, res: Response): void {
  const u = uploads.get(req.params["id"] ?? "");
  if (!u) { res.status(404).json({ error: "Upload not found" }); return; }
  res.json(u);
}

export function handleConfirmAmbiguities(req: Request, res: Response): void {
  const u = uploads.get(req.params["id"] ?? "");
  if (!u) { res.status(404).json({ error: "Upload not found" }); return; }
  const { decisions } = req.body as { decisions: Record<string,string>[] };
  if (!decisions?.length) { res.status(400).json({ error: "decisions array required" }); return; }
  const valid = ["variable","coefficient","constraint","skip"];
  const bad = decisions.filter(d => !valid.includes(d["kind"] ?? ""));
  if (bad.length) { res.status(400).json({ error: "Invalid decision kind(s)", invalid: bad }); return; }
  (u as Record<string,unknown>)["classifierState"] = "reviewed";
  (u as Record<string,unknown>)["confirmedDecisions"] = decisions;
  uploads.set(req.params["id"]!, u);
  res.json({ ...u, message: "Confirmed. Upload ready for intake." });
}
