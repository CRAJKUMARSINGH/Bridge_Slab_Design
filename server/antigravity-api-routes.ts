import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Router, type Request, type Response } from 'express';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import calculateCompleteDesign from '../bridge-excel-generator/design-engine';
import type { ProjectInput } from '../bridge-excel-generator/types';
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
import { generateGADCSV, generateGADJSON } from '../scripts/generate-gad-csv';
import {
  buildSingleWorkbookSheetPreview,
  buildWorkbookSheetPreviews,
  STABILITY_CHECK_PIER_SHEET_NAME,
} from './workbook-sheets-preview';
import { resolveFeatureFlags } from '../shared/feature-flags';

const router = Router();

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

// RISK-3 cache: Load schema once at startup
const PROJECT_INPUT_SCHEMA = JSON.parse(
  readFileSync(join(process.cwd(), 'schemas', 'project-input.schema.json'), 'utf-8')
);

/**
 * GET /api/design/schema
 * JSON Schema for ProjectInput (Phase 1 contract for tools / forms).
 */
router.get('/schema', (_req, res) => {
  res.setHeader('Content-Type', 'application/schema+json');
  res.json(PROJECT_INPUT_SCHEMA);
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
    const model = (rawBody.model === 'model-a' || rawBody.model === 'model-b') ? rawBody.model : 'model-b';
    
    console.log(`📝 Design request: ${input.projectName} (Model: ${model})`);
    
    // Generate Excel using existing bridge-excel-generator
    const buffer = await generateCompleteExcel(input, { model });
    
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
  } catch (error: any) {
    console.error('❌ Calculation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
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
    const results = calculateCompleteDesign(input);
    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/design/workbook-previews — grid snapshot of each generated sheet (for online viewer).
 * Body: full ProjectInput JSON. Response: { success, sheets: [{ name, rowCount, colCount, rows }] }.
 */
router.post('/workbook-previews', async (req, res) => {
  try {
    const raw = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? (req.body as Record<string, any>) : {};
    const model = (raw.model === 'model-a' || raw.model === 'model-b') ? raw.model : 'model-b';
    
    const out = parseMergedProjectInput(req.body);
    if (!out.ok) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        issues: out.issues,
      });
      return;
    }
    const sheets = await buildWorkbookSheetPreviews(out.input, { model } as any);
    res.json({ success: true, sheets });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Workbook preview failed';
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
    const message = error instanceof Error ? error.message : 'Sheet preview failed';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET/POST /api/design/drawings/svg/gad — POST body = full ProjectInput JSON (recommended)
 */
async function svgGadHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCompleteDesign(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generateGADSvg(enhancedInput as any));
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
router.get('/drawings/svg/gad', svgGadHandler);
router.post('/drawings/svg/gad', svgGadHandler);

async function svgPierHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCompleteDesign(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generatePierSvg(enhancedInput as any));
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
router.get('/drawings/svg/pier', svgPierHandler);
router.post('/drawings/svg/pier', svgPierHandler);

async function svgAbutmentHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCompleteDesign(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generateAbutmentSvg(enhancedInput as any));
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
router.get('/drawings/svg/abutment', svgAbutmentHandler);
router.post('/drawings/svg/abutment', svgAbutmentHandler);

async function svgSlabHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCompleteDesign(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generateSlabSvg(enhancedInput as any));
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
router.get('/drawings/svg/slab', svgSlabHandler);
router.post('/drawings/svg/slab', svgSlabHandler);

async function svgScourProfileHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCompleteDesign(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generateScourProfileSvg(enhancedInput as any));
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
router.get('/drawings/svg/scour-profile', svgScourProfileHandler);
router.post('/drawings/svg/scour-profile', svgScourProfileHandler);

async function svgPierStabilityHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCompleteDesign(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generatePierStabilitySvg(enhancedInput as any));
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
router.get('/drawings/svg/pier-stability', svgPierStabilityHandler);
router.post('/drawings/svg/pier-stability', svgPierStabilityHandler);

async function svgAbutmentPressureHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCompleteDesign(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generateAbutmentPressureSvg(enhancedInput as any));
  } catch (error: any) {
    // FIX-KERO-002: never leak stack traces to clients
    res.status(500).json({ success: false, error: error.message });
  }
}
router.get('/drawings/svg/abutment-pressure', svgAbutmentPressureHandler);
router.post('/drawings/svg/abutment-pressure', svgAbutmentPressureHandler);

async function svgSlabReinfPlanHandler(req: Request, res: Response) {
  try {
    const input = mergeInputFromRequest(req);
    const enhancedInput = { ...input, ...calculateCompleteDesign(input) };
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(generateSlabReinfPlanSvg(enhancedInput as any));
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    const designResults = calculateCompleteDesign(input);
    const enhancedInput = { ...input, ...designResults } as any;
    const buffer = await generateComprehensivePDF(enhancedInput);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Complete_46_Sheets.pdf"`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    const designResults = calculateCompleteDesign(input);
    const enhancedInput = { ...input, ...designResults } as any;
    const buffer = await generateDesignPDF(enhancedInput);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Report.pdf"`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    const designResults = calculateCompleteDesign(input);
    const enhancedInput = { ...input, ...designResults } as any;
    const dxfContent = generateBridgeDXF(enhancedInput, profile);
    res.setHeader('Content-Type', 'application/dxf');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Drawings.dxf"`);
    res.send(dxfContent);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    const designResults = calculateCompleteDesign(input);
    const { buildReportModel } = await import('../bridge-excel-generator/report-model');
    const enhancedInput = { ...input, ...designResults } as any;
    const model = buildReportModel(enhancedInput);
    res.json({ success: true, model });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    const designResults = calculateCompleteDesign(input);
    const enhancedInput = { ...input, ...designResults } as any;
    
    const html = generateHTMLDesignReport(enhancedInput);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Report.html"`);
    res.send(html);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    const designResults = calculateCompleteDesign(input);
    
    const validationReport = validateDesign(input, designResults);
    
    res.json({
      success: true,
      validation: validationReport
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    const designResults = calculateCompleteDesign(input);
    
    const validationReport = validateDesign(input, designResults);
    const html = generateValidationHTML(validationReport);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Validation.html"`);
    res.send(html);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    const designResults = calculateCompleteDesign(input);
    const enhancedInput = { ...input, ...designResults } as any;
    const reinforcement = calculateReinforcement(enhancedInput);
    res.json({ success: true, reinforcement });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    const designResults = calculateCompleteDesign(input);
    const enhancedInput = { ...input, ...designResults } as any;
    const svg = generateReinforcementDetailSVG(enhancedInput, element);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Reinforcement_${element}.svg"`);
    res.send(svg);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    const designResults = calculateCompleteDesign(input);
    const enhancedInput = { ...input, ...designResults } as any;
    const svg = generateReinforcementSectionSVG(enhancedInput, element);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${input.projectName.replace(/\s+/g, '_')}_Section_${element}.svg"`);
    res.send(svg);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    const designResults = calculateCompleteDesign(input);
    const estimation = calculateDetailedEstimation(input, designResults);
    res.json({ success: true, estimation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    const designResults = calculateCompleteDesign(input);
    const anchorage = calculateDeckAnchorage(input, designResults);
    res.json({ success: true, anchorage });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
 * POST /api/design/slabdraw-zip
 * Forwards the design input to the slabdraw service and streams back the
 * ZIP of 5 DXF sheets + BOQ.xlsx. Set SLABDRAW_URL in .env (defaults to
 * http://localhost:8000 in dev).
 */
router.post('/slabdraw-zip', async (req: Request, res: Response) => {
  const slabdrawUrl = (process.env.SLABDRAW_URL || 'http://localhost:8000').replace(/\/$/, '');

  try {
    const upstream = await fetch(`${slabdrawUrl}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body ?? {}),
    });

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

  try {
    const start = Date.now();
    const upstream = await fetch(`${slabdrawUrl}/healthz`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const duration = Date.now() - start;

    if (!upstream.ok) {
      res.status(upstream.status >= 400 && upstream.status < 500 ? 400 : 502)
         .json({ success: false, error: `slabdraw health check failed with status ${upstream.status}` });
      return;
    }

    const data = await upstream.json();
    res.json({
      success: true,
      latency: `${duration}ms`,
      ...data
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
