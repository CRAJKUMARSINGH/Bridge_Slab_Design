/**
 * Sheet 9: STABILITY CHECK FOR PIER
 *
 * The worksheet is a view of the calculated load cases. It is not a second
 * calculation path and it does not contain representative sample loads.
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput, PierDesignResult } from '../types';
import { addTableHeader, addTableRow, setColumnWidths, setCellValue } from '../utils';

export async function generateStabilityCheckPierSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('STABILITY CHECK FOR PIER');
  setColumnWidths(ws, [6, 32, 16, 16, 16, 16, 16, 16]);
  setCellValue(ws, 1, 1, 'DESIGN OF PIER AND CHECK FOR STABILITY - SUBMERSIBLE BRIDGE');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  setCellValue(ws, 2, 1, `Name Of Work :- ${input.projectName}`);
  setCellValue(ws, 3, 1, `HFL: ${input.hfl} m MSL`);
  setCellValue(ws, 4, 1, `Design discharge: ${input.discharge} m³/s`);

  const pier: PierDesignResult | undefined = input.pier;
  if (!pier) {
    setCellValue(ws, 6, 1, 'CHECK: calculated pier result unavailable.');
    ws.getCell(6, 1).font = { bold: true, color: { argb: 'FF9C0006' } };
    return;
  }

  let row = 6;
  addTableHeader(ws, row, [
    'Case',
    'Description',
    'Vertical force (kN)',
    'Horizontal force (kN)',
    'Moment (kN-m)',
    'Sliding FOS',
    'Overturning FOS',
    'Bearing FOS',
  ]);
  row += 1;
  for (const loadCase of pier.loadCases) {
    addTableRow(ws, row, [
      loadCase.caseNumber,
      loadCase.description,
      loadCase.verticalForce,
      loadCase.horizontalForce,
      loadCase.moment,
      loadCase.slidingFOS,
      loadCase.overturningFOS,
      loadCase.bearingFOS,
    ]);
    setCellValue(ws, row, 9, loadCase.status);
    row += 1;
  }

  row += 1;
  setCellValue(ws, row, 1, 'Loads used by the calculated result');
  ws.getCell(row, 1).font = { bold: true };
  const loads = [
    ['Dead load', pier.loads.deadLoad, 'kN'],
    ['Live load', pier.loads.liveLoad, 'kN'],
    ['Hydrostatic force', pier.loads.hydrostaticForce, 'kN'],
    ['Drag force', pier.loads.dragForce, 'kN'],
    ['Buoyancy', pier.loads.buoyancy, 'kN'],
  ];
  loads.forEach(([label, value, unit], index) => {
    setCellValue(ws, row + 1 + index, 1, label);
    setCellValue(ws, row + 1 + index, 2, value);
    setCellValue(ws, row + 1 + index, 3, unit);
  });
  setCellValue(ws, row + 7, 1, 'Status is copied from the engine result; it is not an engineering approval.');
  ws.getCell(row + 7, 1).font = { italic: true, color: { argb: 'FF9C6500' } };
}
