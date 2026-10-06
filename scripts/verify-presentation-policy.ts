/**
 * Presentation-policy gate: proves the A4 / 15 mm / orientation contract on the
 * artefacts themselves instead of trusting the writer code.
 *
 * Three measured lanes:
 *   1. workbook  — every generated worksheet's pageSetup (both book shapes)
 *   2. @page CSS — every print rule in the client/server source lanes
 *   3. PDF pages — MediaBox geometry of the files under test-output/
 *
 * Run: pnpm run verify:presentation
 */

import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import { EXPECTED_SHEET_NAMES, isLandscapeSheet } from '../bridge-excel-generator/sheet-contract';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from './fixtures/kherwara-project-input';

const REPO = path.resolve(import.meta.dirname, '..');
const MM = 1 / 25.4; // ExcelJS pageSetup margins are inches
const OWNER_TABULATION_46 = [
  'afflux calculation',
  'Deck Anchorage',
  'STABILITY CHECK FOR PIER',
  'abstract of stresses',
  'Pier Cap LL tracked vehicle',
  'Pier Cap',
  'LLOAD',
  'loadsumm',
  'LL-ABSTRACT',
  'TYPE1-AbutMENT Drawing',
  'TYPE1-STABILITY CHECK ABUTMENT',
  'C1-AbutMENT Drawing',
  'C1-STABILITY CHECK ABUTMENT',
] as const;

// A4 in PostScript points, and the print-media tolerance for the PDF scan.
const A4 = { w: 595.28, h: 841.89 };
const PT_TOL = 1.5;

const failures: string[] = [];
const check = (cond: boolean, msg: string) => {
  if (!cond) failures.push(msg);
};

async function checkWorkbook(label: string, book: 'executive-56' | 'legacy-46'): Promise<void> {
  const buffer = await generateCompleteExcel(KHERWARA_REFERENCE_PROJECT_INPUT, { book });
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  for (const ws of wb.worksheets) {
    const ps = ws.pageSetup;
    const where = `${label} · ${ws.name}`;
    if (!ps) {
      check(false, `${where}: no pageSetup written`);
      continue;
    }
    check(ps.paperSize === 9, `${where}: paperSize ${ps.paperSize} is not A4 (9)`);
    check(ps.fitToPage === true, `${where}: fitToPage not enabled`);
    const want = isLandscapeSheet(ws.name) ? 'landscape' : 'portrait';
    check(ps.orientation === want, `${where}: orientation ${ps.orientation}, contract wants ${want}`);
    for (const side of ['left', 'right', 'top', 'bottom'] as const) {
      const value = ps.margins?.[side];
      check(
        typeof value === 'number' && Math.abs(value - 15 * MM) < 0.01 * MM,
        `${where}: ${side} margin ${value}in is not 15 mm`,
      );
    }
  }

  const names = wb.worksheets.map((ws) => ws.name);
  for (const name of OWNER_TABULATION_46) {
    check(names.includes(name), `${label}: owner-tabulated sheet "${name}" missing from the book`);
  }
  console.log(
    `  workbook [${label}]: ${names.length} sheets, ` +
      `${names.filter((n) => isLandscapeSheet(n)).length} landscape / ` +
      `${names.filter((n) => !isLandscapeSheet(n)).length} portrait`,
  );
}

type PageRule = { file: string; selector: string; size: string; margin: string };

function collectPageRules(dir: string, acc: PageRule[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') collectPageRules(abs, acc);
      continue;
    }
    if (!/\.(css|ts|tsx)$/.test(entry.name) || entry.name.endsWith('.d.ts')) continue;
    const source = fs.readFileSync(abs, 'utf8');
    const pattern = /@page\s*(:[a-z-]+)?\s*\{([^}]*)\}/g;
    for (const match of source.matchAll(pattern)) {
      const body = match[2];
      const rel = path.relative(REPO, abs).replace(/\\/g, '/');
      acc.push({
        file: rel,
        selector: `@page${match[1] ?? ''}`,
        size: /size\s*:\s*([^;]+);/.exec(body)?.[1].trim() ?? '',
        margin: /margin\s*:\s*([^;]+);/.exec(body)?.[1].trim() ?? '',
      });
    }
  }
}

// The cover page of the STRUDS report is a full-bleed 297 x 210 box drawn by the
// stylesheet itself; it can only be honoured with a zero page margin.
const MARGIN_EXCEPTIONS: Record<string, string> = {
  'client/src/styles/struds-report.css::@page:first': 'full-bleed cover page',
};

function checkPageRules(): void {
  const rules: PageRule[] = [];
  for (const dir of ['client/src', 'server', 'bridge-excel-generator', 'pipeline']) {
    collectPageRules(path.join(REPO, dir), rules);
  }
  check(rules.length >= 5, `only ${rules.length} @page rules found — the scanner has lost its sources`);
  const byFile = new Map<string, PageRule[]>();
  for (const rule of rules) {
    const key = `${rule.file}::${rule.selector}`;
    const allowed = MARGIN_EXCEPTIONS[key];
    if (allowed) console.log(`  @page      : ${key} margin "${rule.margin}" — allowed (${allowed})`);
    if (rule.size) check(/a4/i.test(rule.size), `${key}: @page size is "${rule.size}", must name A4`);
    // A rule that names no size inherits it, so only the pseudo-less rules can carry the obligation.
    const group = byFile.get(rule.file) ?? [];
    group.push(rule);
    byFile.set(rule.file, group);
    if (allowed) continue;
    const sides = rule.margin.split(/\s+/).filter(Boolean);
    check(
      sides.length > 0 && sides.every((s) => s === '15mm'),
      `${key}: @page margin "${rule.margin}" is not 15 mm on all sides`,
    );
  }
  for (const [file, group] of byFile) {
    check(
      group.some((r) => /a4/i.test(r.size)),
      `${file}: no @page rule names A4`,
    );
  }
  console.log(`  @page      : ${rules.length} print rules scanned in client/server/pipeline sources`);
}

function checkPdfGeometry(): void {
  const outDir = path.join(REPO, 'test-output');
  if (!fs.existsSync(outDir)) {
    console.log('  pdf pages  : test-output/ absent — skipped (run `pnpm run deliverables`)');
    return;
  }
  const files = fs.readdirSync(outDir).filter((f) => f.endsWith('.pdf'));
  check(files.length > 0, 'test-output/ has no PDFs to measure');
  for (const file of files) {
    const text = fs.readFileSync(path.join(outDir, file)).toString('latin1');
    const boxes = [...text.matchAll(/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/g)];
    check(boxes.length > 0, `${file}: no MediaBox found — page geometry unverifiable`);
    let landscape = 0;
    boxes.forEach((box, index) => {
      const w = Number(box[3]);
      const h = Number(box[4]);
      const portrait = Math.abs(w - A4.w) < PT_TOL && Math.abs(h - A4.h) < PT_TOL;
      const wide = Math.abs(w - A4.h) < PT_TOL && Math.abs(h - A4.w) < PT_TOL;
      check(portrait || wide, `${file}: page ${index + 1} is ${w}x${h} pt, not A4`);
      if (wide) landscape += 1;
    });
    console.log(
      `  pdf pages  : ${file} — ${boxes.length} pages, ${landscape} landscape / ${boxes.length - landscape} portrait`,
    );
  }
}

async function main(): Promise<void> {
  check(EXPECTED_SHEET_NAMES.length === 56, 'sheet contract is no longer 56 sheets');
  await checkWorkbook('executive-56', 'executive-56');
  await checkWorkbook('legacy-46', 'legacy-46');
  checkPageRules();
  checkPdfGeometry();

  if (failures.length) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`verify-presentation-policy: FAILED (${failures.length} problem(s))`);
    process.exit(1);
  }
  console.log('verify-presentation-policy: OK (A4 / 15 mm / orientation proven on artefacts)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
