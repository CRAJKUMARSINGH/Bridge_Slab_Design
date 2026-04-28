import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine';
import { KHERWARA_REFERENCE_PROJECT_INPUT as inp } from './fixtures/kherwara-project-input';
import { computeDeckNarrativeBundle } from '../bridge-excel-generator/prose/deck-narrative-math';

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

console.log('crossSectionalArea:', globalCtx.crossSectionalArea);
console.log('velocity:', globalCtx.velocity);
console.log('froudeNumber:', globalCtx.froudeNumber);
console.log('flowType:', globalCtx.flowType);
console.log('regimeWidth:', globalCtx.regimeWidth);
console.log('effectiveWaterway:', globalCtx.effectiveWaterway);
console.log('scourDepth:', globalCtx.scourDepth);
console.log('designScourDepth:', globalCtx.designScourDepth);
console.log('afflux:', globalCtx.afflux);
console.log('designWaterLevel:', globalCtx.designWaterLevel);
