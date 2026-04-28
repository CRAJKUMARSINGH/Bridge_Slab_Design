/**
 * Golden regression: HYDRAULICS totals formulas, afflux → HYDRAULICS links, Molesworth pattern, ESTIMATION BOQ roll-up.
 * ExcelJS round-trip may alter formula punctuation; we normalize sheet names and locate rows by label.
 * Cross-book (W05): repeats afflux + HYDRAULICS checks for Larathi stability fixture (different cross-section count).
 * Third golden (W15): `MINIMAL_CHANNEL_PROJECT_INPUT` — 4-point cross-section, zero piers; same regression block as Kherwara/Larathi.
 * Pier block (W07): STABILITY CHECK FOR PIER ↔ HYDRAULICS HFL, LLOAD VLOOKUP present, loadsumm sheet present.
 * TYPE1 abutment (W08): stability sheet Ka (Rankine or Coulomb-style COS/SIN/RADIANS) + FOS IF checks; footing sheet bearing IF (see artifacts/W08-type1-stability-footing-gaps.md).
 * TYPE1 tail (W09): footing stress, steel, cap, dirt wall + BM sheets present with expected A1 keywords (see artifacts/W09-type1-cap-dirt-steel-matrix.md).
 * C1 block (W10): sheets 35–46 names + titles; C1 stability FOS IF + Rankine Ka (see artifacts/W10-c1-parity-checklist.md).
 * Estimation (W11): Abstract + General Abs. GRAND TOTAL → ESTIMATION!F{row}; Bridge measurements qty column (see artifacts/W11-estimation-refs.md).
 * TechNote / Tech Report (W12): 13-section note + 7-part report + (a)–(k); hard-rock vs open foundation branch (see artifacts/W12-technote-techreport.md).
 * Sketches + abstract of stresses (W13): Phase 1 placeholder on drawing/stress tabs; pier abstract MAX/MIN + SBC (see artifacts/W13-sketches-abstract-pressures.md).
 * Run: npm run verify:excel
 * COVER + DRAWINGS-SLOTS: title block and Bridge GAD drawing-register slots (first tab + index rows).
 */

import ExcelJS from 'exceljs';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import { getHydraulicsTotalRow } from '../bridge-excel-generator/sheets/04-hydraulics';
import { getEstimationGrandTotalExcelRow } from '../bridge-excel-generator/sheets/46-estimation';
import type { ProjectInput } from '../bridge-excel-generator/types';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from './fixtures/kherwara-project-input';
import { LARATHI_STABIL_REFERENCE_INPUT } from './fixtures/larathi-stabil-project-input';
import { MINIMAL_CHANNEL_PROJECT_INPUT } from './fixtures/minimal-channel-project-input';

function getFormula(cell: ExcelJS.Cell): string | undefined {
  const v = cell.value as { formula?: string; sharedFormula?: string } | null | undefined;
  if (v && typeof v === 'object') {
    if (typeof v.formula === 'string') return v.formula;
    if (typeof v.sharedFormula === 'string') return v.sharedFormula;
  }
  if (typeof cell.value === 'string' && cell.value.startsWith('=')) return cell.value;
  return undefined;
}

/** Uppercase, no spaces, HYDRAULICS sheet ref with or without quotes. */
function normalizeFormula(f: string): string {
  return f
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/'HYDRAULICS'!/g, 'HYDRAULICS!')
    .replace(/'ESTIMATION'!/g, 'ESTIMATION!')
    .replace(/'LLOAD'!/g, 'LLOAD!');
}

function findLabelRow(ws: ExcelJS.Worksheet, exact: string): number {
  const u = exact.toUpperCase();
  for (let r = 1; r <= 250; r++) {
    const v = ws.getRow(r).getCell(2).value;
    const s = v == null ? '' : String(v).trim().toUpperCase();
    if (s === u) return r;
  }
  return -1;
}

/** Abstract puts GRAND TOTAL in column E (label); scan cols 2–6. */
function findGrandTotalRow(ws: ExcelJS.Worksheet): number {
  for (let r = 1; r <= 250; r++) {
    for (let c = 2; c <= 6; c++) {
      const v = ws.getRow(r).getCell(c).value;
      if (v != null && String(v).trim().toUpperCase() === 'GRAND TOTAL') return r;
    }
  }
  return -1;
}

/** Molesworth h: column C, formula uses 17.85 and A/a ratio (generator ~row 75; AFL =B49+D76 follows on ~row 78). */
/** HYDRAULICS block below TOTAL: C column mirrors F/G totals; R/V/Q chain uses C (Som / Larathi reference layout). */
function assertHydraulicsSummaryBlock(
  hydWs: ExcelJS.Worksheet,
  totalRow: number,
  tag: string,
  failedRef: { v: boolean }
): void {
  const aRow = findLabelRow(hydWs, 'A');
  const pRow = findLabelRow(hydWs, 'P');
  const rRow = findLabelRow(hydWs, 'R');
  const nRow = findLabelRow(hydWs, 'N');
  const sRow = findLabelRow(hydWs, 'S       1 IN');
  const vRow = findLabelRow(hydWs, 'V');
  const qRow = findLabelRow(hydWs, 'Q');
  const ddRow = findLabelRow(hydWs, 'Design Discharge =');

  if (aRow < 0 || pRow < 0 || rRow < 0 || nRow < 0 || sRow < 0 || vRow < 0 || qRow < 0 || ddRow < 0) {
    console.error(
      `${tag}: HYDRAULICS summary labels missing (A=${aRow} P=${pRow} R=${rRow} N=${nRow} S=${sRow} V=${vRow} Q=${qRow} DD=${ddRow})`
    );
    failedRef.v = true;
    return;
  }

  const fA = getFormula(hydWs.getRow(aRow).getCell(3));
  if (!fA || normalizeFormula(fA) !== normalizeFormula(`=F${totalRow}`)) {
    console.error(`${tag}: HYDRAULICS C${aRow} (A): expected =F${totalRow}, got ${fA ?? '(none)'}`);
    failedRef.v = true;
  }

  const fP = getFormula(hydWs.getRow(pRow).getCell(3));
  if (!fP || normalizeFormula(fP) !== normalizeFormula(`=G${totalRow}`)) {
    console.error(`${tag}: HYDRAULICS C${pRow} (P): expected =G${totalRow}, got ${fP ?? '(none)'}`);
    failedRef.v = true;
  }

  const fR = getFormula(hydWs.getRow(rRow).getCell(3));
  const expectR = normalizeFormula(`=C${aRow}/C${pRow}`);
  if (!fR || normalizeFormula(fR) !== expectR) {
    console.error(`${tag}: HYDRAULICS C${rRow} (R): expected =C${aRow}/C${pRow}, got ${fR ?? '(none)'}`);
    failedRef.v = true;
  }

  const fV = getFormula(hydWs.getRow(vRow).getCell(3));
  const nV = fV ? normalizeFormula(fV) : '';
  if (
    !fV ||
    !nV.includes(`C${nRow}`) ||
    !nV.includes(`C${aRow}`) ||
    !nV.includes(`C${pRow}`) ||
    !nV.includes(`C${sRow}`) ||
    (!nV.includes('POWER') && !nV.includes('^'))
  ) {
    console.error(`${tag}: HYDRAULICS C${vRow} (V): expected Manning form using C${nRow}, C${aRow}/C${pRow}, C${sRow}, got ${fV ?? '(none)'}`);
    failedRef.v = true;
  }

  const fQ = getFormula(hydWs.getRow(qRow).getCell(3));
  const expectQ = normalizeFormula(`=C${aRow}*C${vRow}`);
  if (!fQ || normalizeFormula(fQ) !== expectQ) {
    console.error(`${tag}: HYDRAULICS C${qRow} (Q): expected =C${aRow}*C${vRow}, got ${fQ ?? '(none)'}`);
    failedRef.v = true;
  }

  const fDd = getFormula(hydWs.getRow(ddRow).getCell(3));
  const expectDd = normalizeFormula(`=C${qRow}`);
  if (!fDd || normalizeFormula(fDd) !== expectDd) {
    console.error(`${tag}: HYDRAULICS C${ddRow} (Design Discharge): expected =C${qRow}, got ${fDd ?? '(none)'}`);
    failedRef.v = true;
  }
}

function sheetHasFormulaMatching(
  ws: ExcelJS.Worksheet,
  test: (normalized: string) => boolean,
  maxRow: number,
  maxCol: number
): boolean {
  for (let r = 1; r <= maxRow; r++) {
    for (let c = 1; c <= maxCol; c++) {
      const f = getFormula(ws.getRow(r).getCell(c));
      if (f && test(normalizeFormula(f))) return true;
    }
  }
  return false;
}

/** W07: minimal pier / LLOAD / loadsumm sanity (Som reference uses HYDRAULICS!F4 + dense LLOAD; loadsumm pulls from LLOAD). */
function verifyPierLloadLoadsummBlock(wb: ExcelJS.Workbook, tag: string, failedRef: { v: boolean }): void {
  const pier = wb.getWorksheet('STABILITY CHECK FOR PIER');
  const lload = wb.getWorksheet('LLOAD');
  const loadsumm = wb.getWorksheet('loadsumm');
  if (!pier || !lload || !loadsumm) {
    console.error(`${tag}: missing STABILITY CHECK FOR PIER, LLOAD, or loadsumm worksheet`);
    failedRef.v = true;
    return;
  }

  if (!sheetHasFormulaMatching(pier, (n) => n.includes('HYDRAULICS!F4'), 800, 36)) {
    console.error(`${tag}: STABILITY CHECK FOR PIER: expected ≥1 formula referencing HYDRAULICS!F4`);
    failedRef.v = true;
  }

  if (!sheetHasFormulaMatching(lload, (n) => n.includes('VLOOKUP'), 450, 31)) {
    console.error(`${tag}: LLOAD: expected ≥1 VLOOKUP formula`);
    failedRef.v = true;
  }

  const a1 = loadsumm.getRow(1).getCell(1).value;
  const s1 = a1 == null ? '' : String(a1).toUpperCase();
  if (!s1.includes('LOAD')) {
    console.error(`${tag}: loadsumm A1: expected title containing LOAD, got ${String(a1)}`);
    failedRef.v = true;
  }

  if (!sheetHasFormulaMatching(loadsumm, (n) => n.includes('LLOAD!'), 80, 6)) {
    console.error(`${tag}: loadsumm: expected ≥1 formula referencing LLOAD!`);
    failedRef.v = true;
  }
}

/** W08: TYPE1 stability (Ka: Rankine or Coulomb-style per sheet 21) + sliding/overturning FOS IF; footing bearing check IF. */
function verifyType1AbutmentFootingBlock(wb: ExcelJS.Workbook, tag: string, failedRef: { v: boolean }): void {
  const stab = wb.getWorksheet('TYPE1-STABILITY CHECK ABUTMENT');
  const foot = wb.getWorksheet('TYPE1-ABUTMENT FOOTING DESIGN');
  if (!stab || !foot) {
    console.error(`${tag}: missing TYPE1-STABILITY CHECK ABUTMENT or TYPE1-ABUTMENT FOOTING DESIGN`);
    failedRef.v = true;
    return;
  }

  const stabTitle = stab.getRow(1).getCell(1).value;
  const st = stabTitle == null ? '' : String(stabTitle).toUpperCase();
  if (!st.includes('STABILITY') && !st.includes('TYPE1')) {
    console.error(`${tag}: TYPE1-STABILITY A1: expected title with STABILITY/TYPE1, got ${String(stabTitle)}`);
    failedRef.v = true;
  }

  const footTitle = foot.getRow(1).getCell(1).value;
  const ft = footTitle == null ? '' : String(footTitle).toUpperCase();
  if (!ft.includes('FOOTING') && !ft.includes('TYPE')) {
    console.error(`${tag}: TYPE1-FOOTING A1: expected title with FOOTING/TYPE, got ${String(footTitle)}`);
    failedRef.v = true;
  }

  const rankineKa = sheetHasFormulaMatching(
    stab,
    (n) =>
      n.includes('TAN(RADIANS(45') ||
      (n.includes('POWER') && n.includes('TAN') && n.includes('RADIANS')),
    500,
    8
  );
  const coulombKa = sheetHasFormulaMatching(
    stab,
    (n) => n.includes('COS(RADIANS') && n.includes('POWER') && n.includes('SIN(RADIANS'),
    500,
    8
  );
  if (!rankineKa && !coulombKa) {
    console.error(
      `${tag}: TYPE1-STABILITY: expected Ka pattern (Rankine TAN/RADIANS or Coulomb COS/SIN/POWER — see sheet 21 generator)`
    );
    failedRef.v = true;
  }

  if (!sheetHasFormulaMatching(stab, (n) => n.includes('IF(') && n.includes('1.5'), 500, 8)) {
    console.error(`${tag}: TYPE1-STABILITY: expected sliding FOS IF with 1.5`);
    failedRef.v = true;
  }
  if (!sheetHasFormulaMatching(stab, (n) => n.includes('IF(') && n.includes('1.8'), 500, 8)) {
    console.error(`${tag}: TYPE1-STABILITY: expected overturning FOS IF with 1.8`);
    failedRef.v = true;
  }

  if (!sheetHasFormulaMatching(foot, (n) => n.includes('IF(') && (n.includes('SAFE') || n.includes('UNSAFE')), 80, 8)) {
    console.error(`${tag}: TYPE1-FOOTING: expected bearing IF(…,SAFE/UNSAFE)`);
    failedRef.v = true;
  }
}

/** W09: TYPE1 footing stress, steel, cap, dirt reinforcement, dirt BM sheets — title smoke. */
function verifyType1CapDirtSteelBlock(wb: ExcelJS.Workbook, tag: string, failedRef: { v: boolean }): void {
  const checks: [string, (u: string) => boolean][] = [
    ['TYPE1- Abut Footing STRESS', (u) => u.includes('FOOTING') && u.includes('STRESS')],
    ['TYPE1-STEEL IN ABUTMENT', (u) => u.includes('STEEL')],
    ['TYPE1-Abutment Cap', (u) => u.includes('CAP')],
    ['TYPE1-DIRT WALL REINFORCEMENT', (u) => u.includes('DIRT') && u.includes('REINFORCEMENT')],
    ['TYPE1-DIRT DirectLoad_BM', (u) => u.includes('DIRECT')],
    ['TYPE1-DIRT LL_BM', (u) => u.includes('LIVE')],
  ];

  for (const [sheetName, titleOk] of checks) {
    const ws = wb.getWorksheet(sheetName);
    if (!ws) {
      console.error(`${tag}: missing worksheet "${sheetName}"`);
      failedRef.v = true;
      continue;
    }
    const a1 = ws.getRow(1).getCell(1).value;
    const u = a1 == null ? '' : String(a1).toUpperCase();
    if (!titleOk(u)) {
      console.error(`${tag}: "${sheetName}" A1: unexpected title ${JSON.stringify(a1)}`);
      failedRef.v = true;
    }
  }
}

/** W10: C1 abutment sheets 35–46 — tab names + A1 keywords; stability Rankine + FOS IF. */
function verifyC1AbutmentBlock(wb: ExcelJS.Workbook, tag: string, failedRef: { v: boolean }): void {
  const checks: [string, (u: string) => boolean][] = [
    ['INSERT C1-ABUT', (u) => u.includes('DESIGN') || u.includes('C1') || u.includes('CANTILEVER')],
    ['C1-AbutMENT Drawing', (u) => u.includes('C1') || u.includes('ARRANGEMENT') || u.includes('CANTILEVER')],
    ['C1-STABILITY CHECK ABUTMENT', (u) => u.includes('STABILITY') || u.includes('CANTILEVER')],
    ['C1-ABUTMENT FOOTING DESIGN', (u) => u.includes('FOOTING') || u.includes('C1')],
    ['C1-Abut Footing STRESS DIAGRAM', (u) => u.includes('FOOTING') && (u.includes('STRESS') || u.includes('DISTRIBUTION'))],
    ['CAN-RETURN FOOTING DESIGN', (u) => u.includes('RETURN') || u.includes('FOOTING') || u.includes('CANTILEVER')],
    ['STEEL IN CANT-ABUTMENT', (u) => u.includes('STEEL') || u.includes('CANTILEVER') || u.includes('BODY')],
    ['STEEL IN CANT-RETURNS', (u) => u.includes('STEEL') || u.includes('RETURN')],
    ['C1-Abutment Cap', (u) => u.includes('CAP') || u.includes('C1')],
    ['C1-DIRT WALL REINFORCEMENT', (u) => u.includes('DIRT') && u.includes('REINFORCEMENT')],
    ['C1-DIRT DirectLoad_BM', (u) => u.includes('DIRECT') || u.includes('DIRT')],
    ['C1-DIRT LL_BM', (u) => u.includes('LIVE') || u.includes('DIRT')],
  ];

  for (const [sheetName, titleOk] of checks) {
    const ws = wb.getWorksheet(sheetName);
    if (!ws) {
      console.error(`${tag}: missing C1 worksheet "${sheetName}"`);
      failedRef.v = true;
      continue;
    }
    const a1 = ws.getRow(1).getCell(1).value;
    const u = a1 == null ? '' : String(a1).toUpperCase();
    if (!titleOk(u)) {
      console.error(`${tag}: C1 "${sheetName}" A1: unexpected title ${JSON.stringify(a1)}`);
      failedRef.v = true;
    }
  }

  const stab = wb.getWorksheet('C1-STABILITY CHECK ABUTMENT');
  if (stab) {
    const rankineKa = sheetHasFormulaMatching(
      stab,
      (n) =>
        n.includes('TAN(RADIANS(45') ||
        (n.includes('POWER') && n.includes('TAN') && n.includes('RADIANS')),
      500,
      8
    );
    const coulombKa = sheetHasFormulaMatching(
      stab,
      (n) => n.includes('COS(RADIANS') && n.includes('POWER') && n.includes('SIN(RADIANS'),
      500,
      8
    );
    if (!rankineKa && !coulombKa) {
      console.error(`${tag}: C1-STABILITY: expected Ka pattern (Rankine TAN/RADIANS or Coulomb COS/SIN)`);
      failedRef.v = true;
    }
    if (!sheetHasFormulaMatching(stab, (n) => n.includes('IF(') && n.includes('1.5'), 500, 8)) {
      console.error(`${tag}: C1-STABILITY: expected sliding FOS IF with 1.5`);
      failedRef.v = true;
    }
    if (!sheetHasFormulaMatching(stab, (n) => n.includes('IF(') && n.includes('1.8'), 500, 8)) {
      console.error(`${tag}: C1-STABILITY: expected overturning FOS IF with 1.8`);
      failedRef.v = true;
    }
  }
}

function assertMolesworthPattern(affluxWs: ExcelJS.Worksheet, tag: string, failedRef: { v: boolean }): void {
  let found: string | undefined;
  for (let r = 50; r <= 88; r++) {
    const f = getFormula(affluxWs.getRow(r).getCell(3));
    if (!f) continue;
    const n = normalizeFormula(f);
    if (n.includes('17.85') && n.includes('C46') && n.includes('C74') && (n.includes('C47') || n.includes('POWER(C47'))) {
      found = f;
      break;
    }
  }
  if (!found) {
    console.error(`${tag}: afflux: no Molesworth formula in C50:C88 (expected 17.85, C46, C74, C47)`);
    failedRef.v = true;
  }
}

async function verifyHydraulicsAffluxForProject(
  input: ProjectInput,
  tag: string,
  failedRef: { v: boolean }
): Promise<ExcelJS.Workbook> {
  const n = input.crossSectionData.length;
  const lastDataRow = 5 + n;
  const totalRow = getHydraulicsTotalRow(n);

  const buffer = await generateCompleteExcel(input);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const hydWs = wb.getWorksheet('HYDRAULICS');
  const affluxWs = wb.getWorksheet('afflux calculation');
  if (!hydWs || !affluxWs) {
    console.error(`${tag}: missing HYDRAULICS or afflux calculation sheet`);
    failedRef.v = true;
    return wb;
  }

  const sumArea = `SUM(F6:F${lastDataRow})`;
  const sumPerim = `SUM(G6:G${lastDataRow})`;

  const fArea = getFormula(hydWs.getRow(totalRow).getCell(6));
  const fPerim = getFormula(hydWs.getRow(totalRow).getCell(7));

  if (!fArea || !normalizeFormula(fArea).includes(normalizeFormula(`=${sumArea}`).replace('=', ''))) {
    console.error(`${tag}: HYDRAULICS!F${totalRow}: expected formula containing =${sumArea}, got ${fArea ?? '(none)'}`);
    failedRef.v = true;
  }
  if (!fPerim || !normalizeFormula(fPerim).includes(normalizeFormula(`=${sumPerim}`).replace('=', ''))) {
    console.error(`${tag}: HYDRAULICS!G${totalRow}: expected formula containing =${sumPerim}, got ${fPerim ?? '(none)'}`);
    failedRef.v = true;
  }

  const affluxArea = getFormula(affluxWs.getRow(6).getCell(3));
  const affluxPerim = getFormula(affluxWs.getRow(7).getCell(3));
  const expectAreaRef = normalizeFormula(`=HYDRAULICS!F${totalRow}`);
  const expectPerimRef = normalizeFormula(`=HYDRAULICS!G${totalRow}`);
  if (!affluxArea || normalizeFormula(affluxArea) !== expectAreaRef) {
    console.error(`${tag}: afflux C6: expected =HYDRAULICS!F${totalRow}, got ${affluxArea ?? '(none)'}`);
    failedRef.v = true;
  }
  if (!affluxPerim || normalizeFormula(affluxPerim) !== expectPerimRef) {
    console.error(`${tag}: afflux C7: expected =HYDRAULICS!G${totalRow}, got ${affluxPerim ?? '(none)'}`);
    failedRef.v = true;
  }

  assertHydraulicsSummaryBlock(hydWs, totalRow, tag, failedRef);
  assertMolesworthPattern(affluxWs, tag, failedRef);
  return wb;
}

async function verifyEstimationBoq(input: ProjectInput, wb: ExcelJS.Workbook, tag: string, failedRef: { v: boolean }): Promise<void> {
  const estWs = wb.getWorksheet('ESTIMATION');
  if (!estWs) {
    console.error(`${tag}: ESTIMATION sheet missing`);
    failedRef.v = true;
    return;
  }

  const { calculateCompleteDesign } = await import('../bridge-excel-generator/design-engine');
  const { estimation } = calculateCompleteDesign(input, { quiet: true });
  if (!estimation) {
    console.error(`${tag}: engine returned no estimation`);
    failedRef.v = true;
    return;
  }
  const boqCount = estimation.boq.length;

  const subtotalRow = findLabelRow(estWs, 'SUBTOTAL');
  const grandRow = findLabelRow(estWs, 'GRAND TOTAL');
  if (subtotalRow < 0 || grandRow < 0) {
    console.error(`${tag}: could not find SUBTOTAL or GRAND TOTAL row`);
    failedRef.v = true;
    return;
  }

  const fSub = getFormula(estWs.getRow(subtotalRow).getCell(6));
  const sumM = fSub && normalizeFormula(fSub).match(/^=SUM\(F(\d+):F(\d+)\)$/);
  if (!sumM) {
    console.error(`${tag}: ESTIMATION!F${subtotalRow}: expected =SUM(Fstart:Fend), got ${fSub ?? '(none)'}`);
    failedRef.v = true;
  } else {
    const start = parseInt(sumM[1], 10);
    const end = parseInt(sumM[2], 10);
    const nBoq = end - start + 1;
    if (nBoq !== boqCount) {
      console.error(
        `${tag}: ESTIMATION BOQ row count: expected ${boqCount} from engine, SUM covers ${nBoq} rows (F${start}:F${end})`
      );
      failedRef.v = true;
    }
  }

  const fGrand = getFormula(estWs.getRow(grandRow).getCell(6));
  const profitRow = subtotalRow + 1;
  const overheadRow = subtotalRow + 2;
  const gstRow = subtotalRow + 3;
  const expectGrand = normalizeFormula(`=F${subtotalRow}+F${profitRow}+F${overheadRow}+F${gstRow}`);
  if (!fGrand || normalizeFormula(fGrand) !== expectGrand) {
    console.error(
      `${tag}: ESTIMATION!F${grandRow}: expected =F${subtotalRow}+F${profitRow}+F${overheadRow}+F${gstRow}, got ${fGrand ?? '(none)'}`
    );
    failedRef.v = true;
  }
}

/** W11: General Abs. C and Abstract F on GRAND TOTAL row = ESTIMATION!F{getEstimationGrandTotalExcelRow(...)}. */
async function verifyEstimationCrossSheetGrandTotal(
  input: ProjectInput,
  wb: ExcelJS.Workbook,
  tag: string,
  failedRef: { v: boolean }
): Promise<void> {
  const { calculateCompleteDesign } = await import('../bridge-excel-generator/design-engine');
  const { estimation } = calculateCompleteDesign(input, { quiet: true });
  if (!estimation) {
    console.error(`${tag}: W11 cross-sheet: engine returned no estimation`);
    failedRef.v = true;
    return;
  }
  const grandRow = getEstimationGrandTotalExcelRow({
    boqCount: estimation.boq.length,
    hasEstimationQuantities: true,
  });
  const expectRef = normalizeFormula(`=ESTIMATION!F${grandRow}`);

  const genWs = wb.getWorksheet('General Abs.');
  if (!genWs) {
    console.error(`${tag}: W11: General Abs. sheet missing`);
    failedRef.v = true;
  } else {
    const gRow = findLabelRow(genWs, 'GRAND TOTAL');
    if (gRow < 0) {
      console.error(`${tag}: W11: General Abs. GRAND TOTAL label not found`);
      failedRef.v = true;
    } else {
      const fGen = getFormula(genWs.getRow(gRow).getCell(3));
      if (!fGen || normalizeFormula(fGen) !== expectRef) {
        console.error(
          `${tag}: W11: General Abs.!C${gRow}: expected ${expectRef}, got ${fGen ?? '(none)'}`
        );
        failedRef.v = true;
      }
    }
  }

  const absWs = wb.getWorksheet('Abstract');
  if (!absWs) {
    console.error(`${tag}: W11: Abstract sheet missing`);
    failedRef.v = true;
  } else {
    const aRow = findGrandTotalRow(absWs);
    if (aRow < 0) {
      console.error(`${tag}: W11: Abstract GRAND TOTAL label not found`);
      failedRef.v = true;
    } else {
      const fAbs = getFormula(absWs.getRow(aRow).getCell(6));
      if (!fAbs || normalizeFormula(fAbs) !== expectRef) {
        console.error(
          `${tag}: W11: Abstract!F${aRow}: expected ${expectRef}, got ${fAbs ?? '(none)'}`
        );
        failedRef.v = true;
      }
    }
  }
}

function worksheetConcatCellText(ws: ExcelJS.Worksheet, maxRow: number, maxCol: number): string {
  const chunks: string[] = [];
  for (let r = 1; r <= maxRow; r++) {
    for (let c = 1; c <= maxCol; c++) {
      const v = ws.getRow(r).getCell(c).value;
      if (v != null && v !== '') chunks.push(String(v));
    }
  }
  return chunks.join('\n');
}

const W13_SKETCH_SHEETS = [
  'TYPE1-AbutMENT Drawing',
  'C1-AbutMENT Drawing',
  'Footing STRESS DIAGRAM',
  'TYPE1- Abut Footing STRESS',
  'C1-Abut Footing STRESS DIAGRAM',
] as const;

function verifyW13SketchesAndAbstract(wb: ExcelJS.Workbook, tag: string, failedRef: { v: boolean }): void {
  for (const name of W13_SKETCH_SHEETS) {
    const ws = wb.getWorksheet(name);
    if (!ws) {
      console.error(`${tag}: W13: sheet missing: ${name}`);
      failedRef.v = true;
      continue;
    }
    const t = worksheetConcatCellText(ws, 100, 12);
    if (!t.includes('Drawing to be inserted manually') || !t.includes('D-01')) {
      console.error(`${tag}: W13: ${name}: expected Phase 1 sketch placeholder (D-01)`);
      failedRef.v = true;
    }
  }

  const abs = wb.getWorksheet('abstract of stresses');
  if (!abs) {
    console.error(`${tag}: W13: abstract of stresses sheet missing`);
    failedRef.v = true;
    return;
  }
  const body = worksheetConcatCellText(abs, 45, 12);
  if (!body.includes('ABSTRACT OF STRESSES IN PIER') || !body.includes('SBC (kN/m²)')) {
    console.error(`${tag}: W13: abstract of stresses: expected title + SBC header`);
    failedRef.v = true;
  }
  let foundMax = false;
  let foundMin = false;
  for (let r = 1; r <= 40; r++) {
    const f6 = getFormula(abs.getRow(r).getCell(6));
    const f7 = getFormula(abs.getRow(r).getCell(7));
    const n6 = f6 ? normalizeFormula(f6) : '';
    const n7 = f7 ? normalizeFormula(f7) : '';
    if (n6.startsWith('=MAX(')) foundMax = true;
    if (n7.startsWith('=MIN(')) foundMin = true;
  }
  if (!foundMax || !foundMin) {
    console.error(`${tag}: W13: abstract of stresses: expected =MAX / =MIN summary formulas`);
    failedRef.v = true;
  }
}

function verifyTechNoteTechReport(
  wb: ExcelJS.Workbook,
  input: ProjectInput,
  tag: string,
  failedRef: { v: boolean }
): void {
  const note = wb.getWorksheet('TechNote');
  const rep = wb.getWorksheet('Tech Report');
  if (!note || !rep) {
    console.error(`${tag}: W12: TechNote or Tech Report sheet missing`);
    failedRef.v = true;
    return;
  }
  const tNote = worksheetConcatCellText(note, 120, 12);
  const tRep = worksheetConcatCellText(rep, 120, 12);
  if (!tNote.includes('TECHNICAL NOTE') || !tNote.includes('1. GENERAL') || !tNote.includes('13. ASSUMPTIONS')) {
    console.error(`${tag}: W12: TechNote missing expected section headers`);
    failedRef.v = true;
  }
  if (
    !tRep.includes('TECHNICAL REPORT') ||
    !tRep.includes('7. SPECIFICATION ITEMS') ||
    !tRep.includes('(k) Tests:')
  ) {
    console.error(`${tag}: W12: Tech Report missing expected structure`);
    failedRef.v = true;
  }
  const rock = input.hardRockAvailable === true;
  const lowNote = tNote.toLowerCase();
  const lowRep = tRep.toLowerCase();
  if (rock) {
    if (!lowNote.includes('hard rock')) {
      console.error(`${tag}: W12: TechNote expected hard-rock foundation prose`);
      failedRef.v = true;
    }
    if (!lowRep.includes('hard rock')) {
      console.error(`${tag}: W12: Tech Report expected hard-rock foundation prose`);
      failedRef.v = true;
    }
  } else {
    if (!tNote.includes('Open foundations')) {
      console.error(`${tag}: W12: TechNote expected open-foundation prose`);
      failedRef.v = true;
    }
    if (!tRep.includes('Open foundations')) {
      console.error(`${tag}: W12: Tech Report expected open-foundation prose`);
      failedRef.v = true;
    }
  }
}

/** COVER + DRAWINGS-SLOTS (Bridge GAD workflow register). */
function verifyCoverAndDrawingsSlots(wb: ExcelJS.Workbook, tag: string, failedRef: { v: boolean }): void {
  const cover = wb.getWorksheet('COVER');
  const slots = wb.getWorksheet('DRAWINGS-SLOTS');
  if (!cover || !slots) {
    console.error(`${tag}: COVER or DRAWINGS-SLOTS sheet missing`);
    failedRef.v = true;
    return;
  }
  let foundTitle = false;
  for (let r = 1; r <= 20; r++) {
    for (let c = 1; c <= 3; c++) {
      const v = cover.getRow(r).getCell(c).value;
      const s = v == null ? '' : String(v);
      if (s.includes('SUBMERSIBLE BRIDGE DESIGN WORKBOOK')) {
        foundTitle = true;
        break;
      }
    }
    if (foundTitle) break;
  }
  if (!foundTitle) {
    console.error(`${tag}: COVER: expected workbook title text`);
    failedRef.v = true;
  }
  let foundSlot = false;
  for (let r = 1; r <= 45; r++) {
    const v = slots.getRow(r).getCell(1).value;
    if (v != null && String(v).includes('GAD-1')) {
      foundSlot = true;
      break;
    }
  }
  if (!foundSlot) {
    console.error(`${tag}: DRAWINGS-SLOTS: expected GAD-1 slot label`);
    failedRef.v = true;
  }
}

function verifyBridgeMeasurementsQtyColumn(wb: ExcelJS.Workbook, tag: string, failedRef: { v: boolean }): void {
  const ws = wb.getWorksheet('Bridge measurements');
  if (!ws) {
    console.error(`${tag}: W11: Bridge measurements sheet missing`);
    failedRef.v = true;
    return;
  }
  const re = /^=C\d+\*D\d+\*E\d+\*F\d+$/;
  let found = false;
  for (let r = 1; r <= 80; r++) {
    const f = getFormula(ws.getRow(r).getCell(7));
    if (f && re.test(normalizeFormula(f))) {
      found = true;
      break;
    }
  }
  if (!found) {
    console.error(`${tag}: W11: Bridge measurements col G: expected at least one =C*D*E*F qty formula`);
    failedRef.v = true;
  }
}

async function main(): Promise<void> {
  const failedRef = { v: false };

  const kTotal = getHydraulicsTotalRow(KHERWARA_REFERENCE_PROJECT_INPUT.crossSectionData.length);
  const wbK = await verifyHydraulicsAffluxForProject(KHERWARA_REFERENCE_PROJECT_INPUT, 'Kherwara', failedRef);
  await verifyEstimationBoq(KHERWARA_REFERENCE_PROJECT_INPUT, wbK, 'Kherwara', failedRef);
  await verifyEstimationCrossSheetGrandTotal(KHERWARA_REFERENCE_PROJECT_INPUT, wbK, 'Kherwara', failedRef);
  verifyBridgeMeasurementsQtyColumn(wbK, 'Kherwara', failedRef);

  const lTotal = getHydraulicsTotalRow(LARATHI_STABIL_REFERENCE_INPUT.crossSectionData.length);
  const wbL = await verifyHydraulicsAffluxForProject(LARATHI_STABIL_REFERENCE_INPUT, 'Larathi', failedRef);
  await verifyEstimationBoq(LARATHI_STABIL_REFERENCE_INPUT, wbL, 'Larathi', failedRef);
  await verifyEstimationCrossSheetGrandTotal(LARATHI_STABIL_REFERENCE_INPUT, wbL, 'Larathi', failedRef);
  verifyBridgeMeasurementsQtyColumn(wbL, 'Larathi', failedRef);

  verifyCoverAndDrawingsSlots(wbK, 'Kherwara', failedRef);
  verifyCoverAndDrawingsSlots(wbL, 'Larathi', failedRef);

  verifyPierLloadLoadsummBlock(wbK, 'Kherwara', failedRef);
  verifyPierLloadLoadsummBlock(wbL, 'Larathi', failedRef);

  verifyType1AbutmentFootingBlock(wbK, 'Kherwara', failedRef);
  verifyType1AbutmentFootingBlock(wbL, 'Larathi', failedRef);

  verifyType1CapDirtSteelBlock(wbK, 'Kherwara', failedRef);
  verifyType1CapDirtSteelBlock(wbL, 'Larathi', failedRef);

  verifyC1AbutmentBlock(wbK, 'Kherwara', failedRef);
  verifyC1AbutmentBlock(wbL, 'Larathi', failedRef);

  verifyTechNoteTechReport(wbK, KHERWARA_REFERENCE_PROJECT_INPUT, 'Kherwara', failedRef);
  verifyTechNoteTechReport(wbL, LARATHI_STABIL_REFERENCE_INPUT, 'Larathi', failedRef);

  verifyW13SketchesAndAbstract(wbK, 'Kherwara', failedRef);
  verifyW13SketchesAndAbstract(wbL, 'Larathi', failedRef);

  const mTotal = getHydraulicsTotalRow(MINIMAL_CHANNEL_PROJECT_INPUT.crossSectionData.length);
  const wbM = await verifyHydraulicsAffluxForProject(MINIMAL_CHANNEL_PROJECT_INPUT, 'MinimalChannel', failedRef);
  await verifyEstimationBoq(MINIMAL_CHANNEL_PROJECT_INPUT, wbM, 'MinimalChannel', failedRef);
  await verifyEstimationCrossSheetGrandTotal(MINIMAL_CHANNEL_PROJECT_INPUT, wbM, 'MinimalChannel', failedRef);
  verifyBridgeMeasurementsQtyColumn(wbM, 'MinimalChannel', failedRef);

  verifyCoverAndDrawingsSlots(wbM, 'MinimalChannel', failedRef);
  verifyPierLloadLoadsummBlock(wbM, 'MinimalChannel', failedRef);
  verifyType1AbutmentFootingBlock(wbM, 'MinimalChannel', failedRef);
  verifyType1CapDirtSteelBlock(wbM, 'MinimalChannel', failedRef);
  verifyC1AbutmentBlock(wbM, 'MinimalChannel', failedRef);
  verifyTechNoteTechReport(wbM, MINIMAL_CHANNEL_PROJECT_INPUT, 'MinimalChannel', failedRef);
  verifyW13SketchesAndAbstract(wbM, 'MinimalChannel', failedRef);

  if (failedRef.v) {
    console.error('verify-kherwara-excel-golden: FAILED');
    process.exit(1);
  }

  console.log(
    `verify-kherwara-excel-golden: OK (Kherwara HYDRAULICS row ${kTotal}; Larathi row ${lTotal}; MinimalChannel row ${mTotal}; afflux + estimation + W07–W13 blocks)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
