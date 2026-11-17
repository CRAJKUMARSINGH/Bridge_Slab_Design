import { calculateCompleteDesign } from '../../bridge-excel-generator/design-engine.ts';
import { PHASE1_QUICK_TEMPLATES } from '../../server/default-project-inputs.ts';
function main() {
  let pairs = 0; const divergences: string[] = []; let geomSame = 0, geomDiff = 0;
  for (const t of PHASE1_QUICK_TEMPLATES) {
    const d: any = calculateCompleteDesign(t.input, { quiet: true });
    const t1 = d.abutmentType1, c1 = d.abutmentC1;
    const gk = ['height','width','depth','baseWidth','baseLength'] as const;
    const same = gk.every((k) => Math.abs((t1.geometry as any)[k] - (c1.geometry as any)[k]) < 1e-9);
    same ? geomSame++ : geomDiff++;
    if (!same) divergences.push(`${t.id}: GEOMETRY differs ${gk.map((k)=>`${k} T1=${(t1.geometry as any)[k]} C1=${(c1.geometry as any)[k]}`).join(' ')}`.trim());
    t1.loadCases.forEach((a: any, i: number) => {
      const b = c1.loadCases[i]; pairs++;
      for (const k of ['slidingFOS','overturningFOS','bearingFOS','verticalForce','horizontalForce','moment','status'] as const) {
        const x = a[k], y = b[k];
        const bad = typeof x === 'number' ? Math.abs(x - y) > 1e-9 : String(x) !== String(y);
        if (bad) divergences.push(`${t.id} case ${a.caseNumber}: ${k} TYPE1=${x} C1=${y}`);
      }
    });
  }
  console.log(`templates=${PHASE1_QUICK_TEMPLATES.length} case-pairs=${pairs} geometry identical=${geomSame} differing=${geomDiff}`);
  console.log(divergences.length ? `DIVERGENCES (${divergences.length}):\n  ` + divergences.join('\n  ') : 'DIVERGENCES: none — engine Type-1 and C1 outputs are identical case by case today');
}
main();
