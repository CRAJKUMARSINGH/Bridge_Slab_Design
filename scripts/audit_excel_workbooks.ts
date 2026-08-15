import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

const repoRoot = path.resolve(__dirname, '..');

function getAllExcelFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...getAllExcelFiles(full));
    } else if (e.isFile() && /\.(xlsx?|xlsm?)$/i.test(e.name)) {
      files.push(full);
    }
  }
  return files;
}

const excelFiles = getAllExcelFiles(repoRoot);

interface Info {
  path: string;
  sizeKB: number;
  sheetCount: number;
  formulaCount: number;
  allSheetsHaveFormula: boolean;
}

async function analyze() {
  const infos: Info[] = [];
  for (const file of excelFiles) {
    const stats = fs.statSync(file);
    // skip tiny files that are unlikely to be full workbooks
    if (stats.size < 100 * 1024) continue;
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.readFile(file);
    } catch (e) {
      // ExcelJS may not support old .xls formats – ignore those files
      continue;
    }
    let formulaCount = 0;
    let allSheetsHaveFormula = true;
    for (const ws of workbook.worksheets) {
      let sheetFormula = 0;
      ws.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
          if (cell.type === ExcelJS.ValueType.Formula) {
            formulaCount++;
            sheetFormula++;
          }
        });
      });
      if (sheetFormula === 0) allSheetsHaveFormula = false;
    }
    infos.push({
      path: file,
      sizeKB: Math.round(stats.size / 1024),
      sheetCount: workbook.worksheets.length,
      formulaCount,
      allSheetsHaveFormula,
    });
  }

  const REQUIRED = 46;
  const complete = infos.filter((i) => i.sheetCount === REQUIRED);
  let selected: Info | undefined;
  if (complete.length > 0) {
    selected = complete.reduce((a, b) => (a.sizeKB > b.sizeKB ? a : b));
  } else {
    selected = infos.reduce((a, b) => (a.sizeKB > b.sizeKB ? a : b));
  }

  const lines: string[] = [];
  lines.push('# Excel Workbook Audit Report');
  lines.push('');
  lines.push(`Generated on ${new Date().toISOString()}`);
  lines.push('');
  lines.push('| Workbook | Size (KB) | Sheets | Formula Cells | Complete (46 sheets) | All sheets have formula |');
  lines.push('|---|---|---|---|---|---|');
  for (const i of infos) {
    const mark = i === selected ? ' **SELECTED**' : '';
    lines.push(`| ${i.path}${mark} | ${i.sizeKB} | ${i.sheetCount} | ${i.formulaCount} | ${i.sheetCount === REQUIRED ? 'Yes' : 'No'} | ${i.allSheetsHaveFormula ? 'Yes' : 'No'} |`);
  }
  lines.push('');
  if (selected) {
    lines.push(`**Selected workbook:** ${selected.path}`);
  }

  const reportPath = path.join(repoRoot, 'excel_workbook_audit_report.md');
  fs.writeFileSync(reportPath, lines.join('\n'));
  console.log('Report written to', reportPath);
}

analyze();
