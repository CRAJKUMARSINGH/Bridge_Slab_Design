/**
 * 15-User Test Runner — generates PDF, DXF, and Excel for each user scenario.
 * Saves all outputs to sample/merged-15-users/user_XX/
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:5000/api/design';
const OUTPUT_ROOT = path.join(process.cwd(), 'sample', 'merged-15-users');

// 15 distinct bridge user scenarios spanning varied geometries
const USER_SCENARIOS = [
  { id: '01', name: 'Kherwara Golden', spanLength: 10, numberOfSpans: 4, carriageWidth: 7.5, numberOfLanes: 2, totalLength: 40, numberOfPiers: 3, hfl: 285.5, bedLevel: 280.2, foundationLevel: 276.5, discharge: 900, manningN: 0.033, bedSlope: 1200, laceysSiltFactor: 1.5, pierWidth: 1.2, pierLength: 3.5, pierDepth: 4, pierBaseWidth: 2.5, pierBaseLength: 4.5, abutmentHeight: 8, abutmentWidth: 3.5, abutmentDepth: 5, sbc: 200, bridgeType: 'submersible' },
  { id: '02', name: 'Larathi Som River', spanLength: 10, numberOfSpans: 5, carriageWidth: 7.5, numberOfLanes: 2, totalLength: 50, numberOfPiers: 4, hfl: 290, bedLevel: 284, foundationLevel: 280, discharge: 1200, manningN: 0.035, bedSlope: 1100, laceysSiltFactor: 1.6, pierWidth: 1.2, pierLength: 3.5, pierDepth: 5, pierBaseWidth: 2.5, pierBaseLength: 4.5, abutmentHeight: 9, abutmentWidth: 3.5, abutmentDepth: 5, sbc: 180, bridgeType: 'submersible' },
  { id: '03', name: 'High Level Reference', spanLength: 12, numberOfSpans: 4, carriageWidth: 7.5, numberOfLanes: 2, totalLength: 48, numberOfPiers: 3, hfl: 288, bedLevel: 282, foundationLevel: 278, discharge: 650, manningN: 0.033, bedSlope: 1200, laceysSiltFactor: 1.5, pierWidth: 1.2, pierLength: 3.5, pierDepth: 5, pierBaseWidth: 2.5, pierBaseLength: 4.5, abutmentHeight: 8, abutmentWidth: 3.5, abutmentDepth: 5, sbc: 200, bridgeType: 'high-level' },
  { id: '04', name: 'Small Bridge 8m', spanLength: 8, numberOfSpans: 3, carriageWidth: 4.5, numberOfLanes: 2, totalLength: 24, numberOfPiers: 2, hfl: 282, bedLevel: 277, foundationLevel: 273, discharge: 85, manningN: 0.03, bedSlope: 1000, laceysSiltFactor: 1.5, pierWidth: 1.0, pierLength: 3.0, pierDepth: 3.5, pierBaseWidth: 2.0, pierBaseLength: 3.5, abutmentHeight: 6, abutmentWidth: 3, abutmentDepth: 4, sbc: 150, bridgeType: 'submersible' },
  { id: '05', name: 'Medium Bridge 12m', spanLength: 12, numberOfSpans: 4, carriageWidth: 7.5, numberOfLanes: 2, totalLength: 48, numberOfPiers: 3, hfl: 288, bedLevel: 282, foundationLevel: 278, discharge: 650, manningN: 0.033, bedSlope: 1200, laceysSiltFactor: 1.5, pierWidth: 1.2, pierLength: 3.5, pierDepth: 5, pierBaseWidth: 2.5, pierBaseLength: 4.5, abutmentHeight: 8, abutmentWidth: 3.5, abutmentDepth: 5, sbc: 200, bridgeType: 'submersible' },
  { id: '06', name: 'Large Bridge 16m', spanLength: 16, numberOfSpans: 5, carriageWidth: 10.5, numberOfLanes: 3, totalLength: 80, numberOfPiers: 4, hfl: 295, bedLevel: 288, foundationLevel: 283, discharge: 1800, manningN: 0.035, bedSlope: 1500, laceysSiltFactor: 1.65, pierWidth: 1.5, pierLength: 4.5, pierDepth: 6, pierBaseWidth: 3, pierBaseLength: 5.5, abutmentHeight: 10, abutmentWidth: 4.5, abutmentDepth: 6, sbc: 280, bridgeType: 'submersible' },
  { id: '07', name: 'Bedach River Bridge', spanLength: 10, numberOfSpans: 6, carriageWidth: 7.5, numberOfLanes: 2, totalLength: 60, numberOfPiers: 5, hfl: 292, bedLevel: 285, foundationLevel: 281, discharge: 1500, manningN: 0.035, bedSlope: 1300, laceysSiltFactor: 1.55, pierWidth: 1.3, pierLength: 4.0, pierDepth: 5, pierBaseWidth: 2.8, pierBaseLength: 5, abutmentHeight: 9, abutmentWidth: 4, abutmentDepth: 5.5, sbc: 220, bridgeType: 'submersible' },
  { id: '08', name: 'Ayad River Urban', spanLength: 10, numberOfSpans: 3, carriageWidth: 7.5, numberOfLanes: 2, totalLength: 30, numberOfPiers: 2, hfl: 283, bedLevel: 279, foundationLevel: 275, discharge: 450, manningN: 0.03, bedSlope: 900, laceysSiltFactor: 1.4, pierWidth: 1.1, pierLength: 3.2, pierDepth: 3.5, pierBaseWidth: 2.2, pierBaseLength: 4, abutmentHeight: 7, abutmentWidth: 3, abutmentDepth: 4, sbc: 180, bridgeType: 'submersible' },
  { id: '09', name: 'Sisarama Nalah', spanLength: 8, numberOfSpans: 4, carriageWidth: 4.5, numberOfLanes: 2, totalLength: 32, numberOfPiers: 3, hfl: 281, bedLevel: 276, foundationLevel: 272, discharge: 200, manningN: 0.032, bedSlope: 1000, laceysSiltFactor: 1.45, pierWidth: 1.0, pierLength: 3.0, pierDepth: 3.5, pierBaseWidth: 2, pierBaseLength: 3.5, abutmentHeight: 7, abutmentWidth: 3, abutmentDepth: 4, sbc: 160, bridgeType: 'submersible' },
  { id: '10', name: 'Kumbhalgarh Fort', spanLength: 10, numberOfSpans: 3, carriageWidth: 4.5, numberOfLanes: 2, totalLength: 30, numberOfPiers: 2, hfl: 284, bedLevel: 278, foundationLevel: 274, discharge: 350, manningN: 0.033, bedSlope: 1100, laceysSiltFactor: 1.5, pierWidth: 1.1, pierLength: 3.0, pierDepth: 4, pierBaseWidth: 2.2, pierBaseLength: 4, abutmentHeight: 8, abutmentWidth: 3.5, abutmentDepth: 5, sbc: 250, bridgeType: 'submersible' },
  { id: '11', name: 'Parwan River HLB', spanLength: 14, numberOfSpans: 5, carriageWidth: 7.5, numberOfLanes: 2, totalLength: 70, numberOfPiers: 4, hfl: 296, bedLevel: 289, foundationLevel: 284, discharge: 2200, manningN: 0.035, bedSlope: 1400, laceysSiltFactor: 1.7, pierWidth: 1.4, pierLength: 4, pierDepth: 6, pierBaseWidth: 3, pierBaseLength: 5.5, abutmentHeight: 10, abutmentWidth: 4.5, abutmentDepth: 6, sbc: 300, bridgeType: 'high-level' },
  { id: '12', name: 'Gumania Nalah Factory', spanLength: 8, numberOfSpans: 3, carriageWidth: 7.5, numberOfLanes: 2, totalLength: 24, numberOfPiers: 2, hfl: 280, bedLevel: 275, foundationLevel: 271, discharge: 120, manningN: 0.03, bedSlope: 800, laceysSiltFactor: 1.4, pierWidth: 1.0, pierLength: 3.0, pierDepth: 3.5, pierBaseWidth: 2, pierBaseLength: 3.5, abutmentHeight: 6, abutmentWidth: 3, abutmentDepth: 4, sbc: 150, bridgeType: 'submersible' },
  { id: '13', name: 'Sukanaka Wide Span', spanLength: 12, numberOfSpans: 6, carriageWidth: 10.5, numberOfLanes: 3, totalLength: 72, numberOfPiers: 5, hfl: 293, bedLevel: 286, foundationLevel: 281, discharge: 1600, manningN: 0.034, bedSlope: 1250, laceysSiltFactor: 1.6, pierWidth: 1.3, pierLength: 4, pierDepth: 5, pierBaseWidth: 2.8, pierBaseLength: 5, abutmentHeight: 9, abutmentWidth: 4, abutmentDepth: 5.5, sbc: 220, bridgeType: 'submersible' },
  { id: '14', name: 'Banas River Open Fdn', spanLength: 10, numberOfSpans: 8, carriageWidth: 7.5, numberOfLanes: 2, totalLength: 80, numberOfPiers: 7, hfl: 298, bedLevel: 290, foundationLevel: 285, discharge: 3500, manningN: 0.035, bedSlope: 1600, laceysSiltFactor: 1.8, pierWidth: 1.5, pierLength: 4.5, pierDepth: 6, pierBaseWidth: 3, pierBaseLength: 5.5, abutmentHeight: 10, abutmentWidth: 4.5, abutmentDepth: 6, sbc: 300, bridgeType: 'submersible' },
  { id: '15', name: 'Jakham Aqueduct Special', spanLength: 10, numberOfSpans: 4, carriageWidth: 7.5, numberOfLanes: 2, totalLength: 40, numberOfPiers: 3, hfl: 287, bedLevel: 281, foundationLevel: 277, discharge: 800, manningN: 0.033, bedSlope: 1150, laceysSiltFactor: 1.5, pierWidth: 1.2, pierLength: 3.5, pierDepth: 4.5, pierBaseWidth: 2.5, pierBaseLength: 4.5, abutmentHeight: 8, abutmentWidth: 3.5, abutmentDepth: 5, sbc: 200, bridgeType: 'submersible' },
];

const CROSS_SECTION_DATA = [
  { chainage: 0, gl: 280.0 },
  { chainage: 20, gl: 279.2 },
  { chainage: 40, gl: 278.5 },
  { chainage: 60, gl: 279.0 },
  { chainage: 80, gl: 280.0 },
];

async function generateForUser(scenario: typeof USER_SCENARIOS[number]) {
  const userDir = path.join(OUTPUT_ROOT, `user_${scenario.id}`);
  fs.mkdirSync(userDir, { recursive: true });

  const payload = {
    projectName: scenario.name,
    location: 'Rajasthan, India',
    riverName: scenario.name,
    bridgeType: scenario.bridgeType,
    spanLength: scenario.spanLength,
    numberOfSpans: scenario.numberOfSpans,
    skew: 0,
    carriageWidth: scenario.carriageWidth,
    numberOfLanes: scenario.numberOfLanes,
    totalLength: scenario.totalLength,
    hfl: scenario.hfl,
    bedLevel: scenario.bedLevel,
    foundationLevel: scenario.foundationLevel,
    discharge: scenario.discharge,
    manningN: scenario.manningN,
    bedSlope: scenario.bedSlope,
    laceysSiltFactor: scenario.laceysSiltFactor,
    crossSectionData: CROSS_SECTION_DATA,
    pierWidth: scenario.pierWidth,
    pierLength: scenario.pierLength,
    pierDepth: scenario.pierDepth,
    numberOfPiers: scenario.numberOfPiers,
    pierBaseWidth: scenario.pierBaseWidth,
    pierBaseLength: scenario.pierBaseLength,
    abutmentHeight: scenario.abutmentHeight,
    abutmentWidth: scenario.abutmentWidth,
    abutmentDepth: scenario.abutmentDepth,
    dirtWallHeight: 2.5,
    returnWallLength: 6,
    concreteGrade: 'M25',
    fck: 25,
    steelGrade: 'Fe415',
    fy: 415,
    sbc: scenario.sbc,
    phi: 30,
    gamma: 18,
    rtl: scenario.hfl + 1.5,
    agl: scenario.bedLevel,
    nbl: scenario.bedLevel,
    ofl: scenario.hfl - 0.7,
    dwl: scenario.hfl + 0.25,
    deckSlabThickness: 0.25,
    freeboardAboveHfl: 1.0,
  };

  const safeName = scenario.name.replace(/\s+/g, '_');

  // 1. Excel
  try {
    const excelRes = await fetch(`${BASE_URL}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (excelRes.ok) {
      const buf = Buffer.from(await excelRes.arrayBuffer());
      fs.writeFileSync(path.join(userDir, `${safeName}_design.xlsx`), buf);
      console.log(`  ✅ User ${scenario.id} Excel saved`);
    } else {
      console.log(`  ❌ User ${scenario.id} Excel failed: ${excelRes.status}`);
    }
  } catch (e: any) { console.log(`  ❌ User ${scenario.id} Excel error: ${e.message}`); }

  // 2. PDF (comprehensive 46-sheet)
  try {
    const pdfRes = await fetch(`${BASE_URL}/pdf/comprehensive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (pdfRes.ok) {
      const buf = Buffer.from(await pdfRes.arrayBuffer());
      fs.writeFileSync(path.join(userDir, `${safeName}_report.pdf`), buf);
      console.log(`  ✅ User ${scenario.id} PDF saved`);
    } else {
      console.log(`  ❌ User ${scenario.id} PDF failed: ${pdfRes.status}`);
    }
  } catch (e: any) { console.log(`  ❌ User ${scenario.id} PDF error: ${e.message}`); }

  // 3. DXF
  try {
    const dxfRes = await fetch(`${BASE_URL}/dxf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (dxfRes.ok) {
      const buf = Buffer.from(await dxfRes.arrayBuffer());
      fs.writeFileSync(path.join(userDir, `${safeName}_drawing.dxf`), buf);
      console.log(`  ✅ User ${scenario.id} DXF saved`);
    } else {
      console.log(`  ❌ User ${scenario.id} DXF failed: ${dxfRes.status}`);
    }
  } catch (e: any) { console.log(`  ❌ User ${scenario.id} DXF error: ${e.message}`); }

  // 4. HTML Report
  try {
    const htmlRes = await fetch(`${BASE_URL}/report/html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (htmlRes.ok) {
      const buf = Buffer.from(await htmlRes.arrayBuffer());
      fs.writeFileSync(path.join(userDir, `${safeName}_report.html`), buf);
      console.log(`  ✅ User ${scenario.id} HTML saved`);
    } else {
      console.log(`  ❌ User ${scenario.id} HTML failed: ${htmlRes.status}`);
    }
  } catch (e: any) { console.log(`  ❌ User ${scenario.id} HTML error: ${e.message}`); }
}

async function main() {
  console.log('🏗️ ANTIGRAVITY BRIDGE DESIGN — 15-User Test Run');
  console.log('================================================\n');

  for (const scenario of USER_SCENARIOS) {
    console.log(`👤 User ${scenario.id}: ${scenario.name}`);
    await generateForUser(scenario);
    console.log('');
  }

  console.log('================================================');
  console.log('✅ 15-User Test Run Complete!');
  console.log(`📂 All outputs saved to: ${OUTPUT_ROOT}`);
}

main().catch(console.error);
