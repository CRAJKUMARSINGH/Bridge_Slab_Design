/**
 * Write one full workbook from the same seed as GET /api/design/demo-seed (Kherwara golden).
 * Run: npm run demo:workbook
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from './fixtures/kherwara-project-input';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const outDir = path.join(repoRoot, 'archive', 'w16-demo');
const outFile = path.join(outDir, 'FirstCompleteDesign_Kherwara_Seed.xlsx');

mkdirSync(outDir, { recursive: true });
const buf = await generateCompleteExcel(KHERWARA_REFERENCE_PROJECT_INPUT);
writeFileSync(outFile, buf);
console.log('W16 demo workbook:', outFile, `(${(buf.length / 1024).toFixed(2)} KB)`);
