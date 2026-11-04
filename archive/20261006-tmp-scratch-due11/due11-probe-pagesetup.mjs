import ExcelJS from 'exceljs';

const file = process.argv[2];
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(file);

const rows = [];
wb.worksheets.forEach((ws, i) => {
  const ps = ws.pageSetup ?? {};
  const m = ps.margins ?? {};
  rows.push({
    idx: i + 1,
    name: ws.name,
    orient: ps.orientation ?? 'unset',
    paper: ps.paperSize ?? 'unset',
    fitToPage: ps.fitToPage ?? 'unset',
    fitToWidth: ps.fitToWidth ?? 'unset',
    fitToHeight: ps.fitToHeight ?? 'unset',
    marginsMm: ['left', 'right', 'top', 'bottom']
      .map((k) => (typeof m[k] === 'number' ? +(m[k] * 25.4).toFixed(2) : 'unset'))
      .join('/'),
  });
});

const mm = (v) => rows.filter((r) => r.marginsMm === v).length;
const landscape = rows.filter((r) => r.orient === 'landscape').map((r) => r.idx);
console.log(JSON.stringify({
  file,
  sheetCount: rows.length,
  landscapeCount: landscape.length,
  landscapeIdx: landscape,
  portraitCount: rows.length - landscape.length,
  orientationValues: [...new Set(rows.map((r) => r.orient))],
  paperValues: [...new Set(rows.map((r) => String(r.paper)))],
  fitToPageValues: [...new Set(rows.map((r) => String(r.fitToPage)))],
  marginSets: Object.fromEntries([...new Set(rows.map((r) => r.marginsMm))].map((s) => [s, mm(s)])),
  unsetPageSetup: rows.filter((r) => r.orient === 'unset').length,
}, null, 2));
for (const r of rows) console.log(`${String(r.idx).padStart(2)} ${r.orient.padEnd(9)} ${r.marginsMm.padEnd(20)} ${r.name}`);
