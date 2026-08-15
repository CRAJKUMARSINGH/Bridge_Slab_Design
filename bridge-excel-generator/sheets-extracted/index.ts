/**
 * MASTER INDEX - All 46 Sheets
 * Auto-generated from FINAL_RESULT.xls
 */

import ExcelJS from 'exceljs';
import { EnhancedProjectInput } from '../types';

import { generateINDEXSheet } from './01-index';
import { generateINSERTHYDRAULICSSheet } from './02-insert--hydraulics';
import { generateaffluxcalculationSheet } from './03-afflux-calculation';
import { generateHYDRAULICSSheet } from './04-hydraulics';
import { generateDeckAnchorageSheet } from './05-deck-anchorage';
import { generateCROSSSECTIONSheet } from './06-cross-section';
import { generateBedSlopeSheet } from './07-bed-slope';
import { generateSBCSheet } from './08-sbc';
import { generateSTABILITYCHECKFORPIERSheet } from './09-stability-check-for-pier';
import { generateabstractofstressesSheet } from './10-abstract-of-stresses';
import { generateSTEELINFLAREDPIERBASESheet } from './11-steel-in-flared--pier-base-';
import { generateSTEELINPIERSheet } from './12-steel-in-pier';
import { generateFOOTINGDESIGNSheet } from './13-footing-design';
import { generateFootingSTRESSDIAGRAMSheet } from './14-footing-stress-diagram';
import { generatePierCapLLtrackedvehicleSheet } from './15-pier-cap-ll-tracked-vehicle';
import { generatePierCapSheet } from './16-pier-cap';
import { generateLLOADSheet } from './17-lload';
import { generateloadsummSheet } from './18-loadsumm-';
import { generateLLABSTRACTSheet } from './19-ll-abstract';
import { generateTYPE1AbutMENTDrawingSheet } from './20-type1-abutment-drawing';
import { generateTYPE1STABILITYCHECKABUTMENTSheet } from './21-type1-stability-check-abutment';
import { generateTYPE1ABUTMENTFOOTINGDESIGNSheet } from './22-type1-abutment-footing-design';
import { generateTYPE1AbutFootingSTRESSSheet } from './23-type1--abut-footing-stress';
import { generateTYPE1STEELINABUTMENTSheet } from './24-type1-steel-in-abutment';
import { generateTYPE1AbutmentCapSheet } from './25-type1-abutment-cap';
import { generateTYPE1DIRTWALLREINFORCEMENTSheet } from './26-type1-dirt-wall-reinforcement';
import { generateTYPE1DIRTDirectLoadBMSheet } from './27-type1-dirt-directload-bm';
import { generateTYPE1DIRTLLBMSheet } from './28-type1-dirt-ll-bm';
import { generateTechNoteSheet } from './29-technote';
import { generateINSERTC1ABUTSheet } from './30-insert-c1-abut';
import { generateC1AbutMENTDrawingSheet } from './31-c1-abutment-drawing';
import { generateC1STABILITYCHECKABUTMENTSheet } from './32-c1-stability-check-abutment';
import { generateC1ABUTMENTFOOTINGDESIGNSheet } from './33-c1-abutment-footing-design';
import { generateC1AbutFootingSTRESSDIAGRAMSheet } from './34-c1-abut-footing-stress-diagram';
import { generateCANRETURNFOOTINGDESIGNSheet } from './35-can-return-footing-design';
import { generateSTEELINCANTABUTMENTSheet } from './36-steel-in-cant-abutment';
import { generateSTEELINCANTRETURNSSheet } from './37-steel-in-cant-returns';
import { generateC1AbutmentCapSheet } from './38-c1-abutment-cap';
import { generateC1DIRTWALLREINFORCEMENTSheet } from './39-c1-dirt-wall-reinforcement';
import { generateC1DIRTDirectLoadBMSheet } from './40-c1-dirt-directload-bm';
import { generateC1DIRTLLBMSheet } from './41-c1-dirt-ll-bm';
import { generateINSERTESTIMATESheet } from './42-insert-estimate';
import { generateTechReportSheet } from './43-tech-report';
import { generateGeneralAbsSheet } from './44-general-abs--';
import { generateAbstractSheet } from './45-abstract';
import { generateBridgemeasurementsSheet } from './46-bridge-measurements';

export async function generateAll46Sheets(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  console.log('🚀 Generating all 46 sheets...');
  
  await generateINDEXSheet(workbook, input);
  await generateINSERTHYDRAULICSSheet(workbook, input);
  await generateaffluxcalculationSheet(workbook, input);
  await generateHYDRAULICSSheet(workbook, input);
  await generateDeckAnchorageSheet(workbook, input);
  await generateCROSSSECTIONSheet(workbook, input);
  await generateBedSlopeSheet(workbook, input);
  await generateSBCSheet(workbook, input);
  await generateSTABILITYCHECKFORPIERSheet(workbook, input);
  await generateabstractofstressesSheet(workbook, input);
  await generateSTEELINFLAREDPIERBASESheet(workbook, input);
  await generateSTEELINPIERSheet(workbook, input);
  await generateFOOTINGDESIGNSheet(workbook, input);
  await generateFootingSTRESSDIAGRAMSheet(workbook, input);
  await generatePierCapLLtrackedvehicleSheet(workbook, input);
  await generatePierCapSheet(workbook, input);
  await generateLLOADSheet(workbook, input);
  await generateloadsummSheet(workbook, input);
  await generateLLABSTRACTSheet(workbook, input);
  await generateTYPE1AbutMENTDrawingSheet(workbook, input);
  await generateTYPE1STABILITYCHECKABUTMENTSheet(workbook, input);
  await generateTYPE1ABUTMENTFOOTINGDESIGNSheet(workbook, input);
  await generateTYPE1AbutFootingSTRESSSheet(workbook, input);
  await generateTYPE1STEELINABUTMENTSheet(workbook, input);
  await generateTYPE1AbutmentCapSheet(workbook, input);
  await generateTYPE1DIRTWALLREINFORCEMENTSheet(workbook, input);
  await generateTYPE1DIRTDirectLoadBMSheet(workbook, input);
  await generateTYPE1DIRTLLBMSheet(workbook, input);
  await generateTechNoteSheet(workbook, input);
  await generateINSERTC1ABUTSheet(workbook, input);
  await generateC1AbutMENTDrawingSheet(workbook, input);
  await generateC1STABILITYCHECKABUTMENTSheet(workbook, input);
  await generateC1ABUTMENTFOOTINGDESIGNSheet(workbook, input);
  await generateC1AbutFootingSTRESSDIAGRAMSheet(workbook, input);
  await generateCANRETURNFOOTINGDESIGNSheet(workbook, input);
  await generateSTEELINCANTABUTMENTSheet(workbook, input);
  await generateSTEELINCANTRETURNSSheet(workbook, input);
  await generateC1AbutmentCapSheet(workbook, input);
  await generateC1DIRTWALLREINFORCEMENTSheet(workbook, input);
  await generateC1DIRTDirectLoadBMSheet(workbook, input);
  await generateC1DIRTLLBMSheet(workbook, input);
  await generateINSERTESTIMATESheet(workbook, input);
  await generateTechReportSheet(workbook, input);
  await generateGeneralAbsSheet(workbook, input);
  await generateAbstractSheet(workbook, input);
  await generateBridgemeasurementsSheet(workbook, input);
  
  console.log('✅ All 46 sheets generated!');
}
