import { getSheetNarrativeParagraphs } from '../bridge-excel-generator/narrative-engine';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from './fixtures/kherwara-project-input';
import calculateCompleteDesign from '../bridge-excel-generator/design-engine';

const SHEETS_TO_VERIFY = [
  'HYDRAULICS',
  'STABILITY CHECK FOR PIER',
  'TYPE1-STABILITY CHECK ABUTMENT',
  'TechNote',
  'Tech Report',
  'ESTIMATION',
];

function main(): void {
  const result = calculateCompleteDesign(KHERWARA_REFERENCE_PROJECT_INPUT);
  const enhancedInput = {
    ...KHERWARA_REFERENCE_PROJECT_INPUT,
    hydraulics: result.hydraulics,
    pier: result.pier,
    abutmentType1: result.abutmentType1,
    abutmentC1: result.abutmentC1,
    estimation: result.estimation,
  };

  let failed = false;

  for (const sheet of SHEETS_TO_VERIFY) {
    const paragraphs = getSheetNarrativeParagraphs(sheet, enhancedInput);
    const joined = paragraphs.join(' ');
    const hasStepLogic = /Step 1/i.test(joined) && /Step 2/i.test(joined);
    const hasDesignData = /Design data:/i.test(joined);
    const hasVerdict = /Hence O\.K\.|Hence NOT O\.K\./i.test(joined);
    const hasSpecificity = !/same engineering narrative chain/i.test(joined);

    if (paragraphs.length < 4 || !hasStepLogic || !hasDesignData || !hasVerdict || !hasSpecificity) {
      console.error(`FAIL ${sheet}`);
      console.error(`  paragraphs=${paragraphs.length}, designData=${hasDesignData}, steps=${hasStepLogic}, verdict=${hasVerdict}, specific=${hasSpecificity}`);
      failed = true;
      continue;
    }

    console.log(`OK ${sheet} (${paragraphs.length} paragraphs)`);
  }

  if (failed) process.exit(1);
}

main();
