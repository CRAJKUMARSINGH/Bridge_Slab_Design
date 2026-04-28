import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

async function readExcel() {
  const filePath = 'attached_assets/for replit FINAL_RESULT_1763885256922.xls';
  
  if (!fs.existsSync(filePath)) {
    console.log('File not found at:', filePath);
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    console.log('Total Sheets:', workbook.worksheets.length);
    console.log('\nSheet Structure:');
    
    workbook.worksheets.forEach((ws, idx) => {
      console.log(`\n=== Sheet ${idx + 1}: "${ws.name}" ===`);
      
      let rowCount = 0;
      ws.eachRow((row) => {
        rowCount++;
        if (rowCount <= 5) {
          const values = [];
          row.eachCell(cell => values.push(cell.value));
          console.log(values.join(' | '));
        }
      });
      console.log(`... (${rowCount} total rows)`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

readExcel();
