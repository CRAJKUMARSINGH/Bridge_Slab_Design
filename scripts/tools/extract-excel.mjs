import fs from 'fs';

const filePath = 'attached_assets/for replit FINAL_RESULT_1763885256922.xls';

// Try to read file as different formats
const buffer = fs.readFileSync(filePath);
console.log('File size:', buffer.length, 'bytes');
console.log('First 200 bytes (hex):');
console.log(buffer.slice(0, 200).toString('hex'));

// Check file signature
const signature = buffer.slice(0, 8).toString('hex');
console.log('File signature:', signature);

if (signature.includes('d0cf11e0')) {
  console.log('→ OLE2/XLS format detected (older Excel)');
} else if (signature.includes('504b0304')) {
  console.log('→ ZIP/XLSX format detected (newer Excel)');
} else {
  console.log('→ Unknown format');
}

// Try with xlsx library
try {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer);
  console.log('\nSheets found:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(name => {
    const ws = workbook.Sheets[name];
    console.log(`\n=== Sheet: ${name} ===`);
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    data.slice(0, 8).forEach(row => {
      console.log(row.join(' | '));
    });
  });
} catch (err) {
  console.log('XLSX error:', err.message);
}
