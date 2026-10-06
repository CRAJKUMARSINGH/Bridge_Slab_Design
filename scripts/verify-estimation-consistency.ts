/**
 * Estimation consistency verifier (cost-model regression guard).
 *
 * The rules this file exists to protect, each of which a real bug once broke:
 *  1. excavation depth is BED − FOUNDATION (+ over-dig): an inverted sign used to
 *     bill 0 m³ of earthwork on every sub-bed foundation;
 *  2. the four earthwork bands (soil ≤3 m, soil deeper, soft rock, blasted hard
 *     rock) are priced at their own register rates and sum to the reported total —
 *     the retired 80/20 soil/rock split is NOT how the PWD register bills a dig;
 *  3. rock bands appear only when the project is actually flagged hard rock;
 *  4. reinforcement is billed as the register percentage of the RCC volume it
 *     reinforces × 7850 kg/m³, at the location steel rate;
 *  5. the wearing coat is billed as VOLUME at the 75 mm average thickness — the
 *     old per-m² rule understated it about 20×, and the register prices it per m³;
 *  6. every BOQ amount is quantity × rate and the lines sum to the subtotal;
 *  7. every BOQ quantity is exactly the sum of its own measurement rows, so the
 *     Bridge measurements sheet and the Abstract can never disagree;
 *  8. no line carries a rate outside the rate register;
 *  9. the PWD overhead ladder reconciles: QC → contingency provision →
 *     contingencies → G.Total → prorata overheads & profit → grand total → Lacs.
 *     GST is not part of a departmental abstract.
 *
 * Run: npx tsx scripts/verify-estimation-consistency.ts
 */
import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine.ts';
import { PHASE1_QUICK_TEMPLATES } from '../server/default-project-inputs.ts';
import {
  ABUTMENT_BAND_LENGTH_M,
  ABUTMENT_FOOTING_EXTRA_WIDTH_M,
  BEARINGS_PER_PIER,
  EXCAVATION_OVERDIG_M,
  OVERHEAD_RATES,
} from '../server/remote-app-adapter.ts';
import {
  CONCRETE_RATES,
  EARTHWORK_RATES,
  ITEM_RATES,
  ROCK_HEAD_DEPTH_BELOW_BED_M,
  STEEL_RATES,
  STEEL_UNIT_WEIGHT_KG_PER_M3,
  STEEL_VOLUME_PERCENT,
  WEARING_COAT_THICKNESS_M,
} from '../bridge-excel-generator/material-rates.ts';
import type { EstimationMeasurement, ProjectInput } from '../bridge-excel-generator/types.ts';

const RUPEE = 0.51; // rupee rounding on large products
const CUBIC = 0.01; // m³ rounding on a measured quantity
const REL = 1.5; // ₹ reconciliation tolerance on the ladder (₹2 per ₹1000)

/** Every rate the register knows about; a line priced outside it is a bug. */
const REGISTER_RATES = new Set<number>([
  ...Object.values(EARTHWORK_RATES),
  ...Object.values(STEEL_RATES),
  ...Object.values(CONCRETE_RATES).flatMap((byGrade) => Object.values(byGrade)),
  ...Object.values(ITEM_RATES),
]);

function bandTotal(m: EstimationMeasurement): number {
  if (m.basis === 'count') return m.nos;
  if (m.basis === 'plan') return m.nos * m.length * m.breadth;
  if (m.basis === 'steel') return (m.nos * m.length * m.breadth * m.height) / 100 / 1000;
  return m.nos * m.length * m.breadth * m.height;
}

function check(input: ProjectInput) {
  const problems: string[] = [];
  const stats = { excavation: 0, rock: 0, coat: 0, steel: 0, bearings: 0, items: 0, lacs: 0 };
  const design = calculateCompleteDesign(input, { quiet: true });
  const est = design.estimation;
  if (!est) {
    problems.push('no estimation result');
    return { problems, stats };
  }

  const boq = est.boq ?? [];
  const measurements = est.measurements ?? [];
  const dig = est.quantities.excavation;
  const cost = est.cost;
  stats.items = boq.length;
  stats.excavation = dig.total;
  stats.rock = dig.softRock + dig.hardRock;
  stats.coat = est.quantities.concrete.m30;
  stats.steel = est.quantities.steel.total;
  stats.bearings = boq.find((b) => /bearing/i.test(b.description))?.quantity ?? 0;
  stats.lacs = cost.totalInLacs;

  // ── 1. earthwork exists wherever the foundation is below the bed ────────────
  const depth = input.bedLevel - input.foundationLevel + EXCAVATION_OVERDIG_M;
  if (depth > 0.01 && dig.total <= 0) {
    problems.push(`foundation ${depth.toFixed(2)} m below bed but excavation = ${dig.total} m3`);
  }

  // ── 2. the four bands are the total, and each is billed at its own rate ─────
  const bands = dig.soilUpto3m + dig.soil3to6m + dig.softRock + dig.hardRock;
  if (Math.abs(bands - dig.total) > CUBIC) {
    problems.push(`earthwork bands sum ${bands.toFixed(3)} m3 but reported total ${dig.total.toFixed(3)} m3`);
  }
  const bandRate: Record<string, number> = {
    'B-1/1.1.4': EARTHWORK_RATES.soilUpto3m,
    'B-1/1.1.5': EARTHWORK_RATES.soil3to6m,
    'B-1/1.3.2': EARTHWORK_RATES.softRockNoBlasting,
    'B-1/1.4.1': EARTHWORK_RATES.hardRockBlasting,
  };
  const digPlan = input.numberOfPiers * input.pierBaseWidth * input.pierBaseLength +
    2 * ABUTMENT_BAND_LENGTH_M * (input.abutmentWidth + ABUTMENT_FOOTING_EXTRA_WIDTH_M);
  for (const [code, rate] of Object.entries(bandRate)) {
    const rowTotal = measurements.filter((m) => m.bsrCode === code).reduce((s, m) => s + m.quantity, 0);
    if (rowTotal <= 0) continue;
    const line = boq.find((b) => measurements.some((m) => m.item === b.itemNo && m.bsrCode === code));
    if (!line) {
      problems.push(`band ${code} measures ${rowTotal.toFixed(3)} m3 but no BOQ line bills it`);
      continue;
    }
    if (line.rate !== rate) problems.push(`band ${code} rate ${line.rate}, register says ${rate}`);
    if (Math.abs(line.quantity - rowTotal) > CUBIC) {
      problems.push(`band ${code} billed ${line.quantity.toFixed(3)} but measured ${rowTotal.toFixed(3)}`);
    }
  }

  // ── 3. rock only where the project reports rock ─────────────────────────────
  if (!input.hardRockAvailable) {
    if (dig.softRock > 0 || dig.hardRock > 0) {
      problems.push(`hardRockAvailable = false but rock bands bill ${dig.softRock} + ${dig.hardRock} m3`);
    }
    if (boq.some((b) => /rock requiring blasting|not requiring blasting/i.test(b.description))) {
      problems.push('BOQ carries a rock earthwork line for a project with no reported rock');
    }
  } else if (dig.soilUpto3m + dig.soil3to6m > digPlan * ROCK_HEAD_DEPTH_BELOW_BED_M + CUBIC) {
    problems.push(
      `soil bands ${((dig.soilUpto3m + dig.soil3to6m) as number).toFixed(2)} m3 exceed the ${ROCK_HEAD_DEPTH_BELOW_BED_M} m rock head over ${digPlan.toFixed(2)} m2 of trench`,
    );
  }

  // ── 4. reinforcement = register % of the RCC volume it reinforces ───────────
  const steelLines = boq.filter((b) => /TMT steel/i.test(b.description));
  if (steelLines.length === 0) problems.push('no TMT steel lines billed');
  for (const line of steelLines) {
    const percent = Number(line.description.match(/at ([\d.]+) %/)?.[1]);
    if (!Number.isFinite(percent)) {
      problems.push(`steel line has no readable percentage: ${line.description}`);
      continue;
    }
    const rows = measurements.filter((m) => m.item === line.itemNo);
    for (const row of rows) {
      const expected = (row.length * row.breadth * row.height) / 100 / 1000;
      if (Math.abs(expected - row.quantity) > CUBIC) {
        problems.push(`steel row '${row.description}': ${expected.toFixed(3)} MT expected, ${row.quantity} billed`);
      }
      if (row.length !== percent) problems.push(`steel row percentage ${row.length} != description ${percent}`);
    }
    const rateValues = Object.values(STEEL_RATES);
    if (!rateValues.includes(line.rate)) {
      problems.push(`steel rate ${line.rate} is not a register steel rate (${rateValues.join('/')})`);
    }
    const rccVolume = rows.reduce((s, r) => s + r.breadth, 0);
    if (Math.abs(line.quantity - (percent / 100) * rccVolume * STEEL_UNIT_WEIGHT_KG_PER_M3 / 1000) > CUBIC) {
      problems.push(`steel line qty ${line.quantity} != ${percent}% of RCC ${rccVolume}`);
    }
  }
  const declaredPercents = Object.values(STEEL_VOLUME_PERCENT);
  if (!steelLines.every((l) => declaredPercents.includes(Number(l.description.match(/at ([\d.]+) %/)?.[1])))) {
    problems.push('a steel line quotes a percentage the register does not declare');
  }

  // ── 5. wearing coat billed as volume at the register thickness ──────────────
  const coat = boq.find((b) => /wearing coat/i.test(b.description) && /RCC M-30/i.test(b.description));
  if (!coat) {
    problems.push('no RCC M-30 wearing coat line');
  } else {
    if (coat.unit !== 'm³') problems.push(`wearing coat unit '${coat.unit}', register prices it per m³`);
    const expected = input.totalLength * input.carriageWidth * WEARING_COAT_THICKNESS_M;
    if (Math.abs(coat.quantity - expected) > CUBIC) {
      problems.push(`wearing coat ${coat.quantity} m3, expected ${expected.toFixed(3)} m3 at ${WEARING_COAT_THICKNESS_M * 1000} mm average`);
    }
    if (coat.rate !== ITEM_RATES.wearingCoatRccM30) {
      problems.push(`wearing coat rate ${coat.rate}, register ${ITEM_RATES.wearingCoatRccM30}`);
    }
  }

  // ── 6. line arithmetic and the subtotal ─────────────────────────────────────
  for (const item of boq) {
    if (Math.abs(item.quantity * item.rate - item.amount) > RUPEE) {
      problems.push(`BOQ '${item.description}': ${item.quantity} × ${item.rate} = ${(item.quantity * item.rate).toFixed(2)} but amount ${item.amount.toFixed(2)}`);
    }
    if (!REGISTER_RATES.has(item.rate)) {
      problems.push(`BOQ '${item.description}' rate ${item.rate} is not in the rate register`);
    }
    if (item.quantity <= 0) problems.push(`BOQ '${item.description}' bills a zero/negative quantity`);
    if (!item.unit) problems.push(`BOQ '${item.description}' has no unit`);
  }
  const boqSum = boq.reduce((sum, item) => sum + item.amount, 0);
  if (Math.abs(boqSum - cost.subtotal) > RUPEE) {
    problems.push(`BOQ lines sum ${boqSum.toFixed(2)} but subtotal reported ${cost.subtotal.toFixed(2)}`);
  }

  // ── 7. every BOQ quantity is the sum of its own measurement rows ────────────
  const itemsWithRows = new Set(measurements.map((m) => m.item));
  for (const item of boq) {
    if (!itemsWithRows.has(item.itemNo)) {
      problems.push(`BOQ line ${item.itemNo} '${item.description}' has no measurement rows`);
      continue;
    }
    const rows = measurements.filter((m) => m.item === item.itemNo);
    const sum = rows.reduce((s, r) => s + r.quantity, 0);
    if (Math.abs(sum - item.quantity) > CUBIC) {
      problems.push(`line ${item.itemNo}: measurement rows sum ${sum.toFixed(3)} but billed ${item.quantity.toFixed(3)}`);
    }
    for (const row of rows) {
      if (Math.abs(bandTotal(row) - row.quantity) > CUBIC) {
        problems.push(`line ${item.itemNo} row '${row.description}': ${row.basis} dimensions give ${bandTotal(row).toFixed(3)}, stored ${row.quantity}`);
      }
      if (!row.bsrCode) problems.push(`line ${item.itemNo} row '${row.description}' has no BSR code`);
    }
  }
  const orphans = measurements.filter((m) => !boq.some((b) => b.itemNo === m.item));
  if (orphans.length) problems.push(`${orphans.length} measurement rows bill nothing`);

  // ── 8. the PWD overhead ladder reconciles ──────────────────────────────────
  const expectQc = cost.subtotal * OVERHEAD_RATES.qualityControl;
  const expectCont = cost.subtotal * OVERHEAD_RATES.contingencies;
  const expectG = cost.subtotal + cost.qualityControl + cost.contingencyProvision + cost.contingencies;
  const expectProrata = cost.gTotal * OVERHEAD_RATES.prorataOverheads;
  if (Math.abs(cost.qualityControl - expectQc) > REL) problems.push(`quality control ${cost.qualityControl.toFixed(2)} != 1% of subtotal ${expectQc.toFixed(2)}`);
  if (Math.abs(cost.contingencyProvision) > 0.01) problems.push(`contingency provision ${cost.contingencyProvision.toFixed(2)} booked while the register books it nil`);
  if (Math.abs(cost.contingencies - expectCont) > REL) problems.push(`contingencies ${cost.contingencies.toFixed(2)} != 1.5% of subtotal ${expectCont.toFixed(2)}`);
  if (Math.abs(cost.gTotal - expectG) > REL) problems.push(`G.Total ${cost.gTotal.toFixed(2)} != ${expectG.toFixed(2)}`);
  if (Math.abs(cost.prorataOverheads - expectProrata) > REL) problems.push(`prorata overheads ${cost.prorataOverheads.toFixed(2)} != 13% of G.Total ${expectProrata.toFixed(2)}`);
  if (Math.abs(cost.total - (cost.gTotal + cost.prorataOverheads)) > REL) problems.push(`grand total ${cost.total.toFixed(2)} != G.Total + prorata`);
  if (Math.abs(cost.totalInLacs - Math.round((cost.total / 100000) * 100) / 100) > 0.011) {
    problems.push(`lakh figure ${cost.totalInLacs} != ${Math.round((cost.total / 100000) * 100) / 100}`);
  }
  if (input.totalLength > 0 && Math.abs(cost.ratePerMeter - cost.total / input.totalLength) > RUPEE) {
    problems.push(`rate per metre ${cost.ratePerMeter.toFixed(2)} != total / ${input.totalLength} m`);
  }

  // ── 9. bearings and concrete buckets ───────────────────────────────────────
  const expectedBearings = input.numberOfPiers * BEARINGS_PER_PIER;
  const bearingLine = boq.find((b) => /bearing/i.test(b.description));
  if (!bearingLine) {
    if (expectedBearings > 0) problems.push('BOQ has no bearings line');
  } else if (Math.abs(bearingLine.quantity - expectedBearings) > 0.01) {
    problems.push(`bearings ${bearingLine.quantity} nos, expected ${input.numberOfPiers} piers × ${BEARINGS_PER_PIER} = ${expectedBearings}`);
  }

  const gradeSum = est.quantities.concrete.m15 + est.quantities.concrete.m20 +
    est.quantities.concrete.m25 + est.quantities.concrete.m30 + est.quantities.concrete.m35;
  if (Math.abs(gradeSum - est.quantities.concrete.total) > CUBIC) {
    problems.push(`concrete grades sum ${gradeSum.toFixed(3)} but reported total ${est.quantities.concrete.total.toFixed(3)}`);
  }
  // Every m³ concrete line feeds the grade buckets, wearing coat included: it is
  // RCC M-30 billed by volume, exactly like the deck slab.
  const concreteBoq = boq
    .filter((b) => b.unit === 'm³' && /(PCC|RCC)/i.test(b.description))
    .reduce((s, b) => s + b.quantity, 0);
  if (Math.abs(concreteBoq - est.quantities.concrete.total) > CUBIC) {
    problems.push(`concrete BOQ lines ${concreteBoq.toFixed(3)} m3 vs quantity summary ${est.quantities.concrete.total.toFixed(3)} m3`);
  }

  return { problems, stats };
}

let defects = 0;
for (const template of PHASE1_QUICK_TEMPLATES) {
  const { problems, stats } = check(template.input);
  defects += problems.length;
  console.log(
    `${problems.length === 0 ? 'OK  ' : 'FAIL'} ${template.id.padEnd(26)} items:${String(stats.items).padStart(2)} ` +
    `dig=${stats.excavation.toFixed(1)} m³ (rock ${stats.rock.toFixed(1)}) steel=${stats.steel.toFixed(2)} MT ` +
    `bearings=${stats.bearings} total=₹${stats.lacs.toFixed(2)} L`
  );
  problems.forEach((p) => console.log(`       - ${p}`));
}

console.log(`\nTemplates: ${PHASE1_QUICK_TEMPLATES.length} | defects: ${defects}`);
if (defects > 0) process.exitCode = 1;
