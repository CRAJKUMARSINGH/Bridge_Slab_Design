import { buildWorkbookSheetPreviews } from '../server/workbook-sheets-preview';
import { KHERWARA_REFERENCE_PROJECT_INPUT as input } from './fixtures/kherwara-project-input.ts';

async function main(): Promise<void> {
  const sheets = await buildWorkbookSheetPreviews(input, { maxRows: 900, maxCols: 60 });
  const lines: string[] = [];
  let clippedRows = 0;
  let clippedCols = 0;
  for (const s of sheets) {
    const rowClip = s.sourceRowCount > 900;
    const colClip = s.sourceColCount > 60;
    if (rowClip) clippedRows++;
    if (colClip) clippedCols++;
    lines.push(
      `${s.name.padEnd(34)} src ${String(s.sourceRowCount).padStart(4)}r x ${String(s.sourceColCount).padStart(3)}c  print ${String(s.rowCount).padStart(4)}r x ${String(s.colCount).padStart(3)}c${rowClip || colClip ? '  << CLIP' : ''}`
    );
  }
  lines.push(`clipped rows ${clippedRows}, clipped cols ${clippedCols}, total print rows ${sheets.reduce((n, s) => n + s.rowCount, 0)}`);
  process.stdout.write(lines.join('\n') + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
