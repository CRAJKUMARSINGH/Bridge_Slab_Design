/**
 * Load-case diversity guard (CURSOR-002).
 *
 * The abutment loop used to run `for (let i = 1; i <= 5; i++)` without ever using `i`,
 * so all five "IRC:6 load cases" of both abutments were the same arithmetic dressed in
 * five labels — a stability table that looked verified but tested one combination.
 * These rules make that class of bug impossible to return quietly:
 *  1. pier and both abutments carry exactly five cases;
 *  2. every case names its combination (no `Case 1`…`Case 5`) and no two share a label;
 *  3. no two cases share the same factor set, and no two share the same
 *     (vertical, horizontal, moment) triple — a labelled case that is not distinct is a
 *     duplicate, not a check;
 *  4. every force is finite and the status follows the 1.5 / 1.8 / 2.5 thresholds.
 *
 * Run: npx tsx scripts/verify-load-case-diversity.ts
 */
import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine.ts';
import { PHASE1_QUICK_TEMPLATES } from '../server/default-project-inputs.ts';
import type { LoadCase, ProjectInput } from '../bridge-excel-generator/types.ts';

const EXPECTED_CASES = 5;

type Structure = 'pier' | 'abutmentType1' | 'abutmentC1';

function checkStructure(name: Structure, cases: LoadCase[] | undefined): string[] {
  const problems: string[] = [];
  if (!cases) return [`${name}: no loadCases array`];
  if (cases.length !== EXPECTED_CASES) {
    problems.push(`${name}: ${cases.length} load cases, expected ${EXPECTED_CASES}`);
    return problems;
  }

  const labels = cases.map((c) => c.description.trim());
  labels.forEach((label, i) => {
    if (/^case \d+$/i.test(label)) problems.push(`${name}: case ${i + 1} is unlabelled ("${label}")`);
    if (!label) problems.push(`${name}: case ${i + 1} has an empty description`);
  });
  if (new Set(labels).size !== labels.length) problems.push(`${name}: duplicate case labels`);

  cases.forEach((c, i) => {
    const factors = [c.deadLoadFactor, c.liveLoadFactor, c.windLoadFactor, c.buoyancyFactor,
      c.earthPressureFactor ?? 0, c.surchargeFactor ?? 0, c.seismicLoadFactor ?? 0].join('/');
    for (let j = 0; j < i; j++) {
      const o = cases[j];
      const otherFactors = [o.deadLoadFactor, o.liveLoadFactor, o.windLoadFactor, o.buoyancyFactor,
        o.earthPressureFactor ?? 0, o.surchargeFactor ?? 0, o.seismicLoadFactor ?? 0].join('/');
      if (factors === otherFactors) problems.push(`${name}: case ${i + 1} repeats case ${j + 1}'s factors`);
      const sameForces = Math.abs(c.verticalForce - o.verticalForce) < 1e-6
        && Math.abs(c.horizontalForce - o.horizontalForce) < 1e-6
        && Math.abs(c.moment - o.moment) < 1e-6;
      if (sameForces) problems.push(`${name}: case ${i + 1} is numerically identical to case ${j + 1}`);
    }

    for (const [field, value] of Object.entries(c)) {
      if (typeof value === 'number' && !Number.isFinite(value)) {
        problems.push(`${name} case ${i + 1}: ${field} = ${value}`);
      }
    }
    const qualifies = c.slidingFOS >= 1.5 && c.overturningFOS >= 1.8 && c.bearingFOS >= 2.5;
    if (qualifies !== (c.status === 'SAFE')) {
      problems.push(
        `${name} case ${i + 1} "${c.description}": status ${c.status} but ` +
        `sliding ${c.slidingFOS.toFixed(2)} / overturning ${c.overturningFOS.toFixed(2)} / bearing ${c.bearingFOS.toFixed(2)}`
      );
    }
  });

  return problems;
}

function check(input: ProjectInput) {
  const design: any = calculateCompleteDesign(input, { quiet: true });
  const structures: Array<[Structure, LoadCase[] | undefined]> = [
    ['pier', design.pier?.loadCases],
    ['abutmentType1', design.abutmentType1?.loadCases],
    ['abutmentC1', design.abutmentC1?.loadCases],
  ];
  const problems = structures.flatMap(([name, cases]) => checkStructure(name, cases));
  const abt = structures[1][1] ?? [];
  const spread = abt.length ? Math.max(...abt.map((c) => c.horizontalForce)) - Math.min(...abt.map((c) => c.horizontalForce)) : 0;
  return { problems, spread, distinct: new Set(abt.map((c) => c.description)).size };
}

let defects = 0;
for (const template of PHASE1_QUICK_TEMPLATES) {
  const r = check(template.input);
  defects += r.problems.length;
  console.log(
    `${r.problems.length === 0 ? 'OK  ' : 'FAIL'} ${template.id.padEnd(24)} ` +
    `abutment cases: ${r.distinct} distinct, horizontal spread ${r.spread.toFixed(1)} kN`
  );
  r.problems.forEach((p) => console.log(`       - ${p}`));
}

console.log(`\nTemplates: ${PHASE1_QUICK_TEMPLATES.length} | defects: ${defects}`);
if (defects > 0) process.exitCode = 1;
