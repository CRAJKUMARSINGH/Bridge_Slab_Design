/**
 * GATE G3b — proves the suite is sensitive. If a 10% span change does NOT move the
 * discharge beyond tolerance, every "parity" claim in the repo is vacuous.
 */
import { describe, it, expect } from 'vitest';
import { calculateCompleteDesign } from '../../bridge-excel-generator/design-engine';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from '../../scripts/fixtures/kherwara-project-input';
import { toleranceFor } from '../helpers/tolerance';

const run = (i: typeof KHERWARA_REFERENCE_PROJECT_INPUT) =>
  calculateCompleteDesign(i, { quiet: true }).hydraulics;

describe('G3b tamper meta-test', () => {
  it('identical input is bit-identical (determinism)', () => {
    expect(run(KHERWARA_REFERENCE_PROJECT_INPUT).discharge).toBe(
      run(KHERWARA_REFERENCE_PROJECT_INPUT).discharge
    );
  });

  it('a 10% span change moves discharge beyond the registered tolerance', () => {
    const clean = run(KHERWARA_REFERENCE_PROJECT_INPUT);
    const bad = run({
      ...KHERWARA_REFERENCE_PROJECT_INPUT,
      spanLength: KHERWARA_REFERENCE_PROJECT_INPUT.spanLength * 1.1,
    });
    const t = toleranceFor('hydraulics.discharge');
    const allowed = t.atol + t.rtol * Math.abs(clean.discharge);
    expect(Math.abs(bad.discharge - clean.discharge)).toBeGreaterThan(allowed);
  });
});
