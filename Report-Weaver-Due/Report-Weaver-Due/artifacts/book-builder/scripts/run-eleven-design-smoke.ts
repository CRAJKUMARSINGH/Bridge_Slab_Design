/**
 * Runs the design engine on all Phase-1 quick templates plus six Kherwara
 * perturbations. Exit 1 if any case throws or returns invalid hydraulics.
 */
import calculateCompleteDesign from '../bridge-excel-generator/design-engine';
import { buildElevenBridgeCases, expectedDesignSmokeCaseCount } from './eleven-bridge-cases';

function main() {
  const cases = buildElevenBridgeCases();
  const expected = expectedDesignSmokeCaseCount();
  if (cases.length !== expected) {
    console.error(`Expected ${expected} cases, got ${cases.length}`);
    process.exit(1);
  }

  let failed = 0;
  for (const { id, input } of cases) {
    try {
      const out = calculateCompleteDesign(input, { quiet: true });
      const v = out.hydraulics?.velocity;
      const q = out.hydraulics?.discharge;
      if (typeof v !== 'number' || !Number.isFinite(v) || typeof q !== 'number' || !Number.isFinite(q)) {
        console.error(`FAIL ${id}: invalid hydraulics (v=${v}, Q=${q})`);
        failed++;
        continue;
      }
      console.log(`OK   ${id}  v=${v.toFixed(3)} m/s  Q=${q.toFixed(2)} cumecs`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`FAIL ${id}: ${msg}`);
      failed++;
    }
  }

  console.log(`\nDone: ${cases.length - failed}/${cases.length} passed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
