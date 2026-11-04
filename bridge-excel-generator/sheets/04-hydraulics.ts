/**
 * SHEET 4: HYDRAULICS
 * Cross-section velocity determination
 * Structure: 49 rows, 7 columns
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';
import { setColumnWidths, setCellValue, setCellFormula, addTableHeader, mergeCells } from '../utils';

export function getHydraulicsTotalRow(crossSectionPoints: number): number {
  const startDataRow = 6;
  const lastDataRow = startDataRow + Math.max(0, crossSectionPoints - 1);
  return lastDataRow + 2;
}

/**
 * TS mirror of the sheet's Area-Velocity chain. Used as cached formula
 * results so viewers that skip recalculation still display correct numbers,
 * and by the afflux sheet for its cross-sheet references.
 */
export function computeCrossSectionHydraulics(input: ProjectInput) {
  const pts = input.crossSectionData;
  let area = 0;
  let perimeter = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const depth = Math.max(0, input.hfl - pts[i].gl);
    const nextDepth = Math.max(0, input.hfl - pts[i + 1].gl);
    const len = pts[i + 1].chainage - pts[i].chainage;
    area += (depth > 0 ? (depth + nextDepth) / 2 : 0) * len;
    perimeter += Math.sqrt(len * len + (pts[i + 1].gl - pts[i].gl) ** 2);
  }
  const hydraulicRadius = perimeter > 0 ? area / perimeter : 0;
  const velocity = hydraulicRadius > 0 && input.manningN > 0 && input.bedSlope > 0
    ? (1 / input.manningN) * Math.pow(hydraulicRadius, 2 / 3) * Math.sqrt(1 / input.bedSlope)
    : 0;
  return { area, perimeter, hydraulicRadius, velocity, discharge: area * velocity };
}

export async function generateHydraulicsSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('HYDRAULICS');
  
  setColumnWidths(ws, [12, 12, 20, 18, 25, 35, 25]);
  
  let row = 1;
  
  // Row 1: Title
  setCellValue(ws, row, 1, 'DETERMINATION OF VELOCITY AT PROPOSED SUBMERSIBLE BRIDGE SITE');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  mergeCells(ws, row, 1, row, 7);
  row++;
  
  // Row 2: Project name
  setCellValue(ws, row, 1, `Name Of Work :- ${input.projectName}`);
  mergeCells(ws, row, 1, row, 7);
  row++;
  
  // Row 3: Section
  setCellValue(ws, row, 1, 'AS PER UP-STREAM SECTION');
  ws.getCell(row, 1).font = { bold: true };
  mergeCells(ws, row, 1, row, 7);
  row++;
  
  // Row 4: HFL
  setCellValue(ws, row, 1, 'HIGHEST FLOOD LEVEL');
  setCellValue(ws, row, 6, input.hfl);
  setCellValue(ws, row, 7, 'M');
  row++;
  
  // Row 5: Headers
  const headers = ['CHAINAGE', 'G.L.', 'DEPTH OF FLOW IN  M', 'LENGTH OF FLOW', 
                   'AVERAGE DEPTH OF FLOW', 'CROSS SECTIONAL AREA OF FLOW', 'WETTED PERIMETER'];
  addTableHeader(ws, row, headers);
  const headerRow = row;
  row++;
  
  // Data rows with REAL FORMULAS
  const hyd = computeCrossSectionHydraulics(input);
  const startDataRow = row;
  input.crossSectionData.forEach((point, idx) => {
    const nextPoint = input.crossSectionData[idx + 1];
    const depth = Math.max(0, input.hfl - point.gl);
    
    // Chainage
    setCellValue(ws, row, 1, point.chainage);
    
    // Ground Level
    setCellValue(ws, row, 2, point.gl);
    
    // Depth of Flow = HFL - GL (if positive)
    setCellFormula(ws, row, 3, `=IF($F$4-B${row}>0,$F$4-B${row},0)`, depth);
    
    if (nextPoint) {
      const len = nextPoint.chainage - point.chainage;
      const nextDepth = Math.max(0, input.hfl - nextPoint.gl);
      const avgDepth = depth > 0 ? (depth + nextDepth) / 2 : 0;
      const stripArea = avgDepth * len;
      const wetted = Math.sqrt(len * len + (nextPoint.gl - point.gl) ** 2);
      // Length of Flow
      setCellFormula(ws, row, 4, `=A${row + 1}-A${row}`, len);
      
      // Average Depth
      setCellFormula(ws, row, 5, `=IF(C${row}>0,(C${row}+C${row + 1})/2,0)`, avgDepth);
      
      // Cross Sectional Area
      setCellFormula(ws, row, 6, `=E${row}*D${row}`, stripArea);
      
      // Wetted Perimeter
      setCellFormula(ws, row, 7, `=SQRT(POWER(D${row},2)+POWER(B${row + 1}-B${row},2))`, wetted);
    }
    
    row++;
  });
  
  const lastDataRow = row - 1;
  
  // Empty row
  row++;
  
  // TOTAL row
  setCellValue(ws, row, 3, 'TOTAL');
  ws.getCell(row, 3).font = { bold: true };
  setCellFormula(ws, row, 4, `=A${lastDataRow}`, input.crossSectionData[input.crossSectionData.length - 1].chainage);
  setCellFormula(ws, row, 6, `=SUM(F${startDataRow}:F${lastDataRow})`, Number(hyd.area.toFixed(3)));
  setCellFormula(ws, row, 7, `=SUM(G${startDataRow}:G${lastDataRow})`, Number(hyd.perimeter.toFixed(3)));
  const totalRow = row;
  row++;
  
  // Empty row
  row++;
  
  // Summary calculations
  setCellValue(ws, row, 2, 'A');
  setCellFormula(ws, row, 3, `=F${totalRow}`, Number(hyd.area.toFixed(3)));
  setCellValue(ws, row, 4, 'SQM');
  const aRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'P');
  setCellFormula(ws, row, 3, `=G${totalRow}`, Number(hyd.perimeter.toFixed(3)));
  setCellValue(ws, row, 4, 'M');
  const pRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'R');
  setCellFormula(ws, row, 3, `=C${aRow}/C${pRow}`, Number(hyd.hydraulicRadius.toFixed(3)));
  setCellValue(ws, row, 4, 'M');
  row++;
  
  setCellValue(ws, row, 2, 'N');
  setCellValue(ws, row, 3, input.manningN);
  const nRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'S       1 IN');
  setCellValue(ws, row, 3, input.bedSlope);
  const sRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'V');
  setCellFormula(ws, row, 3, `=(1/C${nRow})*POWER(C${aRow}/C${pRow},2/3)*SQRT(1/C${sRow})`, Number(hyd.velocity.toFixed(3)));
  setCellValue(ws, row, 4, 'M/SEC');
  const vRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'Q');
  setCellFormula(ws, row, 3, `=C${aRow}*C${vRow}`, Number(hyd.discharge.toFixed(3)));
  setCellValue(ws, row, 4, 'CUMECS');
  const qRow = row;
  row++;
  
  // Additional notes
  setCellValue(ws, row, 2, 'The design engineer visually observed the river to ascertain');
  row++;
  
  setCellValue(ws, row, 2, 'Design Discharge =');
  setCellFormula(ws, row, 3, `=C${qRow}`, Number(hyd.discharge.toFixed(3)));
  setCellValue(ws, row, 4, 'CUMECS');
  row++;
  
  // Critical Levels section
  row++;
  setCellValue(ws, row, 1, 'Critical Levels');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  
  const levelsStart = row;
  const levels: Array<[string, number | { formula: string; result: number }]> = [
    ['Road top level (RTL)', input.rtl],
    ['Average Ground Level(AGL)', input.agl],
    ['Average Height Of Bridge', { formula: `=B${levelsStart}-B${levelsStart + 3}`, result: input.rtl - input.nbl }],
    ['Lowest Nala Bed level (NBL)', input.nbl],
    ['Ordinary flood level (OFL)', input.ofl],
    ['Foundation level (FL)', input.foundationLevel],
    ['Ht. of bridge h= (RTL-NBL)', { formula: `=B${levelsStart}-B${levelsStart + 3}`, result: input.rtl - input.nbl }],
    ['Ht. of bridge H=(RTL-FL)', { formula: `=B${levelsStart}-B${levelsStart + 5}`, result: input.rtl - input.foundationLevel }]
  ];
  
  levels.forEach(([label, value]) => {
    setCellValue(ws, row, 1, label);
    setCellValue(ws, row, 2, value);
    setCellValue(ws, row, 3, 'm');
    row++;
  });
  
  setCellValue(ws, row, 1, '** Needs Rational Evaluation w.r.t. afflux.');
  row++;
  setCellValue(ws, row, 1, '** Average of GL for points lying below HFL.');
  
  console.log('✓ Sheet 4: HYDRAULICS complete (49 rows with formulas)');
}
