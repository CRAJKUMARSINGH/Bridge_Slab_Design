/**
 * Stability-outcome gate.
 *
 * Every other gate in `pnpm run verify` checks that the machinery is internally consistent:
 * 46 sheets exist, derived cells are formulas, values are finite, costs tie, uplift is sane,
 * load cases are diverse. All six can be GREEN while the bridge is UNSAFE — the last full run
 * reported 15/15 not-SAFE across 19 of 20 templates and still exited 0. Nothing in the pipeline
 * said the words "this design does not stand up", and nothing proved that the verdict an
 * engineer reads in the workbook is the verdict the engine reached.
 *
 * This gate closes both gaps WITHOUT adjudicating anything:
 *  1. every member (pier, abutment Type 1, abutment cantilever) exists and carries load cases;
 *  2. every load case has three finite, positive factors of safety;
 *  3. `status` is SAFE or UNSAFE — never blank, never 'CHECK', which the engine never emits;
 *  4. `status` agrees with the thresholds (IRC:6 §114 sliding 1.5, overturning 1.8, bearing 2.5)
 *     recomputed here from the same three numbers, so a status derived from different arithmetic
 *     than it reports is a defect even when it happens to read "SAFE";
 *  5. the workbook's stability sheets carry the same verdict, in the same order, for the same
 *     case — read back from the generated file, not from the generator's own arrays.
 *
 * A UNSAFE verdict is NOT a gate failure: it is an engineering outcome that belongs to the
 * licensed engineer who signs the drawing. Failing the build on it would train people to want
 * the gate removed. So the exit code answers "is the machinery telling the truth", and the
 * tally answers "what is the truth it is telling" — printed in the same run, loudly, and written
 * to evidence/stability-outcomes.json for reviewers.
 *
 * Run: npx tsx scripts/verify-stability-outcomes.ts
 */
import ExcelJS from 'exceljs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCompleteExcel } from '../bridge-excel-generator/index.ts';
import { readCellValue } from '../bridge-excel-generator/utils.ts';
import { calculateCompleteDesign, STABILITY_ACCEPTANCE } from '../bridge-excel-generator/design-engine.ts';
import { PHASE1_QUICK_TEMPLATES } from '../server/default-project-inputs.ts';
import type { CompleteDesignResult, LoadCase } from '../bridge-excel-generator/types.ts';

/** The engine's own acceptance rule, read from the module that applies it — not restated here. */
const THRESHOLDS = {
  sliding: STABILITY_ACCEPTANCE.slidingFosMin,
  overturning: STABILITY_ACCEPTANCE.overturningFosMin,
  bearing: STABILITY_ACCEPTANCE.bearingFosMin,
} as const;

/** Reporting only: the commoner "pressure <= SBC" reading of the bearing check, i.e. a factor of 1. */
const BEARING_FOS_FOR_SBC_LIMIT = 1.0;

const MEMBERS: Array<{ key: 'pier' | 'abutmentType1' | 'abutmentC1'; label: string; sheet: string }> = [
  { key: 'pier', label: 'Pier', sheet: 'STABILITY CHECK FOR PIER' },
  { key: 'abutmentType1', label: 'Abutment Type 1', sheet: 'TYPE1-STABILITY CHECK ABUTMENT' },
  { key: 'abutmentC1', label: 'Abutment cantilever (C1)', sheet: 'C1-STABILITY CHECK ABUTMENT' },
];

interface CaseOutcome {
  caseNumber: number;
  description: string;
  slidingFOS: number;
  overturningFOS: number;
  bearingFOS: number;
  status: string;
  governing: boolean;
}

/**
 * Records WHICH threshold a case fails, so a wall of UNSAFE verdicts can be read as a diagnosis
 * instead of a shrug. Pure reporting: it never alters a status, and the gate does not fail on it.
 */
function failureOf(lc: LoadCase): string[] {
  const fails: string[] = [];
  if (!(lc.slidingFOS >= THRESHOLDS.sliding)) fails.push('sliding');
  if (!(lc.overturningFOS >= THRESHOLDS.overturning)) fails.push('overturning');
  if (!(lc.bearingFOS >= THRESHOLDS.bearing)) fails.push('bearing');
  return fails;
}

const attribution = {
  unsafe: 0,
  byThreshold: { sliding: 0, overturning: 0, bearing: 0 } as Record<string, number>,
  bearingOnly: 0,
  bearingWouldPassAtSbcLimit: 0,
};

interface MemberOutcome {
  member: string;
  sheet: string;
  cases: CaseOutcome[];
  unsafeCases: number;
  safeCases: number;
  worstSliding: number;
  worstOverturning: number;
  worstBearing: number;
  verdict: 'SAFE' | 'UNSAFE' | 'NO CASES';
}

const here = dirname(fileURLToPath(import.meta.url));
const evidencePath = join(here, '..', 'evidence', 'stability-outcomes.json');

/** Recompute the engine's own rule from the numbers the case reports. */
function expectedStatus(lc: LoadCase): 'SAFE' | 'UNSAFE' {
  return lc.slidingFOS >= THRESHOLDS.sliding &&
         lc.overturningFOS >= THRESHOLDS.overturning &&
         lc.bearingFOS >= THRESHOLDS.bearing
    ? 'SAFE'
    : 'UNSAFE';
}

function checkEngine(design: CompleteDesignResult): { outcomes: MemberOutcome[]; problems: string[] } {
  const outcomes: MemberOutcome[] = [];
  const problems: string[] = [];

  for (const m of MEMBERS) {
    const result = design[m.key];
    if (!result) {
      problems.push(`${m.label}: no ${m.key} result on the design`);
      continue;
    }
    const cases = result.loadCases ?? [];
    if (cases.length === 0) {
      problems.push(`${m.label}: zero load cases — nothing was checked, so nothing is safe`);
    }

    let worst = { sliding: Number.POSITIVE_INFINITY, overturning: Number.POSITIVE_INFINITY, bearing: Number.POSITIVE_INFINITY };
    const rowOutcomes: CaseOutcome[] = [];
    let safe = 0;
    let unsafe = 0;

    cases.forEach((lc, i) => {
      const trio: Array<[string, number, number]> = [
        ['sliding', lc.slidingFOS, THRESHOLDS.sliding],
        ['overturning', lc.overturningFOS, THRESHOLDS.overturning],
        ['bearing', lc.bearingFOS, THRESHOLDS.bearing],
      ];
      for (const [name, value] of trio) {
        if (!Number.isFinite(value) || value <= 0) {
          problems.push(`${m.label} case ${lc.caseNumber}: ${name} FOS ${value} is not finite and positive`);
        }
        if (Number.isFinite(value)) worst[name as 'sliding' | 'overturning' | 'bearing'] =
          Math.min(worst[name as 'sliding' | 'overturning' | 'bearing'], value);
      }
      if (lc.status !== 'SAFE' && lc.status !== 'UNSAFE') {
        problems.push(`${m.label} case ${lc.caseNumber}: status ${JSON.stringify(lc.status)} is neither SAFE nor UNSAFE`);
      }
      const want = expectedStatus(lc);
      if (want === 'UNSAFE') {
        const fails = failureOf(lc);
        attribution.unsafe++;
        fails.forEach((f) => attribution.byThreshold[f]++);
        if (fails.length === 1 && fails[0] === 'bearing') {
          attribution.bearingOnly++;
          // The alternative reading of the same numbers: bearing capacity is usually checked as
          // "pressure ≤ SBC", i.e. a factor of 1.0, not 2.5. Counting cases that pass at 1.0 tells
          // the signing engineer how much of this wall of UNSAFE is the 2.5 choice, and nothing else.
          if (lc.slidingFOS >= THRESHOLDS.sliding && lc.overturningFOS >= THRESHOLDS.overturning &&
              lc.bearingFOS >= BEARING_FOS_FOR_SBC_LIMIT) attribution.bearingWouldPassAtSbcLimit++;
        }
      }
      if (lc.status === want) {
        if (want === 'SAFE') safe++; else unsafe++;
      } else {
        problems.push(
          `${m.label} case ${lc.caseNumber}: status ${lc.status} but its own factors ` +
          `(sliding ${lc.slidingFOS.toFixed(3)} / overturning ${lc.overturningFOS.toFixed(3)} / ` +
          `bearing ${lc.bearingFOS.toFixed(3)}) give ${want}`
        );
        if (want === 'SAFE') safe++; else unsafe++;
      }
      rowOutcomes.push({
        caseNumber: lc.caseNumber,
        description: lc.description,
        slidingFOS: lc.slidingFOS,
        overturningFOS: lc.overturningFOS,
        bearingFOS: lc.bearingFOS,
        status: String(lc.status),
        governing: i === 0,
      });
    });

    outcomes.push({
      member: m.label,
      sheet: m.sheet,
      cases: rowOutcomes,
      safeCases: safe,
      unsafeCases: unsafe,
      worstSliding: Number.isFinite(worst.sliding) ? worst.sliding : Number.NaN,
      worstOverturning: Number.isFinite(worst.overturning) ? worst.overturning : Number.NaN,
      worstBearing: Number.isFinite(worst.bearing) ? worst.bearing : Number.NaN,
      verdict: cases.length === 0 ? 'NO CASES' : unsafe > 0 ? 'UNSAFE' : 'SAFE',
    });
  }

  return { outcomes, problems };
}

interface SheetVerdict {
  row: number;
  col: number;
  shown: string;
  formula: string;
  /** true when the cell applies the threshold rule itself, false when it copies or hard-codes. */
  derived: boolean;
}

/** Read the verdict cells back out of the generated workbook. */
async function sheetVerdicts(input: Parameters<typeof generateCompleteExcel>[0], sheetNames: string[]) {
  const log = console.log;
  console.log = () => {};
  let buffer: Buffer;
  try {
    buffer = await generateCompleteExcel(input);
  } finally {
    console.log = log;
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  const bySheet: Record<string, SheetVerdict[] | undefined> = {};
  for (const name of sheetNames) {
    const ws = wb.getWorksheet(name);
    if (!ws) {
      bySheet[name] = undefined;
      continue;
    }
    const found: SheetVerdict[] = [];
    for (let r = 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= row.cellCount; c++) {
        const raw = readCellValue(row.getCell(c));
        let formula = '';
        let result: unknown = raw;
        if (raw && typeof raw === 'object' && 'formula' in raw) {
          formula = String((raw as { formula?: unknown }).formula ?? '');
          result = (raw as { result?: unknown }).result;
        }
        const shown = String(result);
        const isVerdictCell = /"UNSAFE"|'UNSAFE'/.test(formula) || /^(SAFE|UNSAFE)$/.test(shown);
        if (!isVerdictCell) continue;
        // The stability tables decide with an AND() over the three thresholds. Anything else — a
        // bare cross-sheet ref to another member's verdict, or a literal — restates a conclusion
        // instead of applying the rule, so it is reported as such rather than silently accepted.
        const derived = /IF\(\s*AND\(/i.test(formula.replace(/\s+/g, ' '));
        found.push({ row: r, col: c, shown, formula, derived });
      }
    }
    bySheet[name] = found;
  }
  return bySheet;
}

let defects = 0;
const report: Array<{ template: string; name: string; members: MemberOutcome[] }> = [];
const totals = { templates: 0, cases: 0, safe: 0, unsafe: 0, templatesWithUnsafe: 0 };

for (const template of PHASE1_QUICK_TEMPLATES) {
  const design = calculateCompleteDesign(template.input, { quiet: true }) as unknown as CompleteDesignResult;
  const { outcomes, problems } = checkEngine(design);

  const sheetNames = outcomes.map((o) => o.sheet);
  const verdicts = await sheetVerdicts(template.input, sheetNames);
  for (const o of outcomes) {
    const sheetVerdictList = verdicts[o.sheet];
    if (sheetVerdictList === undefined) {
      problems.push(`${o.member}: workbook has no sheet '${o.sheet}' to read the verdict from`);
      continue;
    }
    if (sheetVerdictList.length !== o.cases.length) {
      problems.push(`${o.member}: sheet '${o.sheet}' renders ${sheetVerdictList.length} verdicts for ${o.cases.length} engine cases`);
    }
    o.cases.forEach((c, i) => {
      const v = sheetVerdictList[i];
      if (!v) return;
      if (v.shown !== c.status) {
        problems.push(`${o.member} case ${c.caseNumber}: sheet shows ${v.shown} but the engine decided ${c.status}`);
      }
      if (!v.derived) {
        problems.push(
          `${o.member} case ${c.caseNumber} at ${o.sheet} r${v.row}c${v.col}: verdict is not derived from the row's own ` +
          `factors of safety (${v.formula ? `formula ${v.formula}` : 'no formula — hard-coded literal'})`
        );
      }
    });
  }

  report.push({ template: template.id, name: template.name, members: outcomes });
  defects += problems.length;

  totals.templates++;
  let templateUnsafe = 0;
  for (const o of outcomes) {
    totals.cases += o.cases.length;
    totals.safe += o.safeCases;
    totals.unsafe += o.unsafeCases;
    templateUnsafe += o.unsafeCases;
  }
  if (templateUnsafe > 0) totals.templatesWithUnsafe++;

  const line = outcomes.map((o) => `${o.verdict.padEnd(6)} (${o.unsafeCases}/${o.cases.length})`).join('  ');
  console.log(`${problems.length === 0 ? 'OK  ' : 'DEFECT'} ${template.id.padEnd(24)} ${line}`);
  problems.forEach((p) => console.log(`       - ${p}`));
}

const banner =
  `\n${'='.repeat(78)}\n` +
  `STABILITY OUTCOMES — ${totals.cases} load cases across ${totals.templates} templates\n` +
  `  SAFE   ${totals.safe}\n` +
  `  UNSAFE ${totals.unsafe}\n` +
  `  templates carrying at least one UNSAFE case: ${totals.templatesWithUnsafe} of ${totals.templates}\n` +
  `\nWHICH CHECK FAILS (cases may fail more than one):\n` +
  `  sliding < ${THRESHOLDS.sliding}          ${String(attribution.byThreshold.sliding).padStart(4)}\n` +
  `  overturning < ${THRESHOLDS.overturning}    ${String(attribution.byThreshold.overturning).padStart(4)}\n` +
  `  bearing < ${THRESHOLDS.bearing}         ${String(attribution.byThreshold.bearing).padStart(4)}\n` +
  `  failing bearing ALONE ${String(attribution.bearingOnly).padStart(4)} — of which ${attribution.bearingWouldPassAtSbcLimit}` +
  ` would pass the commoner "pressure ≤ SBC" reading (factor ${BEARING_FOS_FOR_SBC_LIMIT})\n` +
  `${'='.repeat(78)}\n` +
  `These are engineering verdicts, not gate failures. ${totals.templatesWithUnsafe} template(s)\n` +
  `must NOT be signed off on this run's numbers without a licensed engineer. A zero exit code\n` +
  `below means the machinery reported the truth, not that the bridge stands.\n`;

console.log(banner);

mkdirSync(dirname(evidencePath), { recursive: true });
writeFileSync(
  evidencePath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      thresholds: THRESHOLDS,
      totals,
      attribution,
      templates: report,
      note: 'UNSAFE counts are reported, never suppressed. Defects (non-finite factors, status disagreeing with its own numbers, sheet/engine divergence, verdicts copied rather than derived) fail the gate. Attribution is reporting only: no threshold was changed by this script.',
    },
    null,
    2
  ),
  'utf8'
);
console.log(`Evidence written: ${evidencePath.replace(/\\/g, '/')}`);

console.log(`Templates: ${totals.templates} | defects: ${defects}`);
if (defects > 0) process.exitCode = 1;
