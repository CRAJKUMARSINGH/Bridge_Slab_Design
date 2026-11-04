import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { generateCompleteExcel } from '../../bridge-excel-generator/index.ts';
import { EXPECTED_SHEET_COUNT, EXPECTED_SHEET_NAMES } from '../../bridge-excel-generator/sheet-contract.ts';

/**
 * Complete valid input matching the full ProjectInputSchema contract.
 */
const VALID_INPUT = {
  projectName: "Excel Integrity Test Bridge",
  location: "Rajasthan, India",
  riverName: "Test River",
  spanLength: 8,
  numberOfSpans: 1,
  carriageWidth: 7.5,
  numberOfLanes: 2,
  totalLength: 8,
  bedLevel: 95,
  hfl: 100,
  foundationLevel: 90,
  discharge: 150,
  manningN: 0.035,
  bedSlope: 500,
  laceysSiltFactor: 1.1,
  crossSectionData: [
    { chainage: 0, gl: 100 },
    { chainage: 20, gl: 95 },
    { chainage: 40, gl: 100 }
  ],
  pierWidth: 1.2,
  pierLength: 8.5,
  pierDepth: 5,
  numberOfPiers: 0,
  pierBaseWidth: 4.5,
  pierBaseLength: 10.5,
  abutmentHeight: 6.5,
  abutmentWidth: 10.5,
  abutmentDepth: 4.5,
  dirtWallHeight: 2.5,
  returnWallLength: 6,
  concreteGrade: "M30",
  fck: 30,
  steelGrade: "Fe500",
  fy: 500,
  sbc: 250,
  phi: 30,
  gamma: 18,
  rtl: 103,
  agl: 95,
  nbl: 95,
  ofl: 100,
  dwl: 100.5,
};

describe('Excel Workbook Integrity & Recalculation Structure', () => {
  it('generates a workbook buffer and validates the 46-sheet contract via ExcelJS', async () => {
    const buffer = await generateCompleteExcel(VALID_INPUT);
    assert.ok(buffer instanceof Buffer);
    assert.ok(buffer.length > 10000);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    assert.equal(
      workbook.worksheets.length,
      EXPECTED_SHEET_COUNT,
      `Workbook should have ${EXPECTED_SHEET_COUNT} sheets, got ${workbook.worksheets.length}`,
    );

    const sheetNames = workbook.worksheets.map(w => w.name);
    assert.deepEqual(sheetNames, [...EXPECTED_SHEET_NAMES]);

    let emptySheets = 0;
    workbook.worksheets.forEach(ws => {
      let cellCount = 0;
      ws.eachRow(row => {
        row.eachCell(() => { cellCount++; });
      });
      if (cellCount === 0) emptySheets++;
    });
    assert.equal(emptySheets, 0, 'Every sheet must have at least 1 populated cell');
  });

  it('verifies Excel size is within sanity bounds (50 KB - 5 MB)', async () => {
    const buffer = await generateCompleteExcel(VALID_INPUT);
    const sizeKb = buffer.length / 1024;
    assert.ok(sizeKb >= 50 && sizeKb <= 5000, `Excel size of ${sizeKb.toFixed(1)} KB is out of bounds`);
  });

  it('E-006 validates Excel generation determinism', async () => {
    const buffer1 = await generateCompleteExcel(VALID_INPUT);
    const buffer2 = await generateCompleteExcel(VALID_INPUT);
    assert.equal(Math.abs(buffer1.length - buffer2.length) < 100, true);
  });
});
