import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine';
import { KHERWARA_REFERENCE_PROJECT_INPUT as inp } from './fixtures/kherwara-project-input';
import { computeDeckNarrativeBundle } from '../bridge-excel-generator/prose/deck-narrative-math';
import { getComprehensiveNarrative } from '../bridge-excel-generator/prose/sheet-narratives';

const result = calculateCompleteDesign(inp, { quiet: true });
const hyd = (result.hydraulics ?? {}) as Record<string, unknown>;
const deckNarrative = computeDeckNarrativeBundle(inp);
const globalCtx: Record<string, unknown> = {
  ...hyd,
  pierData: result.pier,
  abutmentT1Data: result.abutmentType1,
  abutmentC1Data: result.abutmentC1,
  estimationData: result.estimation,
  deckNarrative,
};

console.log('globalCtx.velocity:', globalCtx.velocity);
console.log('typeof globalCtx.velocity:', typeof globalCtx.velocity);

// Test the wind narrative directly
const windText = getComprehensiveNarrative('load-wind', inp, globalCtx);
console.log('\nWind narrative:');
console.log(windText);
