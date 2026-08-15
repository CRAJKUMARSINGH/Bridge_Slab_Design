// audit_excel_workbooks.cjs – scans repo for Excel workbooks and reports the largest complete one
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const repoRoot = process.cwd();

function getAllExcelFiles(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    // Skip directories we cannot read (permissions, etc.)
    return [];
  }
  const files = [];
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

/** @typedef {{path:string,sizeKB:number,sheetCount:number,formulaCount:number,allSheetsHaveFormula:boolean}} Info */

async function analyze() {
  const infos = [];
  for (const file of excelFiles) {
    const stats = fs.statSync(file);
    if (stats.size < 100 * 1024) continue; // ignore tiny files
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.readFile(file);
    } catch (_) { continue; }
    let formulaCount = 0;
    let allSheetsHaveFormula = true;
    for (const ws of workbook.worksheets) {
      let sheetFormula = 0;
      ws.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
          if (cell.type === ExcelJS.ValueType.Formula) {
            formulaCount++; sheetFormula++; }
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

  // Determine workbook with the greatest number of sheets
  let selected;
  if (infos.length > 0) {
    selected = infos.reduce((a, b) => (a.sheetCount > b.sheetCount ? a : b));
  }

  const lines = [];
  lines.push('# Excel Workbook Audit Report');
  lines.push('');
  lines.push(`Generated on ${new Date().toISOString()}`);
  lines.push('');
  lines.push('| Workbook | Size (KB) | Sheets | Formula Cells | Complete (46) | All sheets have formula |');
  lines.push('|---|---|---|---|---|---|');
  for (const i of infos) {
    const mark = i===selected ? ' **SELECTED**' : '';
    lines.push(`| ${i.path}${mark} | ${i.sizeKB} | ${i.sheetCount} | ${i.formulaCount} | ${i.sheetCount===REQUIRED ? 'Yes' : 'No'} | ${i.allSheetsHaveFormula ? 'Yes' : 'No'} |`);
  }
  lines.push('');
  if (selected) lines.push(`**Selected workbook:** ${selected.path}`);

  const reportPath = path.join(repoRoot, 'excel_workbook_audit_report.md');
  fs.writeFileSync(reportPath, lines.join('\n'));
  console.log('Report written to', reportPath);
}

analyze();
