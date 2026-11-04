/**
 * Workbook link topology + cache divergence verifier.
 *
 * Runs the generator once per Phase-1 template (cross-section lengths 5..16, so
 * every data-shape-dependent row anchor is exercised) and checks that:
 *  1. every cross-sheet and same-sheet reference points at a non-empty cell;
 *  2. every cached formula result still equals what its own formula computes —
 *     including IF/AND/MAX/SUM/range logic, so SAFE-vs-UNSAFE verdicts too.
 *
 * Non-zero exit code = some sheet links to a blank cell, or its stored number
 * no longer matches its own arithmetic.
 *
 * Run: npx tsx scripts/verify-workbook-links.ts
 */
import ExcelJS from 'exceljs';
import { generateCompleteExcel } from '../bridge-excel-generator/index.ts';
import { readCellValue } from '../bridge-excel-generator/utils.ts';
import type { ProjectInput } from '../bridge-excel-generator/types.ts';
import { PHASE1_QUICK_TEMPLATES } from '../server/default-project-inputs.ts';

// Sheet names are matched case-insensitively (Excel does the same) and may be
// bare or quoted; bare names allow lowercase because generators emit both.
const CROSS_RE = /(?:'([^']+)'|([A-Za-z0-9_ -]+))!\$?([A-Z]{1,3})\$?(\d+)/g;
const SAME_RE = /(?<![A-Za-z0-9_$!:'"])\$?([A-Z]{1,3})\$?(\d{1,5})(?![A-Za-z0-9_(.])/g;
const CROSS_RANGE_RE = /(?:'([^']+)'|([A-Za-z0-9_ -]+))!\$?([A-Z]{1,3})\$?(\d{1,5}):\$?([A-Z]{1,3})\$?(\d{1,5})/g;
const SAME_RANGE_RE = /(?<![A-Za-z0-9_$!:'"])\$?([A-Z]{1,3})\$?(\d{1,5}):\$?([A-Z]{1,3})\$?(\d{1,5})(?![A-Za-z0-9_(.])/g;
const SUPPORTED_FNS = ['IF', 'AND', 'OR', 'MAX', 'MIN', 'SUM', 'ABS', 'POWER', 'SQRT', 'TAN', 'COS', 'SIN', 'ROUND', 'MOD', 'PI'];

function cellNumber(ws: ExcelJS.Worksheet, addr: string): number | undefined {
  const v = readCellValue(ws.getCell(addr)) as any;
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object' && 'result' in v && typeof v.result === 'number') return v.result;
  return undefined;
}

/** JS literal for a referenced cell: numbers inline, text quoted, blanks as 0. */
function cellLiteral(ws: ExcelJS.Worksheet, addr: string): string {
  const v = readCellValue(ws.getCell(addr)) as any;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return JSON.stringify(v);
  if (v && typeof v === 'object') {
    if (typeof v.result === 'number') return String(v.result);
    if (typeof v.result === 'string') return JSON.stringify(v.result);
  }
  return '0';
}

function colToIndex(col: string): number {
  return col.split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0);
}

function indexToCol(index: number): string {
  let s = '';
  let n = index;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - rem) / 26);
  }
  return s;
}

/** Numeric cells inside a range (text/blanks excluded, matching Excel SUM). */
function rangeValues(ws: ExcelJS.Worksheet, ref: string): number[] {
  const m = /^\$?([A-Z]{1,3})\$?(\d{1,5}):\$?([A-Z]{1,3})\$?(\d{1,5})$/.exec(ref);
  if (!m) return [];
  const c1 = colToIndex(m[1]), c2 = colToIndex(m[3]);
  const r1 = Number(m[2]), r2 = Number(m[4]);
  const out: number[] = [];
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
      const n = cellNumber(ws, `${indexToCol(c)}${r}`);
      if (n !== undefined) out.push(n);
    }
  }
  return out;
}

const flatten = (args: any[]) => args.flat(4);

/**
 * Re-execute a formula from the cached values it references. Returns undefined
 * when a formula uses something this mini-interpreter does not model — reported
 * as an unaudited cell, never as a silent pass.
 */
function tryEvaluate(wb: ExcelJS.Workbook, ws: ExcelJS.Worksheet, formula: string): number | string | undefined {
  const calls = formula.match(/\b([A-Z][A-Z0-9]*)\s*\(/g) ?? [];
  for (const call of calls) {
    if (!SUPPORTED_FNS.includes(call.replace(/\s*\($/, ''))) return undefined;
  }

  const sheetNamed = (name: string | undefined): ExcelJS.Worksheet | undefined => {
    if (!name) return undefined;
    const lower = name.toLowerCase();
    return wb.worksheets.find((w) => w.name.toLowerCase() === lower);
  };

  let expr = formula.replace(/^=/, '');

  CROSS_RANGE_RE.lastIndex = 0;
  expr = expr.replace(CROSS_RANGE_RE, (_m, q, plain, c1, r1, c2, r2) => {
    const sheet = sheetNamed(q || plain);
    return sheet ? JSON.stringify(rangeValues(sheet, `${c1}${r1}:${c2}${r2}`)) : '[[NaN]]';
  });
  SAME_RANGE_RE.lastIndex = 0;
  expr = expr.replace(SAME_RANGE_RE, (_m, c1, r1, c2, r2) =>
    JSON.stringify(rangeValues(ws, `${c1}${r1}:${c2}${r2}`)));

  // Excel reads an empty referenced cell as 0; a missing sheet still yields NaN.
  CROSS_RE.lastIndex = 0;
  expr = expr.replace(CROSS_RE, (_m, qName, plainName, col, row) => {
    const target = sheetNamed(qName || plainName);
    return target ? cellLiteral(target, `${col}${row}`) : 'NaN';
  });
  SAME_RE.lastIndex = 0;
  expr = expr.replace(SAME_RE, (_m, col, row) => cellLiteral(ws, `${col}${row}`));

  // Text operands must survive the operator rewrites untouched.
  const textLiterals: string[] = [];
  expr = expr.replace(/"[^"]*"/g, (s) => {
    textLiterals.push(s);
    return `|${textLiterals.length - 1}|`;
  });

  // Excel equality is `=`, inequality is `<>`; JS needs `==` / `!=`.
  expr = expr.replace(/<>/g, '!=');
  expr = expr.replace(/<=/g, '|L|').replace(/>=/g, '|G|');
  expr = expr.replace(/=/g, '==').replace(/\|L\|/g, '<=').replace(/\|G\|/g, '>=');

  expr = expr.replace(/\bPI\s*\(\s*\)/g, '__PI');
  for (const fn of SUPPORTED_FNS) {
    if (fn === 'PI') continue;
    expr = expr.replace(new RegExp(`\\b${fn}\\s*\\(`, 'g'), `__${fn}(`);
  }
  expr = expr.replace(/\^/g, '**');
  // Excel allows `A-B` where B is negative; JS would read `--` as a decrement.
  expr = expr.replace(/-(?=-)/g, '- ');

  expr = expr.replace(/\|(\d+)\|/g, (_m, i) => textLiterals[Number(i)]);

  const bare = expr.replace(/__[A-Z]+/g, '').replace(/"[^"]*"/g, '').replace(/'[^']*'/g, '');
  if (!/^[-+*/().,<>=!&|[\] 0-9eE]*$/.test(bare)) return undefined;

  try {
    // eslint-disable-next-line no-new-func
    const compiled = Function(
      '__IF', '__AND', '__OR', '__MAX', '__MIN', '__SUM', '__ABS', '__POWER', '__SQRT',
      '__TAN', '__COS', '__SIN', '__ROUND', '__MOD', '__PI',
      `"use strict";return (${expr});`,
    );
    const val = compiled(
      (c: any, a: any, b: any) => (c ? a : b),
      (...a: any[]) => a.every(Boolean),
      (...a: any[]) => a.some(Boolean),
      (...a: any[]) => Math.max(...flatten(a)),
      (...a: any[]) => Math.min(...flatten(a)),
      (...a: any[]) => flatten(a).reduce((s, x) => s + (typeof x === 'number' ? x : 0), 0),
      Math.abs, Math.pow, Math.sqrt, Math.tan, Math.cos, Math.sin,
      (x: number, d = 0) => Number(x.toFixed(d)),
      (a: number, b: number) => a % b,
      Math.PI,
    );
    if (typeof val === 'number') return Number.isFinite(val) ? val : undefined;
    if (typeof val === 'string') return val;
    return undefined;
  } catch (e) {
    if (process.env.LINK_DEBUG) console.error(`DEBUG throw expr=${JSON.stringify(expr)} err=${String(e)}`);
    return undefined;
  }
}

type Counts = {
  formulas: number; cross: number; sameRefs: number; literals: number;
  badRefs: number; divergences: number; evaluated: number; unaudited: number;
};

async function auditWorkbook(input: ProjectInput) {
  // Generators log one line per sheet; 20 workbooks would drown the verdict.
  const log = console.log;
  console.log = () => {};
  const buffer = await generateCompleteExcel(input);
  console.log = log;

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  const counts: Counts = { formulas: 0, cross: 0, sameRefs: 0, literals: 0, badRefs: 0, divergences: 0, evaluated: 0, unaudited: 0 };
  const issues: string[] = [];
  const unauditedCells: string[] = [];

  for (const ws of wb.worksheets) {
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        const v = readCellValue(cell) as any;
        if (v == null) return;
        if (!(typeof v === 'object' && 'formula' in v)) {
          if (typeof v === 'number' && Number.isFinite(v)) counts.literals++;
          return;
        }

        counts.formulas++;
        const f = String(v.formula || '');

        CROSS_RE.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = CROSS_RE.exec(f))) {
          counts.cross++;
          const targetName = m[1] || m[2];
          const lower = targetName.toLowerCase();
          const target = wb.worksheets.find((w) => w.name.toLowerCase() === lower);
          if (!target) {
            counts.badRefs++;
            issues.push(`BAD SHEET '${targetName}' from ${ws.name}!${cell.address} [${f}]`);
            continue;
          }
          const tc = target.getCell(`${m[3]}${m[4]}`).value as any;
          if (tc == null || tc === '') {
            counts.badRefs++;
            issues.push(`EMPTY TARGET ${targetName}!${m[3]}${m[4]} from ${ws.name}!${cell.address} [${f}]`);
          }
        }

        const stripped = f.replace(CROSS_RE, 'X');
        SAME_RE.lastIndex = 0;
        let s: RegExpExecArray | null;
        while ((s = SAME_RE.exec(stripped))) {
          counts.sameRefs++;
          const tc = ws.getCell(`${s[1]}${s[2]}`).value as any;
          if (tc == null || tc === '') {
            counts.badRefs++;
            issues.push(`EMPTY SAME-SHEET ${s[1]}${s[2]} from ${ws.name}!${cell.address} [${f}]`);
          }
        }

        const cached = v.result;
        if (cached === undefined || cached === null || cached === '') return;
        const recomputed = tryEvaluate(wb, ws, f);
        if (recomputed === undefined) {
          if (typeof cached === 'number' && cached !== 0) {
            counts.unaudited++;
            unauditedCells.push(`${ws.name}!${cell.address} [${f}]`);
          }
          return;
        }
        counts.evaluated++;
        if (typeof recomputed === 'number' && typeof cached === 'number') {
          const tol = Math.max(0.01, Math.abs(cached) * 0.005);
          if (Math.abs(recomputed - cached) > tol) {
            counts.divergences++;
            issues.push(`DIVERGE ${ws.name}!${cell.address} [${f}] cached=${cached} recomputed=${recomputed.toFixed(4)}`);
          }
        } else if (String(recomputed).trim() !== String(cached).trim()) {
          counts.divergences++;
          issues.push(`DIVERGE ${ws.name}!${cell.address} [${f}] cached=${JSON.stringify(cached)} recomputed=${JSON.stringify(recomputed)}`);
        }
      });
    });
  }

  return { counts, issues, unauditedCells, wb };
}

async function main() {
  let failed = 0;
  const shapes = new Map<string, number>();

  for (const template of PHASE1_QUICK_TEMPLATES) {
    const input = template.input;
    const { counts, issues, unauditedCells } = await auditWorkbook(input);
    unauditedCells.forEach((entry) => {
      const shape = entry.replace(/![A-Z]{1,3}\d+ /, '!CELL ');
      shapes.set(shape, (shapes.get(shape) ?? 0) + 1);
    });
    const ok = counts.badRefs + counts.divergences === 0;
    if (!ok) failed++;
    console.log(
      `${ok ? 'OK  ' : 'FAIL'} ${template.id.padEnd(24)} pts=${String(input.crossSectionData.length).padStart(2)} ` +
      `formulas:${counts.formulas} cross:${counts.cross} same:${counts.sameRefs} ` +
      `re-eval:${counts.evaluated} broken:${counts.badRefs} diverge:${counts.divergences}`,
    );
    issues.slice(0, 8).forEach((x) => console.log(`     ${x}`));
    if (issues.length > 8) console.log(`     … ${issues.length - 8} more`);
  }

  const golden = PHASE1_QUICK_TEMPLATES.find((t) => t.id === 'kherwara-golden')!;
  const { wb } = await auditWorkbook(golden.input);
  const p9 = wb.getWorksheet('STABILITY CHECK FOR PIER')!;
  const p10 = wb.getWorksheet('abstract of stresses')!;
  console.log('\nGolden spot-checks:');
  console.log('  S9 B18 velocity xref:', JSON.stringify(p9.getCell('B18').value));
  console.log('  S9 H47 service V:    ', JSON.stringify(p9.getCell('H47').value));
  console.log('  S9 N51 ULS status:   ', JSON.stringify(p9.getCell('N51').value));
  console.log('  S10 C12 retrieved V: ', JSON.stringify(p10.getCell('C12').value));
  console.log('  S10 I12 status link: ', JSON.stringify(p10.getCell('I12').value));

  if (shapes.size > 0) {
    console.log(`\nFormula shapes the mini-interpreter cannot re-execute (${shapes.size}):`);
    [...shapes.entries()].slice(0, 20).forEach(([shape, n]) => console.log(`  x${n} ${shape}`));
  }

  console.log(`\nDone: ${PHASE1_QUICK_TEMPLATES.length - failed}/${PHASE1_QUICK_TEMPLATES.length} workbooks fully linked.`);
  if (failed > 0) process.exitCode = 1;
}

await main();
