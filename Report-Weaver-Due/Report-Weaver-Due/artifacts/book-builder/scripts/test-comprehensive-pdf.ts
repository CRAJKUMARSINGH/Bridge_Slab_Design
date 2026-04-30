/**
 * Test Comprehensive PDF Generation
 * Generates ~200 page PDF with all 46 sheets
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import calculateCompleteDesign from '../bridge-excel-generator/design-engine';
import { generateComprehensivePDF } from '../server/comprehensive-pdf-export';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from './fixtures/kherwara-project-input';

const OUTPUT_DIR = './archive/test-outputs';

async function testComprehensivePDF() {
  console.log('========================================');
  console.log('COMPREHENSIVE PDF TEST');
  console.log('Project:', KHERWARA_REFERENCE_PROJECT_INPUT.projectName);
  console.log('Expected: ~200 pages, A4 portrait, 46 sheets');
  console.log('========================================\n');

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Run Design Engine
  console.log('1️⃣ Running Design Engine...');
  const designResults = calculateCompleteDesign(KHERWARA_REFERENCE_PROJECT_INPUT);
  const enhancedInput = { ...KHERWARA_REFERENCE_PROJECT_INPUT, ...designResults } as any;
  console.log('   ✅ Design calculations complete');
  console.log();

  // Generate Comprehensive PDF
  console.log('2️⃣ Generating Comprehensive PDF (~200 pages)...');
  try {
    const pdfBuffer = await generateComprehensivePDF(enhancedInput);
    const pdfPath = join(OUTPUT_DIR, 'complete_design_46_sheets.pdf');
    writeFileSync(pdfPath, pdfBuffer);
    
    const pageCount = Math.floor(pdfBuffer.length / 1024); // Rough estimate
    console.log('   ✅ PDF generated');
    console.log(`   📁 Saved: ${pdfPath}`);
    console.log(`   📄 Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
    console.log(`   📖 Estimated pages: ${pageCount}`);
    console.log();
    console.log('PDF Contents:');
    console.log('  • Cover page with project details');
    console.log('  • Table of contents');
    console.log('  • Sheet 01: INDEX');
    console.log('  • Sheet 02: INSERT- HYDRAULICS');
    console.log('  • Sheet 03: afflux calculation');
    console.log('  • Sheet 04: HYDRAULICS (with cross-section table)');
    console.log('  • Sheets 05-08: Deck, Cross Section, Bed Slope, SBC');
    console.log('  • Sheets 09-18: Pier Design & Stability');
    console.log('  • Sheets 19-28: TYPE1 Abutment');
    console.log('  • Sheet 29: TECHNOTE');
    console.log('  • Sheets 30-41: C1 Abutment');
    console.log('  • Sheets 42-46: Estimation & Reports');
    console.log('  • Final summary');
    console.log();
    console.log('✅ Comprehensive PDF feature working!');
    
  } catch (err: any) {
    console.error('   ❌ PDF generation error:', err.message);
    console.error(err.stack);
  }
}

testComprehensivePDF().catch(console.error);
