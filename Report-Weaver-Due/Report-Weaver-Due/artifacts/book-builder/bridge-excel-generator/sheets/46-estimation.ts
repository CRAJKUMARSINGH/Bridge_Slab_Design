/**
 * SHEET 46: ESTIMATION
 * Reads entirely from input.estimation (EstimationResult computed by calculateEstimation).
 * Falls back to direct input fields if input.estimation is undefined.
 */

import ExcelJS from 'exceljs';
import { EnhancedProjectInput, InputHydraulicsTemplateRefs } from '../types';
import { setColumnWidths, setCellValue, setCellFormula, mergeCells } from '../utils';

/**
 * Excel row of GRAND TOTAL on ESTIMATION (column F). Must match generateEstimationSheet layout.
 */
export function getEstimationGrandTotalExcelRow(opts: {
  boqCount: number;
  hasEstimationQuantities: boolean;
}): number {
  /** First BOQ data row when BASIC QUANTITIES + refs block is present (must match generateEstimationSheet). */
  const boqStart = opts.hasEstimationQuantities ? 18 : 12;
  const dataRows = opts.boqCount === 0 ? 1 : opts.boqCount;
  const boqEnd = boqStart + dataRows - 1;
  return boqEnd + 5;
}

export async function generateEstimationSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
  inputHydraulicsRefs?: InputHydraulicsTemplateRefs
): Promise<void> {
  const ws = workbook.addWorksheet('ESTIMATION');

  setColumnWidths(ws, [6, 40, 8, 14, 14, 16]);

  const est = input.estimation;
  const bridgeL = input.totalLength || 40;
  const carriageW = input.carriageWidth || 7.5;

  let row = 1;

  // ── HEADER ────────────────────────────────────────────────────────────────
  ws.getCell(row, 1).value = 'BILL OF QUANTITIES & COST ESTIMATION';
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  mergeCells(ws, row, 1, row, 6);
  row++;

  ws.getCell(row, 1).value = `Project: ${input.projectName || ''}`;
  ws.getCell(row, 1).font = { bold: true };
  mergeCells(ws, row, 1, row, 6);
  row++;

  ws.getCell(row, 1).value = `Location: ${input.location || ''}`;
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  // ── BASIC QUANTITIES BLOCK ────────────────────────────────────────────────
  ws.getCell(row, 1).value = 'BASIC QUANTITIES';
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row++;

  const qRows: Record<string, number> = {};

  const addQRow = (label: string, val: number, unit: string): number => {
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellValue(ws, row, 4, val);
    setCellValue(ws, row, 5, unit);
    const r = row;
    row++;
    return r;
  };

  const addQRowFormula = (label: string, excelFormula: string, cached: number, unit: string): number => {
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellFormula(ws, row, 4, excelFormula, cached);
    setCellValue(ws, row, 5, unit);
    const r = row;
    row++;
    return r;
  };

  if (est) {
    if (inputHydraulicsRefs) {
      const { totalLengthRef, carriageWidthRef, numberOfSpansRef } = inputHydraulicsRefs;
      addQRowFormula('Total Bridge Length', '=' + totalLengthRef, bridgeL, 'm');
      addQRowFormula('Carriageway Width', '=' + carriageWidthRef, carriageW, 'm');
      addQRowFormula('Number of Spans', '=' + numberOfSpansRef, input.numberOfSpans || 0, '');
    } else {
      addQRow('Total Bridge Length', bridgeL, 'm');
      addQRow('Carriageway Width', carriageW, 'm');
      addQRow('Number of Spans', input.numberOfSpans || 0, '');
    }
    addQRow('Number of Piers', input.numberOfPiers || 0, '');
    addQRow('Total Concrete (M30)', est.quantities.concrete.m30, 'm³');
    addQRow('Total Concrete (M25 PCC)', est.quantities.concrete.m25, 'm³');
    addQRow('Total Steel', est.quantities.steel.total, 'MT');
    addQRow('Total Excavation', est.quantities.excavation.total, 'm³');
    addQRow('Formwork', est.quantities.formwork, 'm²');
  } else {
    addQRow('Total Bridge Length', bridgeL, 'm');
    addQRow('Carriageway Width', carriageW, 'm');
    addQRow('Number of Spans', input.numberOfSpans || 0, '');
    addQRow('Number of Piers', input.numberOfPiers || 0, '');
  }
  row++;

  // ── BOQ TABLE HEADER ──────────────────────────────────────────────────────
  const boqHeaders = ['Item No', 'Description', 'Unit', 'Quantity', 'Rate (₹)', 'Amount (₹)'];
  boqHeaders.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    cell.alignment = { horizontal: 'center' };
  });
  row++;

  const boqStartRow = row;

  // ── BOQ ROWS ──────────────────────────────────────────────────────────────
  const boqItems = est?.boq ?? [];

  if (boqItems.length > 0) {
    boqItems.forEach((item) => {
      setCellValue(ws, row, 1, item.itemNo);
      setCellValue(ws, row, 2, item.description);
      setCellValue(ws, row, 3, item.unit);
      setCellValue(ws, row, 4, item.quantity);
      setCellValue(ws, row, 5, item.rate);
      // Amount = Qty × Rate, formula + cached engine value
      setCellFormula(ws, row, 6, `=D${row}*E${row}`, item.amount);
      for (let c = 1; c <= 6; c++) {
        ws.getCell(row, c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      }
      row++;
    });
  } else {
    // Fallback: single placeholder row
    setCellValue(ws, row, 1, '—');
    setCellValue(ws, row, 2, 'No BOQ data (run design engine)');
    row++;
  }

  const boqEndRow = row - 1;
  row++;

  // ── SUBTOTAL ──────────────────────────────────────────────────────────────
  setCellValue(ws, row, 2, 'SUBTOTAL');
  ws.getCell(row, 2).font = { bold: true };
  const subtotalVal = est?.cost.subtotal ?? 0;
  setCellFormula(ws, row, 6, `=SUM(F${boqStartRow}:F${boqEndRow})`, subtotalVal);
  ws.getCell(row, 6).font = { bold: true };
  const subtotalRow = row;
  row++;

  // ── PROFIT ────────────────────────────────────────────────────────────────
  setCellValue(ws, row, 2, 'Contractor\'s Profit (10%)');
  const profitVal = est?.cost.profit ?? 0;
  setCellFormula(ws, row, 6, `=F${subtotalRow}*0.10`, profitVal);
  const profitRow = row;
  row++;

  // ── OVERHEAD ─────────────────────────────────────────────────────────────
  setCellValue(ws, row, 2, 'Overhead Charges (8%)');
  const overheadVal = est?.cost.overhead ?? 0;
  setCellFormula(ws, row, 6, `=F${subtotalRow}*0.08`, overheadVal);
  const overheadRow = row;
  row++;

  // ── GST ───────────────────────────────────────────────────────────────────
  setCellValue(ws, row, 2, 'GST (18%)');
  const gstVal = est?.cost.gst ?? 0;
  setCellFormula(ws, row, 6, `=(F${subtotalRow}+F${profitRow}+F${overheadRow})*0.18`, gstVal);
  const gstRow = row;
  row++;

  // ── GRAND TOTAL ───────────────────────────────────────────────────────────
  setCellValue(ws, row, 2, 'GRAND TOTAL');
  ws.getCell(row, 2).font = { bold: true, size: 12 };
  const totalVal = est?.cost.total ?? 0;
  setCellFormula(ws, row, 6, `=F${subtotalRow}+F${profitRow}+F${overheadRow}+F${gstRow}`, totalVal);
  ws.getCell(row, 6).font = { bold: true };
  ws.getCell(row, 6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } };
  const grandTotalRow = row;
  row += 2;

  // ── COST ANALYSIS ─────────────────────────────────────────────────────────
  setCellValue(ws, row, 1, 'COST ANALYSIS');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row++;

  const ratePerM = est?.cost.ratePerMeter ?? (totalVal / (bridgeL || 1));
  const ratePerSqm =
    est?.cost.ratePerSqm ??
    (bridgeL && carriageW ? totalVal / (bridgeL * carriageW) : 0);

  setCellValue(ws, row, 2, 'Cost per Running Meter (₹/Rm)');
  if (inputHydraulicsRefs) {
    const len = inputHydraulicsRefs.totalLengthRef;
    setCellFormula(ws, row, 4, `=F${grandTotalRow}/${len}`, +ratePerM.toFixed(0));
  } else {
    setCellFormula(ws, row, 4, `=F${grandTotalRow}/${bridgeL}`, +ratePerM.toFixed(0));
  }
  row++;

  setCellValue(ws, row, 2, 'Cost per Square Meter (₹/sqm)');
  if (inputHydraulicsRefs) {
    const len = inputHydraulicsRefs.totalLengthRef;
    const cw = inputHydraulicsRefs.carriageWidthRef;
    setCellFormula(ws, row, 4, `=F${grandTotalRow}/(${len}*${cw})`, +ratePerSqm.toFixed(0));
  } else {
    setCellFormula(ws, row, 4, `=F${grandTotalRow}/(${bridgeL}*${carriageW})`, +ratePerSqm.toFixed(0));
  }
  row++;

  if (est) {
    setCellValue(ws, row, 2, 'Total Concrete (m³)');
    setCellValue(ws, row, 4, est.quantities.concrete.total);
    row++;
    setCellValue(ws, row, 2, 'Total Steel (MT)');
    setCellValue(ws, row, 4, est.quantities.steel.total);
    row++;
  }

  console.log('✓ Sheet ESTIMATION generated from input.estimation');
}
