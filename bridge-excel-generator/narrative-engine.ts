import type { EnhancedProjectInput } from './types';

function fmt(value: number | undefined, digits = 2): string {
  const safe = value === undefined || value === null || Number.isNaN(value) ? 0 : value;
  return safe.toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: Math.max(digits, 3),
  });
}

function verdict(ok: boolean): string {
  return ok ? 'Hence O.K.' : 'Hence NOT O.K. - revise inputs/member sizes and re-verify.';
}

function adequacy(actual: number | undefined, threshold: number, label: string): string {
  const safe = actual ?? 0;
  const ratio = threshold > 0 ? safe / threshold : 0;
  if (ratio >= 1.2) return `${label} has a comfortable margin (${fmt(ratio, 2)}x).`;
  if (ratio >= 1.05) return `${label} has an adequate margin (${fmt(ratio, 2)}x).`;
  if (ratio >= 1.0) return `${label} is marginally compliant.`;
  return `${label} is below requirement by ${fmt((1 - ratio) * 100, 1)} percent.`;
}

function caseByMin(
  cases: Array<{ [key: string]: any }>,
  key: 'slidingFOS' | 'overturningFOS' | 'bearingFOS',
) {
  return cases.reduce<any | undefined>((best, item) => {
    if (!best) return item;
    return Number(item?.[key] ?? Number.POSITIVE_INFINITY) < Number(best?.[key] ?? Number.POSITIVE_INFINITY)
      ? item
      : best;
  }, undefined);
}

function narrativeContext(input: EnhancedProjectInput) {
  const h = input.hydraulics;
  const pier = input.pier;
  const type1 = input.abutmentType1;
  const c1 = input.abutmentC1;
  const pierCases = pier?.loadCases ?? [];
  const type1Cases = type1?.loadCases ?? [];
  const c1Cases = c1?.loadCases ?? [];

  const minPierSliding = pierCases.length ? Math.min(...pierCases.map((c) => c.slidingFOS)) : undefined;
  const minPierOverturning = pierCases.length ? Math.min(...pierCases.map((c) => c.overturningFOS)) : undefined;
  const minPierBearing = pierCases.length ? Math.min(...pierCases.map((c) => c.bearingFOS)) : undefined;
  const minType1Sliding = type1Cases.length ? Math.min(...type1Cases.map((c) => c.slidingFOS)) : undefined;
  const minType1Overturning = type1Cases.length ? Math.min(...type1Cases.map((c) => c.overturningFOS)) : undefined;
  const minType1Bearing = type1Cases.length ? Math.min(...type1Cases.map((c) => c.bearingFOS)) : undefined;
  const minC1Sliding = c1Cases.length ? Math.min(...c1Cases.map((c) => c.slidingFOS)) : undefined;
  const minC1Overturning = c1Cases.length ? Math.min(...c1Cases.map((c) => c.overturningFOS)) : undefined;
  const minC1Bearing = c1Cases.length ? Math.min(...c1Cases.map((c) => c.bearingFOS)) : undefined;

  const foundationLevel =
    input.foundationLevel ??
    h?.foundationLevel ??
    (input.bedLevel - ((h?.designScourDepth ?? h?.scourDepth ?? 0) * 0.35));
  const deckSoffit =
    input.deckSoffitLevel ??
    h?.soffitLevel ??
    (input.rtl - (input.deckSlabThickness ?? 0.25));
  const requiredFreeboard = h?.requiredFreeboardAboveHfl ?? input.freeboardAboveHfl ?? 1.2;
  const availableFreeboard = h?.freeboardAboveHfl ?? Math.max(0, deckSoffit - input.hfl);
  const afflux = h?.afflux ?? 0;
  const dwl = h?.designWaterLevel ?? (input.hfl + afflux);
  const froude = h?.froudeNumber ?? 0;
  const flowType = h?.flowType ?? (froude < 1 ? 'Subcritical' : 'Rapid');
  const totalBridgeLength = input.totalLength ?? input.spanLength * input.numberOfSpans;
  const slabThickness = input.deckSlabThickness ?? 0.25;
  const q = h?.discharge ?? input.discharge;
  const v = h?.velocity ?? 0;
  const scour = h?.designScourDepth ?? h?.scourDepth ?? 0;
  const isHigh = input.bridgeType === 'high-level';
  const minPierOk =
    (minPierSliding ?? 0) >= 1.5 &&
    (minPierOverturning ?? 0) >= 1.8 &&
    (minPierBearing ?? 0) >= 2.5;

  return {
    h,
    pier,
    type1,
    c1,
    flowType,
    froude,
    foundationLevel,
    deckSoffit,
    requiredFreeboard,
    availableFreeboard,
    afflux,
    dwl,
    slabThickness,
    totalBridgeLength,
    q,
    v,
    scour,
    isHigh,
    minPierSliding,
    minPierOverturning,
    minPierBearing,
    minType1Sliding,
    minType1Overturning,
    minType1Bearing,
    minC1Sliding,
    minC1Overturning,
    minC1Bearing,
    minPierOk,
  };
}

export function getHydraulicNarrativeParagraphs(input: EnhancedProjectInput): string[] {
  const c = narrativeContext(input);
  const waterwayRatio = c.h?.regimeWidth ? c.totalBridgeLength / c.h.regimeWidth : 0;
  const waterwayVerdict =
    waterwayRatio >= 1 ? 'exceeds the regime width requirement' :
    waterwayRatio >= 0.95 ? 'is close to the regime width requirement' :
    'is short of the regime width requirement';
  const velocityVerdict =
    c.v < 2 ? 'moderate' :
    c.v < 3 ? 'high but acceptable for a designed crossing' :
    'elevated, so scour protection and current-force checks become critical';

  return [
    `HYDRAULIC NARRATIVE: the bridge is first read as a river regime problem. The report therefore links cross-section, velocity, design discharge, afflux, scour and founding level in one continuous engineering story, so the subsequent pier and abutment checks are not detached from the flood model.`,
    `Design data: HFL = ${fmt(input.hfl, 3)} m MSL, bed level = ${fmt(input.bedLevel, 3)} m MSL, foundation level = ${fmt(c.foundationLevel, 3)} m MSL, Manning n = ${fmt(input.manningN, 3)}, bed slope = 1 in ${fmt(input.bedSlope, 0)}, total waterway = ${fmt(c.totalBridgeLength, 2)} m, and design discharge Q = ${fmt(c.q, 2)} cumecs.`,
    `Step 1 - A) FLOW CALCULATION: the adopted waterway section gives area A = ${fmt(c.h?.crossSectionalArea, 3)} m2 and wetted perimeter P = ${fmt(c.h?.wettedPerimeter, 3)} m. Hence hydraulic radius R = A/P = ${fmt(c.h?.hydraulicRadius, 4)} m, velocity V = ${fmt(c.v, 3)} m/s, and Froude number Fr = ${fmt(c.froude, 3)}. The flow regime is read as ${c.flowType}, so the discharge, afflux and scour computations are carried forward as one consistent hydraulic envelope.`,
    `Step 2 - B) WATERWAY, AFFLUX AND SCOUR: regime width is ${fmt(c.h?.regimeWidth, 2)} m and the provided waterway ${waterwayVerdict} with provided/required ratio ${fmt(waterwayRatio, 2)}. Computed afflux is ${fmt(c.afflux, 3)} m, design water level is HFL + afflux = ${fmt(c.dwl, 3)} m MSL, and design scour depth is ${fmt(c.scour, 3)} m below the working bed. This fixes the foundation narrative before structural actions are accepted.`,
    c.isHigh
      ? `CHECK: high-level deck control compares available freeboard ${fmt(c.availableFreeboard, 3)} m with required freeboard ${fmt(c.requiredFreeboard, 3)} m. ${verdict(Boolean(c.h?.isFreeboardSafe ?? (c.availableFreeboard >= c.requiredFreeboard)))}`
      : `CHECK: for a submersible crossing, overtopping is intentional, but velocity is ${velocityVerdict}; therefore drag, buoyancy, scour and anchorage remain governing review items. ${verdict(c.froude < 2 && c.scour < 100)}`,
  ];
}

export function getStructuralNarrativeParagraphs(input: EnhancedProjectInput): string[] {
  const c = narrativeContext(input);
  const footingPressure = c.pier?.footing?.basePressure?.max;
  const footingVerdict = footingPressure !== undefined ? adequacy(input.sbc, footingPressure, 'SBC versus governing pier pressure') : 'Pier footing pressure is not available in the current result set.';
  const activeThrust = c.type1?.earthPressure?.pa ?? c.c1?.earthPressure?.pa ?? 0;
  const pierCases = c.pier?.loadCases ?? [];
  const seismicCase = pierCases.find((lc) => /seismic/i.test(lc.description)) ?? pierCases[3];
  const windCases = pierCases.filter((lc) => Number(lc.windLoadFactor) > 0);
  const windMoment = windCases.length ? Math.max(...windCases.map((lc) => lc.moment)) : 0;

  return [
    `STRUCTURAL NARRATIVE: the structure is narrated as one force path from deck to bearing, pier, footing and soil. Deck gravity/live effects, current load, buoyancy, earth pressure, braking, wind and seismic components are therefore read together before the report permits a final "Hence O.K." line.`,
    `Design data: slab thickness = ${fmt(c.slabThickness, 3)} m, span = ${fmt(input.spanLength, 2)} m, carriageway = ${fmt(input.carriageWidth, 2)} m, pier = ${fmt(c.pier?.geometry.width, 2)} m x ${fmt(c.pier?.geometry.length, 2)} m x ${fmt(c.pier?.geometry.depth, 2)} m, base = ${fmt(c.pier?.geometry.baseWidth, 2)} m x ${fmt(c.pier?.geometry.baseLength, 2)} m, SBC = ${fmt(input.sbc, 2)} kN/m2, phi = ${fmt(input.phi, 2)} deg, gamma = ${fmt(input.gamma, 2)} kN/m3.`,
    `Step 1 - A) DEAD LOAD CALCULATION: pier/self and deck reactions are accumulated into vertical restoring action. The current pier result carries dead load ${fmt(c.pier?.loads.deadLoad, 2)} kN and live load ${fmt(c.pier?.loads.liveLoad, 2)} kN, so every stability case starts from the same computed vertical load table used by the workbook.`,
    `Step 2 - B) LIVE LOAD CALCULATION: live load reaction is ${fmt(c.pier?.loads.liveLoad, 2)} kN and is activated by the service and ultimate combinations through live-load factors in the pier load-case table. This preserves the legacy workbook habit of keeping live reaction and braking/longitudinal effects visible before base stress is read.`,
    `C) LOADS DUE TO WATER CURRENT: hydrostatic force = ${fmt(c.pier?.loads.hydrostaticForce, 2)} kN, drag/current force = ${fmt(c.pier?.loads.dragForce, 2)} kN, buoyancy = ${fmt(c.pier?.loads.buoyancy, 2)} kN, and total horizontal action = ${fmt(c.pier?.loads.totalHorizontalForce, 2)} kN. These forces are applied with foundation lever arms to produce sliding, overturning and base-pressure checks.`,
    `D) SEISMIC CONDITION: the seismic-design row is ${seismicCase ? `case ${seismicCase.caseNumber} (${seismicCase.description}) with V = ${fmt(seismicCase.verticalForce, 2)} kN, H = ${fmt(seismicCase.horizontalForce, 2)} kN and M = ${fmt(seismicCase.moment, 2)} kN-m` : 'not generated in the current pier load-case set'}. The report keeps this row explicit even when seismic is not governing.`,
    `E) WIND FORCE: wind-sensitive combinations are ${windCases.length ? windCases.map((lc) => `case ${lc.caseNumber}`).join(', ') : 'not controlling for this pier model'}; maximum wind-combination moment carried by the load table is ${fmt(windMoment, 2)} kN-m and pier wind screening force is ${fmt(c.pier?.loads.windForce ?? 0, 2)} kN.`,
    `BASE PRESSURE / EARTH PRESSURE LINK: Rankine Ka = ${fmt(c.type1?.earthPressure?.ka ?? c.c1?.earthPressure?.ka, 3)} and active thrust Pa = ${fmt(activeThrust, 2)} kN. Pa acts at approximately H/3 above base and is carried into abutment sliding, overturning and bearing verification, including surcharge where generated by the engine.`,
    `CHECK: pier minima are Sliding ${fmt(c.minPierSliding, 3)}, Overturning ${fmt(c.minPierOverturning, 3)}, Bearing ${fmt(c.minPierBearing, 3)}. ${verdict(c.minPierOk)} Base pressure reading: ${footingVerdict}`,
  ];
}

export function getClosingNarrativeParagraphs(input: EnhancedProjectInput): string[] {
  const c = narrativeContext(input);
  const estTotal = input.estimation?.cost?.total ?? 0;
  const type1Ok =
    (c.minType1Sliding ?? 0) >= 1.5 &&
    (c.minType1Overturning ?? 0) >= 1.8 &&
    (c.minType1Bearing ?? 0) >= 2.5;

  return [
    `CLOSING NARRATIVE: the bridge is accepted only when the river story, stability story, detailing story and quantity story remain consistent with one another. Any CHECK result is treated as an engineering review stop-point, not as a submission-ready closeout.`,
    `Design data: total bridge length ${fmt(c.totalBridgeLength, 2)} m, design discharge ${fmt(c.q, 2)} cumecs, design water level ${fmt(c.dwl, 3)} m MSL, design scour depth ${fmt(c.scour, 3)} m, foundation level ${fmt(c.foundationLevel, 3)} m MSL, and estimated project total Rs ${fmt(estTotal, 2)}.`,
    `Step 1 - D) SEISMIC / WIND / SERVICEABILITY CLOSURE: the generated load cases retain lateral actions in the pier and abutment tables; high-level cases must prove freeboard and exposed wind behavior, while submersible cases must explicitly accept overtopping and then prove drag, buoyancy and anchorage behavior.`,
    `Step 2 - BASE PRESSURE / STABILITY VERDICT: Type1 abutment minima are Sliding ${fmt(c.minType1Sliding, 3)}, Overturning ${fmt(c.minType1Overturning, 3)}, Bearing ${fmt(c.minType1Bearing, 3)}. ${verdict(type1Ok)}`,
    `FOUNDATION / BEARING NOTE: foundation level ${fmt(c.foundationLevel, 3)} m MSL is checked against design scour ${fmt(c.scour, 3)} m, SBC ${fmt(input.sbc, 2)} kN/m2 and the generated base-pressure envelopes. Bearing-seat and cap details are therefore tied to the same geometry used for pier cap, abutment cap and deck reaction calculations.`,
    `FINAL TRACEABILITY CHECK: the same computed geometry drives TechNote, Tech Report, workbook narratives, drawings, BOQ and estimate. ${verdict(c.minPierOk && type1Ok)}`,
  ];
}

export function getVerificationNarrativeParagraphs(input: EnhancedProjectInput): string[] {
  const c = narrativeContext(input);
  const c1Ok =
    (c.minC1Sliding ?? 0) >= 1.5 &&
    (c.minC1Overturning ?? 0) >= 1.8 &&
    (c.minC1Bearing ?? 0) >= 2.5;
  const cases = c.pier?.loadCases ?? [];
  const baseArea = (c.pier?.footing.width ?? input.pierBaseWidth) * (c.pier?.footing.length ?? input.pierBaseLength);
  const serviceCase = cases.find((lc) => /service/i.test(lc.description)) ?? cases[0];
  const floodCase = cases.find((lc) => /flood/i.test(lc.description)) ?? cases[2];
  const seismicCase = cases.find((lc) => /seismic/i.test(lc.description)) ?? cases[3];
  const bearingCase = caseByMin(cases, 'bearingFOS');
  const windCases = cases.filter((lc) => Number(lc.windLoadFactor) > 0);
  const qService = serviceCase && baseArea > 0 ? serviceCase.verticalForce / baseArea : undefined;
  const qBearing = bearingCase && baseArea > 0 ? bearingCase.verticalForce / baseArea : undefined;

  return [
    `VERIFICATION NARRATIVE: this report is intended to let a checker read backward from final verdict to governing numbers without opening source code or reconstructing hidden assumptions. The prose is deterministic and is generated from the same input plus design-result object as the tables and drawings.`,
    `Design data: discharge ${fmt(c.q, 2)} cumecs, velocity ${fmt(c.v, 3)} m/s, afflux ${fmt(c.afflux, 3)} m, design water level ${fmt(c.dwl, 3)} m MSL, scour ${fmt(c.scour, 3)} m, SBC ${fmt(input.sbc, 2)} kN/m2, phi ${fmt(input.phi, 2)} deg, gamma ${fmt(input.gamma, 2)} kN/m3.`,
    `Step 1 - HYDRAULIC VERIFICATION: section, regime width, afflux and scour are checked as a mutually consistent chain. High-level bridges must satisfy freeboard/clearance; submersible bridges must state overtopping intent and then prove current, buoyancy and stability behavior.`,
    `Step 2 - STRUCTURAL VERIFICATION: governing pier and abutment load cases must keep sliding, overturning and bearing within acceptance. Cantilever/C1 minima are Sliding ${fmt(c.minC1Sliding, 3)}, Overturning ${fmt(c.minC1Overturning, 3)}, Bearing ${fmt(c.minC1Bearing, 3)}. ${verdict(c1Ok)}`,
    `A) DEAD LOAD CALCULATION REVIEW: pier/substructure dead load ${fmt(c.pier?.loads.deadLoad, 2)} kN is the base restoring component. Service case ${serviceCase?.caseNumber ?? 0} carries V = ${fmt(serviceCase?.verticalForce, 2)} kN and q = V/A = ${fmt(qService, 3)} kN/m2 over base area ${fmt(baseArea, 3)} m2.`,
    `B) LIVE LOAD CALCULATION REVIEW: live reaction ${fmt(c.pier?.loads.liveLoad, 2)} kN is visible through the service and ultimate live-load factors. This preserves the attached workbook's practice of separating live reaction before combining moments and stresses.`,
    `C) LOADS DUE TO WATER CURRENT REVIEW: hydrostatic ${fmt(c.pier?.loads.hydrostaticForce, 2)} kN plus drag/current ${fmt(c.pier?.loads.dragForce, 2)} kN gives horizontal action ${fmt(c.pier?.loads.totalHorizontalForce, 2)} kN. Flood case ${floodCase?.caseNumber ?? 0} reports M = ${fmt(floodCase?.moment, 2)} kN-m and buoyancy factor ${fmt(floodCase?.buoyancyFactor, 2)}.`,
    `D) SEISMIC CONDITION REVIEW: ${seismicCase ? `case ${seismicCase.caseNumber} (${seismicCase.description}) remains in the audit table with V = ${fmt(seismicCase.verticalForce, 2)} kN, H = ${fmt(seismicCase.horizontalForce, 2)} kN and M = ${fmt(seismicCase.moment, 2)} kN-m` : 'no seismic row is present in the generated set'}. A non-governing seismic result is still stated, not silently omitted.`,
    `E) WIND FORCE REVIEW: wind-factor cases are ${windCases.length ? windCases.map((lc) => `case ${lc.caseNumber}`).join(', ') : 'not governing'} and pier wind screening force is ${fmt(c.pier?.loads.windForce ?? 0, 2)} kN. Wind therefore remains part of the report audit trail even when water current controls.`,
    `BASE PRESSURE / STABILITY VERDICT: governing pier bearing case ${bearingCase?.caseNumber ?? 0} gives q = ${fmt(qBearing, 3)} kN/m2; pier minima are Sliding ${fmt(c.minPierSliding, 3)}, Overturning ${fmt(c.minPierOverturning, 3)}, Bearing ${fmt(c.minPierBearing, 3)}. ${verdict(c.minPierOk)}`,
    `ABUTMENT / FOUNDATION VERIFICATION: Type1 minima are Sliding ${fmt(c.minType1Sliding, 3)}, Overturning ${fmt(c.minType1Overturning, 3)}, Bearing ${fmt(c.minType1Bearing, 3)}; C1 minima are Sliding ${fmt(c.minC1Sliding, 3)}, Overturning ${fmt(c.minC1Overturning, 3)}, Bearing ${fmt(c.minC1Bearing, 3)}. This extends the source PCC abutment workbook's sill/foundation/seismic pressure checks into the final report narrative.`,
    `FINAL VERIFICATION LINE: computed values, narrative prose, report tables and annexure drawings are all generated from the same design state, so a revision to HFL, SBC, span, geometry or load class refreshes the whole report set. ${verdict(c.minPierOk)}`,
  ];
}

/** Single source of truth for HTML report, short PDF, and any export that needs the full workbook-aligned computation trace */
export interface FullComputationNarrativeChunk {
  title: string;
  paragraphs: string[];
}

export function getFullTechnicalComputationNarrativeChunks(
  input: EnhancedProjectInput,
): FullComputationNarrativeChunk[] {
  return [
    {
      title:
        '1 — Hydraulics (A, P, R, V, Q, regime width, afflux, scour, DWL, freeboard)',
      paragraphs: getHydraulicNarrativeParagraphs(input),
    },
    {
      title:
        '2 — Pier stability — STABILITY CHECK FOR PIER (dead / live / current / seismic / wind, q = V/A, FOS)',
      paragraphs: getSheetNarrativeParagraphs('STABILITY CHECK FOR PIER', input),
    },
    {
      title: '3 — Abutment Type 1 — TYPE1-STABILITY CHECK ABUTMENT',
      paragraphs: getSheetNarrativeParagraphs('TYPE1-STABILITY CHECK ABUTMENT', input),
    },
    {
      title: '4 — Abutment cantilever (C1) — C1-STABILITY CHECK ABUTMENT',
      paragraphs: getSheetNarrativeParagraphs('C1-STABILITY CHECK ABUTMENT', input),
    },
    {
      title: '5 — Structural envelope (deck reactions, currents, earth pressure link)',
      paragraphs: getStructuralNarrativeParagraphs(input),
    },
    {
      title: '6 — Design closure (traceability, foundation note, consistency)',
      paragraphs: getClosingNarrativeParagraphs(input),
    },
    {
      title: '7 — Verification audit (case-by-case review, same chain as Tech Report)',
      paragraphs: getVerificationNarrativeParagraphs(input),
    },
    {
      title: '8 — Estimation & BOQ trace',
      paragraphs: getSheetNarrativeParagraphs('ESTIMATION', input),
    },
  ];
}

function buildTechNoteNarrative(input: EnhancedProjectInput): string[] {
  return [
    `DESIGN STORY NOTE (TechNote) - DESIGN OF ${input.bridgeType === 'high-level' ? 'HIGH-LEVEL' : 'SUBMERSIBLE'} BRIDGE`,
    ...getHydraulicNarrativeParagraphs(input),
    ...getStructuralNarrativeParagraphs(input),
    ...getClosingNarrativeParagraphs(input),
  ];
}

function buildTechReportNarrative(input: EnhancedProjectInput): string[] {
  return [
    `DESIGN STORY NOTE (Tech Report) - DESIGN OF ${input.bridgeType === 'high-level' ? 'HIGH-LEVEL' : 'SUBMERSIBLE'} BRIDGE`,
    ...getVerificationNarrativeParagraphs(input),
  ];
}

function buildPierNarrative(input: EnhancedProjectInput): string[] {
  const c = narrativeContext(input);
  const cases = c.pier?.loadCases ?? [];
  const baseArea = (c.pier?.footing.width ?? input.pierBaseWidth) * (c.pier?.footing.length ?? input.pierBaseLength);
  const slidingCase = caseByMin(cases, 'slidingFOS');
  const overturningCase = caseByMin(cases, 'overturningFOS');
  const bearingCase = caseByMin(cases, 'bearingFOS');
  const serviceCase = cases.find((lc) => /service/i.test(lc.description)) ?? cases[0];
  const floodCase = cases.find((lc) => /flood/i.test(lc.description)) ?? cases[2];
  const seismicCase = cases.find((lc) => /seismic/i.test(lc.description)) ?? cases[3];
  const windCases = cases.filter((lc) => Number(lc.windLoadFactor) > 0);
  const windMoment = windCases.length ? Math.max(...windCases.map((lc) => lc.moment)) : 0;
  const qService = serviceCase && baseArea > 0 ? serviceCase.verticalForce / baseArea : undefined;
  const qBearing = bearingCase && baseArea > 0 ? bearingCase.verticalForce / baseArea : undefined;
  const pressureMax = c.pier?.footing.basePressure.max ?? qBearing;
  const pressureMin = c.pier?.footing.basePressure.min;
  return [
    'STORY - Pier stability is the equilibrium story in the legacy BEDACH pattern: DESIGN DATA first, then A) dead load, B) live load, C) water current, D) seismic, E) wind, and finally base-pressure/stability verdict.',
    `Design data: project ${input.projectName}; HFL ${fmt(input.hfl, 3)} m MSL; bed level ${fmt(input.bedLevel, 3)} m MSL; foundation level ${fmt(c.foundationLevel, 3)} m MSL; design water level ${fmt(c.dwl, 3)} m MSL; design discharge ${fmt(c.q, 2)} cumecs; velocity ${fmt(c.v, 3)} m/s; design scour ${fmt(c.scour, 3)} m; SBC ${fmt(input.sbc, 2)} kN/m2.`,
    `Design data: pier body ${fmt(c.pier?.geometry.width, 2)} m x ${fmt(c.pier?.geometry.length, 2)} m x ${fmt(c.pier?.geometry.depth, 2)} m; footing/base ${fmt(c.pier?.footing.width ?? input.pierBaseWidth, 2)} m x ${fmt(c.pier?.footing.length ?? input.pierBaseLength, 2)} m x ${fmt(c.pier?.footing.thickness, 2)} m; base area A = ${fmt(baseArea, 3)} m2; pier cap ${fmt(c.pier?.pierCap.width, 2)} m x ${fmt(c.pier?.pierCap.length, 2)} m x ${fmt(c.pier?.pierCap.thickness, 2)} m.`,
    `Step 1 - A) DEAD LOAD CALCULATION: computed pier/substructure dead load = ${fmt(c.pier?.loads.deadLoad, 2)} kN. The load-case table applies dead-load factors from ${cases.map((lc) => `${lc.caseNumber}:${fmt(lc.deadLoadFactor, 2)}`).join(', ') || 'not available'}, so the restoring vertical load remains traceable in each service, flood, seismic and ultimate row.`,
    `Step 2 - B) LIVE LOAD CALCULATION: maximum generated live-load reaction on the pier line = ${fmt(c.pier?.loads.liveLoad, 2)} kN. Service case ${serviceCase?.caseNumber ?? 0} uses live-load factor ${fmt(serviceCase?.liveLoadFactor, 2)}, while the ultimate case uses the governing live-load factor shown in the load table; this mirrors the legacy workbook's separate live reaction and moment disclosure before stress calculation.`,
    `C) LOADS DUE TO WATER CURRENT: hydraulic force is split into hydrostatic ${fmt(c.pier?.loads.hydrostaticForce, 2)} kN plus drag/current ${fmt(c.pier?.loads.dragForce, 2)} kN, giving total horizontal force ${fmt(c.pier?.loads.totalHorizontalForce, 2)} kN. Flood case ${floodCase?.caseNumber ?? 0} carries V = ${fmt(floodCase?.verticalForce, 2)} kN, H = ${fmt(floodCase?.horizontalForce, 2)} kN, M = ${fmt(floodCase?.moment, 2)} kN-m, with buoyancy factor ${fmt(floodCase?.buoyancyFactor, 2)}.`,
    `D) SEISMIC CONDITION: ${seismicCase ? `case ${seismicCase.caseNumber} (${seismicCase.description}) is retained with DL factor ${fmt(seismicCase.deadLoadFactor, 2)}, LL factor ${fmt(seismicCase.liveLoadFactor, 2)}, buoyancy factor ${fmt(seismicCase.buoyancyFactor, 2)}, V = ${fmt(seismicCase.verticalForce, 2)} kN and M = ${fmt(seismicCase.moment, 2)} kN-m` : 'no seismic case is present in the generated set'}. If the site zone makes seismic non-governing, the report still states the checked row rather than hiding the decision.`,
    `E) WIND FORCE: pier wind screening force = ${fmt(c.pier?.loads.windForce ?? 0, 2)} kN. Wind-factor cases are ${windCases.length ? windCases.map((lc) => `${lc.caseNumber} (${lc.description})`).join('; ') : 'not governing in this result set'}, and the maximum wind-combination moment read from the generated table is ${fmt(windMoment, 2)} kN-m.`,
    `BASE PRESSURE CALCULATION: service base pressure q = V/A = ${fmt(serviceCase?.verticalForce, 2)} / ${fmt(baseArea, 3)} = ${fmt(qService, 3)} kN/m2. Governing bearing case ${bearingCase?.caseNumber ?? 0} gives q = ${fmt(qBearing, 3)} kN/m2, while the footing pressure envelope reports qmax ${fmt(pressureMax, 3)} kN/m2 and qmin ${fmt(pressureMin, 3)} kN/m2 against SBC ${fmt(input.sbc, 2)} kN/m2.`,
    `STABILITY VERDICT: governing sliding is case ${slidingCase?.caseNumber ?? 0} with FOS ${fmt(c.minPierSliding, 3)}; governing overturning is case ${overturningCase?.caseNumber ?? 0} with FOS ${fmt(c.minPierOverturning, 3)}; governing bearing is case ${bearingCase?.caseNumber ?? 0} with FOS ${fmt(c.minPierBearing, 3)}. Compare against Sliding >= 1.50, Overturning >= 1.80, Bearing >= 2.50. ${verdict(c.minPierOk)}`,
  ];
}

function buildType1Narrative(input: EnhancedProjectInput): string[] {
  const c = narrativeContext(input);
  const ab = c.type1;
  const cases = ab?.loadCases ?? [];
  const baseArea = (ab?.geometry.baseWidth ?? 0) * (ab?.geometry.baseLength ?? 0);
  const serviceCase = cases.find((lc) => /service/i.test(lc.description)) ?? cases[0];
  const seismicCase = cases.find((lc) => /seismic/i.test(lc.description)) ?? cases.find((lc) => lc.windLoadFactor > 0);
  const bearingCase = caseByMin(cases, 'bearingFOS');
  const qService = serviceCase && baseArea > 0 ? serviceCase.verticalForce / baseArea : undefined;
  const qBearing = bearingCase && baseArea > 0 ? bearingCase.verticalForce / baseArea : undefined;
  return [
    'STORY - Type1 abutment stability follows the PCC open-foundation workbook pattern: input geometry, sill/foundation pressure, live-load surcharge, seismic row, and foundation-level stability must all be visible before the section is called safe.',
    `Design data: abutment height ${fmt(ab?.geometry.height ?? input.abutmentHeight, 2)} m, top/body width ${fmt(ab?.geometry.width, 2)} m, depth ${fmt(ab?.geometry.depth, 2)} m, base ${fmt(ab?.geometry.baseWidth, 2)} m x ${fmt(ab?.geometry.baseLength, 2)} m, base area ${fmt(baseArea, 3)} m2, foundation level ${fmt(c.foundationLevel, 3)} m MSL, SBC ${fmt(input.sbc, 2)} kN/m2.`,
    `Step 1 - A) DEAD LOAD / REACTION: abutment dead load is ${fmt(ab?.loads.deadLoad, 2)} kN and live reaction is ${fmt(ab?.loads.liveLoad, 2)} kN. Service case ${serviceCase?.caseNumber ?? 0} resolves V = ${fmt(serviceCase?.verticalForce, 2)} kN, H = ${fmt(serviceCase?.horizontalForce, 2)} kN, M = ${fmt(serviceCase?.moment, 2)} kN-m, giving service q = ${fmt(qService, 3)} kN/m2.`,
    `Step 2 - B) LIVE LOAD SURCHARGE / EARTH PRESSURE: Rankine Ka = ${fmt(ab?.earthPressure.ka, 3)}, active thrust Pa = ${fmt(ab?.earthPressure.pa, 2)} kN acting at ${fmt(ab?.earthPressure.location, 3)} m above base, and live-load surcharge component = ${fmt(ab?.loads.soilSurcharge, 2)} kN. This reproduces the attached abutment workbook's separation of dead reaction, live reaction and surcharge stress.`,
    `C) FOUNDATION PRESSURE AT SILL / BOTTOM LEVEL: governing bearing case ${bearingCase?.caseNumber ?? 0} gives q = ${fmt(qBearing, 3)} kN/m2 and bearing FOS ${fmt(c.minType1Bearing, 3)}. The report keeps the foundation-level pressure check visible against SBC ${fmt(input.sbc, 2)} kN/m2 before reinforcement or BOQ is accepted.`,
    `D) SEISMIC CONDITION: ${seismicCase ? `case ${seismicCase.caseNumber} (${seismicCase.description}) reports V = ${fmt(seismicCase.verticalForce, 2)} kN, H = ${fmt(seismicCase.horizontalForce, 2)} kN and M = ${fmt(seismicCase.moment, 2)} kN-m` : 'no separate seismic case is present in the current Type1 load-case set'}. Seismic is stated explicitly so a non-governing case is not mistaken for an omitted check.`,
    `BASE PRESSURE / STABILITY VERDICT: Type1 minima are Sliding ${fmt(c.minType1Sliding, 3)}, Overturning ${fmt(c.minType1Overturning, 3)}, Bearing ${fmt(c.minType1Bearing, 3)}. Compare against project acceptance before issuing abutment body, dirt wall, return wall, footing and cap reinforcement. ${verdict((c.minType1Sliding ?? 0) >= 1.5 && (c.minType1Overturning ?? 0) >= 1.8 && (c.minType1Bearing ?? 0) >= 2.5)}`,
  ];
}

function buildC1Narrative(input: EnhancedProjectInput): string[] {
  const c = narrativeContext(input);
  const ab = c.c1;
  const cases = ab?.loadCases ?? [];
  const baseArea = (ab?.geometry.baseWidth ?? 0) * (ab?.geometry.baseLength ?? 0);
  const serviceCase = cases.find((lc) => /service/i.test(lc.description)) ?? cases[0];
  const seismicCase = cases.find((lc) => /seismic/i.test(lc.description)) ?? cases.find((lc) => lc.windLoadFactor > 0);
  const bearingCase = caseByMin(cases, 'bearingFOS');
  const qService = serviceCase && baseArea > 0 ? serviceCase.verticalForce / baseArea : undefined;
  const qBearing = bearingCase && baseArea > 0 ? bearingCase.verticalForce / baseArea : undefined;
  return [
    'STORY - Cantilever abutment behaviour is the stem-footing interaction story: stem action, heel/toe pressure, live-load surcharge, seismic increment and foundation bearing must be read together, not as isolated calculations.',
    `Design data: C1 height ${fmt(ab?.geometry.height ?? input.abutmentHeight, 2)} m, base ${fmt(ab?.geometry.baseWidth, 2)} m x ${fmt(ab?.geometry.baseLength, 2)} m, base area ${fmt(baseArea, 3)} m2, Ka ${fmt(ab?.earthPressure.ka, 3)}, Pa ${fmt(ab?.earthPressure.pa, 2)} kN, Pa location ${fmt(ab?.earthPressure.location, 3)} m above base.`,
    `Step 1 - A) DEAD LOAD / LIVE LOAD: dead load ${fmt(ab?.loads.deadLoad, 2)} kN and live load ${fmt(ab?.loads.liveLoad, 2)} kN establish the vertical restoring system. Service case ${serviceCase?.caseNumber ?? 0} gives V = ${fmt(serviceCase?.verticalForce, 2)} kN and q = ${fmt(qService, 3)} kN/m2.`,
    `Step 2 - B) EARTH PRESSURE / SURCHARGE: earth-pressure load ${fmt(ab?.loads.earthPressure, 2)} kN plus soil surcharge ${fmt(ab?.loads.soilSurcharge, 2)} kN and water pressure ${fmt(ab?.loads.waterPressure, 2)} kN form the destabilising side of the cantilever equilibrium.`,
    `C) FOUNDATION CHECK: governing bearing case ${bearingCase?.caseNumber ?? 0} gives q = ${fmt(qBearing, 3)} kN/m2 against SBC ${fmt(input.sbc, 2)} kN/m2. This keeps the bottom-of-foundation pressure story aligned with the attached PCC abutment workbook.`,
    `D) SEISMIC CONDITION: ${seismicCase ? `case ${seismicCase.caseNumber} (${seismicCase.description}) reports V = ${fmt(seismicCase.verticalForce, 2)} kN, H = ${fmt(seismicCase.horizontalForce, 2)} kN and M = ${fmt(seismicCase.moment, 2)} kN-m` : 'no separate seismic case is present in the current cantilever load-case set'}.`,
    `BASE PRESSURE / STABILITY VERDICT: Cantilever minima are Sliding ${fmt(c.minC1Sliding, 3)}, Overturning ${fmt(c.minC1Overturning, 3)}, Bearing ${fmt(c.minC1Bearing, 3)}. Foundation pressure and stability acceptance must both pass before cantilever detailing is treated as final. ${verdict((c.minC1Sliding ?? 0) >= 1.5 && (c.minC1Overturning ?? 0) >= 1.8 && (c.minC1Bearing ?? 0) >= 2.5)}`,
  ];
}

function buildEstimateNarrative(input: EnhancedProjectInput): string[] {
  const total = input.estimation?.cost?.total;
  const boqCount = input.estimation?.boq?.length ?? 0;
  return [
    'STORY - Estimation is the quantity-traceability story: every amount should descend from verified geometry, reinforcement and material assumptions already accepted in design sheets.',
    `Design data: BOQ line count ${boqCount}, project total Rs ${fmt(total ?? 0, 2)}, and workbook-derived geometry driving concrete, steel, excavation, formwork and backfill items.`,
    'Step 1 - quantity extraction converts dimensions and reinforcement outputs into measurable line items.',
    `Step 2 - each line amount is quantity x rate and the schedule rolls up to Rs ${fmt(total ?? 0, 2)}.`,
    `Check: ${verdict(Boolean(total && Number.isFinite(total) && total > 0))} If any governing design sheet remains in CHECK status, the estimate must be treated as provisional.`,
  ];
}

export function getSheetNarrativeParagraphs(sheetName: string, input: EnhancedProjectInput): string[] {
  const normalized = sheetName.toLowerCase();
  if (normalized.includes('technote')) return buildTechNoteNarrative(input);
  if (normalized.includes('tech report')) return buildTechReportNarrative(input);
  if (normalized.includes('hydraulic') || normalized.includes('afflux')) return getHydraulicNarrativeParagraphs(input);
  if (normalized.includes('pier')) return buildPierNarrative(input);
  if (normalized.includes('type1') || normalized.includes('abutment')) return buildType1Narrative(input);
  if (normalized.includes('c1') || normalized.includes('cant')) return buildC1Narrative(input);
  if (normalized.includes('estimate') || normalized.includes('estimation') || normalized.includes('abstract') || normalized.includes('measurement')) {
    return buildEstimateNarrative(input);
  }
  return [
    `STORY - ${sheetName} belongs to the same engineering narrative chain: inputs must lead to visible design logic, then to computed values, and finally to a pass/check verdict.`,
    `Design data: project ${input.projectName}, bridge length ${fmt(input.totalLength)} m, span ${fmt(input.spanLength)} m, HFL ${fmt(input.hfl)} m MSL, SBC ${fmt(input.sbc)} kN/m2.`,
    'Step 1 - identify the governing phenomenon of this sheet rather than reusing unrelated formulas.',
    'Step 2 - carry the correct numbers from the same calculation model into the explanation so narration and design never drift apart.',
    'Check: only compliant calculations should read as Hence O.K.; everything else remains a review checkpoint.',
  ];
}

export function getSheetNarrativeText(sheetName: string, input: EnhancedProjectInput): string {
  return getSheetNarrativeParagraphs(sheetName, input).join('\n\n');
}

export function assertNarrativeHasNoPlaceholders(text: string, context: string): void {
  const forbiddenPatterns: Array<{ name: string; re: RegExp }> = [
    { name: 'NaN token', re: /\bNaN\b/ },
    { name: 'insert placeholder', re: /\[INSERT HERE\]/i },
    { name: 'encoding artifact', re: /(?:Ã¢â‚¬â€|â€”|Â°|Ï†|Î³)/ },
    { name: 'colon dash placeholder', re: /:\s-\s*([.,;:]|$)/ },
    { name: 'equals dash placeholder', re: /=\s-\s*([.,;:]|$)/ },
  ];

  for (const rule of forbiddenPatterns) {
    if (rule.re.test(text)) {
      throw new Error(`Narrative placeholder violation (${rule.name}) in ${context}: ${text}`);
    }
  }
}
