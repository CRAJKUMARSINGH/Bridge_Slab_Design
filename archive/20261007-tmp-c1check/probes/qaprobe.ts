import ExcelJS from 'exceljs';
import { readFileSync } from 'node:fs';
import { readCellValue } from '../../bridge-excel-generator/utils.ts';
async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(readFileSync('test-output/design-workbook.xlsx').buffer as ArrayBuffer);
  const qa = wb.getWorksheet('IRC CODE COMPLIANCE CHECKLIST')!;
  for (let r = 1; r <= 70; r++) {
    const id = String(readCellValue(qa.getCell(r, 2)) ?? '');
    if (id === 'D1' || id === 'D2' || id === 'D5') {
      console.log(`row ${r} ${id}: ${readCellValue(qa.getCell(r, 3))}  [status ${readCellValue(qa.getCell(r, 4))}]`);
    }
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
