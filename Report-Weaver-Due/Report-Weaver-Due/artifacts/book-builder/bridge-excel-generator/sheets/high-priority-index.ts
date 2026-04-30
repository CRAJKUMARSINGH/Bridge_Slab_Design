/**
 * MASTER INDEX - HIGH PRIORITY SHEETS
 * Auto-generated implementation
 */

import ExcelJS from 'exceljs';
import { EnhancedProjectInput } from '../types';

import { generateSTABILITYCHECKFORPIERSheet } from './stability-check-for-pier-generated';
import { generateLLOADSheet } from './lload-generated';
import { generateTYPE1STABILITYCHECKABUTMENTSheet } from './type1-stability-check-abutment-generated';
import { generateSTEELINPIERSheet } from './steel-in-pier-generated';
import { generateHYDRAULICSSheet } from './hydraulics-generated';
import { generateCROSSSECTIONSheet } from './cross-section-generated';
import { generateaffluxcalculationSheet } from './afflux-calculation-generated';
import { generatePierCapSheet } from './pier-cap-generated';
import { generateloadsummSheet } from './loadsumm-generated';
import { generateTYPE1AbutmentCapSheet } from './type1-abutment-cap-generated';

export async function generateAllHighPrioritySheets(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  console.log('🚀 Generating all high-priority sheets...');
  
  await generateSTABILITYCHECKFORPIERSheet(workbook, input);
  await generateLLOADSheet(workbook, input);
  await generateTYPE1STABILITYCHECKABUTMENTSheet(workbook, input);
  await generateSTEELINPIERSheet(workbook, input);
  await generateHYDRAULICSSheet(workbook, input);
  await generateCROSSSECTIONSheet(workbook, input);
  await generateaffluxcalculationSheet(workbook, input);
  await generatePierCapSheet(workbook, input);
  await generateloadsummSheet(workbook, input);
  await generateTYPE1AbutmentCapSheet(workbook, input);
  
  console.log('✅ All high-priority sheets generated!');
}

export const HIGH_PRIORITY_SHEET_COUNT = 10;
export const TOTAL_FORMULAS = 1825;
