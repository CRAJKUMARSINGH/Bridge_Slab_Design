import ExcelJS from 'exceljs';
import type { EnhancedProjectInput } from '../types';
import { LloadSummaryRefs } from './17-lload';
import { setColumnWidths, setCellValue, setCellFormula, mergeCells, COLORS } from '../utils';
import { addSketchPlaceholderBlock } from '../sketch-placeholders';

// ── Sheet 35: INSERT C1-ABUT ──────────────────────────────────────────────────
export async function generateInsertC1AbutSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('INSERT C1-ABUT');
  setColumnWidths(ws, [8, 35, 15, 15, 10, 15]);

  let row = 1;
  setCellValue(ws, row, 1, 'DESIGN OF SUBMERSIBLE BRIDGE');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  mergeCells(ws, row, 1, row, 6);
  row++;
  setCellValue(ws, row, 1, `Name Of Work :- ${input.projectName}`);
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  setCellValue(ws, row, 1, 'CANTILEVER (C1) ABUTMENT — INPUT DATA');
  ws.getCell(row, 1).font = { bold: true, size: 13, color: { argb: COLORS.WHITE } };
  ws.getCell(row, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.PRIMARY } };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  const abt = input.abutmentC1;
  const dataRows: [string, string, number | string, string][] = [
    ['1.',  'Abutment Height (H)',          abt?.geometry.height      ?? input.abutmentHeight,  'm'],
    ['2.',  'Stem Thickness (ts)',           abt?.geometry.width       ?? input.abutmentWidth,   'm'],
    ['3.',  'Abutment Depth (D)',            abt?.geometry.depth       ?? input.abutmentDepth,   'm'],
    ['4.',  'Base Width (B)',                abt?.geometry.baseWidth   ?? (input.abutmentWidth + 1.5), 'm'],
    ['5.',  'Base Length',                   abt?.geometry.baseLength  ?? (input.abutmentDepth + 1.0), 'm'],
    ['6.',  'Dirt Wall Height',              abt?.geometry.dirtWallHeight ?? input.dirtWallHeight, 'm'],
    ['7.',  'Return Wall Length',            abt?.geometry.returnWallLength ?? input.returnWallLength, 'm'],
    ['8.',  'Foundation Level',              input.foundationLevel,    'm MSL'],
    ['9.',  'H.F.L.',                        input.hfl,                'm MSL'],
    ['10.', 'Safe Bearing Capacity (SBC)',   input.sbc,                'kN/m²'],
    ['11.', 'Angle of Friction (φ)',         input.phi,                'degrees'],
    ['12.', 'Unit Weight of Soil (γ)',       input.gamma,              'kN/m³'],
    ['13.', 'Concrete Grade',                input.concreteGrade,      ''],
    ['14.', 'Steel Grade',                   input.steelGrade,         ''],
  ];

  dataRows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellValue(ws, row, 4, val);
    setCellValue(ws, row, 5, unit);
    row++;
  });

  console.log('✓ Sheet 35: INSERT C1-ABUT complete');
}

// ── Sheet 36: C1-AbutMENT Drawing ────────────────────────────────────────────
export async function generateC1AbutmentDrawingSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('C1-AbutMENT Drawing');
  setColumnWidths(ws, [8, 35, 15, 15, 10, 15]);

  const abt = input.abutmentC1;
  const H  = abt?.geometry.height      ?? input.abutmentHeight;
  const t  = abt?.geometry.width       ?? input.abutmentWidth;
  const D  = abt?.geometry.depth       ?? input.abutmentDepth;
  const B  = abt?.geometry.baseWidth   ?? (t + 1.5);
  const Lb = abt?.geometry.baseLength  ?? (D + 1.0);
  const Dw = abt?.geometry.dirtWallHeight ?? input.dirtWallHeight;
  const Rw = abt?.geometry.returnWallLength ?? input.returnWallLength;
  const baseSlab = Math.max(0.8, H * 0.15);
  const heel = B * 0.6;
  const toe  = B - heel - t;

  let row = 1;
  setCellValue(ws, row, 1, 'C1 CANTILEVER ABUTMENT — GENERAL ARRANGEMENT DIMENSIONS');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  row = addSketchPlaceholderBlock(ws, row, 6);

  const dims: [string, string, number, string][] = [
    ['A', 'Total Abutment Height (H)',          H,                    'm'],
    ['B', 'Stem Thickness (t)',                  t,                    'm'],
    ['C', 'Abutment Depth (D)',                  D,                    'm'],
    ['D', 'Base Width (B)',                      B,                    'm'],
    ['E', 'Base Length',                         Lb,                   'm'],
    ['F', 'Base Slab Thickness (max 0.8, H*0.15)', +baseSlab.toFixed(3), 'm'],
    ['G', 'Heel Length (0.6*B)',                 +heel.toFixed(3),     'm'],
    ['H', 'Toe Length (B - heel - t)',           +toe.toFixed(3),      'm'],
    ['I', 'Dirt Wall Height',                    Dw,                   'm'],
    ['J', 'Return Wall Length (each side)',      Rw,                   'm'],
    ['K', 'Return Wall Thickness',               0.4,                  'm'],
    ['L', 'Abutment Cap Width',                  input.carriageWidth,  'm'],
    ['M', 'Abutment Cap Depth',                  1.5,                  'm'],
    ['N', 'Abutment Cap Height',                 0.8,                  'm'],
  ];

  setCellValue(ws, row, 1, 'Ref');
  setCellValue(ws, row, 2, 'Component');
  setCellValue(ws, row, 3, 'Dimension');
  setCellValue(ws, row, 4, 'Unit');
  ws.getRow(row).font = { bold: true };
  row++;

  dims.forEach(([ref, label, val, unit]) => {
    setCellValue(ws, row, 1, ref);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, val);
    setCellValue(ws, row, 4, unit);
    row++;
  });

  console.log('✓ Sheet 36: C1-AbutMENT Drawing complete');
}

import { PierSummaryRefs } from './09-stability-check-pier';

// ── Sheet 37: C1-STABILITY CHECK ABUTMENT ────────────────────────────────────
export async function generateC1StabilityCheckSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
  lloadRefs?: LloadSummaryRefs,
  pierRefs?: PierSummaryRefs
): Promise<void> {
  const { generateC1StabilityCheckAbutmentSheet } = await import('./22-c1-stability-check-abutment');
  await generateC1StabilityCheckAbutmentSheet(workbook, input, lloadRefs, pierRefs);
}

// Re-export sheets 38-46 from the companion file
export {
  generateC1FootingDesignSheet,
  generateC1FootingStressSheet,
  generateCanReturnFootingDesignSheet,
  generateSteelInCantAbutmentSheet,
  generateSteelInCantReturnsSheet,
  generateC1AbutmentCapSheet,
  generateC1DirtWallReinforcementSheet,
  generateC1DirtDirectLoadBMSheet,
  generateC1DirtLLBMSheet,
} from './c1-sheets-38-46';
