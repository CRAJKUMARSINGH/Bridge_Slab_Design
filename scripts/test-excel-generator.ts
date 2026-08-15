/**
 * Smoke test: generate full workbook (run from repo root: npm run test:excel).
 */
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from './fixtures/kherwara-project-input';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

async function main() {
  console.log('Testing bridge-excel-generator...\n');
  const buffer = await generateCompleteExcel(KHERWARA_REFERENCE_PROJECT_INPUT);
  const outputFile = path.join(repoRoot, 'TEST_CURRENT_OUTPUT.xlsx');
  fs.writeFileSync(outputFile, buffer);
  console.log(`OK — wrote ${outputFile} (${(buffer.length / 1024).toFixed(2)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
