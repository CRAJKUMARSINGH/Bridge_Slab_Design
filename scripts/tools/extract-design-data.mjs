import XLSX from 'xlsx';
import fs from 'fs';

const buffer = fs.readFileSync('attached_assets/for replit FINAL_RESULT_1763885256922.xls');
const workbook = XLSX.read(buffer);

// Extract key data from important sheets
const sheetData = {};

// Sheet: afflux calculation
const affluxWs = workbook.Sheets['afflux calculation'];
const affluxData = XLSX.utils.sheet_to_json(affluxWs, { header: 1 });

// Sheet: HYDRAULICS
const hydraulicsWs = workbook.Sheets['HYDRAULICS'];
const hydraulicsData = XLSX.utils.sheet_to_json(hydraulicsWs, { header: 1 });

// Sheet: Deck Anchorage
const deckWs = workbook.Sheets['Deck Anchorage'];
const deckData = XLSX.utils.sheet_to_json(deckWs, { header: 1 });

// Sheet: STABILITY CHECK FOR PIER
const pierWs = workbook.Sheets['STABILITY CHECK FOR PIER'];
const pierData = XLSX.utils.sheet_to_json(pierWs, { header: 1 });

// Extract numeric values
const designData = {
  hydraulics: {
    discharge: null,
    velocity: null,
    floodLevel: 100.6,
    crossSectionalArea: 490.3
  },
  pier: {
    width: 1.2,
    numberOfPiers: 11
  }
};

// Parse afflux data for discharge
affluxData.forEach((row, idx) => {
  if (row[0]?.toString().includes('Q') && row[2]) {
    designData.hydraulics.discharge = parseFloat(row[2]);
  }
});

// Parse hydraulics data
hydraulicsData.forEach((row, idx) => {
  if (row[0]?.toString().includes('HIGHEST') && row[5]) {
    designData.hydraulics.floodLevel = parseFloat(row[5]);
  }
  if (row[0] === 0 || row[0] === '0') {
    if (row[5]) designData.hydraulics.crossSectionalArea = parseFloat(row[5]);
    if (row[6]) designData.hydraulics.velocity = parseFloat(row[6]);
  }
});

console.log('Extracted Design Data:');
console.log(JSON.stringify(designData, null, 2));

// Save to file
fs.writeFileSync('design-data.json', JSON.stringify(designData, null, 2));
console.log('Saved to design-data.json');
