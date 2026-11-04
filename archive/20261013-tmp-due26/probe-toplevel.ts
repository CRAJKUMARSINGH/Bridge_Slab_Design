import { PHASE1_QUICK_TEMPLATES } from '../../server/default-project-inputs';
import { calculateCompleteDesign } from '../../bridge-excel-generator/design-engine';
const r: any = calculateCompleteDesign(PHASE1_QUICK_TEMPLATES[0].input);
console.log('TOPLEVEL=' + Object.keys(r).sort().join(','));
