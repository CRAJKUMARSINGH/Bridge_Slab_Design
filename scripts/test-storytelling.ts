import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import { PHASE1_QUICK_TEMPLATES } from '../server/default-project-inputs';

function cellValueToText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  const cell = value as { richText?: { text?: string }[]; text?: string; result?: unknown };
  if (Array.isArray(cell.richText)) return cell.richText.map((part) => part.text ?? '').join('');
  if (typeof cell.text === 'string') return cell.text;
  if (cell.result !== undefined && cell.result !== null) return String(cell.result);
  return '';
}

function assertNoNarrativePlaceholders(text: string, context: string) {
  const forbiddenPatterns: Array<{ name: string; re: RegExp }> = [
    { name: 'NaN token', re: /\bNaN\b/ },
    { name: 'insert placeholder', re: /\[INSERT HERE\]/i },
    { name: 'em-dash placeholder', re: /—/ },
    { name: 'colon dash placeholder', re: /:\s-\s*([.,;:]|$)/ },
    { name: 'equals dash placeholder', re: /=\s-\s*([.,;:]|$)/ },
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.re.test(text)) {
      throw new Error(`Narrative placeholder violation (${pattern.name}) in ${context}`);
    }
  }
}

async function main() {
  const users = PHASE1_QUICK_TEMPLATES.slice(0, 3);
  console.log(`Testing 3 distinct users...`);
  
  let reportText = '# Technical Design Report Certification\n\n';

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    console.log(`\nUser ${i + 1}: Generating 55 sheets for [${user.name}]...`);
    const buffer = await generateCompleteExcel(user.input);
    
    // Save the workbook
    const outPath = path.resolve(`user_${i + 1}_${user.id}_design.xlsx`);
    fs.writeFileSync(outPath, buffer);
    console.log(`✅ Saved: ${outPath} (${(buffer.length / 1024).toFixed(2)} KB)`);
    
    // Load workbook to read narrative
    const wb = new ExcelJS.Workbook();
    // ExcelJS pins a pre-generic @types/node Buffer; Node 24's Buffer<ArrayBufferLike> is the same value.
    const load = wb.xlsx.load.bind(wb.xlsx) as (data: Uint8Array) => Promise<ExcelJS.Workbook>;
    await load(buffer);

    reportText += `## User ${i + 1}: ${user.name}\n\n`;

    const narrativeSheets = ['TechNote', 'Tech Report'];
    for (const sheetName of narrativeSheets) {
      const sheet = wb.getWorksheet(sheetName) || wb.worksheets.find(s => s.name === sheetName);
      if (sheet) {
        reportText += `### ${sheetName} Content\n`;
        let text = '';
        sheet.eachRow((row) => {
          // ExcelJS types `row.values` as a union of the array getter and the (begin,end) method.
          const cellValues: unknown[] = typeof row.values === 'function'
            ? (row.values as (begin: number, end: number) => unknown[])(1, row.cellCount)
            : Array.from(row.values as Iterable<unknown>);
          const rowText = cellValues.map(cellValueToText).join(' ').trim();
          if (rowText) text += rowText + '\n';
        });
        assertNoNarrativePlaceholders(text, `${user.id}/${sheetName}`);
        reportText += `\`\`\`text\n${text}\n\`\`\`\n\n`;
      } else {
        reportText += `### ${sheetName} Content\n*Sheet not found*\n\n`;
      }
    }
    
    console.log(`✅ Certified storytelling narrative extracted for User ${i + 1}.`);
  }
  
  fs.writeFileSync(path.resolve('narrative_certification.md'), reportText);
  console.log(`\n✅ Certification complete. Check narrative_certification.md`);
}

main().catch(console.error);
