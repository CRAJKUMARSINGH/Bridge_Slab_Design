#!/usr/bin/env node
/**
 * F5b — No unexplained numeric literal in the engine.
 * A literal is allowed only if the line carries //@k:KEY or //@lit, or the
 * `line:literal` pair is listed in foundation/literals.allow.json.
 */
import { readFileSync, existsSync } from 'node:fs';

const FILES = [
  'client/src/report-engine/lib/slabCalc.ts',
  'client/src/report-engine/lib/loadCalc.ts',
  'client/src/report-engine/lib/ircSlabCalc.ts',
  'bridge-excel-generator/design-engine.ts',
];
const allow = existsSync('foundation/literals.allow.json')
  ? JSON.parse(readFileSync('foundation/literals.allow.json', 'utf8'))
  : { files: {} };

const TRIVIAL = new Set(['0', '1', '2', '100', '1000', '0.5']);
const failures = [];
let scanned = 0;

for (const f of FILES) {
  if (!existsSync(f)) { failures.push(`missing engine file: ${f}`); continue; }
  const fileAllow = new Set(allow.files?.[f] ?? []);
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '');
    if (!code.trim()) return;
    if (/\/\/@(k:|lit)/.test(line)) return;
    scanned++;
    for (const n of code.match(/(?<![\w.])\d+(?:\.\d+)?(?:e[+-]?\d+)?/g) ?? []) {
      if (TRIVIAL.has(n) || fileAllow.has(`${i + 1}:${n}`)) continue;
      failures.push(`${f}:${i + 1}  bare literal ${n}  →  ${line.trim()}`);
    }
  });
}

console.log(`F5b literal-guard: scanned ${scanned} code lines, ${failures.length} unexplained literals`);
if (failures.length) {
  failures.slice(0, 30).forEach((x) => console.log('  ' + x));
  if (failures.length > 30) console.log(`  ... and ${failures.length - 30} more`);
  process.exit(1);
}
