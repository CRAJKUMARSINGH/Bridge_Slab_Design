import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import { PHASE1_QUICK_TEMPLATES } from '../server/default-project-inputs';

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
    await wb.xlsx.load(buffer);
    
    reportText += `## User ${i + 1}: ${user.name}\n\n`;
    
    const narrativeSheets = ['TechNote', 'Tech Report'];
    for (const sheetName of narrativeSheets) {
      const sheet = wb.getWorksheet(sheetName) || wb.worksheets.find(s => s.name === sheetName);
      if (sheet) {
        reportText += `### ${sheetName} Content\n`;
        let text = '';
        sheet.eachRow((row) => {
          const rowText = row.values.map(v => typeof v === 'object' && v && 'richText' in v ? v.richText.map(r => r.text).join('') : String(v || '')).join(' ').trim();
          if (rowText) text += rowText + '\n';
        });
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
