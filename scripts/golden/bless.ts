import { writeFileSync, mkdirSync } from 'node:fs';
import { calculateCompleteDesign } from '../../bridge-excel-generator/design-engine';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from '../fixtures/kherwara-project-input';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flatten(obj: any, prefix = '', out: Record<string, number> = {}): Record<string, number> {
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) { obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out)); return out; }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
    return out;
  }
  if (typeof obj === 'number') out[prefix] = obj;
  return out;
}

const result = calculateCompleteDesign(KHERWARA_REFERENCE_PROJECT_INPUT, { quiet: true });
const out = flatten(result);
// Remove input echo — those are not computed outputs
for (const k of Object.keys(out)) {
  if (k.startsWith('input.')) delete out[k];
}
mkdirSync('tests/golden/kherwara', { recursive: true });
writeFileSync('tests/golden/kherwara/expected.json', JSON.stringify(out, null, 2) + '\n');
console.log(`blessed ${Object.keys(out).length} numeric leaves → tests/golden/kherwara/expected.json`);
