/**
 * Regenerate the six review deliverables in test-output/ for the golden
 * Kherwara design. Run this after any sheet-generator or report change:
 *
 *   npx tsx scripts/regenerate-test-output.ts
 *
 * Files (all A4, 15 mm margins; sheet-book honours the orientation contract):
 *   design-workbook.xlsx      46-sheet live-linked workbook
 *   sheet-book.pdf            every worksheet, one sheet per page
 *   comprehensive-report.pdf  full IRC design narrative
 *   short-design-report.pdf   executive summary
 *   design-report.html        browsable design report
 *   irc-checklist.html        IRC clause compliance checklist
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine.ts';
import { generateCompleteExcel } from '../bridge-excel-generator/index.ts';
import type { EnhancedProjectInput } from '../bridge-excel-generator/types.ts';
import { generateComprehensivePDF } from '../server/comprehensive-pdf-export.ts';
import { generateDesignPDF } from '../server/pdf-export.ts';
import { generateLandscapeBookPDF } from '../server/landscape-pdf-export.ts';
import { generateHTMLDesignReport } from '../server/design-report.ts';
import { generateIrcChecklistHTML } from '../server/checklist-export.ts';
import { KHERWARA_REFERENCE_PROJECT_INPUT as input } from './fixtures/kherwara-project-input.ts';

// Anchored to the repo root, not process.cwd(): `pnpm run deliverables` executes this
// with cwd=scripts/, which used to write a second, divergent copy of the six files.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(repoRoot, 'test-output');
mkdirSync(outDir, { recursive: true });

const design = calculateCompleteDesign(input, { quiet: true });
const enhanced = { ...input, ...design } as EnhancedProjectInput;

const excel = await generateCompleteExcel(input);
const sheetBook = await generateLandscapeBookPDF(input);
const comprehensive = await generateComprehensivePDF(enhanced);
const short = await generateDesignPDF(enhanced);
const htmlReport = await generateHTMLDesignReport(enhanced);
const htmlChecklist = generateIrcChecklistHTML(enhanced, design);

writeFileSync(join(outDir, 'design-workbook.xlsx'), excel);
writeFileSync(join(outDir, 'sheet-book.pdf'), sheetBook);
writeFileSync(join(outDir, 'comprehensive-report.pdf'), comprehensive);
writeFileSync(join(outDir, 'short-design-report.pdf'), short);
writeFileSync(join(outDir, 'design-report.html'), htmlReport, 'utf-8');
writeFileSync(join(outDir, 'irc-checklist.html'), htmlChecklist, 'utf-8');

[
  ['design-workbook.xlsx', excel.length],
  ['sheet-book.pdf', sheetBook.length],
  ['comprehensive-report.pdf', comprehensive.length],
  ['short-design-report.pdf', short.length],
  ['design-report.html', htmlReport.length],
  ['irc-checklist.html', htmlChecklist.length],
].forEach(([name, bytes]) => console.log(`  ${String(name).padEnd(28)} ${Number(bytes).toLocaleString('en-US')} bytes`));
console.log(`\nWrote 6 deliverables to ${outDir}`);
