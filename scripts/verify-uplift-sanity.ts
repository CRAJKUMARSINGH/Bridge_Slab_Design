/**
 * Deck uplift / anchorage sanity guard.
 *
 * The uplift model used to bill buoyancy on a deck sitting above the design water
 * level, so every submersible project reported a NEGATIVE uplift, a negative factor
 * of safety, and therefore a false UNSAFE verdict. These rules keep that class of
 * bug from returning, and pin sheet 5 to the engine:
 *  1. buoyancy, hydrodynamic uplift and total uplift are never negative;
 *  2. the factor of safety is finite and positive;
 *  3. a deck whose soffit is at or above DWL carries nil buoyancy;
 *  4. status follows the 1.2 threshold, and hold-down bolts are only proposed when
 *     the deck is actually submerged;
 *  5. the workbook's 'Deck Anchorage' sheet and the engine agree on the factor of
 *     safety (forces are quoted per deck block vs whole deck, the ratio is not).
 *
 * Run: npx tsx scripts/verify-uplift-sanity.ts
 */
import ExcelJS from 'exceljs';
import { generateCompleteExcel } from '../bridge-excel-generator/index.ts';
import { readCellValue } from '../bridge-excel-generator/utils.ts';
import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine.ts';
import { calculateDeckAnchorage } from '../server/remote-app-adapter.ts';
import { deckSlabThicknessOf } from '../bridge-excel-generator/input-contract.ts';
import { PHASE1_QUICK_TEMPLATES } from '../server/default-project-inputs.ts';
import type { ProjectInput } from '../bridge-excel-generator/types.ts';

const FOS_LABEL = 'Factor of safety against uplift';

async function sheetFos(input: ProjectInput): Promise<number> {
  const log = console.log;
  console.log = () => {};
  const buffer = await generateCompleteExcel(input);
  console.log = log;

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const ws = wb.getWorksheet('Deck Anchorage');
  if (!ws) throw new Error('no Deck Anchorage sheet');
  for (let r = 1; r <= ws.rowCount; r++) {
    if (readCellValue(ws.getCell(r, 2)) === FOS_LABEL) {
      const raw = readCellValue(ws.getCell(r, 4));
      return typeof raw === 'number' ? raw : Number(raw?.result);
    }
  }
  throw new Error(`'${FOS_LABEL}' row missing`);
}

async function check(input: ProjectInput) {
  const problems: string[] = [];
  const design: any = calculateCompleteDesign(input, { quiet: true });
  const a = calculateDeckAnchorage(input, design);
  const thk = deckSlabThicknessOf(input);
  const soffit = input.deckSoffitLevel ?? (input.rtl - thk);
  const dwl = design.hydraulics?.designWaterLevel ?? input.hfl;

  for (const [name, v] of Object.entries(a.upliftForces)) {
    if (!(Number(v) >= 0)) problems.push(`${name} uplift ${v} kN is not >= 0`);
  }
  if (!Number.isFinite(a.safetyFactor) || a.safetyFactor <= 0) {
    problems.push(`safety factor ${a.safetyFactor} is not finite and positive`);
  }
  if (dwl <= soffit && a.upliftForces.buoyancy !== 0) {
    problems.push(`soffit ${soffit.toFixed(2)} at/above DWL ${dwl.toFixed(2)} but buoyancy ${a.upliftForces.buoyancy}`);
  }
  const expectedStatus = a.safetyFactor >= 1.2 ? 'SAFE' : 'UNSAFE';
  if (a.status !== expectedStatus) problems.push(`status ${a.status} but FOS ${a.safetyFactor.toFixed(2)}`);
  if (dwl <= soffit && a.boltRecommendation.number !== 0 && a.status === 'SAFE') {
    problems.push(`dry deck still proposes ${a.boltRecommendation.number} hold-down bolts`);
  }

  let sheetFosValue = Number.NaN;
  try {
    sheetFosValue = await sheetFos(input);
  } catch (e: any) {
    problems.push(String(e.message));
  }
  if (Number.isFinite(sheetFosValue) && Math.abs(sheetFosValue - a.safetyFactor) > Math.max(0.01, a.safetyFactor * 0.005)) {
    problems.push(`sheet 5 FOS ${sheetFosValue.toFixed(3)} != engine FOS ${a.safetyFactor.toFixed(3)}`);
  }
  return { problems, fos: a.safetyFactor, sheetFos: sheetFosValue, status: a.status };
}

let defects = 0;
for (const template of PHASE1_QUICK_TEMPLATES) {
  const r = await check(template.input);
  defects += r.problems.length;
  console.log(
    `${r.problems.length === 0 ? 'OK  ' : 'FAIL'} ${template.id.padEnd(24)} FOS=${r.fos.toFixed(2).padStart(6)} ` +
    `sheet=${Number.isFinite(r.sheetFos) ? r.sheetFos.toFixed(2) : 'n/a'} ${r.status}`
  );
  r.problems.forEach((p) => console.log(`       - ${p}`));
}

console.log(`\nTemplates: ${PHASE1_QUICK_TEMPLATES.length} | defects: ${defects}`);
if (defects > 0) process.exitCode = 1;
