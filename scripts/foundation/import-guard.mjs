#!/usr/bin/env node
/** F10 — one authoritative engine; the weaver must not be a forked copy. */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ALLOWED_DEEP_IMPORTERS = new Set([
  'bridge-excel-generator/index.ts',
  'bridge-excel-generator/narrative-engine.ts',
  'client/src/report-engine/lib/__tests__/engineConsistency.test.ts',
  'client/src/report-engine/lib/__tests__/pbt-round-trip.test.ts',
  'scripts/verify-engine-hydraulics.ts',
  'scripts/verify-kherwara-excel-golden.ts',
  'scripts/golden/bless.ts',
  'tests/golden/kherwara/golden.test.ts',
  'tests/meta/tamper-goes-red.test.ts',
]);

const MIRROR_PAIRS = [
  ['client/src/report-engine/lib/slabCalc.ts',  'client/src/report-engine-weaver/lib/slabCalc.ts'],
  ['client/src/report-engine/lib/loadCalc.ts',  'client/src/report-engine-weaver/lib/loadCalc.ts'],
];

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const problems = [];

for (const [a, b] of MIRROR_PAIRS) {
  if (!existsSync(a)) { problems.push(`source missing: ${a}`); continue; }
  if (!existsSync(b)) {
    console.log(`ABSENT   ${b}  (no mirror to diverge from)`);
    continue;
  }
  const same = sha(a) === sha(b);
  console.log(`${same ? 'IDENTICAL' : 'DIVERGED '} ${b}`);
  if (!same) {
    problems.push(
      `${b} has diverged from ${a} — pick one as authoritative and make the other a re-export`
    );
  }
}

console.log(
  `\nF10 import-guard: deep-import allowlist = ${ALLOWED_DEEP_IMPORTERS.size} files, ` +
  `${problems.length} problems`
);
if (problems.length) {
  problems.forEach((p) => console.log('  ' + p));
  process.exit(1);
}
