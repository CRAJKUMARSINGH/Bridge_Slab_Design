import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import calculateCompleteDesign from '../bridge-excel-generator/design-engine';
import { generateBridgeDXF } from '../server/dxf-export';
import { generateHTMLDesignReport } from '../server/design-report';
import type { EnhancedProjectInput } from '../bridge-excel-generator/types';
import { buildElevenBridgeCases, expectedDesignSmokeCaseCount } from './eleven-bridge-cases';

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

async function main() {
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;
  const cases = buildElevenBridgeCases();
  const expected = expectedDesignSmokeCaseCount();
  if (cases.length !== expected) {
    throw new Error(`Expected ${expected} cases, got ${cases.length}`);
  }
  const selectedCases =
    typeof limit === 'number' && Number.isFinite(limit) && limit > 0
      ? cases.slice(0, Math.floor(limit))
      : cases;

  const outRoot = join(process.cwd(), 'sample', 'merged-11-users-full');
  mkdirSync(outRoot, { recursive: true });

  let ok = 0;
  for (const testCase of selectedCases) {
    const tag = safeName(testCase.id);
    const userDir = join(outRoot, tag);
    mkdirSync(userDir, { recursive: true });
    try {
      const design = calculateCompleteDesign(testCase.input, { quiet: true });
      const enhanced = { ...testCase.input, ...design } as EnhancedProjectInput;
      const workbook = await generateCompleteExcel(testCase.input);

      writeFileSync(join(userDir, 'input.json'), JSON.stringify(testCase.input, null, 2));
      writeFileSync(join(userDir, 'design-results.json'), JSON.stringify(design, null, 2));
      writeFileSync(join(userDir, 'estimation.json'), JSON.stringify(design.estimation ?? null, null, 2));
      writeFileSync(join(userDir, `${tag}_design.xlsx`), workbook);
      writeFileSync(join(userDir, `${tag}_drawing.dxf`), generateBridgeDXF(enhanced, { acadVersion: 'AC1018' }), 'utf-8');
      writeFileSync(join(userDir, `${tag}_report.html`), generateHTMLDesignReport(enhanced), 'utf-8');

      ok += 1;
      console.log(`OK   ${testCase.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`FAIL ${testCase.id}: ${message}`);
      process.exitCode = 1;
    }
  }

  console.log(`\nDone: ${ok}/${selectedCases.length} generated`);
}

void main();
