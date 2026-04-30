/**
 * MAIN EXCEL GENERATOR — full design workbook (reference layout + INPUT-* templates).
 *
 * Target parity with the office reference workbook: same sheet names, row/column layout, labels,
 * and formula *text* where applicable; only input-driven **values** (and cached formula results) may
 * change when variables change. Not every cell is at that fidelity yet — extend golden checks
 * (e.g. scripts/verify-kherwara-excel-golden.ts) sheet-by-sheet as generators are tightened.
 */

import ExcelJS from 'exceljs';
import { ProjectInput, EnhancedProjectInput } from './types';
import calculateCompleteDesign from './design-engine';

// Import all sheet generators
import { generateCoverPageSheet } from './sheets/00-cover-page';
import { generateDrawingsSlotsSheet } from './sheets/00-drawings-slots';
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
  generateLoadSummSheet
} from './sheets/12-18-pier-remaining';
import { generateLLOADSheet, LloadSummaryRefs } from './sheets/17-lload';
import { generateType1StabilityCheckAbutmentSheet } from './sheets/21-type1-stability-check-abutment';
import { generateC1StabilityCheckAbutmentSheet } from './sheets/22-c1-stability-check-abutment';
import { generateEstimationSheet } from './sheets/46-estimation';
import { generateInputTemplateHydraulicsSheet } from './sheets/00-input-template-hydraulics';
import { generateInputTemplatePierStabilitySheet } from './sheets/00-input-template-pier-stability';
import { generateInputTemplateAbutmentStabilitySheet } from './sheets/00-input-template-abutment-stability';
import {
  generateInsertType1AbutSheet,
  generateType1AbutmentDrawingSheet,
  generateType1StabilityCheckSheet,
  generateType1FootingDesignSheet,
  generateType1FootingStressSheet,
  generateType1SteelInAbutmentSheet,
  generateType1AbutmentCapSheet,
  generateType1DirtWallReinforcementSheet,
  generateType1DirtDirectLoadBMSheet,
  generateType1DirtLLBMSheet,
  generateType1ReturnWallStabilitySheet,
  generateType1ReturnWallReinforcementSheet
} from './sheets/19-28-abutment-type1';
import {
  generateTechNoteSheet,
  generateInsertEstimateSheet,
  generateTechReportSheet,
  generateGeneralAbsSheet,
  generateAbstractSheet,
  generateBridgeMeasurementsSheet,
  generateC1AbutmentAllSheets
} from './sheets/29-46-estimation';
import { generateNarrativeReportSheet } from './sheets/00-narrative-report';

/**
 * Generate complete Excel workbook (all design sheets + input templates)
 */
export async function generateCompleteExcel(
  input: ProjectInput,
  options: { model?: 'model-a' | 'model-b' } = {}
): Promise<Buffer> {
  const model = options.model ?? 'model-b';
  console.log(`🚀 Starting Excel generation (${model === 'model-a' ? 'Industrial' : 'Premium'})...`);
  console.log(`Project: ${input.projectName}`);
  console.log(`Generating workbook (all sheets) with real formulas...`);
  
  // Run design engine to calculate all results
  const designResults = calculateCompleteDesign(input);
  
  // Create enhanced input with calculated results
  const enhancedInput: EnhancedProjectInput = {
    ...input,
    hydraulics: designResults.hydraulics,
    pier: designResults.pier,
    abutmentType1: designResults.abutmentType1,
    abutmentC1: designResults.abutmentC1,
    estimation: designResults.estimation,   // ← linked
    pierDesign: {
      spanCC: input.spanLength
    }
  };
  
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'Bridge Design App';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  
  // ==================== GENERATE ALL SHEETS ====================

  // Cover (first tab) — title block + Bridge GAD drawing workflow note
  await generateCoverPageSheet(workbook, enhancedInput);
  
  // ==================== INPUT TEMPLATE SHEETS ====================
  
  // Input Template 1: Hydraulics & Afflux Parameters (returns cell refs for ESTIMATION links)
  const inputHydraulicsRefs = await generateInputTemplateHydraulicsSheet(workbook, enhancedInput);
  
  // Input Template 2: Pier Stability Parameters  
  await generateInputTemplatePierStabilitySheet(workbook, enhancedInput);
  
  // Input Template 3: Abutment Stability Parameters
  await generateInputTemplateAbutmentStabilitySheet(workbook, enhancedInput);
  
  // INDEX (table of contents; includes COVER + DRAWINGS-SLOTS rows)
  await generateIndexSheet(workbook, enhancedInput);

  // Drawing package slots — Bridge GAD multi-sheet export register + future expansion rows
  await generateDrawingsSlotsSheet(workbook, enhancedInput);
  
  // Sheet 2: INSERT- HYDRAULICS
  await generateInsertHydraulicsSheet(workbook, enhancedInput);
  
  // Sheet 3: afflux calculation (formulas =HYDRAULICS!F/G on TOTAL row — see getHydraulicsTotalRow)
  await generateAffluxCalculationSheet(workbook, enhancedInput);

  // Sheet 4: HYDRAULICS
  await generateHydraulicsSheet(workbook, enhancedInput);
  
  // Sheet 5: Deck Anchorage
  await generateDeckAnchorageSheet(workbook, enhancedInput);
  
  // Sheet 6: CROSS SECTION
  await generateCrossSectionSheet(workbook, enhancedInput);
  
  // Sheet 7: Bed Slope
  await generateBedSlopeSheet(workbook, enhancedInput);
  
  // Sheet 8: SBC
  await generateSBCSheet(workbook, enhancedInput);
  
  // ==================== PIER DESIGN SECTION ====================
  
  // Sheet 9: STABILITY CHECK FOR PIER
  const pierRefs = await generateStabilityCheckPierSheet(workbook, enhancedInput);
  
  // Sheet 10: abstract of stresses
  await generateAbstractOfStressesSheet(workbook, enhancedInput);
  
  // Sheet 11: STEEL IN FLARED PIER BASE
  await generateSteelFlaredPierSheet(workbook, enhancedInput);
  
  // Sheet 12: STEEL IN PIER
  await generateSteelInPierSheet(workbook, enhancedInput);
  
  // Sheet 13: FOOTING DESIGN
  await generateFootingDesignSheet(workbook, enhancedInput);
  
  // Sheet 14: Footing STRESS DIAGRAM
  await generateFootingStressDiagramSheet(workbook, enhancedInput);
  
  // Sheet 15: Pier Cap LL tracked vehicle
  await generatePierCapLLSheet(workbook, enhancedInput);
  
  // Sheet 16: Pier Cap
  await generatePierCapSheet(workbook, enhancedInput);
  
  // Sheet 17: LLOAD (returns cell rows for loadsumm links)
  const lloadSummaryRefs = await generateLLOADSheet(workbook, enhancedInput);

  // Sheet 18: loadsumm
  await generateLoadSummSheet(workbook, enhancedInput, lloadSummaryRefs);
  
  // ==================== TYPE1 ABUTMENT SECTION ====================
  
  // Sheet 19: INSERT TYPE1-ABUT
  await generateInsertType1AbutSheet(workbook, enhancedInput);
  
  // Sheet 20: TYPE1-AbutMENT Drawing
  await generateType1AbutmentDrawingSheet(workbook, enhancedInput);
  
  // Sheet 21: TYPE1-STABILITY CHECK ABUTMENT
  await generateType1StabilityCheckAbutmentSheet(workbook, enhancedInput, lloadSummaryRefs, pierRefs);
  
  // Sheet 22: TYPE1-ABUTMENT FOOTING DESIGN
  await generateType1FootingDesignSheet(workbook, enhancedInput, lloadSummaryRefs);
  
  // Sheet 23: TYPE1- Abut Footing STRESS
  await generateType1FootingStressSheet(workbook, enhancedInput);
  
  // Sheet 24: TYPE1-STEEL IN ABUTMENT
  await generateType1SteelInAbutmentSheet(workbook, enhancedInput);
  
  // Sheet 25: TYPE1-Abutment Cap
  await generateType1AbutmentCapSheet(workbook, enhancedInput, lloadSummaryRefs);
  
  // Sheet 26: TYPE1-DIRT WALL REINFORCEMENT
  await generateType1DirtWallReinforcementSheet(workbook, enhancedInput);
  
  // Sheet 27: TYPE1-DIRT DirectLoad_BM
  await generateType1DirtDirectLoadBMSheet(workbook, enhancedInput);
  
  // Sheet 28: TYPE1-DIRT LL_BM
  await generateType1DirtLLBMSheet(workbook, enhancedInput);

  // Sheet 29: TYPE1-RETURN WALL STABILITY
  await generateType1ReturnWallStabilitySheet(workbook, enhancedInput);

  // Sheet 30: TYPE1-RETURN WALL REINFORCEMENT
  await generateType1ReturnWallReinforcementSheet(workbook, enhancedInput);
  
  // ==================== ESTIMATION SECTION ====================
  
  // Sheet 31: TechNote
  await generateTechNoteSheet(workbook, enhancedInput);
  
  // Sheet 32: INSERT ESTIMATE
  await generateInsertEstimateSheet(workbook, enhancedInput);
  
  // Sheet 33: Tech Report
  await generateTechReportSheet(workbook, enhancedInput);

  // Sheet 34: ESTIMATION (BOQ) — before General Abs. / Abstract so cross-sheet =ESTIMATION!F… refs resolve
  await generateEstimationSheet(workbook, enhancedInput, inputHydraulicsRefs);
  
  // Sheet 35: General Abs.
  await generateGeneralAbsSheet(workbook, enhancedInput);
  
  // Sheet 36: Abstract
  await generateAbstractSheet(workbook, enhancedInput);
  
  // Sheet 37: Bridge measurements
  await generateBridgeMeasurementsSheet(workbook, enhancedInput);
  
  // Sheets 38-49: C1 Abutment — full implementations
  await generateC1AbutmentAllSheets(workbook, enhancedInput, lloadSummaryRefs, pierRefs);
  
  // Sheet 51+: Comprehensive Narrative Report (Optional for Model A)
  if (model === 'model-b') {
    await generateNarrativeReportSheet(workbook, enhancedInput);
  }
  
  console.log('✅ Excel generation complete!');
  console.log(`Total worksheets: ${workbook.worksheets.length}`);
  
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
