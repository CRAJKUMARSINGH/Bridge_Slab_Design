import { PHASE1_QUICK_TEMPLATES, PHASE1_DEFAULT_PROJECT_INPUT } from '../../server/default-project-inputs.ts';
let sub = 0, hl = 0, soffitBelow = 0, soffitBelowHl = 0;
const all: any[] = [...(PHASE1_QUICK_TEMPLATES as any[]), PHASE1_DEFAULT_PROJECT_INPUT];
for (const t of all) {
  if (t.bridgeType === 'submersible') sub++; else hl++;
  if (t.deckSoffitLevel !== undefined && t.hfl !== undefined && t.deckSoffitLevel < t.hfl) {
    soffitBelow++;
    if (t.bridgeType !== 'submersible') soffitBelowHl++;
  }
}
console.log(JSON.stringify({ total: all.length, submersible: sub, highLevel: hl, soffitBelowHfl: soffitBelow, soffitBelowHfl_nonSubmersible: soffitBelowHl }));
const lanes = all.filter((t) => t.numberOfLanes !== undefined && t.carriageWidth !== undefined && t.numberOfLanes * 3.75 > t.carriageWidth * 1.2);
console.log('lane-rule hits:', lanes.map((t) => `${t.projectName}: ${t.numberOfLanes} lanes x 3.75 = ${(t.numberOfLanes * 3.75).toFixed(2)} m vs carriageWidth ${t.carriageWidth} m`).join(' | '));
