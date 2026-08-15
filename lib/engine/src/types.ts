/**
 * Core type definitions — Bridge Report Studio calculation engine
 */

export interface BridgeInputs {
  span:               number;  // m   Inputs!B3
  deckWidth:          number;  // m   Inputs!B4
  girderSpacing:      number;  // m   Inputs!B5
  girderCount:        number;  // -   Inputs!B6
  concreteGrade:      number;  // MPa Inputs!B7
  steelYieldStrength: number;  // MPa Inputs!B8
  deckThickness:      number;  // m   Inputs!B9
  liveLoadUDL:        number;  // kN/m Inputs!B10
  concentratedLoad:   number;  // kN  Inputs!B11
  secondMomentArea:   number;  // mm⁴ Inputs!B12
  sectionModulus:     number;  // mm³ Calc!B9
  alpha?:             number;  // -   Calc!B13  default 0.9
  correctionK3?:      number;  // -   Calc!B21  default 1.2
}

export type CheckStatus = "PASS" | "FAIL" | "REVIEW";

export interface TraceEntry {
  formula:            string;
  sourceCells:        string[];
  inputs:             string[];
  coefficients:       string[];
  migrationConstants?: Record<string, number>;
}

export interface TracedValue {
  value: number;
  unit:  string;
  trace: TraceEntry;
}

export interface ConstraintCheck {
  id:      string;
  label:   string;
  value:   number;
  limit?:  number;
  unit:    string;
  status:  CheckStatus;
  trace:   TraceEntry;
}

export interface CalculationResult {
  engineVersion:    string;
  calculatedAt:     string;
  inputFingerprint: string;

  // Intermediates
  designUDL:           TracedValue;
  maximumMoment:       TracedValue;
  maximumShear:        TracedValue;
  bendingStress:       TracedValue;
  liveLoadDeflection:  TracedValue;
  deflectionLimit:     TracedValue;
  shearStress:         TracedValue;

  // Constraint checks
  bendingUtilisation:           ConstraintCheck;
  deflectionCheck:              ConstraintCheck;
  shearCheck:                   ConstraintCheck;
  governingUtilisation:         ConstraintCheck;
  adjustedGoverningUtilisation: ConstraintCheck;

  // Summary
  overallStatus: CheckStatus;
  failedChecks:  string[];
  assumptions:   string[];
  limitations:   string[];
}
