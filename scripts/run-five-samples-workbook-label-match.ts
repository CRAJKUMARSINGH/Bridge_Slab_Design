/**
 * Five template samples → generate Excel each.
 *
 * 1) INPUT-* sheets: multiset of static strings (column D skipped) must match Kherwara across all five runs
 *    (row layout can shift with cross-section length).
 * 2) Reference design workbook (first file found, in order):
 *      - Attached_Assets/Stability Analysis SUBMERSIBLE BRIDGE ACROSS LARATHI SOM RIVER.xls
 *      - REMOTE_APP/attached_assets/FINAL_RESULT.xls
 *      - REMOTE_APP/TEST_COMPLETE_46_SHEETS.xlsx
 *    Loaded with SheetJS for .xls/.xlsx. For each sheet name present in **both** reference and generated
 *    (Kherwara) workbook: compare static text cell-by-cell (skip formulas, skip numeric cells, skip col D on INPUT-*).
 *
 * Run: npx tsx scripts/run-five-samples-workbook-label-match.ts
 * Out: archive/test-outputs/workbook-label-match-report.{json,html}
 */

import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import type { ProjectInput } from '../bridge-excel-generator/types';
import { mergeProjectInput, PHASE1_QUICK_TEMPLATES } from '../server/default-project-inputs';

const REPORT_DIR = path.resolve('archive/test-outputs');
const REPORT_JSON = path.join(REPORT_DIR, 'workbook-label-match-report.json');
const REPORT_HTML = path.join(REPORT_DIR, 'workbook-label-match-report.html');

/** User design samples — LARATHI workbook first (25 sheets); then full 46-sheet template. */
const REFERENCE_CANDIDATES = [
  path.resolve('Attached_Assets/Stability Analysis SUBMERSIBLE BRIDGE ACROSS LARATHI SOM RIVER.xls'),
  path.resolve('REMOTE_APP/attached_assets/FINAL_RESULT.xls'),
  path.resolve('REMOTE_APP/TEST_COMPLETE_46_SHEETS.xlsx'),
];

const INPUT_TEMPLATE_SHEETS = ['INPUT-HYDRAULICS', 'INPUT-PIER-STABILITY', 'INPUT-ABUTMENT-STABILITY'] as const;
const MAX_ROW = 220;
const MAX_COL = 8;
const SKIP_COLS = new Set([4]);

const MAX_REF_ROW_SCAN = 500;
const MAX_REF_COL_SCAN = 30;
const MAX_REF_ISSUES = 12000;

type Multiset = Map<string, number>;

type RefCellIssue = {
  sheet: string;
  row: number;
  col: number;
  kind: 'reference_static_mismatch';
  reference?: string;
  generated?: string;
};

type MultisetIssue = {
  sheet: string;
  kind: 'input_multiset_mismatch';
  baselineSampleId: string;
  otherSampleId: string;
  onlyInBaseline: [string, number][];
  onlyInOther: [string, number][];
  countDiffs: { text: string; baseline: number; other: number }[];
};

function colLetter(c1: number): string {
  let s = '';
  let n = c1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function pickReferencePath(): string | null {
  for (const p of REFERENCE_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadReferenceWorkbook(filePath: string): XLSX.WorkBook {
  const buf = fs.readFileSync(filePath);
  return XLSX.read(buf, { type: 'buffer', cellDates: true });
}

/** Reference cell: skip formulas and numeric-only (treat as data). */
function xlsxPrimitiveString(sheet: XLSX.WorkSheet, r0: number, c0: number): string | null {
  const addr = XLSX.utils.encode_cell({ r: r0, c: c0 });
  const cell = sheet[addr] as XLSX.CellObject | undefined;
  if (!cell) return null;
  if (cell.f != null && String(cell.f).length > 0) return null;
  if (cell.t === 'n') return null;
  if (cell.t === 'b') return null;
  const raw = (cell.w ?? (cell.v == null ? '' : String(cell.v))).trim();
  if (!raw) return null;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/i.test(raw)) return null;
  return raw;
}

function isFormulaCell(cell: ExcelJS.Cell): boolean {
  const v = cell.value as { formula?: string } | null | undefined;
  return Boolean(v && typeof v === 'object' && typeof (v as { formula?: string }).formula === 'string');
}

function primitiveString(cell: ExcelJS.Cell): string | null {
  if (isFormulaCell(cell)) return null;
  const v = cell.value;
  if (v == null || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return null;
  if (typeof v === 'boolean') return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return null;
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t)) return null;
    return t;
  }
  if (typeof v === 'object' && v !== null && 'richText' in v) {
    const rt = (v as ExcelJS.CellRichTextValue).richText?.map((r) => r.text).join('') ?? '';
    const t = rt.trim();
    return t || null;
  }
  if (typeof v === 'object' && v !== null && 'text' in v && typeof (v as { text: string }).text === 'string') {
    const t = (v as { text: string }).text.trim();
    return t || null;
  }
  return null;
}

function normalizeLabel(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function collectMultiset(ws: ExcelJS.Worksheet): Multiset {
  const m: Multiset = new Map();
  for (let r = 1; r <= MAX_ROW; r++) {
    for (let c = 1; c <= MAX_COL; c++) {
      if (SKIP_COLS.has(c)) continue;
      const raw = primitiveString(ws.getRow(r).getCell(c));
      if (!raw) continue;
      const k = normalizeLabel(raw);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
  }
  return m;
}

function multisetDiff(a: Multiset, b: Multiset): { onlyA: [string, number][]; onlyB: [string, number][]; count: { t: string; na: number; nb: number }[] } {
  const onlyA: [string, number][] = [];
  const onlyB: [string, number][] = [];
  const count: { t: string; na: number; nb: number }[] = [];
  const keys = new Set([...a.keys(), ...b.keys()]);
  for (const t of keys) {
    const na = a.get(t) ?? 0;
    const nb = b.get(t) ?? 0;
    if (na === nb) continue;
    if (na > nb) onlyA.push([t, na - nb]);
    if (nb > na) onlyB.push([t, nb - na]);
    if (na !== 0 && nb !== 0 && na !== nb) count.push({ t, na, nb });
  }
  return { onlyA, onlyB, count };
}

function multisetsEqual(a: Multiset, b: Multiset): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    if ((b.get(k) ?? 0) !== v) return false;
  }
  return true;
}

function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  return wb.xlsx.load(buffer);
}

async function workbookFromInput(input: ProjectInput): Promise<ExcelJS.Workbook> {
  const buf = await generateCompleteExcel(input);
  return loadWorkbook(buf);
}

function getSheet(wb: ExcelJS.Workbook, name: string): ExcelJS.Worksheet | undefined {
  return wb.getWorksheet(name) ?? wb.worksheets.find((w) => w.name === name);
}

function skipValueColumnD(sheetName: string, c0: number): boolean {
  return sheetName.startsWith('INPUT-') && c0 === 3;
}

function compareReferenceSheetsToGenerated(
  refWb: XLSX.WorkBook,
  genWb: ExcelJS.Workbook,
): { issues: RefCellIssue[]; sheetsCompared: string[]; refOnlySheets: string[]; genOnlySheets: string[] } {
  const issues: RefCellIssue[] = [];
  const genNames = new Set(genWb.worksheets.map((w) => w.name));
  const refNames = refWb.SheetNames;
  const refOnly = refNames.filter((n) => !genNames.has(n));
  const genOnly = [...genNames].filter((n) => !refNames.includes(n));
  const compared: string[] = [];

  for (const sheetName of refNames) {
    if (issues.length >= MAX_REF_ISSUES) break;
    const genWs = getSheet(genWb, sheetName);
    if (!genWs) continue;
    const refSheet = refWb.Sheets[sheetName];
    if (!refSheet?.['!ref']) continue;
    compared.push(sheetName);

    const range = XLSX.utils.decode_range(refSheet['!ref'] as string);
    const rEnd = Math.min(range.e.r, range.s.r + MAX_REF_ROW_SCAN);
    const cEnd = Math.min(range.e.c, range.s.c + MAX_REF_COL_SCAN);

    for (let r0 = range.s.r; r0 <= rEnd && issues.length < MAX_REF_ISSUES; r0++) {
      for (let c0 = range.s.c; c0 <= cEnd && issues.length < MAX_REF_ISSUES; c0++) {
        if (skipValueColumnD(sheetName, c0)) continue;
        const rs = xlsxPrimitiveString(refSheet, r0, c0);
        const gs = primitiveString(genWs.getRow(r0 + 1).getCell(c0 + 1));
        if (rs == null && gs == null) continue;
        if (normalizeLabel(rs ?? '') !== normalizeLabel(gs ?? '')) {
          issues.push({
            sheet: sheetName,
            row: r0 + 1,
            col: c0 + 1,
            kind: 'reference_static_mismatch',
            reference: rs ?? '(empty / formula / number)',
            generated: gs ?? '(empty / formula / number)',
          });
        }
      }
    }
  }

  return {
    issues,
    sheetsCompared: compared,
    refOnlySheets: refOnly,
    genOnlySheets: genOnly,
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function main(): Promise<void> {
  const samples: { id: string; name: string; input: ProjectInput }[] = [
    ...PHASE1_QUICK_TEMPLATES.map((t) => ({ id: t.id, name: t.name, input: t.input })).slice(0, 4),
    {
      id: 'phase1-default',
      name: 'Phase 1 canonical defaults',
      input: mergeProjectInput({ projectName: 'Phase 1 canonical defaults' }),
    },
  ];

  if (samples.length !== 5) {
    console.error(`Expected 5 samples, got ${samples.length}.`);
    process.exit(1);
  }

  console.log('Generating 5 workbooks…');
  const workbooks = await Promise.all(samples.map((s) => workbookFromInput(s.input)));
  const multisetIssues: MultisetIssue[] = [];

  const baselineId = samples[0].id;
  const baselineWb = workbooks[0];

  for (const sheetName of INPUT_TEMPLATE_SHEETS) {
    const baseWs = getSheet(baselineWb, sheetName);
    if (!baseWs) {
      multisetIssues.push({
        sheet: sheetName,
        kind: 'input_multiset_mismatch',
        baselineSampleId: baselineId,
        otherSampleId: '(missing)',
        onlyInBaseline: [[`missing sheet ${sheetName}`, 1]],
        onlyInOther: [],
        countDiffs: [],
      });
      continue;
    }
    const baseM = collectMultiset(baseWs);
    for (let i = 1; i < workbooks.length; i++) {
      const ws = getSheet(workbooks[i], sheetName);
      if (!ws) continue;
      const m = collectMultiset(ws);
      if (!multisetsEqual(baseM, m)) {
        const d = multisetDiff(baseM, m);
        multisetIssues.push({
          sheet: sheetName,
          kind: 'input_multiset_mismatch',
          baselineSampleId: baselineId,
          otherSampleId: samples[i].id,
          onlyInBaseline: d.onlyA,
          onlyInOther: d.onlyB,
          countDiffs: d.count.map((x) => ({ text: x.t, baseline: x.na, other: x.nb })),
        });
      }
    }
  }

  const refPath = pickReferencePath();
  let refCompare: ReturnType<typeof compareReferenceSheetsToGenerated> | null = null;
  if (refPath) {
    const refXlsx = loadReferenceWorkbook(refPath);
    refCompare = compareReferenceSheetsToGenerated(refXlsx, baselineWb);
  }

  const refIssues = refCompare?.issues ?? [];
  const issuesStored = refIssues.slice(0, MAX_REF_ISSUES);

  const bySheet: Record<string, number> = {};
  for (const it of refIssues) {
    bySheet[it.sheet] = (bySheet[it.sheet] ?? 0) + 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    referencePath: refPath,
    referenceCandidates: REFERENCE_CANDIDATES,
    samples: samples.map((s) => ({ id: s.id, name: s.name })),
    summary: {
      inputMultisetMismatchesVsKherwara: multisetIssues.length,
      referenceStaticMismatches: refIssues.length,
      referenceIssuesTruncated: refIssues.length >= MAX_REF_ISSUES,
      sheetsComparedToReference: refCompare?.sheetsCompared ?? [],
      referenceSheetsNotInGenerated: refCompare?.refOnlySheets ?? [],
      generatedSheetsNotInReference: refCompare?.genOnlySheets ?? [],
      referenceMismatchesBySheet: bySheet,
      methodology:
        'Reference = first existing file in REFERENCE_CANDIDATES (LARATHI SOM RIVER.xls preferred). Static text only: SheetJS skips formula and numeric cells; ExcelJS generated side same; column D skipped on INPUT-* sheets. Up to ' +
        MAX_REF_ISSUES +
        ' mismatches recorded.',
    },
    multisetIssues,
    referenceIssues: issuesStored,
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2), 'utf8');

  const ok = multisetIssues.length === 0 && refIssues.length === 0;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Workbook label match</title>
<style>body{font-family:system-ui,sans-serif;max-width:960px;margin:2rem auto;padding:0 1rem} table{border-collapse:collapse;width:100%;font-size:13px} th,td{border:1px solid #ccc;padding:6px;text-align:left} .ok{color:green} .bad{color:#b00} pre{white-space:pre-wrap;font-size:11px}</style></head><body>
<h1>Workbook label match (5 samples)</h1>
<p>Reference file: <code>${escapeHtml(refPath ?? 'none')}</code></p>
<p>Sheets compared (name intersection): <strong>${(refCompare?.sheetsCompared ?? []).length}</strong> — ${escapeHtml((refCompare?.sheetsCompared ?? []).join(', '))}</p>
<p class="${ok ? 'ok' : 'bad'}"><strong>${ok ? 'PASS' : 'FAIL'}</strong> — INPUT multiset drift: ${multisetIssues.length}; reference static text mismatches: ${refIssues.length}${refIssues.length >= MAX_REF_ISSUES ? ' (truncated)' : ''}</p>
<h2>Reference vs generated (first 40 issues)</h2>
${refIssues.length === 0 ? '<p>None.</p>' : `<table><thead><tr><th>Cell</th><th>Reference</th><th>Generated (${escapeHtml(baselineId)})</th></tr></thead><tbody>${refIssues.slice(0, 40).map((i) => `<tr><td>${escapeHtml(i.sheet)}!${colLetter(i.col)}${i.row}</td><td>${escapeHtml(i.reference ?? '')}</td><td>${escapeHtml(i.generated ?? '')}</td></tr>`).join('')}</tbody></table>`}
<h2>INPUT template multiset issues</h2>
${multisetIssues.length === 0 ? '<p>None.</p>' : `<table><thead><tr><th>Sheet</th><th>vs sample</th><th>Only in Kherwara</th><th>Only in other</th></tr></thead><tbody>${multisetIssues.map((i) => `<tr><td>${escapeHtml(i.sheet)}</td><td>${escapeHtml(i.otherSampleId)}</td><td><pre>${escapeHtml(JSON.stringify(i.onlyInBaseline.slice(0, 15), null, 0))}</pre></td><td><pre>${escapeHtml(JSON.stringify(i.onlyInOther.slice(0, 15), null, 0))}</pre></td></tr>`).join('')}</tbody></table>`}
<p>Full JSON: <code>archive/test-outputs/workbook-label-match-report.json</code></p>
</body></html>`;
  fs.writeFileSync(REPORT_HTML, html, 'utf8');

  console.log('\n=== Workbook label match (5 samples) ===');
  console.log('Reference:', refPath ?? '(none)');
  console.log('Sheets compared:', (refCompare?.sheetsCompared ?? []).join(', ') || '(none)');
  console.log('INPUT multiset mismatches vs', baselineId + ':', multisetIssues.length);
  console.log('Reference static mismatches:', refIssues.length);
  console.log('JSON:', REPORT_JSON);
  console.log('HTML:', REPORT_HTML);

  if (!ok) process.exitCode = 1;
  else console.log('\nOK: INPUT wording inventory matches across five samples; reference static text matches.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
