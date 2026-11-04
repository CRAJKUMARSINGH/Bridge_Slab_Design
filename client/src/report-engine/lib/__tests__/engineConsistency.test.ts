import { describe, it, expect } from 'vitest';
import { calculateCompleteDesign } from '../../../../../bridge-excel-generator/design-engine';
import { computeHydraulics, HydraulicInputs } from '../hydraulicCalc';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from '../../../../../scripts/fixtures/kherwara-project-input';

describe('Hydraulics Engine Consistency (Category D)', () => {
  
  it('D01: Same input should yield identical scour depth and foundation depth', () => {
    const input = KHERWARA_REFERENCE_PROJECT_INPUT;
    
    // 1. Run Excel Design Engine
    const { hydraulics: excel } = calculateCompleteDesign(input, { quiet: true });
    
    // 2. Prepare Web UI Engine Inputs
    const webInput: HydraulicInputs = {
      workName: input.projectName,
      crossSectionPoints: input.crossSectionData.map(p => ({ chainage: p.chainage, bedLevel: p.gl })),
      slope: input.bedSlope,
      rugosity: input.manningN,
      dischargeMethod: 'manning',
      numSpans: input.numberOfSpans,
      spanLength: input.spanLength,
      numPiers: input.numberOfPiers,
      pierWidth: input.pierWidth,
      numAbutments: 2,
      abutTopWidth: input.abutmentWidth, // simplified for check
      abutBottomWidth: input.abutmentWidth,
      hfl: input.hfl,
      avgRiverBedLevel: input.bedLevel,
      lwl: input.dwl,
      lbl: input.bedLevel,
      sofitLevel: input.rtl - (input.deckSlabThickness || 0.25),
      topOfDeck: input.rtl,
      deckThickness: input.deckSlabThickness || 0.25,
      siltFactor: input.laceysSiltFactor,
      F1: input.f1Factor,
      F2: input.f2Factor
    };
    
    // 3. Run Web UI Engine
    const web = computeHydraulics(webInput);
    
    // 4. Compare Results
    // Note: Use a small epsilon for float comparisons
    expect(excel.discharge).toBeCloseTo(web.discharge, 1);
    expect(excel.scourDepth).toBeCloseTo(web.meanScourDepth, 2);
    expect(excel.designScourDepth).toBeCloseTo(web.maxScourDepth, 2);

    // excel.foundationDepth is the AS-BUILT depth below bed (bedLevel - foundationLevel, both
    // project inputs); web.foundationDepth is the CODE-PRESCRIBED minimum below HFL (F2 x 2 x d2).
    // They are different quantities and were never comparable — asserting equality tested nothing.
    expect(excel.foundationDepth).toBeCloseTo(input.bedLevel - input.foundationLevel, 6);

    // The engine's own scour-founding guard, now a returned value instead of only an engineLog line.
    expect(excel.minFoundingLevelForScour).toBeCloseTo(input.bedLevel - excel.designScourDepth, 6);
    expect(excel.isFoundingLevelSafe).toBe(
      input.foundationLevel <= (excel.minFoundingLevelForScour as number),
    );

    // PINNED UNSAFE: the Kherwara reference project founds at 92.60 against a required 91.80,
    // i.e. 0.80 m too high — the pier is at risk of undermining. Owner decision pending (row 1
    // sign-off). If the input is ever deepened this pin fails and must be updated deliberately.
    expect(excel.isFoundingLevelSafe).toBe(false);
  });

  it('D02: Same input should yield identical afflux', () => {
    const input = KHERWARA_REFERENCE_PROJECT_INPUT;
    const { hydraulics: excel } = calculateCompleteDesign(input, { quiet: true });
    
    const webInput: HydraulicInputs = {
      workName: input.projectName,
      crossSectionPoints: input.crossSectionData.map(p => ({ chainage: p.chainage, bedLevel: p.gl })),
      slope: input.bedSlope,
      rugosity: input.manningN,
      dischargeMethod: 'manning',
      numSpans: input.numberOfSpans,
      spanLength: input.spanLength,
      numPiers: input.numberOfPiers,
      pierWidth: input.pierWidth,
      numAbutments: 2,
      abutTopWidth: input.abutmentWidth,
      abutBottomWidth: input.abutmentWidth,
      hfl: input.hfl,
      avgRiverBedLevel: input.bedLevel,
      lwl: input.dwl,
      lbl: input.bedLevel,
      sofitLevel: input.rtl - (input.deckSlabThickness || 0.25),
      topOfDeck: input.rtl,
      deckThickness: input.deckSlabThickness || 0.25,
      siltFactor: input.laceysSiltFactor,
      F1: input.f1Factor,
      F2: input.f2Factor
    };
    
    const web = computeHydraulics(webInput);
    
    // Engines use different intermediate rounding/model assumptions; enforce bounded drift.
    expect(Math.abs(excel.afflux - web.afflux)).toBeLessThanOrEqual(0.08);
  });

});
