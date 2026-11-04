/**
 * GATE G3a — GOLDEN NUMERIC REGRESSION.
 * Compares EVERY numeric leaf of the authoritative engine against a frozen snapshot.
 * Tolerances resolve through foundation/tolerances.json — never inline.
 * Also detects NEW outputs appearing without a bless (drift detector).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { calculateCompleteDesign } from '../../../bridge-excel-generator/design-engine';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from '../../../scripts/fixtures/kherwara-project-input';
import { expectWithin, unregisteredQuantities } from '../../helpers/tolerance';

const GOLDEN = 'tests/golden/kherwara/expected.json';
const IGNORE_TOP = new Set(['input']);

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

describe('G3a golden numeric regression — Kherwara', () => {
  const actual = flatten(calculateCompleteDesign(KHERWARA_REFERENCE_PROJECT_INPUT, { quiet: true }));

  it('snapshot exists and is not a stub', () => {
    expect(existsSync(GOLDEN), `missing ${GOLDEN} — run: pnpm run golden:bless`).toBe(true);
    expect(Object.keys(JSON.parse(readFileSync(GOLDEN, 'utf8'))).length).toBeGreaterThan(50);
  });

  it('every numeric leaf matches within a REGISTERED tolerance', () => {
    const snap = JSON.parse(readFileSync(GOLDEN, 'utf8')) as Record<string, number>;
    const keys = Object.keys(snap).filter((k) => !IGNORE_TOP.has(k.split('.')[0]));
    expect(keys.length, 'snapshot has too few numeric leaves').toBeGreaterThan(50);
    for (const k of keys) {
      expect(typeof actual[k], `engine stopped producing numeric output: ${k}`).toBe('number');
      expectWithin(k, actual[k] as number, snap[k]);
    }
  });

  it('no new numeric output appeared without being blessed', () => {
    const snap = JSON.parse(readFileSync(GOLDEN, 'utf8')) as Record<string, number>;
    const extra = Object.keys(actual).filter(
      (k) => !(k in snap) && !IGNORE_TOP.has(k.split('.')[0])
    );
    expect(
      extra,
      `unblessed new outputs: ${extra.slice(0, 10).join(', ')} — re-bless and record the change`
    ).toEqual([]);
  });

  it('reports any numeric leaf with no quantity-specific tolerance', () => {
    const bare = unregisteredQuantities();
    if (bare.length) console.log(
      `[golden] ${bare.length} leaves resolved under the blanket default tolerance ` +
      `(no entry in foundation/tolerances.json → quantities): ${bare.slice(0, 20).join(', ')}`,
    );
  });
});
