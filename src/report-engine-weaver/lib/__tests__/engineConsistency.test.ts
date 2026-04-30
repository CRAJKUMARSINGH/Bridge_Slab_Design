import { describe, it, expect } from 'vitest';
import { calculateCompleteDesign } from '../../../../bridge-excel-generator/design-engine';
import { computeHydraulics, HydraulicInputs } from '../hydraulicCalc';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from '../../../../scripts/fixtures/kherwara-project-input';

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
    expect(excel.foundationDepth).toBeCloseTo(web.foundationDepth || 0, 2);
    expect(excel.foundationLevel).toBeCloseTo(web.foundationLevel || 0, 2);
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
    
    expect(excel.afflux).toBeCloseTo(web.afflux, 3);
  });

});
