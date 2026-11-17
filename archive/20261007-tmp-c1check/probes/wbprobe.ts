import ExcelJS from 'exceljs';
import { readFileSync } from 'node:fs';
import { readCellValue } from '../../bridge-excel-generator/utils.ts';
async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(readFileSync('test-output/design-workbook.xlsx').buffer as ArrayBuffer);
  const qa = wb.getWorksheet('QA / CODE COMPLIANCE REGISTER') ?? wb.worksheets.find((w) => /QA/i.test(w.name));
  console.log('QA sheet:', qa?.name);
  if (qa) for (let r = 78; r <= 92; r++) { const id = String(readCellValue(qa.getCell(r, 2)) ?? ''); if (id === 'D1' || id === 'D2') console.log(`  ${id}: ${readCellValue(qa.getCell(r, 3))} [${readCellValue(qa.getCell(r, 4))}]`); }
  const c1 = wb.getWorksheet('C1-STABILITY CHECK ABUTMENT')!;
  console.log('C1 row3:', readCellValue(c1.getCell('A3')));
  for (const cell of ['C5', 'D5', 'E5', 'F5']) console.log(`  C1 ${cell}:`, JSON.stringify(readCellValue(c1.getCell(cell))));
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
