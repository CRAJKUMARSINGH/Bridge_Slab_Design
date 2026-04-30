/**
 * Sheet: abstract of stresses — pier footing summary vs load cases (instruction 5f).
 * Uses design-engine pier load cases when present; Excel MAX/MIN over σmax/σmin; SBC check.
 */

import ExcelJS from 'exceljs';
import { EnhancedProjectInput } from '../types';
import { setColumnWidths, setCellValue, setCellFormula } from '../utils';

export async function generateAbstractOfStressesSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('abstract of stresses');

  setColumnWidths(ws, [5, 28, 12, 12, 12, 14, 14, 14, 14, 12]);

  let row = 1;

  setCellValue(ws, row, 1, 'ABSTRACT OF STRESSES IN PIER');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row++;

  setCellValue(ws, row, 1, `Project: ${input.projectName}`);
  row++;
  row++;

  const pier = input.pier;
  const pw = pier?.geometry.baseWidth ?? input.pierBaseWidth;
  const pl = pier?.geometry.baseLength ?? input.pierBaseLength;
  const area = pw * pl;
  const zx = (pw * pl * pl) / 6;
  const zy = (pl * pw * pw) / 6;
  const sbc = input.sbc;

  setCellValue(ws, row, 9, 'SBC (kN/m²)');
  ws.getCell(row, 9).font = { bold: true };
  setCellValue(ws, row, 10, sbc);
  ws.getCell(row, 10).font = { bold: true };
  const sbcRow = row;
  row++;

  setCellValue(ws, row, 1, 'Footprint A');
  setCellValue(ws, row, 2, +area.toFixed(3));
  setCellValue(ws, row, 3, 'm²');
  setCellValue(ws, row, 5, 'Zx');
  setCellValue(ws, row, 6, +zx.toFixed(4));
  setCellValue(ws, row, 7, 'm³');
  setCellValue(ws, row, 9, 'Zy');
  setCellValue(ws, row, 10, +zy.toFixed(4));
  setCellValue(ws, row, 11, 'm³');
  row += 2;

  setCellValue(ws, row, 1, 'S.No.');
  setCellValue(ws, row, 2, 'LOAD CASE');
  setCellValue(ws, row, 3, 'P (kN)');
  setCellValue(ws, row, 4, 'Mx (kN-m)');
  setCellValue(ws, row, 5, 'My (kN-m)');
  setCellValue(ws, row, 6, 'σmax (kN/m²)');
  setCellValue(ws, row, 7, 'σmin (kN/m²)');
  setCellValue(ws, row, 8, 'vs SBC');
  setCellValue(ws, row, 9, 'Tension');

  for (let col = 1; col <= 9; col++) {
    ws.getCell(row, col).font = { bold: true };
    ws.getCell(row, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' },
    };
  }
  row++;

  const dataStart = row;
  type RowCase = { no: number; name: string; p: number; mx: number; my: number };

  let cases: RowCase[] = [];

  if (pier && pier.loadCases.length > 0) {
    cases = pier.loadCases.map((lc) => ({
      no: lc.caseNumber,
      name: lc.description,
      p: lc.verticalForce,
      mx: lc.moment,
      my: lc.horizontalForce * (input.pierDepth * 0.15),
    }));
  } else {
    const pierVolume =
      (input.pierWidth || 1.5) * (input.pierLength || 4.0) * (input.pierDepth || 5.5);
    const deadLoad = pierVolume * 25;
    const liveLoad = (input.spanLength || 10) * (input.carriageWidth || 7.5) * 5.7;
    const waterDepth = (input.hfl || 285.5) - (input.bedLevel || 280.2);
    const hydrostaticForce = 0.5 * 9.81 * Math.pow(waterDepth, 2) * (input.pierLength || 4.0);
    cases = [
      {
        no: 1,
        name: 'Service Condition',
        p: deadLoad + liveLoad,
        mx: (hydrostaticForce * waterDepth) / 3,
        my: liveLoad * 0.1 * (input.spanLength || 10),
      },
      {
        no: 2,
        name: 'Idle Condition at HFL',
        p: deadLoad,
        mx: ((hydrostaticForce * waterDepth) / 3) * 1.2,
        my: 0,
      },
      {
        no: 3,
        name: 'Wind Force - Service',
        p: deadLoad + liveLoad * 0.75,
        mx: (hydrostaticForce * waterDepth) / 3 + 50 * (input.pierDepth || 5.5),
        my: 50 * (input.pierDepth || 5.5) * 0.6,
      },
      {
        no: 4,
        name: 'Wind Force - Idle',
        p: deadLoad,
        mx: (hydrostaticForce * waterDepth) / 3 + 50 * (input.pierDepth || 5.5),
        my: 50 * (input.pierDepth || 5.5) * 0.6,
      },
      {
        no: 5,
        name: 'One Span Dislodged',
        p: deadLoad + liveLoad * 0.5,
        mx: ((hydrostaticForce * waterDepth) / 3) * 1.5,
        my: liveLoad * 0.2 * (input.spanLength || 10),
      },
    ];
  }

  const useConst = pier && pier.loadCases.length > 0;
  const a = useConst ? area : (input.pierBaseWidth || 3) * (input.pierBaseLength || 5);
  const zxi = useConst ? zx : ((input.pierBaseWidth || 3) * Math.pow(input.pierBaseLength || 5, 2)) / 6;
  const zyi = useConst ? zy : ((input.pierBaseLength || 5) * Math.pow(input.pierBaseWidth || 3, 2)) / 6;

  let maxSigmaForBearing = 0;

  cases.forEach((c) => {
    setCellValue(ws, row, 1, c.no);
    setCellValue(ws, row, 2, c.name);
    setCellValue(ws, row, 3, Math.round(c.p));
    setCellValue(ws, row, 4, Math.round(c.mx));
    setCellValue(ws, row, 5, Math.round(c.my));

    const sigmaMax = c.p / a + c.mx / zxi + c.my / zyi;
    const sigmaMin = c.p / a - c.mx / zxi - c.my / zyi;
    if (sigmaMax > maxSigmaForBearing) maxSigmaForBearing = sigmaMax;

    setCellValue(ws, row, 6, +sigmaMax.toFixed(2));
    setCellValue(ws, row, 7, +sigmaMin.toFixed(2));
    setCellFormula(
      ws,
      row,
      8,
      `=IF(F${row}<=$J$${sbcRow},"OK","EXCEED")`,
      sigmaMax <= sbc ? 'OK' : 'EXCEED'
    );
    setCellValue(ws, row, 9, sigmaMin < 0 ? 'CHECK' : 'OK');
    row++;
  });

  const dataEnd = row - 1;

  row++;
  setCellValue(ws, row, 2, 'MAX σmax');
  ws.getCell(row, 2).font = { bold: true };
  setCellFormula(ws, row, 6, `=MAX(F${dataStart}:F${dataEnd})`);
  row++;

  setCellValue(ws, row, 2, 'MIN σmin');
  ws.getCell(row, 2).font = { bold: true };
  setCellFormula(ws, row, 7, `=MIN(G${dataStart}:G${dataEnd})`);
  row++;

  setCellValue(ws, row, 2, 'Bearing vs SBC');
  ws.getCell(row, 2).font = { bold: true };
  const bearingOk = maxSigmaForBearing <= sbc;
  setCellFormula(
    ws,
    row,
    6,
    `=IF(F${row - 2}<=$J$${sbcRow},"SAFE","UNSAFE")`,
    bearingOk ? 'SAFE' : 'UNSAFE'
  );

  row += 2;
  setCellValue(
    ws,
    row,
    1,
    'NOTE: σmax and σmin are extreme fibre bearing pressures (kN/m²); compare σmax to SBC. Tension in soil (σmin < 0) requires engineering review.'
  );
  ws.getCell(row, 1).alignment = { wrapText: true };

  console.log('✓ abstract of stresses sheet complete');
}
