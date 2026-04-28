/**
 * MAIN EXCEL GENERATOR
 * Generates all 46 sheets matching FINAL_RESULT.xls
 */

import ExcelJS from 'exceljs';
import { ProjectInput, EnhancedProjectInput } from './types';
import calculateCompleteDesign from './design-engine';

// Import all sheet generators
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
  generateInsertType1AbutSheet,
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
import {
  generateTechNoteSheet,
  generateInsertEstimateSheet,
  generateTechReportSheet,
  generateGeneralAbsSheet,
  generateAbstractSheet,
  generateBridgeMeasurementsSheet,
  generateC1AbutmentPlaceholderSheets
} from './sheets/29-46-estimation';

/**
 * Generate complete Excel workbook with all 46 sheets
 */
export async function generateCompleteExcel(
  input: ProjectInput,
  _options?: { model?: 'model-a' | 'model-b' }
): Promise<Buffer> {
  console.log('🚀 Starting Excel generation...');
  console.log(`Project: ${input.projectName}`);
  console.log(`Generating 46 sheets with real formulas...`);
  
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
  
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'Bridge Design App';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  
  // ==================== GENERATE ALL SHEETS ====================
  
  // Sheet 1: INDEX
  await generateIndexSheet(workbook, enhancedInput);
  
  // Sheet 2: INSERT- HYDRAULICS
  await generateInsertHydraulicsSheet(workbook, enhancedInput);
  
  // Sheet 3: afflux calculation
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
  await generateStabilityCheckPierSheet(workbook, enhancedInput);
  
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
  
  // Sheet 17: LLOAD
  await generateLLOADSheet(workbook, enhancedInput);
  
  // Sheet 18: loadsumm
  await generateLoadSummSheet(workbook, enhancedInput);
  
  // ==================== TYPE1 ABUTMENT SECTION ====================
  
  // Sheet 19: INSERT TYPE1-ABUT
  await generateInsertType1AbutSheet(workbook, enhancedInput);
  
  // Sheet 20: TYPE1-AbutMENT Drawing
  await generateType1AbutmentDrawingSheet(workbook, enhancedInput);
  
  // Sheet 21: TYPE1-STABILITY CHECK ABUTMENT
  await generateType1StabilityCheckSheet(workbook, enhancedInput);
  
  // Sheet 22: TYPE1-ABUTMENT FOOTING DESIGN
  await generateType1FootingDesignSheet(workbook, enhancedInput);
  
  // Sheet 23: TYPE1- Abut Footing STRESS
  await generateType1FootingStressSheet(workbook, enhancedInput);
  
  // Sheet 24: TYPE1-STEEL IN ABUTMENT
  await generateType1SteelInAbutmentSheet(workbook, enhancedInput);
  
  // Sheet 25: TYPE1-Abutment Cap
  await generateType1AbutmentCapSheet(workbook, enhancedInput);
  
  // Sheet 26: TYPE1-DIRT WALL REINFORCEMENT
  await generateType1DirtWallReinforcementSheet(workbook, enhancedInput);
  
  // Sheet 27: TYPE1-DIRT DirectLoad_BM
  await generateType1DirtDirectLoadBMSheet(workbook, enhancedInput);
  
  // Sheet 28: TYPE1-DIRT LL_BM
  await generateType1DirtLLBMSheet(workbook, enhancedInput);
  
  // ==================== ESTIMATION SECTION ====================
  
  // Sheet 29: TechNote
  await generateTechNoteSheet(workbook, enhancedInput);
  
  // Sheet 30: INSERT ESTIMATE
  await generateInsertEstimateSheet(workbook, enhancedInput);
  
  // Sheet 31: Tech Report
  await generateTechReportSheet(workbook, enhancedInput);
  
  // Sheet 32: General Abs.
  await generateGeneralAbsSheet(workbook, enhancedInput);
  
  // Sheet 33: Abstract
  await generateAbstractSheet(workbook, enhancedInput);
  
  // Sheet 34: Bridge measurements
  await generateBridgeMeasurementsSheet(workbook, enhancedInput);
  
  // Sheets 35-46: C1 Abutment (Placeholder implementations)
  await generateC1AbutmentPlaceholderSheets(workbook, enhancedInput);
  
  console.log('✅ Excel generation complete!');
  console.log(`Total sheets: ${workbook.worksheets.length}/46`);
  
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
