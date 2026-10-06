/**
 * SHEET 5: Deck Anchorage
 * A) bounding envelope — deck assumed fully submerged.
 * B) design water level check — the same terms the design engine uses, linked live.
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput } from '../types';
import { setColumnWidths, setCellValue, addProjectHeader, addCalcRow, readCellValue } from '../utils';
import { deckSlabThicknessOf } from '../input-contract';
import { WEARING_COAT_THICKNESS_M } from '../material-rates';
import { getHydraulicsTotalRow } from './04-hydraulics';

const RHO_WATER = 9.81;        // kN/m³
const RC_DENSITY = 25;         // kN/m³
const COAT_DENSITY = 22;       // kN/m³
const FRICTION_COEFF = 0.6;    // base friction coefficient
const PARAPET_KN_PER_M = 1.5;  // per parapet line

export async function generateDeckAnchorageSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('Deck Anchorage');

  setColumnWidths(ws, [4, 46, 4, 14, 12, 58, 12, 12, 12, 12, 12, 12]);

  let row = addProjectHeader(ws, input.projectName);

  setCellValue(ws, row, 1, 'DECK ANCHORAGE DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row += 2;

  const thickness = deckSlabThicknessOf(input);
  const volume = input.spanLength * input.carriageWidth * thickness;
  const weight = volume * RC_DENSITY;
  const envelopeBuoyancy = volume * RHO_WATER;
  const netEnvelope = envelopeBuoyancy - weight;

  setCellValue(ws, row, 1, 'A) BOUNDING ENVELOPE — deck held fully under water (upper bound, no water-level input used)');
  ws.getCell(row, 1).font = { bold: true, color: { argb: 'FF1F496B' } };
  row++;

  const spanRow = row;
  row = addCalcRow(ws, row, 'Span length (deck block considered)', input.spanLength, 'm');
  row = addCalcRow(ws, row, 'Carriage width', input.carriageWidth, 'm');
  const widthRow = row - 1;
  row = addCalcRow(ws, row, 'Deck slab thickness', thickness, 'm');
  const thickRow = row - 1;
  row = addCalcRow(ws, row, 'Deck slab volume', { formula: `=D${spanRow}*D${widthRow}*D${thickRow}`, result: volume }, 'm³');
  const volRow = row - 1;
  row = addCalcRow(ws, row, 'Deck self-weight', { formula: `=D${volRow}*${RC_DENSITY}`, result: weight }, 'kN');
  const weightRow = row - 1;
  row = addCalcRow(ws, row, 'Buoyancy if totally submerged', { formula: `=D${volRow}*${RHO_WATER}`, result: envelopeBuoyancy }, 'kN');
  const envBuoyRow = row - 1;
  row = addCalcRow(ws, row, 'Net uplift (buoyancy − self-weight)', { formula: `=D${envBuoyRow}-D${weightRow}`, result: netEnvelope }, 'kN');
  const netRow = row - 1;
  row = addCalcRow(ws, row, 'Anchorage required on this envelope', {
    formula: `=IF(D${netRow}>0,"YES","NO (self-weight governs)")`,
    result: netEnvelope > 0 ? 'YES' : 'NO (self-weight governs)',
  }, '');

  row += 1;
  setCellValue(ws, row, 1, 'B) DESIGN WATER LEVEL CHECK — buoyancy acts only on the part of the deck below DWL');
  ws.getCell(row, 1).font = { bold: true, color: { argb: 'FF1F496B' } };
  row++;

  const hydTotal = getHydraulicsTotalRow(input.crossSectionData.length);
  const dwl = input.hydraulics?.designWaterLevel ?? input.hfl;
  const soffit = input.deckSoffitLevel ?? input.rtl - thickness;
  const velocity = Number((input.hydraulics?.velocity ?? 0).toFixed(3));
  const area = input.spanLength * input.carriageWidth;
  const submerged = Math.max(0, Math.min(dwl - soffit, thickness));
  const dryHighLevel = input.bridgeType === 'high-level' && soffit >= dwl - 0.05;
  const buoyancy = dryHighLevel ? 0 : area * submerged * RHO_WATER;
  const hydrodynamic = dryHighLevel ? 0 : 0.5 * 1000 * velocity * velocity * area * 0.001;
  const totalUplift = buoyancy + hydrodynamic;
  const wearingCoat = area * WEARING_COAT_THICKNESS_M * COAT_DENSITY;
  const parapet = input.spanLength * 2 * PARAPET_KN_PER_M;
  const friction = weight * FRICTION_COEFF;
  const resisting = weight + wearingCoat + parapet + friction;
  const safetyFactor = totalUplift > 0 ? resisting / totalUplift : 99;
  const ok = safetyFactor >= 1.2;

  const dwlRow = row;
  setCellValue(ws, row, 2, 'Design water level (DWL)');
  ws.getCell(row, 2).font = { bold: true };
  ws.getCell(row, 3).value = '=';
  ws.getCell(row, 4).value = { formula: `='STABILITY CHECK FOR PIER'!B16`, result: dwl };
  setCellValue(ws, row, 5, 'm MSL');
  setCellValue(ws, row, 6, "linked: pier stability sheet, DWL source cell");
  ws.getCell(row, 6).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
  row++;

  const rtlRow = row;
  row = addCalcRow(ws, row, 'Road top level (RTL)', input.rtl, 'm MSL');
  row = addCalcRow(ws, row, 'Deck soffit level',
    input.deckSoffitLevel == null
      ? { formula: `=D${rtlRow}-D${thickRow}`, result: soffit }
      : soffit,
    'm MSL');
  const soffitRow = row - 1;
  row = addCalcRow(ws, row, 'Plan area of deck block', { formula: `=D${spanRow}*D${widthRow}`, result: area }, 'm²');
  const areaRow = row - 1;
  row = addCalcRow(ws, row, 'Submerged depth of deck', {
    formula: `=MAX(0,MIN(D${dwlRow}-D${soffitRow},D${thickRow}))`,
    result: submerged,
  }, 'm');
  const submergedRow = row - 1;
  row = addCalcRow(ws, row, 'Flow velocity V', { formula: `=HYDRAULICS!C${hydTotal + 7}`, result: velocity }, 'm/s');
  const velRow = row - 1;
  row = addCalcRow(ws, row, 'Static buoyancy', { formula: `=D${areaRow}*D${submergedRow}*${RHO_WATER}`, result: buoyancy }, 'kN');
  const buoyRow = row - 1;
  const hydroRow = row;
  row = addCalcRow(ws, row, 'Hydrodynamic uplift (stagnation pressure on plan area)',
    dryHighLevel
      ? { formula: '=0', result: 0 }
      : { formula: `=0.5*1000*POWER(D${velRow},2)*D${areaRow}*0.001`, result: hydrodynamic },
    'kN');
  setCellValue(ws, hydroRow, 6, dryHighLevel
    ? 'Not applied: high-level crossing with the deck soffit above DWL, so flow never loads the soffit.'
    : 'Submersible crossing: overtopping is intentional, so the velocity head is kept as uplift.');
  ws.getCell(hydroRow, 6).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
  row = addCalcRow(ws, row, 'Total uplift', { formula: `=D${buoyRow}+D${hydroRow}`, result: totalUplift }, 'kN');
  const upliftRow = row - 1;
  row = addCalcRow(ws, row, 'Wearing coat weight', {
    formula: `=D${areaRow}*${WEARING_COAT_THICKNESS_M}*${COAT_DENSITY}`,
    result: wearingCoat,
  }, 'kN');
  const coatRow = row - 1;
  row = addCalcRow(ws, row, 'Parapet weight (two lines)', { formula: `=D${spanRow}*2*${PARAPET_KN_PER_M}`, result: parapet }, 'kN');
  const parapetRow = row - 1;
  row = addCalcRow(ws, row, 'Base friction resistance', { formula: `=D${weightRow}*${FRICTION_COEFF}`, result: friction }, 'kN');
  const frictionRow = row - 1;
  row = addCalcRow(ws, row, 'Total resisting force', {
    formula: `=D${weightRow}+D${coatRow}+D${parapetRow}+D${frictionRow}`,
    result: resisting,
  }, 'kN');
  const resistingRow = row - 1;
  row = addCalcRow(ws, row, 'Factor of safety against uplift', {
    formula: `=IF(D${upliftRow}>0,D${resistingRow}/D${upliftRow},99)`,
    result: safetyFactor,
  }, '');
  const fosRow = row - 1;
  row = addCalcRow(ws, row, 'Anchorage / hold-down required', {
    formula: `=IF(OR(D${fosRow}<1.2,D${submergedRow}>0.1),"YES","NO")`,
    result: safetyFactor < 1.2 || submerged > 0.1 ? 'YES' : 'NO',
  }, '', true);
  row = addCalcRow(ws, row, 'Verdict', {
    formula: `=IF(D${fosRow}>=1.2,"Hence O.K.","CHECK - licensed engineer sign-off")`,
    result: ok ? 'Hence O.K.' : 'CHECK - licensed engineer sign-off',
  }, '', true);

  const closing = submerged > 0.001
    ? `Deck soffit is ${submerged.toFixed(2)} m under DWL: buoyancy plus hydrodynamic uplift both apply, and hold-down detailing must be confirmed.`
    : dryHighLevel
      ? 'High-level crossing with the soffit above DWL: neither buoyancy nor hydrodynamic uplift is applied.'
      : 'Soffit above DWL: uplift is the hydrodynamic allowance carried for a submersible crossing.';
  setCellValue(ws, row, 2, closing);
  ws.getCell(row, 2).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
  row += 2;

  setCellValue(ws, row, 1, `Screening uses thickness ${thickness} m and wearing coat ${WEARING_COAT_THICKNESS_M} m. A licensed engineer must confirm submergence, voided-slab volume, and hold-down detailing.`);
  ws.getCell(row, 1).alignment = { wrapText: true };
  row++;
  setCellValue(ws, row, 1, 'Hydrodynamic uplift is applied as 0.5·ρ·V² over the deck plan area (screening simplification); block A is the bounding case if the deck ever goes under water.');
  ws.getCell(row, 1).alignment = { wrapText: true };

  const FORMAT_BY_UNIT: Record<string, string> = {
    'm MSL': '0.000', m: '0.000', 'm²': '#,##0.000', 'm³': '#,##0.000', 'm/s': '0.000', kN: '#,##0.00',
  };
  for (let r = 1; r <= ws.rowCount; r++) {
    const cell = ws.getCell(r, 4);
    // readCellValue, not cell.value: ExcelJS drops a cached result of 0 on read.
    const raw = readCellValue(cell) as any;
    const numeric = typeof raw === 'number' ? raw : raw?.result;
    if (typeof numeric !== 'number') continue;
    const unit = String(readCellValue(ws.getCell(r, 5)) ?? '');
    cell.numFmt = FORMAT_BY_UNIT[unit] ?? '0.00';
  }

  console.log('✓ Sheet 5: Deck Anchorage complete');
}
