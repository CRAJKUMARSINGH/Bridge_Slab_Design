/**
 * Route registry — Weeks 7-13
 */
import { Router } from "express";
import { handleHealth, handleReadiness } from "./health.js";
import { handleCalculate } from "./calculate.js";
import { handleReportHtml, handleReportPdf } from "./report-html.js";
import { handleListProjects, handleCreateProject, handleListRuns, handleSaveRun, handleGetRun } from "./projects.js";
import { handleWorkbookUpload, handleGetUpload, handleConfirmAmbiguities } from "./intake.js";

export function createRouter(): Router {
  const router = Router();
  // Health (Week 13)
  router.get( "/health",                       handleHealth);
  router.get( "/health/ready",                 handleReadiness);
  // Calculation (Week 7)
  router.post("/api/calculate",                handleCalculate);
  // Reports (Week 10)
  router.post("/api/report/html",              handleReportHtml);
  router.post("/api/report/pdf",               handleReportPdf);
  // Projects + runs (Week 11)
  router.get( "/api/projects",                 handleListProjects);
  router.post("/api/projects",                 handleCreateProject);
  router.get( "/api/projects/:id/runs",        handleListRuns);
  router.post("/api/projects/:id/runs",        handleSaveRun);
  router.get( "/api/projects/:id/runs/:runId", handleGetRun);
  // Intake (Week 12)
  router.post("/api/intake/upload",            handleWorkbookUpload);
  router.get( "/api/intake/:id",               handleGetUpload);
  router.post("/api/intake/:id/confirm",       handleConfirmAmbiguities);
  return router;
}
