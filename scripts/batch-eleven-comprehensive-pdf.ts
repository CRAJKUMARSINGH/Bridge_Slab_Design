/**
 * Generates one comprehensive (~200+ page A4) PDF per eleven-bridge case
 * (same inputs as `npm run smoke:11-designs` / quick templates + Kherwara vars), written under
 * `archive/eleven-bridge-comprehensive-pdfs/`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import calculateCompleteDesign from '../bridge-excel-generator/design-engine';
import type { EnhancedProjectInput } from '../bridge-excel-generator/types';
import { generateComprehensivePDFWithPageCount } from '../server/comprehensive-pdf-export';
import { buildElevenBridgeCases, expectedDesignSmokeCaseCount } from './eleven-bridge-cases';

const OUT_DIR = join(process.cwd(), 'archive', 'eleven-bridge-comprehensive-pdfs');

function safeFileStem(id: string): string {
  return id.replace(/[:\\/*?|<>"]/g, '_');
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const cases = buildElevenBridgeCases();
  const expected = expectedDesignSmokeCaseCount();
  if (cases.length !== expected) {
    console.error(`Expected ${expected} cases, got ${cases.length}`);
    process.exit(1);
  }

  const summary: { id: string; pages: number; mb: string }[] = [];
  let failed = 0;

  for (const { id, input } of cases) {
    try {
      const design = calculateCompleteDesign(input, { quiet: true });
      const enhanced = { ...input, ...design } as EnhancedProjectInput;
      const { buffer, pageCount } = await generateComprehensivePDFWithPageCount(enhanced);
      const stem = safeFileStem(id);
      const file = join(OUT_DIR, `${stem}_Complete_46_Sheets.pdf`);
      writeFileSync(file, buffer);
      const mb = (buffer.length / 1024 / 1024).toFixed(2);
      summary.push({ id, pages: pageCount, mb });
      console.log(`OK  ${id}  pages=${pageCount}  ${mb} MB`);
    } catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`FAIL ${id}: ${msg}`);
    }
  }

  console.log('\n--- Summary ---');
  console.table(summary);
  console.log(`Output directory: ${OUT_DIR}`);
  if (summary.length) {
    const minP = Math.min(...summary.map((s) => s.pages));
    const maxP = Math.max(...summary.map((s) => s.pages));
    console.log(
      `Page count range across runs: ${minP}–${maxP} (comprehensive export targets ~200–250 incl. workbook grid appendix).`,
    );
  }
  process.exit(failed > 0 ? 1 : 0);
}

void main();
