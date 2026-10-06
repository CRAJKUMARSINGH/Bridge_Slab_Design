/**
 * Sheets 12-18: data-driven pier design views.
 *
 * These sheets intentionally consume the calculated PierDesignResult. They do
 * not contain representative dimensions, loads, or reinforcement values.
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput, PierDesignResult, SteelDetails } from '../types';
import { addTableHeader, addTableRow, setColumnWidths, setCellValue } from '../utils';
import { PIER_STABILITY_ROWS } from './09-stability-check-pier';

function pierOrReview(input: EnhancedProjectInput): PierDesignResult | undefined {
  return input.pier;
}

function steelText(steel: SteelDetails | undefined): string {
  if (!steel) return 'CHECK: calculated reinforcement unavailable';
  return `${steel.numberOfBars} nos ${steel.diameter} mm dia @ ${steel.spacing} mm c/c; Ast ${Number(steel.area.toFixed(1))} mm²; ${Number(steel.weight.toFixed(2))} kg`;
}

function addMissingResultNote(ws: ExcelJS.Worksheet, row: number): void {
  setCellValue(ws, row, 1, 'CHECK: this sheet requires the calculated pier result and cannot be issued independently.');
  ws.getCell(row, 1).font = { bold: true, color: { argb: 'FF9C0006' } };
  ws.getCell(row, 1).alignment = { wrapText: true };
}

export async function generateSteelInPierSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('STEEL IN PIER');
  setColumnWidths(ws, [6, 34, 18, 18, 18]);
  setCellValue(ws, 1, 1, 'REINFORCEMENT DESIGN - PIER BODY');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);
  setCellValue(ws, 3, 1, 'Main reinforcement');
  setCellValue(ws, 3, 2, steelText(pier.reinforcement.mainSteel));
  setCellValue(ws, 4, 1, 'Links / ties');
  setCellValue(ws, 4, 2, steelText(pier.reinforcement.linkSteel));
  setCellValue(ws, 5, 1, 'Pier geometry');
  setCellValue(ws, 5, 2, `${pier.geometry.width} m × ${pier.geometry.length} m × ${pier.geometry.depth} m`);
}

export async function generateFootingDesignSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('FOOTING DESIGN');
  setColumnWidths(ws, [6, 34, 18, 18, 18]);
  setCellValue(ws, 1, 1, 'PIER FOOTING DESIGN');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);
  setCellValue(ws, 3, 1, 'Footing length');
  setCellValue(ws, 3, 2, pier.footing.length);
  setCellValue(ws, 3, 3, 'm');
  setCellValue(ws, 4, 1, 'Footing width');
  setCellValue(ws, 4, 2, pier.footing.width);
  setCellValue(ws, 4, 3, 'm');
  setCellValue(ws, 5, 1, 'Footing thickness');
  setCellValue(ws, 5, 2, pier.footing.thickness);
  setCellValue(ws, 5, 3, 'm');
  setCellValue(ws, 6, 1, 'Reinforcement');
  setCellValue(ws, 6, 2, steelText(pier.footing.reinforcement));
}

export async function generateFootingStressDiagramSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('Footing STRESS DIAGRAM');
  setColumnWidths(ws, [6, 30, 18, 18, 18]);
  setCellValue(ws, 1, 1, 'PIER FOOTING STRESS DISTRIBUTION');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);
  const PS = `'${PIER_STABILITY_ROWS.sheet}'`;
  const caseRow = PIER_STABILITY_ROWS.firstCaseRow; // service case governs bearing (engine design-engine.ts govCase)

  setCellValue(ws, 3, 1, 'Governing values (retrieved live from the pier stability model)');
  ws.getCell(3, 1).font = { bold: true, size: 11, color: { argb: 'FF1F496B' } };
  const put = (row: number, label: string, value: { formula: string; result: number }, unit: string): void => {
    setCellValue(ws, row, 1, label);
    setCellValue(ws, row, 2, value);
    setCellValue(ws, row, 3, unit);
  };
  put(4, 'Base width Bw', { formula: `=${PS}!B${PIER_STABILITY_ROWS.baseW}`, result: pier.footing.width }, 'm');
  put(5, 'Base length Bl', { formula: `=${PS}!B${PIER_STABILITY_ROWS.baseL}`, result: pier.footing.length }, 'm');
  put(6, 'Vertical V (service case)', { formula: `=${PS}!H${caseRow}`, result: Number(pier.loadCases[0].verticalForce.toFixed(3)) }, 'kN');
  put(7, 'Moment M (service case)', { formula: `=${PS}!J${caseRow}`, result: Number(pier.loadCases[0].moment.toFixed(3)) }, 'kN-m');
  put(8, 'Area A = Bw·Bl', { formula: '=B4*B5', result: Number((pier.footing.width * pier.footing.length).toFixed(3)) }, 'm²');
  put(9, 'Modulus Sx = Bl·Bw²/6', { formula: '=B5*B4*B4/6', result: Number((pier.footing.length * pier.footing.width ** 2 / 6).toFixed(3)) }, 'm³');
  put(10, 'p max = V/A + M/Sx', { formula: '=B6/B8+B7/B9', result: Number(pier.footing.basePressure.max.toFixed(3)) }, 'kN/m²');
  put(11, 'p min = V/A − M/Sx', { formula: '=B6/B8-B7/B9', result: Number(pier.footing.basePressure.min.toFixed(3)) }, 'kN/m²');

  setCellValue(ws, 13, 1, 'S.No.');
  setCellValue(ws, 13, 2, 'Position');
  setCellValue(ws, 13, 3, 'Pressure (kN/m²)');
  setCellValue(ws, 13, 4, 'SBC (kN/m²)');
  setCellValue(ws, 13, 5, 'Status');
  ws.getCell(13, 2).font = { bold: true };
  const dist = pier.footing.basePressure.distribution;
  for (let i = 0; i < dist.length; i += 1) {
    const row = 14 + i;
    const lastIdx = dist.length - 1;
    addTableRow(ws, row, [
      i + 1,
      i === 0 ? 'Min edge' : i === lastIdx ? 'Max edge' : 'Base section',
      { formula: `=$B$11+($B$10-$B$11)*${i}/${lastIdx}`, result: Number(dist[i].toFixed(3)) },
      { formula: `=${PS}!B${PIER_STABILITY_ROWS.sbc}`, result: input.sbc },
      { formula: `=IF(C${row}<=D${row},"SAFE","UNSAFE")`, result: dist[i] <= input.sbc ? 'SAFE' : 'UNSAFE' },
    ]);
  }
}

export async function generatePierCapLLSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('Pier Cap LL tracked vehicle');
  setColumnWidths(ws, [6, 34, 18, 18]);
  setCellValue(ws, 1, 1, 'PIER CAP - LIVE LOAD SUMMARY');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);
  setCellValue(ws, 3, 1, 'Live load carried by calculated pier model');
  setCellValue(ws, 3, 2, {
    formula: `='${PIER_STABILITY_ROWS.sheet}'!B${PIER_STABILITY_ROWS.live}`,
    result: parseFloat(pier.loads.liveLoad.toFixed(3)),
  });
  setCellValue(ws, 3, 3, 'kN');
  setCellValue(ws, 5, 1, 'Vehicle class / placement');
  setCellValue(ws, 5, 2, 'Not supplied in ProjectInput; engineering review required');
  ws.getCell(5, 2).font = { color: { argb: 'FF9C6500' } };
}

export async function generatePierCapSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('Pier Cap');
  setColumnWidths(ws, [6, 34, 18, 18]);
  setCellValue(ws, 1, 1, 'PIER CAP DESIGN');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);
  setCellValue(ws, 3, 1, 'Cap length');
  setCellValue(ws, 3, 2, pier.pierCap.length);
  setCellValue(ws, 3, 3, 'm');
  setCellValue(ws, 4, 1, 'Cap width');
  setCellValue(ws, 4, 2, pier.pierCap.width);
  setCellValue(ws, 4, 3, 'm');
  setCellValue(ws, 5, 1, 'Cap thickness');
  setCellValue(ws, 5, 2, pier.pierCap.thickness);
  setCellValue(ws, 5, 3, 'm');
  setCellValue(ws, 6, 1, 'Reinforcement');
  setCellValue(ws, 6, 2, steelText(pier.pierCap.reinforcement));
}

export async function generateLLOADSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('LLOAD');
  setColumnWidths(ws, [6, 34, 18, 18, 18]);
  setCellValue(ws, 1, 1, 'LIVE LOAD ANALYSIS');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);
  addTableHeader(ws, 3, ['S.No.', 'Load case', 'Live-load factor', 'Live load (kN)', 'Status']);
  const LL_PS = `'${PIER_STABILITY_ROWS.sheet}'`;
  pier.loadCases.forEach((loadCase, index) => {
    const row = 4 + index;
    addTableRow(ws, row, [
      loadCase.caseNumber,
      loadCase.description,
      loadCase.liveLoadFactor,
      { formula: `=${LL_PS}!$B${PIER_STABILITY_ROWS.live}*C${row}`, result: parseFloat((pier.loads.liveLoad * loadCase.liveLoadFactor).toFixed(3)) },
      { formula: `=${LL_PS}!$N${PIER_STABILITY_ROWS.firstCaseRow + index}`, result: loadCase.status },
    ]);
  });
}

export async function generateLoadSummSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('loadsumm'); // golden 46-sheet contract (no trailing space)
  setColumnWidths(ws, [6, 34, 18, 18]);
  setCellValue(ws, 1, 1, 'LOAD SUMMARY');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  setCellValue(ws, 2, 1, `Project: ${input.projectName}`);

  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);

  // Header row
  addTableHeader(ws, 3, ['S.No.', 'Load', 'Value (kN)', 'Unit']);

  // Main loads (rows 4–11): every value retrieved from STABILITY CHECK FOR PIER Section B
  const PS = `'${PIER_STABILITY_ROWS.sheet}'`;
  const loads: [number, string, number, number][] = [
    [1, 'Dead load (pier self-weight)', PIER_STABILITY_ROWS.dead, 4],
    [2, 'Live load (IRC Class AA)', PIER_STABILITY_ROWS.live, 5],
    [3, 'Hydrostatic force', PIER_STABILITY_ROWS.hydro, 6],
    [4, 'Drag / current force', PIER_STABILITY_ROWS.drag, 7],
    [5, 'Wind force (IRC:6-2017 §209)', PIER_STABILITY_ROWS.wind, 8],
    [6, 'Seismic force (IS:1893:2002)', PIER_STABILITY_ROWS.seis, 9],
    [7, 'Buoyancy', PIER_STABILITY_ROWS.buoy, 10],
    [8, 'Total horizontal force', PIER_STABILITY_ROWS.totalH, 11],
  ];

  const engineLoads = [
    pier.loads.deadLoad,
    pier.loads.liveLoad,
    pier.loads.hydrostaticForce,
    pier.loads.dragForce,
    pier.loads.windForce,
    pier.loads.seismicForce,
    pier.loads.buoyancy,
    pier.loads.totalHorizontalForce,
  ];

  loads.forEach(([no, label, srcRow, row], index) => {
    addTableRow(ws, row, [
      no,
      label,
      { formula: `=${PS}!B${srcRow}`, result: parseFloat(engineLoads[index].toFixed(2)) },
      'kN',
    ]);
  });

  // ── IRC live load reaction table (rows 13–17) ─────────────────────────────
  // These rows are referenced by Sheet 19 LL-ABSTRACT MAX() formula:
  //   MAX(loadsumm!C13,loadsumm!C14,loadsumm!C15,loadsumm!C17)
  // Row 13 = Class AA Tracked, 14 = Class AA Wheeled, 15 = 70R Tracked,
  // 16 = 70R Wheeled, 17 = Class A (2-lane) — LL-ABSTRACT MAX() reads 13/14/15/17.
  setCellValue(ws, 12, 2, 'IRC LIVE LOAD REACTIONS BY CLASS (MT)');
  ws.getCell(12, 2).font = { bold: true };

  // kN → MT divide-by-9.81 then class impact factor, all live from C5 (live load)
  const liveLoadBase = pier.loads.liveLoad / 9.81;
  const reactions: Array<[number, string, number, number]> = [
    [13, 'IRC Class AA Tracked', 1.10, liveLoadBase * 1.10],
    [14, 'IRC Class AA Wheeled', 1.25, liveLoadBase * 1.25],
    [15, 'IRC Class 70R Tracked', 1.10, liveLoadBase * 1.10],
    [16, 'IRC Class 70R Wheeled', 1.25, liveLoadBase * 1.25],
    [17, 'IRC Class A (2-lane)', 1.50, liveLoadBase * 1.50],
  ];
  reactions.forEach(([row, label, factor, cached]) => {
    setCellValue(ws, row, 1, label);
    (ws.getCell(row, 3) as ExcelJS.Cell).value = { formula: `=C5/9.81*${factor}`, result: parseFloat(cached.toFixed(3)) };
    setCellValue(ws, row, 4, 'MT');
  });
}

