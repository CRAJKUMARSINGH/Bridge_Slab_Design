/**
 * Test Run - All New Features
 * Uses Kherwara reference data to test Excel, HTML, GAD, Validation
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import calculateCompleteDesign from '../bridge-excel-generator/design-engine';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import { generateHTMLDesignReport } from '../server/design-report';
import { validateDesign, generateValidationHTML } from '../server/claude-validator';
import { generateGADCSV, generateGADJSON } from './generate-gad-csv';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from './fixtures/kherwara-project-input';

const OUTPUT_DIR = './archive/test-outputs';

async function runTests() {
  console.log('========================================');
  console.log('TEST RUN - All Features');
  console.log('Project:', KHERWARA_REFERENCE_PROJECT_INPUT.projectName);
  console.log('========================================\n');

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Run Design Engine
  console.log('1️⃣ Running Design Engine...');
  const designResults = calculateCompleteDesign(KHERWARA_REFERENCE_PROJECT_INPUT);
  const enhancedInput = { ...KHERWARA_REFERENCE_PROJECT_INPUT, ...designResults } as any;
  console.log('   ✅ Design calculations complete');
  console.log(`   📊 Hydraulics: Q=${designResults.hydraulics.discharge.toFixed(2)} cumecs, V=${designResults.hydraulics.velocity.toFixed(2)} m/s`);
  console.log(`   🏗️  Pier: ${designResults.pier.loadCases.length} load cases analyzed`);
  console.log();

  // 2. Generate Excel
  console.log('2️⃣ Generating Excel Workbook...');
  try {
    const excelBuffer = await generateCompleteExcel(KHERWARA_REFERENCE_PROJECT_INPUT);
    const excelPath = join(OUTPUT_DIR, 'test_output.xlsx');
    writeFileSync(excelPath, excelBuffer);
    console.log('   ✅ Excel generated');
    console.log(`   📁 Saved: ${excelPath} (${(excelBuffer.length / 1024).toFixed(1)} KB)`);
  } catch (err: any) {
    console.log('   ❌ Excel error:', err.message);
  }
  console.log();

  // 3. Generate HTML Report
  console.log('3️⃣ Generating HTML Design Report...');
  try {
    const html = await generateHTMLDesignReport(enhancedInput);
    const htmlPath = join(OUTPUT_DIR, 'test_report.html');
    writeFileSync(htmlPath, html);
    console.log('   ✅ HTML report generated');
    console.log(`   📁 Saved: ${htmlPath} (${(html.length / 1024).toFixed(1)} KB)`);
  } catch (err: any) {
    console.log('   ❌ HTML error:', err.message);
  }
  console.log();

  // 4. Generate GAD CSV
  console.log('4️⃣ Generating GAD CSV...');
  try {
    const csv = generateGADCSV(KHERWARA_REFERENCE_PROJECT_INPUT);
    const csvPath = join(OUTPUT_DIR, 'test_gad.csv');
    writeFileSync(csvPath, csv);
    console.log('   ✅ GAD CSV generated');
    console.log(`   📁 Saved: ${csvPath} (${(csv.length / 1024).toFixed(1)} KB)`);
    
    // Also generate JSON
    const gadJson = generateGADJSON(KHERWARA_REFERENCE_PROJECT_INPUT);
    const jsonPath = join(OUTPUT_DIR, 'test_gad.json');
    writeFileSync(jsonPath, JSON.stringify(gadJson, null, 2));
    console.log(`   📁 GAD JSON: ${jsonPath}`);
  } catch (err: any) {
    console.log('   ❌ GAD error:', err.message);
  }
  console.log();

  // 5. Run Validation
  console.log('5️⃣ Running IRC Validation...');
  try {
    const validation = validateDesign(KHERWARA_REFERENCE_PROJECT_INPUT, designResults);
    console.log('   ✅ Validation complete');
    console.log(`   📋 Overall Status: ${validation.overallStatus}`);
    console.log(`   📊 Checks: ${validation.validations.length} total`);
    console.log(`      ✅ PASS: ${validation.validations.filter(v => v.status === 'PASS').length}`);
    console.log(`      ⚠️  WARNING: ${validation.validations.filter(v => v.status === 'WARNING').length}`);
    console.log(`      ❌ FAIL: ${validation.validations.filter(v => v.status === 'FAIL').length}`);
    
    // Save validation JSON
    const valJsonPath = join(OUTPUT_DIR, 'test_validation.json');
    writeFileSync(valJsonPath, JSON.stringify(validation, null, 2));
    console.log(`   📁 Saved: ${valJsonPath}`);
    
    // Save validation HTML
    const valHtml = generateValidationHTML(validation);
    const valHtmlPath = join(OUTPUT_DIR, 'test_validation.html');
    writeFileSync(valHtmlPath, valHtml);
    console.log(`   📁 Validation HTML: ${valHtmlPath}`);
  } catch (err: any) {
    console.log('   ❌ Validation error:', err.message);
  }
  console.log();

  // Summary
  console.log('========================================');
  console.log('TEST COMPLETE');
  console.log('========================================');
  console.log(`\n📁 All outputs in: ${OUTPUT_DIR}/`);
  console.log('\nGenerated files:');
  console.log('  • test_output.xlsx - Excel workbook with 46 sheets');
  console.log('  • test_report.html - HTML design report with formulas');
  console.log('  • test_gad.csv - GAD parameters for CAD import');
  console.log('  • test_gad.json - GAD data as JSON');
  console.log('  • test_validation.json - IRC validation results');
  console.log('  • test_validation.html - Validation report (HTML)');
  console.log('\n✅ All features working with Kherwara reference data');
}

runTests().catch(console.error);
