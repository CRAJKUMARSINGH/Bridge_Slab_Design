// Row 25 measurement: how many engine load cases sit in the gap between the engine's overturning
// acceptance (1.80) and the 2.00 the client-side calculators apply. Writes UTF-8 (stdout is cp1252).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(readFileSync(join(here, '..', '..', 'evidence', 'stability-outcomes.json'), 'utf8'));
const out: string[] = [];
const p = (s: string) => out.push(s);

p(`evidence generatedAt: ${j.generatedAt}`);
p(`engine thresholds: sliding ${j.thresholds.sliding} / overturning ${j.thresholds.overturning} / bearing ${j.thresholds.bearing}`);

type C = { template: string; name: string; member: string; sheet: string; caseNumber: number; description: string;
  slidingFOS: number; overturningFOS: number; bearingFOS: number; status: string; governing: boolean };
const all: C[] = [];
for (const t of j.templates) for (const m of t.members) for (const c of m.cases)
  all.push({ ...c, template: t.template, name: t.name, member: m.member, sheet: m.sheet });

p(`total load cases: ${all.length}`);

const inGap = all.filter((c) => c.overturningFOS >= 1.8 && c.overturningFOS < 2.0);
p(``);
p(`A) overturningFOS in [1.80, 2.00)  -> passes the engine rule, would be rejected by a 2.00 edge:`);
p(`   count: ${inGap.length}`);
const byStatus = new Map<string, number>();
for (const c of inGap) byStatus.set(c.status, (byStatus.get(c.status) ?? 0) + 1);
p(`   by engine status: ${[...byStatus].map(([k, v]) => `${k}=${v}`).join(', ')}`);
const safeOnly = inGap.filter((c) => c.status === 'SAFE');
p(`   of those SAFE by the engine: ${safeOnly.length}`);
const safeOnlyOtGoverns = safeOnly.filter((c) => c.slidingFOS >= 1.5 && c.bearingFOS >= 1);
p(`   SAFE whose only near-limit factor is overturning (sliding+bearing also clear): ${safeOnlyOtGoverns.length}`);
const tpl = new Set(inGap.map((c) => c.template));
p(`   templates touched: ${tpl.size} -> ${[...tpl].sort().join(', ')}`);
p(``);
p(`   full list (template | member | case | overturningFOS | engine status):`);
for (const c of inGap.sort((a, b) => b.overturningFOS - a.overturningFOS)) {
  p(`     ${c.template} | ${c.member} | #${c.caseNumber} ${c.description} | ${c.overturningFOS.toFixed(4)} | ${c.status}`);
}

const srcG = new Map<string, number>();
for (const c of inGap) srcG.set(`${c.member} @ ${c.sheet}`, (srcG.get(`${c.member} @ ${c.sheet}`) ?? 0) + 1);
p(``);
p(`   by member/sheet: ${[...srcG].map(([k, v]) => `${k}: ${v}`).sort().join(' | ')}`);

// B) the 2.00 literal as a sliding edge is not in play; measure sliding gap vs the client's 1.50 PASS edge.
const sGap = all.filter((c) => c.slidingFOS >= 1.25 && c.slidingFOS < 1.5);
p(``);
p(`B) slidingFOS in [1.25, 1.50) -> the Design.tsx preview WARN band, for reference:`);
p(`   count: ${sGap.length}; engine-UNSAFE among them: ${sGap.filter((c) => c.status === 'UNSAFE').length}`);

// C) bearing: engine 1.00 vs client qmax<=SBC (which is a 1.00 comparison, not a copy defect).
const bGap = all.filter((c) => c.bearingFOS >= 1 && c.bearingFOS < 1.5);
p(``);
p(`C) bearingFOS in [1.00, 1.50): count ${bGap.length} (engine accepts; no client 1.5 bearing rule found)`);

writeFileSync(join(here, 'tmp-due21-gap.txt'), out.join('\n') + '\n', 'utf8');
console.log('written tmp-due21-gap.txt');
