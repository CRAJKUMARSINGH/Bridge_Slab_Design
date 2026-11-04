#!/usr/bin/env node
/** F5 — One coefficient registry, generated from docs/week-0/coefficients.json. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = JSON.parse(readFileSync('docs/week-0/coefficients.json', 'utf8').replace(/^\uFEFF/, ''));

const KEY = {
  'Factors!B3': 'GAMMA_G',
  'Factors!B4': 'GAMMA_Q',
  'Factors!B7': 'E_STEEL_MPA',
  'Factors!B8': 'UW_CONCRETE_KN_M3',
  'Factors!B9': 'UW_ASPHALT_KN_M3',
  'Calc!B19':   'SHEAR_CAPACITY_MPA',
};
const EXTRA = {
  MOMENT_DIVISOR_SS: { value: 8,       source: 'Calc!B6',           label: 'Simply-supported moment divisor',    unit: '-' },
  SHEAR_DIVISOR_SS:  { value: 2,       source: 'Calc!B7',           label: 'Simply-supported shear divisor',     unit: '-' },
  N_MM2_PER_KNM:     { value: 1000000, source: 'Calc!B10',          label: 'kN·m → N·mm',                       unit: '-' },
  MM_PER_M:          { value: 1000,    source: 'Calc!B14/B15/B18',  label: 'm → mm',                             unit: '-' },
  DEFLECTION_COEFF:  { value: 5,       source: 'Calc!B14',          label: '5wL⁴/384EI numerator',               unit: '-' },
  DEFLECTION_DENOM:  { value: 384,     source: 'Calc!B14',          label: '5wL⁴/384EI denominator',             unit: '-' },
  UNITY:             { value: 1,       source: 'Calc!B12',          label: 'Utilisation limit',                   unit: '-' },
};

const rows = [];
for (const c of src.factor_and_limit_cells) {
  const k = KEY[c.id];
  if (!k) throw new Error(`unmapped coefficient cell ${c.id} — update gen-coefficients.mjs`);
  rows.push([k, c.value, c.id, c.label, c.units || '-']);
}
for (const [k, v] of Object.entries(EXTRA)) rows.push([k, v.value, v.source, v.label, v.unit]);

const body = rows.map(([k, v, s, label, u]) =>
  `  /** ${label} [${u}] — ${s} */\n  ${k}: ${v},`
).join('\n');

const map = rows.map(([k, , s]) => `  ${k}: '${s}',`).join('\n');

mkdirSync('shared/generated', { recursive: true });
writeFileSync(
  'shared/generated/coefficients.ts',
  `// AUTO-GENERATED from docs/week-0/coefficients.json — DO NOT EDIT BY HAND.
// Regenerate: pnpm run gen:coefficients
export const COEFFICIENTS = {
${body}
} as const;

export type CoefficientKey = keyof typeof COEFFICIENTS;

/** Workbook cell justifying each coefficient — consumed by the trace layer. */
export const COEFFICIENT_SOURCE: Record<CoefficientKey, string> = {
${map}
};
`,
);
console.log(`generated shared/generated/coefficients.ts — ${rows.length} coefficients`);
