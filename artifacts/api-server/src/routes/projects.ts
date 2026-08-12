/**
 * Project + run persistence — Week 11 (in-memory prototype)
 */
import type { Request, Response } from "express";

const store = new Map<string, Record<string,unknown>>();
const runs  = new Map<string, Record<string,unknown>[]>();

export function handleListProjects(_req: Request, res: Response): void {
  res.json({ projects: [...store.values()] });
}

export function handleCreateProject(req: Request, res: Response): void {
  const { projectCode, projectName, designCode } = req.body as Record<string,string>;
  if (!projectCode || !projectName) { res.status(400).json({ error: "projectCode and projectName required" }); return; }
  if (store.has(projectCode)) { res.status(409).json({ error: "Project code exists" }); return; }
  const project = { id: crypto.randomUUID(), projectCode, projectName, designCode: designCode ?? null, createdAt: new Date().toISOString() };
  store.set(projectCode, project);
  runs.set(projectCode, []);
  res.status(201).json(project);
}

export function handleListRuns(req: Request, res: Response): void {
  const p = store.get(req.params["id"] ?? "");
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }
  res.json({ runs: runs.get((p as Record<string,string>)["projectCode"]) ?? [] });
}

export function handleSaveRun(req: Request, res: Response): void {
  const p = store.get(req.params["id"] ?? "");
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }
  const body = req.body as Record<string,unknown>;
  if (!body["inputs"] || !body["result"]) { res.status(400).json({ error: "inputs and result required" }); return; }
  const run = {
    id: crypto.randomUUID(), projectId: (p as Record<string,string>)["id"],
    revision: body["revision"] ?? "R0",
    engineVersion: (body["result"] as Record<string,string>)["engineVersion"],
    inputFingerprint: (body["result"] as Record<string,string>)["inputFingerprint"],
    inputs: body["inputs"], result: body["result"],
    overallStatus: (body["result"] as Record<string,string>)["overallStatus"],
    failedChecks: (body["result"] as Record<string,unknown[]>)["failedChecks"],
    reviewState: "draft", createdAt: new Date().toISOString(), isSuperseded: false,
  };
  const pc = (p as Record<string,string>)["projectCode"];
  const arr = runs.get(pc) ?? [];
  arr.push(run);
  runs.set(pc, arr);
  res.status(201).json(run);
}

export function handleGetRun(req: Request, res: Response): void {
  const p = store.get(req.params["id"] ?? "");
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }
  const pc  = (p as Record<string,string>)["projectCode"];
  const run = (runs.get(pc) ?? []).find(r => (r as Record<string,string>)["id"] === req.params["runId"]);
  if (!run) { res.status(404).json({ error: "Run not found" }); return; }
  res.json(run);
}
