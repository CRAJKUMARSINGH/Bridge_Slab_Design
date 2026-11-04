import { readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { Router, type Request, type Response } from 'express';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import calculateCompleteDesign from '../bridge-excel-generator/design-engine';
import type { EnhancedProjectInput, ProjectInput } from '../bridge-excel-generator/types';
import { mergeProjectInput, PHASE1_QUICK_TEMPLATES } from './default-project-inputs';
import { generateDesignPDF } from './pdf-export';
import { generateBridgeDXF } from './dxf-export';
import {
  generateGADSvg,
  generatePierSvg,
  generateAbutmentSvg,
  generateSlabSvg,
  generateScourProfileSvg,
  generatePierStabilitySvg,
  generateAbutmentPressureSvg,
  generateSlabReinfPlanSvg,
} from './svg-diagrams';
import { calculateReinforcement, generateReinforcementDetailSVG, generateReinforcementSectionSVG } from './reinforcement-drawings';
import { calculateDetailedAbutmentDesign, calculateDetailedEstimation, calculateDeckAnchorage } from './remote-app-adapter';
import { formatZodIssues, projectInputBodySchema } from './project-input-zod';
import {
  isLikelyXlsxZip,
  MAX_UPLOAD_XLSX_BYTES,
  parseExcelToProjectInput,
  validateParsedInput,
} from './excel-parser';
import { generateComprehensivePDF } from './comprehensive-pdf-export';
import { generateHTMLDesignReport } from './design-report';
import { validateDesign, generateValidationHTML } from './claude-validator';
import { generateIrcChecklistHTML } from './checklist-export';
import { generateGADCSV, generateGADJSON } from '../scripts/generate-gad-csv';
import {
  buildSingleWorkbookSheetPreview,
  buildWorkbookSheetPreviews,
  STABILITY_CHECK_PIER_SHEET_NAME,
} from './workbook-sheets-preview';
import { resolveFeatureFlags } from '../shared/feature-flags';
import { buildPierCaseCatalog, resolveDefaultPierAssetRoot } from './pier-case-engine';
import { PIER_MASTER_SCHEMA, recommendPierType, type PierMasterVariables } from './pier-recommendation-engine';
import { generatePierPayload } from './pier-template-mapper';
import { optimiseBridgeDesign } from './optimisation-engine';
import logger from './logger';

/** Route error payloads are strings only; `catch` binds `unknown`, never `any`. */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
import { db } from '../shared/db';
import { analysisRecords } from '../shared/schema';

const router = Router();

/**
 * Fire-and-forget helper: saves a design run as an Analysis Record.
 * Never throws — errors are logged but never propagate to the client.
 * Requirement 12.1, 12.3.
 */
async function saveAnalysisRecord(
  projectId: number,
  input: ProjectInput,
  resultsSummary: unknown,
): Promise<void> {
  try {
    if (!db) return; // DATABASE_URL not set — silently skip
    await db.insert(analysisRecords).values({
      projectId,
      fileId: null,
      variationType: 'design-run',
      inputSnapshot: input as unknown as Record<string, unknown>,
      resultsSummary: resultsSummary as Record<string, unknown> | null,
    });
  } catch (err) {
    logger.error({ err }, 'auto-save analysis record failed');
  }
}

/** Reject pier catalog roots outside the resolved default asset tree (no arbitrary drive traversal). */
function isDirectoryWithin(rootAbs: string, candidateAbs: string): boolean {
  const root = resolve(rootAbs);
  const dir = resolve(candidateAbs);
  const rel = relative(root, dir);
  return rel === '' || !rel.startsWith('..');
}

function getPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function fetchWithTimeoutAndRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  retries: number,
): Promise<globalThis.Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt === retries) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('fetch failed');
}

function mergeInputFromRequest(req: Request): ProjectInput {
  if (
    req.method === 'POST' &&
    req.body &&
    typeof req.body === 'object' &&
    !Array.isArray(req.body)
  ) {
    return mergeProjectInput(req.body as Partial<ProjectInput>);
  }
  return mergeProjectInput(req.query as Partial<ProjectInput>);
}

/** Zod + merge — same contract as POST /calculate. */
function parseMergedProjectInput(body: unknown):
  | { ok: true; input: ProjectInput }
  | { ok: false; issues: ReturnType<typeof formatZodIssues> } {
  const raw = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const parsed = projectInputBodySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, issues: formatZodIssues(parsed.error) };
  }
  return { ok: true, input: mergeProjectInput(parsed.data) };
}

/**
 * QODER-001: every export route re-runs the engine for the same merged input, and several
 * panels post identical payloads, so results are memoised on a canonical key. Bounded LRU
 * so the cache cannot grow with traffic; cached objects are only read and serialised.
 */
const RESULTS_CACHE_LIMIT = 16;
const resultsCache = new Map<string, ReturnType<typeof calculateCompleteDesign>>();

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value === null || typeof value !== 'object') return String(JSON.stringify(value));
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`;
}

function calculateCached(input: ProjectInput): ReturnType<typeof calculateCompleteDesign> {
  const key = canonicalJson(input);
  const hit = resultsCache.get(key);
  if (hit) {
    resultsCache.delete(key);
    resultsCache.set(key, hit);
    return hit;
  }
  const results = calculateCompleteDesign(input);
  resultsCache.set(key, results);
  if (resultsCache.size > RESULTS_CACHE_LIMIT) {
    const oldest = resultsCache.keys().next().value;
    if (oldest !== undefined) resultsCache.delete(oldest);
  }
  return results;
}

/**
 * POST /api/design/optimise
 * Runs the iterative optimisation engine to find the smallest safe dimensions.
 * The body is schema-validated first: every trial re-runs the whole design engine, so
 * an unvalidated payload (e.g. an enormous crossSectionData) multiplied by the
 * iteration count was an unbounded CPU cost.
 *
 * GENSPARK-001 fix: 30-second wall-clock timeout prevents a single bad call from
 * tying up a worker indefinitely.  On timeout the server returns HTTP 504
 * (Gateway Timeout) so the UI can show a "try narrower bounds" message instead
 * of hanging.
 */
router.post('/optimise', async (req, res) => {
  const rawBody = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const parsed = projectInputBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: 'Invalid request body',
      issues: formatZodIssues(parsed.error),
    });
    return;
  }
  try {
    const OPTIMISE_TIMEOUT_MS = 30_000;
    const timeoutRef: { timer: NodeJS.Timeout | null } = { timer: null };
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutRef.timer = setTimeout(() => {
        reject(Object.assign(new Error('Optimisation timed out after 30 seconds — try reducing the number of spans or starting with larger dimensions'), { code: 'OPTIMISE_TIMEOUT' }));
      }, OPTIMISE_TIMEOUT_MS);
    });

    const result = await Promise.race([
      optimiseBridgeDesign(mergeProjectInput(parsed.data)),
      timeoutPromise,
    ]);
    if (timeoutRef.timer) clearTimeout(timeoutRef.timer);

    res.json(result);
  } catch (error) {
    const isTimeout =
      error instanceof Error && (error as { code?: string }).code === 'OPTIMISE_TIMEOUT';
    res.status(isTimeout ? 504 : 500).json({
      success: false,
      error: errorMessage(error),
      ...(isTimeout ? { retryable: true, suggestedAction: 'reduce scope / increase starting span dimensions' } : {}),
    });
  }
});

/**
 * POST /api/design/calculate
 * Calculate bridge design and generate Excel
 */
router.post('/calculate', async (req, res) => {
  try {
    const rawBody = req.body && typeof req.body === 'object' ? req.body : {};
    const parsed = projectInputBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        issues: formatZodIssues(parsed.error),
      });
      return;
    }

    const input: ProjectInput = mergeProjectInput(parsed.data);

    console.log(`📝 Design request: ${input.projectName}`);

    // Generate Excel using existing bridge-excel-generator
    const buffer = await generateCompleteExcel(input);
    
    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Design.xlsx"`
    );
    
    res.send(buffer);

    // Fire-and-forget auto-save — Requirement 12.1 / 12.2
    const projectId = typeof parsed.data.projectId === 'number' ? parsed.data.projectId : null;
    if (projectId) {
      const summary = calculateCached(input);
      void saveAnalysisRecord(projectId, input, summary).catch(() => { /* already logged inside */ });
    }
  } catch (error) {
    console.error('❌ Calculation error:', error);
    res.status(500).json({
      success: false,
      error: errorMessage(error),
    });
  }
});

/**
 * GET /api/design/templates
 * Quick-start payloads: valid ProjectInput for POST /calculate (Phase 1 defaults).
 */
router.get('/templates', (_req, res) => {
  const templates = PHASE1_QUICK_TEMPLATES.map(({ id, name, description, input }) => ({
    id,
    name,
    description,
    input,
  }));

  res.json({ success: true, templates });
});

/**
 * GET /api/design/demo-seed — canonical W16 / golden Kherwara ProjectInput (same as template `kherwara-golden`).
 * Used for first-run browser seed and operator docs; matches `npm run verify:excel` fixture.
 */
router.get('/demo-seed', (_req, res) => {
  const t = PHASE1_QUICK_TEMPLATES.find((x) => x.id === 'kherwara-golden');
  if (!t) {
    res.status(500).json({ success: false, error: 'kherwara-golden template missing' });
    return;
  }
  res.json({
    success: true,
    templateId: t.id,
    description: t.description,
    input: t.input,
  });
});

/**
 * POST /api/design/results — returns JSON design output (no file download)
 */
router.post('/results', async (req, res) => {
  try {
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        issues: out.issues,
      });
      return;
    }
    const input = out.input;
    const results = calculateCached(input);
    res.json({ success: true, results });

    // Fire-and-forget auto-save — Requirement 12.4
    const rawBody: Record<string, unknown> =
      req.body && typeof req.body === 'object' ? req.body : {};
    const candidateProjectId = rawBody.projectId;
    const projectId = typeof candidateProjectId === 'number' ? candidateProjectId : null;
    if (projectId) {
      void saveAnalysisRecord(projectId, input, results).catch(() => { /* already logged inside */ });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/workbook-previews — grid snapshot of each generated sheet (for online viewer).
 * Body: full ProjectInput JSON. Response: { success, sheets: [{ name, rowCount, colCount, rows }] }.
 */
router.post('/workbook-previews', async (req, res) => {
  try {
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        issues: out.issues,
      });
      return;
    }
    const sheets = await buildWorkbookSheetPreviews(out.input);
    res.json({ success: true, sheets });
  } catch (error: unknown) {
    const message = errorMessage(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/design/workbook-sheet-preview — one sheet, full row range (same cells as downloaded .xlsx).
 * Body: ProjectInput JSON; optional `sheetName` (default: STABILITY CHECK FOR PIER). Unknown keys stripped by Zod.
 */
router.post('/workbook-sheet-preview', async (req, res) => {
  try {
    const raw = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const sheetName =
      typeof (raw as { sheetName?: unknown }).sheetName === 'string' &&
      (raw as { sheetName: string }).sheetName.length > 0
        ? (raw as { sheetName: string }).sheetName
        : STABILITY_CHECK_PIER_SHEET_NAME;

    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        issues: out.issues,
      });
      return;
    }
    const sheet = await buildSingleWorkbookSheetPreview(out.input, sheetName);
    if (!sheet) {
      res.status(404).json({ success: false, error: `Worksheet not found: ${sheetName}` });
      return;
    }
    res.json({ success: true, sheet, sheetName });
  } catch (error: unknown) {
    const message = errorMessage(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET/POST /api/design/drawings/svg/gad — POST body = full ProjectInput JSON (recommended)
 */
async function svgGadHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCached(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generateGADSvg(enhancedInput));
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
}
router.get('/drawings/svg/gad', svgGadHandler);
router.post('/drawings/svg/gad', svgGadHandler);

async function svgPierHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCached(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generatePierSvg(enhancedInput));
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
}
router.get('/drawings/svg/pier', svgPierHandler);
router.post('/drawings/svg/pier', svgPierHandler);

async function svgAbutmentHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCached(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generateAbutmentSvg(enhancedInput));
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
}
router.get('/drawings/svg/abutment', svgAbutmentHandler);
router.post('/drawings/svg/abutment', svgAbutmentHandler);

async function svgSlabHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCached(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generateSlabSvg(enhancedInput));
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
}
router.get('/drawings/svg/slab', svgSlabHandler);
router.post('/drawings/svg/slab', svgSlabHandler);

async function svgScourProfileHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCached(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generateScourProfileSvg(enhancedInput));
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
}
router.get('/drawings/svg/scour-profile', svgScourProfileHandler);
router.post('/drawings/svg/scour-profile', svgScourProfileHandler);

async function svgPierStabilityHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCached(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generatePierStabilitySvg(enhancedInput));
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
}
router.get('/drawings/svg/pier-stability', svgPierStabilityHandler);
router.post('/drawings/svg/pier-stability', svgPierStabilityHandler);

async function svgAbutmentPressureHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCached(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generateAbutmentPressureSvg(enhancedInput));
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
}
router.get('/drawings/svg/abutment-pressure', svgAbutmentPressureHandler);
router.post('/drawings/svg/abutment-pressure', svgAbutmentPressureHandler);

async function svgSlabReinfPlanHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCached(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generateSlabReinfPlanSvg(enhancedInput));
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
}
router.get('/drawings/svg/slab-reinf-plan', svgSlabReinfPlanHandler);
router.post('/drawings/svg/slab-reinf-plan', svgSlabReinfPlanHandler);

/**
 * POST /api/design/pdf/comprehensive — returns ~200 page PDF with all 46 sheets
 */
router.post('/pdf/comprehensive', async (req, res) => {
  try {
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        issues: out.issues,
      });
      return;
    }
    const input = out.input;
    const designResults = calculateCached(input);
    const enhancedInput = { ...input, ...designResults } as EnhancedProjectInput;
    const buffer = await generateComprehensivePDF(enhancedInput);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Complete_46_Sheets.pdf"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/pdf — returns PDF buffer
 */
router.post('/pdf', async (req, res) => {
  try {
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        issues: out.issues,
      });
      return;
    }
    const input = out.input;
    const designResults = calculateCached(input);
    const enhancedInput = { ...input, ...designResults } as EnhancedProjectInput;
    const buffer = await generateDesignPDF(enhancedInput);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Report.pdf"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/dxf — returns DXF file
 */
router.post('/dxf', async (req, res) => {
  try {
    const raw = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? (req.body as Record<string, any>) : {};
    const profile = {
      acadVersion: raw.acadVersion === 'AC1018' ? 'AC1018' as const : 'AC1021' as const,
      includeHatch: raw.includeHatch ?? true,
      units: (raw.units === 'mm' ? 'mm' : 'm') as 'm' | 'mm'
    };
    
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        issues: out.issues,
      });
      return;
    }
    const input = out.input;
    const designResults = calculateCached(input);
    const enhancedInput = { ...input, ...designResults } as EnhancedProjectInput;
    const dxfContent = generateBridgeDXF(enhancedInput, profile);
    res.setHeader('Content-Type', 'application/dxf');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Drawings.dxf"`);
    res.send(dxfContent);
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/report-model
 * Returns the flat report model (id → {value, unit, formulaText, label})
 * Used by the HTML sheet preview to show values + formulas side by side.
 */
router.post('/report-model', async (req, res) => {
  try {
    const input = mergeProjectInput(req.body);
    const designResults = calculateCached(input);
    const { buildReportModel } = await import('../bridge-excel-generator/report-model');
    const enhancedInput = { ...input, ...designResults } as EnhancedProjectInput;
    const model = buildReportModel(enhancedInput);
    res.json({ success: true, model });
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/upload-excel
 * Upload existing Excel workbook and extract ProjectInput
 */
router.post('/upload-excel', async (req, res) => {
  try {
    // Expect base64-encoded Excel file in body.file
    const fileBase64 = req.body.file;
    if (!fileBase64 || typeof fileBase64 !== 'string') {
      res.status(400).json({ success: false, error: 'No file provided (expected base64 in body.file)' });
      return;
    }
    if (fileBase64.length > Math.ceil((MAX_UPLOAD_XLSX_BYTES * 4) / 3) + 16) {
      res.status(413).json({ success: false, error: `File too large (max ${MAX_UPLOAD_XLSX_BYTES} bytes)` });
      return;
    }
    
    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length === 0 || !isLikelyXlsxZip(buffer)) {
      res.status(400).json({ success: false, error: 'Invalid XLSX file payload' });
      return;
    }
    const parsed = await parseExcelToProjectInput(buffer);
    const validation = validateParsedInput(parsed.input);
    
    res.json({
      success: true,
      extracted: parsed.input,
      validation,
      metadata: {
        sheetsFound: parsed.metadata.sheetNames,
        formulaCount: parsed.metadata.formulas.length,
        valueCount: parsed.metadata.values.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/report/html
 * Generate HTML design report with formulas
 */
router.post('/report/html', async (req, res) => {
  try {
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        issues: out.issues,
      });
      return;
    }
    const input = out.input;
    const designResults = calculateCached(input);
    const enhancedInput = { ...input, ...designResults } as EnhancedProjectInput;
    
    const html = await generateHTMLDesignReport(enhancedInput);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Report.html"`);
    res.send(html);
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/gad/csv
 * Generate GAD CSV for CAD import
 */
router.post('/gad/csv', async (req, res) => {
  try {
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        issues: out.issues,
      });
      return;
    }
    const input = out.input;
    const csv = generateGADCSV(input);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_GAD.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/gad/json
 * Generate GAD data as JSON
 */
router.post('/gad/json', async (req, res) => {
  try {
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        issues: out.issues,
      });
      return;
    }
    const input = out.input;
    const gadData = generateGADJSON(input);
    
    res.json({ success: true, gad: gadData });
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/validate
 * Run IRC compliance validation on design
 */
router.post('/validate', async (req, res) => {
  try {
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        issues: out.issues,
      });
      return;
    }
    const input = out.input;
    const designResults = calculateCached(input);
    
    const validationReport = validateDesign(input, designResults);
    
    res.json({
      success: true,
      validation: validationReport
    });
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/checklist/html
 * Generate IRC QA compliance checklist as a print-ready HTML document
 */
router.post('/checklist/html', async (req, res) => {
  try {
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({ success: false, error: 'Invalid request body', issues: out.issues });
      return;
    }
    const input = out.input;
    const designResults = calculateCached(input);
    const html = generateIrcChecklistHTML(input, designResults);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_IRC_Checklist.html"`);
    res.send(html);
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/validate/html
 * Generate HTML validation report
 */
router.post('/validate/html', async (req, res) => {
  try {
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        issues: out.issues,
      });
      return;
    }
    const input = out.input;
    const designResults = calculateCached(input);
    
    const validationReport = validateDesign(input, designResults);
    const html = generateValidationHTML(validationReport);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Validation.html"`);
    res.send(html);
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/reinforcement/schedule
 * Returns reinforcement calculation with BOQ
 */
router.post('/reinforcement/schedule', async (req, res) => {
  try {
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({ success: false, error: 'Invalid request body', issues: out.issues });
      return;
    }
    const input = out.input;
    const designResults = calculateCached(input);
    const enhancedInput = { ...input, ...designResults } as EnhancedProjectInput;
    const reinforcement = calculateReinforcement(enhancedInput);
    res.json({ success: true, reinforcement });
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/reinforcement/drawing/:element
 * Returns SVG reinforcement detail drawing
 */
router.post('/reinforcement/drawing/:element', async (req, res) => {
  try {
    const element = req.params.element as 'pier' | 'abutment-type1' | 'abutment-c1';
    if (!['pier', 'abutment-type1', 'abutment-c1'].includes(element)) {
      res.status(400).json({ success: false, error: 'Invalid element. Use: pier, abutment-type1, abutment-c1' });
      return;
    }
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({ success: false, error: 'Invalid request body', issues: out.issues });
      return;
    }
    const input = out.input;
    const designResults = calculateCached(input);
    const enhancedInput = { ...input, ...designResults } as EnhancedProjectInput;
    const svg = generateReinforcementDetailSVG(enhancedInput, element);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Reinforcement_${element}.svg"`);
    res.send(svg);
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/reinforcement/section/:element
 * Returns SVG cross-section with reinforcement
 */
router.post('/reinforcement/section/:element', async (req, res) => {
  try {
    const element = req.params.element as 'pier' | 'abutment';
    if (!['pier', 'abutment'].includes(element)) {
      res.status(400).json({ success: false, error: 'Invalid element. Use: pier, abutment' });
      return;
    }
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({ success: false, error: 'Invalid request body', issues: out.issues });
      return;
    }
    const input = out.input;
    const designResults = calculateCached(input);
    const enhancedInput = { ...input, ...designResults } as EnhancedProjectInput;
    const svg = generateReinforcementSectionSVG(enhancedInput, element);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Section_${element}.svg"`);
    res.send(svg);
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/detailed-abutment/:type
 * Returns detailed abutment design with earth pressure and stability
 */
router.post('/detailed-abutment/:type', async (req, res) => {
  try {
    const type = req.params.type as 'TYPE1' | 'C1';
    if (!['TYPE1', 'C1'].includes(type)) {
      res.status(400).json({ success: false, error: 'Invalid type. Use: TYPE1 or C1' });
      return;
    }
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({ success: false, error: 'Invalid request body', issues: out.issues });
      return;
    }
    const input = out.input;
    const design = calculateDetailedAbutmentDesign(input, type);
    res.json({ success: true, type, design });
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/detailed-estimation
 * Returns detailed estimation with all BOQ items
 */
router.post('/detailed-estimation', async (req, res) => {
  try {
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({ success: false, error: 'Invalid request body', issues: out.issues });
      return;
    }
    const input = out.input;
    const designResults = calculateCached(input);
    const estimation = calculateDetailedEstimation(input, designResults);
    res.json({ success: true, estimation });
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/deck-anchorage
 * Returns deck anchorage analysis (submersible uplift model; high-level returns safe when soffit is above DWL)
 */
router.post('/deck-anchorage', async (req, res) => {
  try {
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({ success: false, error: 'Invalid request body', issues: out.issues });
      return;
    }
    const input = out.input;
    const designResults = calculateCached(input);
    const anchorage = calculateDeckAnchorage(input, designResults);
    res.json({ success: true, anchorage });
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * GET /api/design/feature-flags
 * Refapp.md: feature-flag visibility for rollout / REFERENCE-APP00 behaviour toggles.
 */
router.get('/feature-flags', (_req, res) => {
  res.json({ success: true, flags: resolveFeatureFlags(process.env) });
});

/**
 * GET /api/design/pier-cases/catalog
 * Scans local pier asset library and returns classified + scored best-case defaults.
 */
router.get('/pier-cases/catalog', (req, res) => {
  try {
    const defaultRoot = resolveDefaultPierAssetRoot();
    const requestedRoot =
      typeof req.query.root === 'string' && req.query.root.trim().length > 0
        ? req.query.root.trim()
        : defaultRoot;
    const resolvedRoot = resolve(requestedRoot);
    const resolvedDefaultRoot = resolve(defaultRoot);
    const withinAllowedRoot = isDirectoryWithin(resolvedDefaultRoot, resolvedRoot);
    if (!withinAllowedRoot) {
      res.status(400).json({
        success: false,
        error: `root must be within configured asset root: ${resolvedDefaultRoot}`,
      });
      return;
    }
    const catalog = buildPierCaseCatalog(resolvedRoot);
    res.json({ success: true, catalog });
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * GET /api/design/pier-cases/master-schema
 * Returns master-variable schema for parametric pier engine input dashboard.
 */
router.get('/pier-cases/master-schema', (_req, res) => {
  res.json({ success: true, schema: PIER_MASTER_SCHEMA });
});

/**
 * POST /api/design/pier-cases/recommend
 * Best-pier recommendation from master variables (span/site/seismic/wind context).
 */
router.post('/pier-cases/recommend', (req, res) => {
  try {
    const body = req.body as Partial<PierMasterVariables>;
    const required = [
      'height',
      'width',
      'length',
      'numberOfColumns',
      'stemThickness',
      'capBeamWidth',
      'capBeamDepth',
      'foundationType',
      'seismicZone',
      'windZone',
      'bearingType',
      'skewAngle',
      'roadWidth',
      'spanLength',
      'crossingType',
      'concreteGrade',
      'steelGrade',
      'clearCover',
      'reinforcementPreference',
      'ircIsLoadClass',
    ] as const;
    const missing = required.filter((k) => body[k] === undefined || body[k] === null);
    if (missing.length) {
      res.status(400).json({
        success: false,
        error: `Missing master variables: ${missing.join(', ')}`,
      });
      return;
    }

    const recommendation = recommendPierType(body as PierMasterVariables);
    res.json({ success: true, recommendation });
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/pier-cases/generate
 * Generates parametric pier payload (geometry/reinf/foundation/BOQ/BBS/summary) from master inputs.
 */
router.post('/pier-cases/generate', (req, res) => {
  try {
    const body = req.body as Partial<PierMasterVariables>;
    const required = [
      'height',
      'width',
      'length',
      'numberOfColumns',
      'stemThickness',
      'capBeamWidth',
      'capBeamDepth',
      'foundationType',
      'seismicZone',
      'windZone',
      'bearingType',
      'skewAngle',
      'roadWidth',
      'spanLength',
      'crossingType',
      'concreteGrade',
      'steelGrade',
      'clearCover',
      'reinforcementPreference',
      'ircIsLoadClass',
    ] as const;
    const missing = required.filter((k) => body[k] === undefined || body[k] === null);
    if (missing.length) {
      res.status(400).json({
        success: false,
        error: `Missing master variables: ${missing.join(', ')}`,
      });
      return;
    }

    const recommendation = recommendPierType(body as PierMasterVariables);
    const payload = generatePierPayload({ ...(body as PierMasterVariables), pierType: recommendation.recommendedType });
    res.json({ success: true, recommendation, payload });
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

/**
 * POST /api/design/slabdraw-zip
 * Forwards the design input to the slabdraw service and streams back the
 * ZIP of 5 DXF sheets + BOQ.xlsx. Set SLABDRAW_URL in .env (defaults to
 * http://localhost:8000 in dev).
 */
router.post('/slabdraw-zip', async (req: Request, res: Response) => {
  const slabdrawUrl = (process.env.SLABDRAW_URL || 'http://localhost:8000').replace(/\/$/, '');
  const slabdrawTimeoutMs = getPositiveIntEnv('SLABDRAW_TIMEOUT', 30000);
  const slabdrawRetry = getPositiveIntEnv('SLABDRAW_RETRY', 3);

  try {
    const upstream = await fetchWithTimeoutAndRetry(
      `${slabdrawUrl}/render`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body ?? {}),
      },
      slabdrawTimeoutMs,
      slabdrawRetry,
    );

    if (!upstream.ok) {
      const text = await upstream.text();
      let parsed: unknown = null;
      try { parsed = JSON.parse(text); } catch { /* not JSON */ }
      const message =
        (typeof parsed === 'object' && parsed && 'detail' in parsed
          ? String((parsed as { detail: unknown }).detail)
          : null) || text || `slabdraw responded ${upstream.status}`;
      res.status(upstream.status >= 400 && upstream.status < 500 ? 400 : 502)
         .json({ success: false, error: `slabdraw: ${message}` });
      return;
    }

    const contentType =
      upstream.headers.get('content-type') || 'application/zip';
    const contentDisposition =
      upstream.headers.get('content-disposition') ||
      'attachment; filename="slabdraw_drawings.zip"';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);

    if (upstream.body) {
      const { Readable } = await import('node:stream');
      Readable.fromWeb(upstream.body as never).pipe(res);
    } else {
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.end(buf);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown proxy error';
    res.status(502).json({
      success: false,
      error: `slabdraw proxy error: ${msg}`,
    });
  }
});

/**
 * GET /api/design/slabdraw-health
 * Proxies to slabdraw's /healthz endpoint to check connectivity and version.
 */
router.get('/slabdraw-health', async (_req, res) => {
  const slabdrawUrl = (process.env.SLABDRAW_URL || 'http://localhost:8000').replace(/\/$/, '');
  const slabdrawTimeoutMs = getPositiveIntEnv('SLABDRAW_TIMEOUT', 30000);
  const slabdrawRetry = getPositiveIntEnv('SLABDRAW_RETRY', 3);

  try {
    const start = Date.now();
    const upstream = await fetchWithTimeoutAndRetry(
      `${slabdrawUrl}/healthz`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      },
      slabdrawTimeoutMs,
      slabdrawRetry,
    );

    const duration = Date.now() - start;

    if (!upstream.ok) {
      res.status(upstream.status >= 400 && upstream.status < 500 ? 400 : 502)
         .json({ success: false, error: `slabdraw health check failed with status ${upstream.status}` });
      return;
    }

    const data = await upstream.json();
    // The proxied payload is not ours to trust: merge it only when it is a plain object.
    const upstreamFields = data && typeof data === 'object' && !Array.isArray(data)
      ? data as Record<string, unknown>
      : { upstream: data };
    res.json({
      success: true,
      latency: `${duration}ms`,
      ...upstreamFields
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown proxy error';
    res.status(502).json({
      success: false,
      error: `Could not reach slabdraw at ${slabdrawUrl}: ${msg}`,
    });
  }
});

export default router;
