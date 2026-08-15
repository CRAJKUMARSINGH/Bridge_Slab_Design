import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine';
import { KHERWARA_REFERENCE_PROJECT_INPUT as inp } from './fixtures/kherwara-project-input';
const r = calculateCompleteDesign(inp, { quiet: true });
console.log(JSON.stringify({ 
  crossSectionalArea: r.hydraulics.crossSectionalArea,
  velocity: r.hydraulics.velocity,
  froudeNumber: r.hydraulics.froudeNumber,
  flowType: r.hydraulics.flowType,
  regimeWidth: r.hydraulics.regimeWidth,
  effectiveWaterway: r.hydraulics.effectiveWaterway,
  scourDepth: r.hydraulics.scourDepth,
  designScourDepth: r.hydraulics.designScourDepth,
  afflux: r.hydraulics.afflux,
  designWaterLevel: r.hydraulics.designWaterLevel
}, null, 2));
