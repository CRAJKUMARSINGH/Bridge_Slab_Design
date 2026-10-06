/**
 * Workbook value-sanity verifier.
 *
 * The link auditor proves that references resolve and that a cached result still
 * matches its own arithmetic. It cannot see the case where BOTH sides are
 * garbage — a #DIV/0-style NaN reproduced faithfully. This sweep looks for the
 * garbage itself across every Phase-1 template:
 *  1. non-finite numbers (NaN / Infinity) in literal or cached cells;
 *  2. placeholder text that leaked out of a template string — 'undefined',
 *     'null', 'NaN', '[object Object]';
 *  3. formula cells missing their cached result (Excel would show 0/blank in
 *     previews that never recalculate).
 *
 * Run: npx tsx scripts/verify-workbook-value-sanity.ts
 */
import ExcelJS from 'exceljs';
import { generateCompleteExcel } from '../bridge-excel-generator/index.ts';
import { readCellValue } from '../bridge-excel-generator/utils.ts';
import type { ProjectInput } from '../bridge-excel-generator/types.ts';
import { PHASE1_QUICK_TEMPLATES } from '../server/default-project-inputs.ts';

const BAD_STRINGS = new Set(['undefined', 'null', 'NaN', 'nullnull', '[object Object]', 'Infinity', '-Infinity']);

type Findings = {
  nonFinite: string[];
  placeholderText: string[];
  missingResult: string[];
  cells: number;
  formulas: number;
};

function classify(v: any): { kind: 'ok' } | { kind: 'number'; value: number } | { kind: 'text'; value: string } | { kind: 'formula'; result: any } {
  if (v == null || v === '') return { kind: 'ok' };
  if (typeof v === 'number') return Number.isFinite(v) ? { kind: 'ok' } : { kind: 'number', value: v };
  if (typeof v === 'string') return BAD_STRINGS.has(v.trim()) ? { kind: 'text', value: v.trim() } : { kind: 'ok' };
  if (typeof v === 'object') {
    if ('formula' in v) return { kind: 'formula', result: (v as any).result };
    if ('result' in v) return { kind: 'formula', result: (v as any).result };
    if ('richText' in v) return { kind: 'ok' };
    // Hyperlink cells carry {text, hyperlink}; both are legitimately object-shaped.
    if ('hyperlink' in v || 'note' in v) return { kind: 'ok' };
    // Cached Excel errors (#REF!, #DIV/0! ...) are real defects, not placeholders.
    if ('error' in v) return { kind: 'text', value: `cached error ${String(v.error)}` };
    if (v instanceof Date) return { kind: 'ok' };
    return { kind: 'text', value: Object.prototype.toString.call(v) };
  }
  return { kind: 'ok' };
}

function checkValue(where: string, raw: any, findings: Findings) {
  const c = classify(raw);
  if (c.kind === 'number') findings.nonFinite.push(`${where} -> ${String(c.value)}`);
  if (c.kind === 'text') findings.placeholderText.push(`${where} -> ${JSON.stringify(c.value)}`);
  if (c.kind === 'formula') {
    findings.formulas++;
    const r = c.result;
    if (r === undefined || r === null || r === '') {
      findings.missingResult.push(where);
      return;
    }
    checkValue(`${where}[result]`, r, findings);
  }
}

async function auditTemplate(input: ProjectInput): Promise<Findings> {
  // Generators log one line per sheet; 20 workbooks would drown the verdict.
  const log = console.log;
  console.log = () => {};
  const buffer = await generateCompleteExcel(input);
  console.log = log;

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  const findings: Findings = { nonFinite: [], placeholderText: [], missingResult: [], cells: 0, formulas: 0 };
  for (const ws of wb.worksheets) {
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        findings.cells++;
        // readCellValue first: ExcelJS hides cached 0/FALSE behind cell.value.
        checkValue(`${ws.name}!${cell.address}`, readCellValue(cell), findings);
      });
    });
  }
  return findings;
}

async function main() {
  let totalCells = 0;
  let totalFormulas = 0;
  let defects = 0;

  for (const template of PHASE1_QUICK_TEMPLATES) {
    const input = (typeof template === 'object' && template && 'input' in template ? (template as any).input : template) as ProjectInput;
    const label = String((template as any)?.id ?? input?.projectName ?? 'template').slice(0, 42);
    const f = await auditTemplate(input);
    totalCells += f.cells;
    totalFormulas += f.formulas;

    const bad = f.nonFinite.length + f.placeholderText.length + f.missingResult.length;
    defects += bad;
    console.log(`${bad === 0 ? 'OK  ' : 'FAIL'} ${label.padEnd(42)} cells:${f.cells} formulas:${f.formulas} nonFinite:${f.nonFinite.length} placeholder:${f.placeholderText.length} missingResult:${f.missingResult.length}`);
    [...f.nonFinite, ...f.placeholderText, ...f.missingResult].forEach((m) => console.log(`       - ${m}`));
  }

  console.log(`\nTemplates: ${PHASE1_QUICK_TEMPLATES.length} | cells: ${totalCells} | formulas: ${totalFormulas} | defects: ${defects}`);
  if (defects > 0) process.exitCode = 1;
}

void main();
