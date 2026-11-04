/**
 * DUE-26 probe — do the engine's bearing/sliding guards actually fire on shipped templates?
 * Read-only: calls calculateCompleteDesign and inspects the load cases.
 */
import { PHASE1_QUICK_TEMPLATES } from '../../server/default-project-inputs';
import { calculateCompleteDesign } from '../../bridge-excel-generator/design-engine';

let upliftCases = 0;
let totalCases = 0;
let maxGuardHits = 0;
let dryChannel = 0;
const upliftTemplates = new Set<string>();
const guardTemplates = new Set<string>();

for (const t of PHASE1_QUICK_TEMPLATES) {
  const r = calculateCompleteDesign(t.input);
  const h = r.hydraulics as { froudeNumber?: number; flowType?: string; avgFlowDepth?: number } | undefined;
  if (h) {
    const fr = h.froudeNumber;
    if (!Number.isFinite(fr)) dryChannel++;
    if (h.flowType === 'Supercritical' && !Number.isFinite(fr)) {
      console.log(`  NON-FINITE Fr -> confident label: ${t.id} flowType=${h.flowType} avgFlowDepth=${h.avgFlowDepth}`);
    }
  }
  for (const lc of r.pier.loadCases) {
    totalCases++;
    if (lc.verticalForce < 0) {
      upliftCases++;
      upliftTemplates.add(t.id);
    }
    if (lc.horizontalForce < 1 || lc.moment < 1) maxGuardHits++;
    if (lc.horizontalForce < 1) guardTemplates.add(`${t.id} H<1kN (${lc.horizontalForce.toFixed(3)})`);
  }
}

console.log('templates:', PHASE1_QUICK_TEMPLATES.length);
console.log('pier load cases inspected:', totalCases);
console.log('net-uplift cases (verticalForce < 0):', upliftCases, [...upliftTemplates].join(', ') || 'NONE');
console.log('Math.max(x,1) guard hits (H<1kN or M<1kNm):', maxGuardHits);
console.log('  sample:', [...guardTemplates].slice(0, 6).join(' | ') || 'NONE');
console.log('non-finite Froude outputs:', dryChannel);
