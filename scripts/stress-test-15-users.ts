import fs from 'node:fs';
import path from 'node:path';

const API_BASE = 'http://localhost:5000/api';
const OUTPUT_DIR = path.resolve(process.cwd(), 'validation_results');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const RANDOM_NAMES = [
  'Kherwara Bridge', 'Som River Crossing', 'Mahi Dam Approach', 'Udaipur Link',
  'Jawas Nalla', 'Suveri Road Bridge', 'Jakham River Submersible', 'Mandvi Road',
  'Parsola Bridge', 'Vai Bajpura Crossing', 'Chhappan Bridge', 'Banswara Bypass',
  'Dungarpur Link', 'Salumbar Highway', 'Rishabhdeo Connector'
];

async function runTest(index: number) {
  const name = RANDOM_NAMES[index] || `Project ${index + 1}`;
  const spans = Math.floor(Math.random() * 8) + 2; // 2 to 9 spans
  const spanL = 8 + Math.random() * 12; // 8 to 20m
  
  const payload = {
    projectName: name,
    location: "Rajasthan, India",
    riverName: "Local River",
    spanLength: spanL,
    numberOfSpans: spans,
    carriageWidth: 7.5,
    numberOfLanes: 2,
    hfl: 100,
    bedLevel: 92,
    foundationLevel: 88,
    discharge: 150 + Math.random() * 500,
    manningN: 0.035,
    bedSlope: 500,
    laceysSiltFactor: 1.1,
    pierWidth: 1.2,
    pierLength: 8.5,
    pierDepth: 8,
    numberOfPiers: spans - 1,
    pierBaseWidth: 4.5,
    pierBaseLength: 10.5,
    abutmentHeight: 6.5,
    abutmentWidth: 10.5,
    abutmentDepth: 4.5,
    dirtWallHeight: 1.5,
    returnWallLength: 4.5,
    concreteGrade: "M30",
    steelGrade: "Fe500",
    sbc: 250,
    phi: 30,
    gamma: 18,
    rtl: 102,
    agl: 93,
    nbl: 92,
    ofl: 98,
    dwl: 100.5,
    crossSectionData: [
      { chainage: 0, gl: 102 },
      { chainage: spans * spanL / 2, gl: 92 },
      { chainage: spans * spanL, gl: 102 }
    ]
  };

  console.log(`[User ${index + 1}] Running design for: ${name} (${spans} spans @ ${spanL.toFixed(1)}m)`);
  
  try {
    // 1. Calculate
    const calcStart = Date.now();
    const calcRes = await fetch(`${API_BASE}/design/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const calcData = await calcRes.json() as any;
    const calcTime = Date.now() - calcStart;
    
    if (!calcData.success) throw new Error(`Calc failed: ${calcData.error}`);
    
    // 2. Generate Excel
    const excelStart = Date.now();
    const excelRes = await fetch(`${API_BASE}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const excelTime = Date.now() - excelStart;
    const excelBuffer = Buffer.from(await excelRes.arrayBuffer());
    fs.writeFileSync(path.join(OUTPUT_DIR, `${name.replace(/\s+/g, '_')}_BOQ.xlsx`), excelBuffer);
    
    // 3. Generate DXF
    const dxfStart = Date.now();
    const dxfRes = await fetch(`${API_BASE}/design/dxf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const dxfTime = Date.now() - dxfStart;
    const dxfBuffer = Buffer.from(await dxfRes.arrayBuffer());
    fs.writeFileSync(path.join(OUTPUT_DIR, `${name.replace(/\s+/g, '_')}_CAD.dxf`), dxfBuffer);

    console.log(`[User ${index + 1}] ✅ SUCCESS | Calc: ${calcTime}ms | Excel: ${excelTime}ms | DXF: ${dxfTime}ms`);
    return true;
  } catch (err: any) {
    console.error(`[User ${index + 1}] ❌ FAILED: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("Starting 15-User Stress Test...");
  let successCount = 0;
  for (let i = 0; i < 15; i++) {
    const success = await runTest(i);
    if (success) successCount++;
  }
  console.log(`\nTest Complete. Result: ${successCount}/15 Passed.`);
  process.exit(successCount === 15 ? 0 : 1);
}

main();
