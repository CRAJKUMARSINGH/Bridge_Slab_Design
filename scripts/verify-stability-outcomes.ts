/**
 * Stability-outcome gate.
 *
 * Every other gate in `pnpm run verify` checks that the machinery is internally consistent:
 * 46 sheets exist, derived cells are formulas, values are finite, costs tie, uplift is sane,
 * load cases are diverse. All of them can be GREEN while the bridge is UNSAFE — in October 2026 a
 * full run reported 15/15 not-SAFE across 19 of 20 templates and still exited 0 (that tally is the
 * pre-§706, pre-bearing-1.0 rule; re-read evidence/stability-outcomes.json for the current one).
 * Nothing in the pipeline
 * said the words "this design does not stand up", and nothing proved that the verdict an
 * engineer reads in the workbook is the verdict the engine reached.
 *
 * This gate closes both gaps WITHOUT adjudicating anything:
 *  1. every member (pier, abutment Type 1, abutment cantilever) exists and carries load cases;
 *  2. every load case has three finite, positive factors of safety;
 *  3. `status` is SAFE or UNSAFE — never blank, never 'CHECK', which the engine never emits;
 *  4. `status` agrees with the engine's own acceptance rule (STABILITY_ACCEPTANCE — currently
 *     sliding 1.5, overturning 1.8, bearing 1.0 i.e. base pressure ≤ SBC per the owner decision of
 *     2026-10-06), recomputed here from the same three numbers, so a status derived from different
 *     arithmetic than it reports is a defect even when it happens to read "SAFE";
 *  5. the workbook's stability sheets carry the same verdict, in the same order, for the same
 *     case — read back from the generated file, not from the generator's own arrays;
 *  6. the acceptance rule reaches the browser as data in the design response, and no client file
 *     keeps a copy of it (§AA);
 *  6b. every numeric stability threshold the client still applies for its OWN reasons — the seismic
 *     reduced edges, UI caution bands, and the second design model behind the report sheets, none of
 *     which has a response to read — is declared with its basis, and an undeclared or drifted one is
 *     a defect (§AB).
 *     (`stabilityAcceptance`), and no client file writes a numeric copy of it — see §Y-5/§AA.
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
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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

/** Reporting only: how many UNSAFE cases fail the bearing check and nothing else. */
/** Reporting only: how many UNSAFE cases fail the bearing check and nothing else. */
const attribution = {
  unsafe: 0,
  byThreshold: { sliding: 0, overturning: 0, bearing: 0 } as Record<string, number>,
  bearingOnly: 0,
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
        if (fails.length === 1 && fails[0] === 'bearing') attribution.bearingOnly++;
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

if (PHASE1_QUICK_TEMPLATES.length === 0) {
  console.error('verify-stability-outcomes: the template roster is empty — this gate would exit 0 having attributed nothing.');
  process.exit(1);
}
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

// Rule 6. The acceptance rule now travels to the browser INSIDE the design response
// (`CompleteDesignResult.stabilityAcceptance`, emitted by the engine that applies it), so no client
// file needs a copy. Checked in both directions, because a one-way check passes on dead code: a
// numeric limit written into `client/src` is a defect — that is the copy that fell behind §M-1 eight
// times in §Y — and every component that shows stability verdicts from the response must actually
// read the field.
const clientSrcDir = join(here, '..', 'client', 'src');
const clientCopyProblems: string[] = [];
const LIMIT_LITERAL = /\b(slidingFosMin|overturningFosMin|bearingFosMin)\b\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/g;
const RETIRED_COPY = /\bSTABILITY_LIMITS\b/;

function clientSources(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...clientSources(path));
    else if (/\.tsx?$/.test(entry.name)) found.push(path);
  }
  return found;
}

const limitReaders = [
  'client/src/components/DesignCheckDashboard.tsx',
  'client/src/components/CompareModal.tsx',
  'client/src/components/EngineeringCopilot.tsx',
  'client/src/components/WindLoadPanel.tsx',
  'client/src/pages/Design.tsx',
];
for (const file of clientSources(clientSrcDir)) {
  const rel = file.slice(join(here, '..').length + 1).replace(/\\/g, '/');
  const src = readFileSync(file, 'utf8');
  for (const literal of src.matchAll(LIMIT_LITERAL)) {
    const key = literal[1] as keyof typeof STABILITY_ACCEPTANCE;
    clientCopyProblems.push(
      `${rel}: hard-codes ${key} = ${literal[2]} where the engine applies ${STABILITY_ACCEPTANCE[key]} — ` +
      `the browser must read stabilityAcceptance from the design response, or a §M-1-style rule ` +
      `change leaves this behind`);
  }
  if (RETIRED_COPY.test(src)) {
    clientCopyProblems.push(`${rel}: still references the retired client copy (STABILITY_LIMITS)`);
  }
  if (limitReaders.includes(rel) && !src.includes('stabilityAcceptance')) {
    clientCopyProblems.push(
      `${rel}: shows stability verdicts but never reads stabilityAcceptance from the response — the ` +
      `gate would otherwise stay green on code that ignores the rule the engine sent`);
  }
}
defects += clientCopyProblems.length;
console.log(`${clientCopyProblems.length === 0 ? 'OK  ' : 'DEFECT'} acceptance rule reaches the browser from the response`);
clientCopyProblems.forEach((p) => console.log(`       - ${p}`));

// Rule 6b. The client keeps a second, independent design model (the submersible-bridge report engine
// and the standalone stability/evaluator pages) that has no engine response to read, plus a seismic
// band and some UI caution bands that are deliberately NOT the normal rule (§AB). Those numbers are
// legitimate, so a blanket ban would be wrong — but they must be DECLARED, with the basis written
// down, and an undeclared or drifted one is a defect. This is what "which keep their own rule and
// must say so" means in practice: a fourteenth file adding `slidFOS >= 1.6` fails the build.
const STABILITY_COMPARE = /\b([\w.]*(?:FOS|slid|overturn|qmax|bear)[\w.]*)\s*(>=|<=|>|<)\s*([0-9]+\.[0-9]+)\b/gi;
const DECLARED_CLIENT_THRESHOLDS: Record<string, { literals: string[]; basis: string }> = {
  'client/src/components/SeismicZonePanel.tsx': {
    literals: ['1.25', '1.50'],
    basis: 'seismic reduced edges (sliding 1.25 / overturning 1.50), cited in-file as IRC:6-2016 Cl.219 — the citation is not verified against the code text (§AB-4)',
  },
  'client/src/pages/AbutmentStability.tsx': {
    literals: ['1.50', '2.00'],
    basis: 'standalone hand-calculator with its own force model: sliding 1.5 agrees with the engine, overturning 2.00 does NOT (the engine applies 1.80) — open owner decision (§AB-3)',
  },
  'client/src/pages/FormulaEvaluator.tsx': {
    literals: ['1.3', '1.5', '1.7', '2.0'],
    basis: 'teaching evaluator, own arithmetic; PASS 1.5 / WARN 1.3 sliding and PASS 2.0 / WARN 1.7 overturning are its own bands, not the engine rule (§AB-3)',
  },
  'client/src/pages/Design.tsx': {
    literals: ['1.10', '1.25', '1.50'],
    basis: 'quick preview: seismic band 1.25/1.50 and UI caution band 1.10/1.25/1.50. The wind PASS edge reads stabilityAcceptance (§AB-1)',
  },
  'client/src/pages/BridgeSlabReport.tsx': {
    literals: ['1.5'],
    basis: 'client report model — no engine response exists in this tree; sliding >= 1.5 with qmax <= SBC, i.e. bearing expressed as pressure <= SBC, matching the engine\'s 1.0 intent (§AB-2)',
  },
  'client/src/report-engine/sheets/SummarySection.tsx': { literals: ['1.5'], basis: 'client report model (§AB-2)' },
  'client/src/report-engine/sheets/engineeringNarrative.tsx': { literals: ['1.5'], basis: 'client report model narrative (§AB-2)' },
  'client/src/report-engine/exportUtils.ts': { literals: ['1.5'], basis: 'client report model export (§AB-2)' },
  'client/src/report-engine/sheets/OptimisationAtAGlance.tsx': {
    literals: ['1.25', '1.50'],
    basis: 'report-model optimiser: ok/warn edges per load combination (seismic 1.25, normal 1.50) — the model has no engine response (§AB-2)',
  },
  'client/src/report-engine/sheets/PierOptimiser.tsx': { literals: ['1.25', '1.50'], basis: 'colour band in the report-model optimiser table, not a verdict (§AB-2)' },
};
const thresholdProblems: string[] = [];
for (const file of clientSources(clientSrcDir)) {
  const rel = file.slice(join(here, '..').length + 1).replace(/\\/g, '/');
  const seen = [...readFileSync(file, 'utf8').matchAll(STABILITY_COMPARE)].map((m) => m[3]);
  if (seen.length === 0) continue;
  const declared = DECLARED_CLIENT_THRESHOLDS[rel];
  const measured = [...new Set(seen)].sort();
  if (!declared) {
    thresholdProblems.push(
      `${rel}: compares a stability factor against a numeric literal (${measured.join(' / ')}) with no entry in ` +
      `DECLARED_CLIENT_THRESHOLDS — read stabilityAcceptance from the design response, or declare the rule and ` +
      `say where it comes from (§AB)`);
    continue;
  }
  const expected = [...new Set(declared.literals)].sort();
  if (expected.join() !== measured.join()) {
    thresholdProblems.push(
      `${rel}: declared thresholds are [${expected.join(' / ')}] but the file now uses [${measured.join(' / ')}] — ` +
      `update the declaration WITH its basis, never by copying the number in. Basis on file: ${declared.basis}`);
  }
}
defects += thresholdProblems.length;
console.log(`${thresholdProblems.length === 0 ? 'OK  ' : 'DEFECT'} client thresholds are declared with a stated basis`);
thresholdProblems.forEach((p) => console.log(`       - ${p}`));

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
  `  failing bearing ALONE ${String(attribution.bearingOnly).padStart(4)} — everything else in those cases passes\n` +
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
