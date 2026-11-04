import { SHEETS } from '../client/src/lib/sheet-definitions';
import { getComprehensiveNarrative } from '../bridge-excel-generator/prose/sheet-narratives';
import { kherwaraDesign } from '../bridge-excel-generator/fixtures/kherwara-design';
import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine';
import { computeDeckNarrativeBundle } from '../bridge-excel-generator/prose/deck-narrative-math';

// Run full design
const result = calculateCompleteDesign(kherwaraDesign, { quiet: true });

// Mirror the exact globalResult shape used in 00-narrative-report.ts
// Hydraulics fields are spread at top level so r.crossSectionalArea etc. resolve.
// Named blocks use the canonical keys: pierData, abutmentT1Data, abutmentC1Data.
const hyd = (result.hydraulics ?? {}) as Record<string, unknown>;
const deckNarrative = computeDeckNarrativeBundle(kherwaraDesign);
const globalCtx: Record<string, unknown> = {
  ...hyd,
  pierData: result.pier,
  abutmentT1Data: result.abutmentType1,
  abutmentC1Data: result.abutmentC1,
  estimationData: result.estimation,
  deckNarrative,
};

console.log("# Bridge Design — 50-Sheet Narrative Readability Check\n");

SHEETS.forEach((s) => {
  const text = getComprehensiveNarrative(s.id, kherwaraDesign, globalCtx);
  console.log(`### Sheet ${s.sheetNo}: ${s.title}`);
  console.log(`**ID**: \`${s.id}\` | **Category**: ${s.category}`);
  console.log(`\n> ${text}\n`);
});
