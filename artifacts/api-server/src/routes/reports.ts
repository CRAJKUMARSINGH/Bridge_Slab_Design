import { Router, type IRouter } from "express";
import { resolve } from "path";
import { existsSync } from "fs";
import express from "express";

const router: IRouter = Router();

// design-reports lives at the workspace root; server CWD is artifacts/api-server
const REPORTS_DIR = resolve(process.cwd(), "../../design-reports");

const reportsStatic = existsSync(REPORTS_DIR)
  ? express.static(REPORTS_DIR, { index: "index.html", etag: true, redirect: true })
  : null;

// Redirect /reports (no trailing slash) → /api/reports/ using an exact regex
// IMPORTANT: must use regex ^\/reports$ so it does NOT match /reports/ (which
// would cause an infinite redirect loop because Express strict mode is off by default)
router.get(/^\/reports$/, (_req, res) => {
  res.redirect(301, "/api/reports/");
});

router.use("/reports", (req, res, next) => {
  if (!reportsStatic) {
    res.status(503).json({
      error: "Design reports directory not found",
      path: REPORTS_DIR,
    });
    return;
  }
  reportsStatic(req, res, next);
});

router.get("/reports-list", (_req, res) => {
  const projects = [
    { id: "som-river-kherwara",    type: "submersible", title: "SOM River — Kherwara-Jawas-Suveri Road",      river: "Som",      file: "som-river-kherwara.html",       q: 899.93,  hfl: 100.60 },
    { id: "bedach-river-bedla",    type: "submersible", title: "BEDACH River — Syphon Tiraha–Bedla Road",     river: "Bedach",   file: "bedach-river-bedla.html" },
    { id: "jakham-river-mandvi",   type: "submersible", title: "JAKHAM River — Mandvi Area",                  river: "Jakham",   file: "jakham-river-mandvi.html" },
    { id: "t01-road-jethliya",     type: "submersible", title: "T01 Road — Jethliya",                         river: "—",        file: "t01-road-jethliya.html" },
    { id: "som-river-larathi",     type: "submersible", title: "SOM River — Larathi to Larathi B Road",       river: "Som",      file: "som-river-larathi.html",        q: 1066.8,  hfl: 99.5 },
    { id: "sukanaka-nalah-matoon", type: "submersible", title: "SUKANAKA Nalah — Matoon",                     river: "Sukanaka", file: "sukanaka-nalah-matoon.html" },
    { id: "ayad-river-maharashtra",type: "submersible", title: "AYAD River — Maharashtra Alignment",          river: "Ayad",     file: "ayad-river-maharashtra.html" },
    { id: "gumaniya-nalah-udaipur",type: "submersible", title: "GUMANIYA Nalah — Udaipur",                   river: "Gumaniya", file: "gumaniya-nalah-udaipur.html" },
    { id: "katumbi-chandrod",      type: "submersible", title: "Katumbi to Chandrod Road Bridge",             river: "—",        file: "katumbi-chandrod.html" },
    { id: "sisarama-nalah-highlevel",type:"high-level", title: "SISARAMA Nalah — High-Level",                 river: "Sisarma",  file: "sisarama-nalah-highlevel.html" },
    { id: "kumbhalgarh-bridge",    type: "high-level",  title: "KUMBHALGARH Road Bridge — High-Level",        river: "—",        file: "kumbhalgarh-bridge.html" },
    { id: "parwan-river-highlevel",type: "high-level",  title: "PARWAN River — High-Level (75T)",             river: "Parwan",   file: "parwan-river-highlevel.html" },
    { id: "banas-river-highlevel", type: "high-level",  title: "BANAS River — High-Level",                   river: "Banas",    file: "banas-river-highlevel.html" },
    { id: "ayad-river-fatehpura",  type: "high-level",  title: "AYAD River — Fatehpura High-Level",           river: "Ayad",     file: "ayad-river-fatehpura.html" },
    { id: "kherka-bridge",         type: "high-level",  title: "KHERKA Bridge — 19 m Span Tee Beam (Courbon)",river: "—",        file: "kherka-bridge.html" },
    { id: "sukanaka-nalah-highlevel",type:"high-level", title: "SUKANAKA Nalah — High-Level",                 river: "Sukanaka", file: "sukanaka-nalah-highlevel.html" },
  ];
  res.json({
    total: projects.length,
    submersible: projects.filter((p) => p.type === "submersible").length,
    highLevel:   projects.filter((p) => p.type === "high-level").length,
    indexUrl:    "/api/reports/",
    projects,
  });
});

export default router;
