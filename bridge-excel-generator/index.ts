/**
 * MAIN EXCEL GENERATOR
 * Generates all 56 sheets of the Executive Engineering Book
 * (Expanded 2026-10-05 from 46 → 56 sheets with 10 new IRC/IS QA / Admin sheets)
 */

import ExcelJS from 'exceljs';
import { ProjectInput, EnhancedProjectInput } from './types';
import { EXPECTED_SHEET_COUNT, isLandscapeSheet } from './sheet-contract';
import calculateCompleteDesign, { mapDetailedEstimationToEstimationResult } from './design-engine';
import { assertValidProjectInput } from './input-contract';
import type { EstimationResult } from './types';
import { assertNarrativeHasNoPlaceholders, getSheetNarrativeParagraphs } from './narrative-engine';
import { calculateDetailedEstimation } from '../shared/design-engine-types';

// Import all sheet generators — legacy numbered originals
import { generateIndexSheet } from './sheets/01-index';
import { generateInsertHydraulicsSheet } from './sheets/02-insert-hydraulics';
import { generateAffluxCalculationSheet } from './sheets/03-afflux-calculation';
import { generateHydraulicsSheet } from './sheets/04-hydraulics';
import { generateDeckAnchorageSheet } from './sheets/05-deck-anchorage';
import { generateCrossSectionSheet } from './sheets/06-cross-section';
import { generateBedSlopeSheet } from './sheets/07-bed-slope';
import { generateSBCSheet } from './sheets/08-sbc';
import { generateStabilityCheckPierSheet } from './sheets/09-stability-check-pier';
import { generateAbstractOfStressesSheet } from './sheets/10-abstract-of-stresses';
import { generateSteelFlaredPierSheet } from './sheets/11-steel-flared-pier';
import {
  generateSteelInPierSheet,
  generateFootingDesignSheet,
  generateFootingStressDiagramSheet,
  generatePierCapLLSheet,
  generatePierCapSheet,
  generateLLOADSheet,
  generateLoadSummSheet
} from './sheets/12-18-pier-remaining';
import {
  generateType1AbutmentDrawingSheet,
  generateType1StabilityCheckSheet,
  generateType1FootingDesignSheet,
  generateType1FootingStressSheet,
  generateType1SteelInAbutmentSheet,
  generateType1AbutmentCapSheet,
  generateType1DirtWallReinforcementSheet,
  generateType1DirtDirectLoadBMSheet,
  generateType1DirtLLBMSheet
} from './sheets/19-28-abutment-type1';
import { generateLLAbstractSheet } from './sheets/19-ll-abstract';
import {
  generateTechNoteSheet,
  generateInsertEstimateSheet,
  generateTechReportSheet,
  generateGeneralAbsSheet,
  generateAbstractSheet,
  generateBridgeMeasurementsSheet,
  generateC1AbutmentPlaceholderSheets
} from './sheets/29-46-estimation';

// 10 NEW 56-sheet book generators — Batches A / B / C
import {
  generateDesignCriteriaSheet,
  generateInputDataSummarySheet,
  generateSeismicAnalysisSheet,
  generateWindLoadSheet,
} from './sheets/A01-admin-substructure';
import {
  generateBearingDetailsSheet,
  generateExpansionJointSheet,
  generateApproachSlabSheet,
} from './sheets/B01-superstructure-approaches';
import {
  generateComplianceChecklistSheet,
  generateServiceabilitySheet,
  generateRevisionSheet,
} from './sheets/C01-qa-admin';

/**
 * Generate complete Excel workbook.
 *
 * Book variants:
 *   'executive-56' (default) — 56-sheet Executive Engineering Book with the
 *      10 new IRC/IS QA / Admin / Environmental sheets interleaved.
 *   'legacy-46'             — original 46-sheet contract (sheet order matches
 *      the LARATHI / FINAL_RESULT source workbooks; omits the 10 new sheets).
 */
export async function generateCompleteExcel(
  input: ProjectInput,
  options: { book?: 'executive-56' | 'legacy-46' } = {}
): Promise<Buffer> {
  assertValidProjectInput(input);
  const book: 'executive-56' | 'legacy-46' = options.book ?? 'executive-56';
  console.log('🚀 Starting Excel generation...');
  console.log(`Project: ${input.projectName}`);
  const sheetN = book === 'legacy-46' ? 46 : EXPECTED_SHEET_COUNT;
  const sheetLabel = book === 'legacy-46' ? 'legacy 46-sheet contract' : `${EXPECTED_SHEET_COUNT}-sheet executive engineering book`;
  console.log(`Generating ${sheetN} sheets with real formulas (${sheetLabel})...`);
  
  // Run design engine to calculate all results
  const designResults = calculateCompleteDesign(input);
  
  // Create enhanced input with calculated results
  const enhancedInput: EnhancedProjectInput = {
    ...input,
    hydraulics: designResults.hydraulics,
    pier: designResults.pier,
    abutmentType1: designResults.abutmentType1,
    abutmentC1: designResults.abutmentC1,
    pierDesign: {
      spanCC: input.spanLength
    }
  };

  // Estimation + BOQ for downstream HTML/PDF/report sheets.
  // Design engine now already computes estimation; keep a fallback mapping just in case.
  if (designResults && 'estimation' in designResults && designResults.estimation) {
    enhancedInput.estimation = designResults.estimation as any;
  } else {
    try {
      const detailedEstimation = calculateDetailedEstimation(input, designResults);
      enhancedInput.estimation = mapDetailedEstimationToEstimationResult(detailedEstimation, input);
    } catch (e) {
      console.error('⚠️ Estimation generation failed:', e instanceof Error ? e.message : String(e));
    }
  }
  
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'Bridge Design App';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  
  // ==================== GENERATE ALL SHEETS ====================
  // Ordering below matches the contract for the selected book variant.

  if (book === 'legacy-46') {
    // ---- Legacy 46-sheet order (source-workbook parity) ----
    await generateIndexSheet(workbook, enhancedInput);
    await generateInsertHydraulicsSheet(workbook, enhancedInput);
    await generateAffluxCalculationSheet(workbook, enhancedInput);
    await generateHydraulicsSheet(workbook, enhancedInput);
    await generateDeckAnchorageSheet(workbook, enhancedInput);
    await generateCrossSectionSheet(workbook, enhancedInput);
    await generateBedSlopeSheet(workbook, enhancedInput);
    await generateSBCSheet(workbook, enhancedInput);
    await generateStabilityCheckPierSheet(workbook, enhancedInput);
    await generateAbstractOfStressesSheet(workbook, enhancedInput);
    await generateSteelFlaredPierSheet(workbook, enhancedInput);
    await generateSteelInPierSheet(workbook, enhancedInput);
    await generateFootingDesignSheet(workbook, enhancedInput);
    await generateFootingStressDiagramSheet(workbook, enhancedInput);
    await generatePierCapLLSheet(workbook, enhancedInput);
    await generatePierCapSheet(workbook, enhancedInput);
    await generateLLOADSheet(workbook, enhancedInput);
    await generateLoadSummSheet(workbook, enhancedInput);
    await generateLLAbstractSheet(workbook, enhancedInput);
    await generateType1AbutmentDrawingSheet(workbook, enhancedInput);
    await generateType1StabilityCheckSheet(workbook, enhancedInput);
    await generateType1FootingDesignSheet(workbook, enhancedInput);
    await generateType1FootingStressSheet(workbook, enhancedInput);
    await generateType1SteelInAbutmentSheet(workbook, enhancedInput);
    await generateType1AbutmentCapSheet(workbook, enhancedInput);
    await generateType1DirtWallReinforcementSheet(workbook, enhancedInput);
    await generateType1DirtDirectLoadBMSheet(workbook, enhancedInput);
    await generateType1DirtLLBMSheet(workbook, enhancedInput);
    await generateC1AbutmentPlaceholderSheets(workbook, enhancedInput);
    await generateTechNoteSheet(workbook, enhancedInput);
    await generateInsertEstimateSheet(workbook, enhancedInput);
    await generateTechReportSheet(workbook, enhancedInput);
    await generateGeneralAbsSheet(workbook, enhancedInput);
    await generateAbstractSheet(workbook, enhancedInput);
    await generateBridgeMeasurementsSheet(workbook, enhancedInput);
  } else {
    // ===== Executive 56-sheet order (matches EXPECTED_SHEET_NAMES) =====

    // Sheet 1: INDEX
    await generateIndexSheet(workbook, enhancedInput);

    // ===== NEW ADMIN SHEETS =====
    // Sheet 2: DESIGN CRITERIA      (Batch A — IRC/IS standards & factors)
    await generateDesignCriteriaSheet(workbook, enhancedInput);

    // Sheet 3: INPUT DATA SUMMARY   (Batch A — tabulated ProjectInput)
    await generateInputDataSummarySheet(workbook, enhancedInput);

    // ===== HYDRAULICS & GEOTECH (sheets 4–10) =====
    await generateInsertHydraulicsSheet(workbook, enhancedInput);
    await generateAffluxCalculationSheet(workbook, enhancedInput);
    await generateHydraulicsSheet(workbook, enhancedInput);
    await generateDeckAnchorageSheet(workbook, enhancedInput);
    await generateCrossSectionSheet(workbook, enhancedInput);
    await generateBedSlopeSheet(workbook, enhancedInput);
    await generateSBCSheet(workbook, enhancedInput);

    // ===== NEW ENVIRONMENTAL SHEETS =====
    await generateSeismicAnalysisSheet(workbook, enhancedInput);
    await generateWindLoadSheet(workbook, enhancedInput);

    // ==================== PIER DESIGN SECTION (sheets 13–23) ====================
    await generateStabilityCheckPierSheet(workbook, enhancedInput);
    await generateAbstractOfStressesSheet(workbook, enhancedInput);
    await generateSteelFlaredPierSheet(workbook, enhancedInput);
    await generateSteelInPierSheet(workbook, enhancedInput);
    await generateFootingDesignSheet(workbook, enhancedInput);
    await generateFootingStressDiagramSheet(workbook, enhancedInput);
    await generatePierCapLLSheet(workbook, enhancedInput);
    await generatePierCapSheet(workbook, enhancedInput);
    await generateLLOADSheet(workbook, enhancedInput);
    await generateLoadSummSheet(workbook, enhancedInput);
    await generateLLAbstractSheet(workbook, enhancedInput);

    // ===== NEW SUPERSTRUCTURE SHEETS =====
    await generateBearingDetailsSheet(workbook, enhancedInput);
    await generateExpansionJointSheet(workbook, enhancedInput);
    await generateApproachSlabSheet(workbook, enhancedInput);

    // ==================== TYPE1 ABUTMENT SECTION (sheets 27–35) ====================
    await generateType1AbutmentDrawingSheet(workbook, enhancedInput);
    await generateType1StabilityCheckSheet(workbook, enhancedInput);
    await generateType1FootingDesignSheet(workbook, enhancedInput);
    await generateType1FootingStressSheet(workbook, enhancedInput);
    await generateType1SteelInAbutmentSheet(workbook, enhancedInput);
    await generateType1AbutmentCapSheet(workbook, enhancedInput);
    await generateType1DirtWallReinforcementSheet(workbook, enhancedInput);
    await generateType1DirtDirectLoadBMSheet(workbook, enhancedInput);
    await generateType1DirtLLBMSheet(workbook, enhancedInput);

    // ==================== C1 ABUTMENT SECTION (sheets 36–47) ====================
    await generateC1AbutmentPlaceholderSheets(workbook, enhancedInput);

    // ==================== ESTIMATION SECTION (sheets 48–52) ====================
    await generateTechNoteSheet(workbook, enhancedInput);
    await generateInsertEstimateSheet(workbook, enhancedInput);
    await generateTechReportSheet(workbook, enhancedInput);
    await generateGeneralAbsSheet(workbook, enhancedInput);
    await generateAbstractSheet(workbook, enhancedInput);
    await generateBridgeMeasurementsSheet(workbook, enhancedInput);

    // ===== NEW QA & ADMIN SHEETS (53–56) =====
    await generateComplianceChecklistSheet(workbook, enhancedInput);
    await generateServiceabilitySheet(workbook, enhancedInput);
    await generateRevisionSheet(workbook, enhancedInput);
  }

  // ---- Post-processing (applies to BOTH book variants) ----

  // Add a detailed engineering story block to every sheet so reviewers get
  // context, assumptions, governing values, and decision trace in-place.
  applyDetailedNarrativeToAllSheets(workbook, enhancedInput);

  // Per-sheet print setup per PRESENTATION-SPEC.md orientation table
  // (A4, 15 mm margins; landscape list lives in sheet-contract.ts).
  applyWorkbookPageSetup(workbook);

  // Lock all formula-backed cells so reviewers cannot accidentally overwrite
  // a calculated result; static/text cells remain editable for downstream tweaks.
  await applyWorkbookProtection(workbook);
  
  console.log('✅ Excel generation complete!');
  console.log(`Total sheets: ${workbook.worksheets.length}/${sheetN}`);
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Save Excel to file
 */
export async function saveExcelToFile(input: ProjectInput, filename: string): Promise<void> {
  const buffer = await generateCompleteExcel(input);
  const fs = await import('fs');
  fs.writeFileSync(filename, buffer);
  console.log(`✅ Saved to: ${filename}`);
}

// Export main function
export default generateCompleteExcel;


function applyDetailedNarrativeToAllSheets(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): void {
  for (const ws of workbook.worksheets) {
    const startRow = ws.rowCount + 2;
    const lines = getSheetNarrativeParagraphs(ws.name, input);

    for (let i = 0; i < lines.length; i += 1) {
      assertNarrativeHasNoPlaceholders(lines[i], `${ws.name} row ${startRow + i}`);
      const cell = ws.getCell(startRow + i, 1);
      cell.value = lines[i];
      cell.font = { italic: i > 0, size: i === 0 ? 11 : 10, color: { argb: 'FF1F4E79' } };
      cell.alignment = { wrapText: true, vertical: 'top' };
    }
  }
}

// ExcelJS pageSetup margins are in inches; 15 mm = 15/25.4 in.
const PAGE_MARGIN_IN = 15 / 25.4; // A4 with 15 mm margins all around

function applyWorkbookPageSetup(workbook: ExcelJS.Workbook): void {
  workbook.worksheets.forEach((ws) => {
    ws.pageSetup = {
      orientation: isLandscapeSheet(ws.name) ? 'landscape' : 'portrait',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: PAGE_MARGIN_IN,
        right: PAGE_MARGIN_IN,
        top: PAGE_MARGIN_IN,
        bottom: PAGE_MARGIN_IN,
        header: 0.3,
        footer: 0.3,
      },
    };
  });
}

async function applyWorkbookProtection(workbook: ExcelJS.Workbook): Promise<void> {
  const protections: Promise<void>[] = [];
  workbook.worksheets.forEach((ws) => {
    let hasLockedFormula = false;
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        const v = cell.value;
        const isFormula =
          v !== null &&
          v !== undefined &&
          typeof v === 'object' &&
          'formula' in (v as object);
        if (isFormula) {
          cell.protection = { locked: true };
          hasLockedFormula = true;
        } else {
          cell.protection = { locked: false };
        }
      });
    });
    if (hasLockedFormula) {
      // ExcelJS protects via `ws.protect(password, options)`; an empty password
      // means no unlock credential is stored. The option flags are "allow"
      // semantics, so `formatCells: false` blocks reformatting.
      protections.push(
        ws.protect('', {
          selectLockedCells: true,
          selectUnlockedCells: true,
          formatCells: false,
          formatColumns: false,
          formatRows: false,
          insertColumns: false,
          insertRows: false,
          insertHyperlinks: false,
          deleteColumns: false,
          deleteRows: false,
          sort: false,
          autoFilter: false,
          pivotTables: false,
        }),
      );
    }
  });
  await Promise.all(protections);
}
