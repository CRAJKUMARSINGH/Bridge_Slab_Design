/**
 * Which rates the estimation engine bills, across every project template.
 *
 * A family the reference prices and the Kherwara workbook does not show is only a real gap if no
 * template can bill it. Rock excavation, for instance, is nil on a site founded wholly in soil and
 * large on a site that is not — so the union over all 20 templates is the honest coverage test.
 *
 * Run: npx tsx archive/20261007-tmp-due20/rate-union.ts
 */
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateCompleteDesign } from '../../bridge-excel-generator/design-engine.ts';
import { PHASE1_QUICK_TEMPLATES } from '../../server/default-project-inputs.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Every rate the reference estimate prices but the Kherwara workbook leaves out. */
const REFERENCE_RATES = [63, 514, 4995, 46, 61, 6046, 1048, 937, 5261, 3476, 1274];

const billedBy = new Map<number, string[]>();
const linesByRate = new Map<number, string>();

for (const template of PHASE1_QUICK_TEMPLATES) {
  const design = calculateCompleteDesign(template.input, { quiet: true });
  for (const item of design.estimation?.boq ?? []) {
    const rate = Math.round(item.rate);
    billedBy.set(rate, [...(billedBy.get(rate) ?? []), template.id]);
    if (!linesByRate.has(rate)) linesByRate.set(rate, `${item.itemNo} ${item.description}`);
  }
}

const out: string[] = [`templates scanned: ${PHASE1_QUICK_TEMPLATES.length}`, `distinct rates billed somewhere: ${billedBy.size}`, ''];
out.push('reference family            | billed by any template? | where');
out.push('-'.repeat(100));
for (const rate of REFERENCE_RATES) {
  const ids = billedBy.get(rate);
  out.push(
    `rate ${String(rate).padEnd(8)} ${(linesByRate.get(rate) ?? '(not in our register)').slice(0, 26).padEnd(27)} | ` +
      `${ids ? 'YES' : 'no '}     | ${ids ? `${ids.length} template(s): ${ids.slice(0, 4).join(', ')}${ids.length > 4 ? ' …' : ''}` : '—'}`,
  );
}
const text = out.join('\n') + '\n';
writeFileSync(join(HERE, 'tmp-due23-rate-union.txt'), text, 'utf8');
process.stdout.write(text);
