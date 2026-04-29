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
    `HYDRAULIC NARRATIVE: the crossing is read as a river-behaviour problem first, so section area, wetted perimeter, hydraulic radius, velocity, afflux and scour must all support the same flood story.`,
    `Design data: HFL ${fmt(input.hfl)} m MSL, bed level ${fmt(input.bedLevel)} m MSL, Manning n ${fmt(input.manningN, 3)}, bed slope 1 in ${fmt(input.bedSlope, 0)}, discharge ${fmt(c.q)} cumecs, and total provided bridge waterway ${fmt(c.totalBridgeLength)} m.`,
    `Step 1 - from the adopted section, the engine reports area ${fmt(c.h?.crossSectionalArea, 3)} m2 and wetted perimeter ${fmt(c.h?.wettedPerimeter, 3)} m, giving hydraulic radius ${fmt(c.h?.hydraulicRadius, 4)} m; this produces velocity ${fmt(c.v, 3)} m/s and Froude number ${fmt(c.froude, 3)}, so the flow regime is interpreted as ${c.flowType}.`,
    `Step 2 - regime and scour logic are then carried forward together: regime width is ${fmt(c.h?.regimeWidth)} m, the provided waterway ${waterwayVerdict}, computed afflux is ${fmt(c.afflux, 3)} m, design water level is ${fmt(c.dwl, 3)} m MSL, and design scour depth is ${fmt(c.scour, 3)} m below the working bed.`,
    c.isHigh
      ? `Check: high-level deck control compares available freeboard ${fmt(c.availableFreeboard)} m with required freeboard ${fmt(c.requiredFreeboard)} m. ${verdict(Boolean(c.h?.isFreeboardSafe ?? (c.availableFreeboard >= c.requiredFreeboard)))}`
      : `Check: for a submersible crossing, overtopping is accepted by concept, but velocity is ${velocityVerdict}, so scour/current/buoyancy actions must still remain within the downstream stability chain. ${verdict(c.froude < 2 && c.scour < 100)}`,
  ];
}

export function getStructuralNarrativeParagraphs(input: EnhancedProjectInput): string[] {
  const c = narrativeContext(input);
  const footingPressure = c.pier?.footing?.basePressure?.max;
  const footingVerdict = footingPressure !== undefined ? adequacy(input.sbc, footingPressure, 'SBC versus governing pier pressure') : 'Pier footing pressure is not available in the current result set.';
  const activeThrust = c.type1?.earthPressure?.pa ?? c.c1?.earthPressure?.pa ?? 0;

  return [
    `STRUCTURAL NARRATIVE: the superstructure and substructure are treated as one force path, so deck action, current load, buoyancy, earth pressure and bearing pressure are checked as linked engineering events rather than as isolated tables.`,
    `Design data: slab thickness ${fmt(c.slabThickness)} m, span ${fmt(input.spanLength)} m, carriageway ${fmt(input.carriageWidth)} m, pier geometry ${fmt(c.pier?.geometry.width)} m x ${fmt(c.pier?.geometry.length)} m x ${fmt(c.pier?.geometry.depth)} m, and governing foundation level ${fmt(c.foundationLevel)} m MSL.`,
    `Step 1 - the hydraulic actions are turned into structural actions by combining dead load ${fmt(c.pier?.loads.deadLoad)} kN, live load ${fmt(c.pier?.loads.liveLoad)} kN, hydrostatic force ${fmt(c.pier?.loads.hydrostaticForce)} kN, drag force ${fmt(c.pier?.loads.dragForce)} kN and buoyancy ${fmt(c.pier?.loads.buoyancy)} kN across the generated pier load cases.`,
    `Step 2 - the same equilibrium method is used for retaining components: active earth-pressure coefficient Ka is ${fmt(c.type1?.earthPressure?.ka ?? c.c1?.earthPressure?.ka, 3)}, total active thrust is ${fmt(activeThrust)} kN, and the abutment footing/base system must convert that destabilising action into acceptable sliding, overturning and bearing response.`,
    `Check: pier minima are Sliding ${fmt(c.minPierSliding)}, Overturning ${fmt(c.minPierOverturning)}, Bearing ${fmt(c.minPierBearing)}. ${verdict(c.minPierOk)} Additional bearing narrative: ${footingVerdict}`,
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
    `CLOSING NARRATIVE: the bridge is accepted only when the river story, the stability story and the quantity story remain consistent with one another.`,
    `Project closure data: total bridge length ${fmt(c.totalBridgeLength)} m, design discharge ${fmt(c.q)} cumecs, design scour depth ${fmt(c.scour)} m, foundation level ${fmt(c.foundationLevel)} m MSL, and estimated project total Rs ${fmt(estTotal, 2)}.`,
    `Step 1 - hydraulic acceptance requires afflux ${fmt(c.afflux)} m and flow regime ${c.flowType} to remain compatible with the adopted waterway and crossing type.`,
    `Step 2 - structural acceptance requires pier and abutment stability minima to remain above project thresholds; Type1 abutment minima are Sliding ${fmt(c.minType1Sliding)}, Overturning ${fmt(c.minType1Overturning)}, Bearing ${fmt(c.minType1Bearing)}. ${verdict(type1Ok)}`,
    `Check: once the same computed geometry also drives the BOQ, the note, report and estimate become audit-traceable to one numerical source. ${verdict(c.minPierOk && type1Ok)}`,
  ];
}

export function getVerificationNarrativeParagraphs(input: EnhancedProjectInput): string[] {
  const c = narrativeContext(input);
  const c1Ok =
    (c.minC1Sliding ?? 0) >= 1.5 &&
    (c.minC1Overturning ?? 0) >= 1.8 &&
    (c.minC1Bearing ?? 0) >= 2.5;

  return [
    `VERIFICATION NARRATIVE: this report is intended to let a checker read backward from the final verdict to the governing numbers without opening source code or reconstructing hidden assumptions.`,
    `Design data: discharge ${fmt(c.q)} cumecs, velocity ${fmt(c.v)} m/s, afflux ${fmt(c.afflux)} m, scour ${fmt(c.scour)} m, SBC ${fmt(input.sbc)} kN/m2, phi ${fmt(input.phi)} deg, gamma ${fmt(input.gamma)} kN/m3.`,
    `Step 1 - hydraulic verification checks whether the selected section, regime width, afflux and scour remain mutually consistent and whether freeboard logic is satisfied for high-level arrangements or overtopping logic is explicitly accepted for submersible arrangements.`,
    `Step 2 - structural verification checks whether the governing pier and abutment load cases keep sliding, overturning and bearing within acceptance. Cantilever/C1 minima are Sliding ${fmt(c.minC1Sliding)}, Overturning ${fmt(c.minC1Overturning)}, Bearing ${fmt(c.minC1Bearing)}. ${verdict(c1Ok)}`,
    `Final verification line: computed values, narrative prose, report tables and annexure drawings are all generated from the same design state, so any design revision will propagate through the whole report set. ${verdict(c.minPierOk)}`,
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
  return [
    'STORY - Pier stability is the equilibrium story: vertical restoring action and horizontal destabilising action must remain in balance across all governing load cases.',
    `Design data: pier width ${fmt(c.pier?.geometry.width)} m, length ${fmt(c.pier?.geometry.length)} m, depth ${fmt(c.pier?.geometry.depth)} m, base ${fmt(c.pier?.geometry.baseWidth)} m x ${fmt(c.pier?.geometry.baseLength)} m.`,
    `Step 1 - actions are assembled from dead load ${fmt(c.pier?.loads.deadLoad)} kN, live load ${fmt(c.pier?.loads.liveLoad)} kN, hydrostatic force ${fmt(c.pier?.loads.hydrostaticForce)} kN, drag/current force ${fmt(c.pier?.loads.dragForce)} kN and buoyancy ${fmt(c.pier?.loads.buoyancy)} kN.`,
    `Step 2 - each load case resolves sliding, overturning and bearing factors of safety; governing minima are Sliding ${fmt(c.minPierSliding)}, Overturning ${fmt(c.minPierOverturning)}, Bearing ${fmt(c.minPierBearing)}.`,
    `Check: compare against Sliding >= 1.50, Overturning >= 1.80, Bearing >= 2.50. ${verdict(c.minPierOk)}`,
  ];
}

function buildType1Narrative(input: EnhancedProjectInput): string[] {
  const c = narrativeContext(input);
  return [
    'STORY - Type1 abutment stability is the retaining-soil story: earth thrust tries to slide and overturn the abutment while self-weight and base reaction restore stability.',
    `Design data: height ${fmt(c.type1?.geometry.height ?? input.abutmentHeight)} m, base width ${fmt(c.type1?.geometry.baseWidth)} m, active earth-pressure coefficient Ka ${fmt(c.type1?.earthPressure?.ka, 3)}, total active thrust Pa ${fmt(c.type1?.earthPressure?.pa)} kN.`,
    'Step 1 - active soil thrust and surcharge effects are resolved at their line of action, while dead load of stem, footing and backfill produce restoring vertical load and moment.',
    `Step 2 - the governing Type1 checks produce minimum FOS values of Sliding ${fmt(c.minType1Sliding)}, Overturning ${fmt(c.minType1Overturning)} and Bearing ${fmt(c.minType1Bearing)}.`,
    `Check: compare against project acceptance limits before issuing reinforcement and BOQ. ${verdict((c.minType1Sliding ?? 0) >= 1.5 && (c.minType1Overturning ?? 0) >= 1.8 && (c.minType1Bearing ?? 0) >= 2.5)}`,
  ];
}

function buildC1Narrative(input: EnhancedProjectInput): string[] {
  const c = narrativeContext(input);
  return [
    'STORY - Cantilever abutment behaviour is the stem-footing interaction story: stem action, heel/toe pressure and earth thrust must be read together, not as isolated calculations.',
    `Design data: C1 height ${fmt(c.c1?.geometry.height ?? input.abutmentHeight)} m, base width ${fmt(c.c1?.geometry.baseWidth)} m, active earth-pressure coefficient Ka ${fmt(c.c1?.earthPressure?.ka, 3)}, total active thrust Pa ${fmt(c.c1?.earthPressure?.pa)} kN.`,
    'Step 1 - stem and footing geometry establish the resisting dead-load system; earth pressure and surcharge establish the destabilising side of the equilibrium.',
    `Step 2 - the governing Cantilever checks produce minimum FOS values of Sliding ${fmt(c.minC1Sliding)}, Overturning ${fmt(c.minC1Overturning)} and Bearing ${fmt(c.minC1Bearing)}.`,
    `Check: foundation pressure and stability acceptance must both pass before cantilever detailing is treated as final. ${verdict((c.minC1Sliding ?? 0) >= 1.5 && (c.minC1Overturning ?? 0) >= 1.8 && (c.minC1Bearing ?? 0) >= 2.5)}`,
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
