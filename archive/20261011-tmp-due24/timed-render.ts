import { performance } from 'node:perf_hooks';

import { generateComprehensivePDFWithPageCount } from '../server/comprehensive-pdf-export.ts';
import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine.ts';
import { kherwaraProjectInput } from './fixtures/kherwara-project-input.ts';

const enhanced = { ...kherwaraProjectInput, ...calculateCompleteDesign(kherwaraProjectInput, { quiet: true }) };

const t0 = performance.now();
const { pageCount } = await generateComprehensivePDFWithPageCount(enhanced as never);
const t1 = performance.now();
console.log(`render pass: pages=${pageCount} ms=${Math.round(t1 - t0)}`);
