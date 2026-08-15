import { z } from "zod";

const finitePositive = z.number().finite().positive();
const finiteNonNegative = z.number().finite().nonnegative();

/**
 * This is the Week 0 demo contract recovered from the attached classifier
 * outputs. It deliberately contains only the ten Inputs-sheet variables and
 * the engineer-chosen Calc!B9 section modulus.
 */
export const bridgeDesignInputSchema = z.object({
  projectName: z.string().trim().min(1).default("KHERWARA / KHARKA DEMO"),
  projectCode: z.string().trim().min(1).default("KHERWARA"),
  revision: z.string().trim().min(1).default("draft"),
  spanLength: finitePositive,
  deckWidth: finitePositive,
  girderSpacing: finitePositive,
  numberOfGirders: z.number().int().positive(),
  concreteStrength: finitePositive,
  steelGrade: finitePositive,
  deckThickness: finitePositive,
  liveLoadUdl: finiteNonNegative,
  liveLoadPoint: finiteNonNegative,
  secondMoment: finitePositive,
  sectionModulus: finitePositive,
  alpha: finitePositive.default(0.9),
  correctionK3: finitePositive.default(1.2),
});

export type BridgeDesignInput = z.infer<typeof bridgeDesignInputSchema>;

export const bridgeDesignContract = {
  schemaVersion: "bridge-input.v1",
  description:
    "Week 0 demo contract recovered from the attached classifier and workbook evidence.",
  variables: [
    { id: "spanLength", label: "Span length L", units: "m", sourceCell: "Inputs!B3" },
    { id: "deckWidth", label: "Deck width W", units: "m", sourceCell: "Inputs!B4" },
    { id: "girderSpacing", label: "Girder spacing s", units: "m", sourceCell: "Inputs!B5" },
    { id: "numberOfGirders", label: "Number of girders n", units: "-", sourceCell: "Inputs!B6" },
    { id: "concreteStrength", label: "Concrete strength fck", units: "MPa", sourceCell: "Inputs!B7" },
    { id: "steelGrade", label: "Steel grade fy", units: "MPa", sourceCell: "Inputs!B8" },
    { id: "deckThickness", label: "Deck thickness t", units: "m", sourceCell: "Inputs!B9" },
    { id: "liveLoadUdl", label: "Live load UDL wl", units: "kN/m", sourceCell: "Inputs!B10" },
    { id: "liveLoadPoint", label: "Live load concentrated Q", units: "kN", sourceCell: "Inputs!B11" },
    { id: "secondMoment", label: "Second moment of area I", units: "mm4", sourceCell: "Inputs!B12" },
    { id: "sectionModulus", label: "Chosen section modulus Wc", units: "mm3", sourceCell: "Calc!B9" },
    { id: "alpha", label: "Parameter alpha", units: "-", sourceCell: "Calc!B13", default: 0.9 },
    { id: "correctionK3", label: "Correction k3", units: "-", sourceCell: "Calc!B21", default: 1.2 },
  ],
  coefficients: [
    { id: "gammaG", label: "Gamma_G (self weight)", value: 1.35, units: "-", sourceCell: "Factors!B3" },
    { id: "gammaQ", label: "Gamma_Q (live load)", value: 1.5, units: "-", sourceCell: "Factors!B4" },
    { id: "gammaM", label: "Gamma_M (steel)", value: 1.1, units: "-", sourceCell: "Factors!B5" },
    { id: "gammaC", label: "Gamma_c (concrete)", value: 1.5, units: "-", sourceCell: "Factors!B6" },
    { id: "elasticModulus", label: "Elastic modulus E", value: 210000, units: "MPa", sourceCell: "Factors!B7" },
    { id: "concreteUnitWeight", label: "Unit weight concrete", value: 25, units: "kN/m3", sourceCell: "Factors!B8" },
    { id: "asphaltUnitWeight", label: "Unit weight asphalt", value: 24, units: "kN/m3", sourceCell: "Factors!B9" },
    { id: "shearCapacity", label: "Shear capacity vc", value: 2.5, units: "MPa", sourceCell: "Calc!B19" },
  ],
  constraints: [
    { id: "Calc!B11", label: "Utilisation (bending)", inequality: "<= 1.0" },
    { id: "Calc!B12", label: "Bending check", inequality: "<= 1.0" },
    { id: "Calc!B16", label: "Deflection check", inequality: "<= limit" },
    { id: "Calc!B20", label: "Shear check", inequality: "<= capacity" },
    { id: "Calc!B22", label: "Governing utilisation", inequality: "<= 1.0" },
    { id: "Calc!B23", label: "Adjusted governing utilisation", inequality: "<= 1.0" },
  ],
} as const;

export type TraceRecord = {
  id: string;
  kind: "input" | "coefficient" | "intermediate" | "constraint" | "assumption";
  label: string;
  value: number | string | boolean;
  units: string;
  sourceCell?: string;
  formula?: string;
  source?: string;
};

export type ConstraintResult = {
  id: string;
  label: string;
  inequality: string;
  formula: string;
  value: number | string;
  gValue: number | null;
  status: "PASS" | "FAIL";
  sourceCell: string;
};

export type BridgeCalculationResult = {
  schemaVersion: "bridge-calculation.v1";
  project: Pick<BridgeDesignInput, "projectName" | "projectCode" | "revision">;
  input: BridgeDesignInput;
  intermediates: {
    deadLoadSlab: number;
    deadLoadAsphalt: number;
    designUdl: number;
    maxBendingMoment: number;
    maxShear: number;
    bendingStress: number;
    bendingUtilisation: number;
    deflectionLiveLoad: number;
    deflectionLimit: number;
    shearStress: number;
    governingUtilisation: number;
    adjustedGoverningUtilisation: number;
  };
  coefficients: {
    gammaG: number;
    gammaQ: number;
    gammaM: number;
    gammaC: number;
    elasticModulus: number;
    concreteUnitWeight: number;
    asphaltUnitWeight: number;
    asphaltThickness: number;
    deflectionLimitDenominator: number;
    shearCapacity: number;
    millimetresPerMetre: number;
    momentDivisor: number;
    shearDivisor: number;
    kiloNewtonMetresToNewtonMillimetres: number;
    deflectionNumerator: number;
    deflectionDenominator: number;
    sourceFactorB2: number;
  };
  constraints: ConstraintResult[];
  overallStatus: "PASS" | "FAIL";
  failedChecks: string[];
  traceRecords: TraceRecord[];
  assumptions: string[];
  reviewStatus: "DRAFT";
};

const COEFFICIENTS = {
  gammaG: 1.35,
  gammaQ: 1.5,
  gammaM: 1.1,
  gammaC: 1.5,
  elasticModulus: 210000,
  concreteUnitWeight: 25,
  asphaltUnitWeight: 24,
  asphaltThickness: 0.1,
  deflectionLimitDenominator: 250,
  shearCapacity: 2.5,
  millimetresPerMetre: 1000,
  momentDivisor: 8,
  shearDivisor: 2,
  kiloNewtonMetresToNewtonMillimetres: 1000000,
  deflectionNumerator: 5,
  deflectionDenominator: 384,
  /**
   * The attached demo workbook references Factors!B2 in Calc!B3/B4.
   * That source cell is blank, and the verified demo result is zero for both
   * dead-load intermediates. Retain this as an explicit parity assumption.
   */
  sourceFactorB2: 0,
} as const;

function inputTrace(
  input: BridgeDesignInput,
  key: keyof BridgeDesignInput,
  label: string,
  units: string,
  sourceCell: string,
): TraceRecord {
  const value = input[key];
  if (typeof value !== "number" && typeof value !== "string") {
    throw new Error(`Input ${String(key)} cannot be traced as a scalar`);
  }
  return {
    id: String(key),
    kind: "input",
    label,
    value,
    units,
    sourceCell,
  };
}

function intermediateTrace(
  id: string,
  label: string,
  value: number,
  units: string,
  sourceCell: string,
  formula: string,
): TraceRecord {
  return { id, kind: "intermediate", label, value, units, sourceCell, formula };
}

function coefficientTrace(
  id: string,
  label: string,
  value: number,
  units: string,
  sourceCell: string,
): TraceRecord {
  return { id, kind: "coefficient", label, value, units, sourceCell };
}

/**
 * Reproduces the formula sequence documented in the attached Week 0 workbook
 * and charter. Excel remains the parity reference; this function is the
 * authoritative user-facing calculation path for the migrated prototype.
 */
export function calculateBridgeDesign(value: unknown): BridgeCalculationResult {
  const input = bridgeDesignInputSchema.parse(value);
  const c = COEFFICIENTS;

  const deadLoadSlab =
    input.deckThickness * c.elasticModulus * c.sourceFactorB2;
  const deadLoadAsphalt =
    c.asphaltUnitWeight * c.concreteUnitWeight * c.sourceFactorB2;
  const designUdl = deadLoadSlab + deadLoadAsphalt + input.liveLoadUdl * c.gammaG;
  const maxBendingMoment =
    (designUdl * input.spanLength ** 2) / c.momentDivisor;
  const maxShear =
    (designUdl * input.spanLength) / c.shearDivisor +
    input.liveLoadPoint * c.gammaG;
  const bendingStress =
    (maxBendingMoment * c.kiloNewtonMetresToNewtonMillimetres) /
    input.sectionModulus;
  const bendingUtilisation = bendingStress / (input.steelGrade / c.gammaQ);
  const deflectionLiveLoad =
    (c.deflectionNumerator *
      input.liveLoadUdl *
      (input.spanLength * c.millimetresPerMetre) ** 4) /
    (c.deflectionDenominator * c.gammaM * input.secondMoment);
  const deflectionLimit =
    (input.spanLength * c.millimetresPerMetre) /
    c.deflectionLimitDenominator;
  const shearStress =
    (maxShear * c.millimetresPerMetre) /
    (input.numberOfGirders *
      input.deckWidth *
      c.millimetresPerMetre *
      input.deckThickness *
      c.millimetresPerMetre);
  const governingUtilisation = Math.max(
    bendingUtilisation,
    shearStress / c.shearCapacity,
  );
  const adjustedGoverningUtilisation =
    governingUtilisation * input.alpha * input.correctionK3;

  const constraints: ConstraintResult[] = [
    {
      id: "Calc!B11",
      label: "Utilisation (bending)",
      inequality: "bending utilisation <= 1.0",
      formula: "B10/(Inputs!B8/Factors!B4)",
      value: bendingUtilisation,
      gValue: bendingUtilisation - 1,
      status: bendingUtilisation <= 1 ? "PASS" : "FAIL",
      sourceCell: "Calc!B11",
    },
    {
      id: "Calc!B12",
      label: "Bending check",
      inequality: "bending utilisation <= 1.0",
      formula: 'IF(B11<=1,"OK","NOT OK")',
      value: bendingUtilisation <= 1 ? "OK" : "NOT OK",
      gValue: bendingUtilisation - 1,
      status: bendingUtilisation <= 1 ? "PASS" : "FAIL",
      sourceCell: "Calc!B12",
    },
    {
      id: "Calc!B16",
      label: "Deflection check",
      inequality: "deflection live load <= deflection limit",
      formula: 'IF(B14<=B15,"OK","NOT OK")',
      value: deflectionLiveLoad <= deflectionLimit ? "OK" : "NOT OK",
      gValue: deflectionLiveLoad - deflectionLimit,
      status: deflectionLiveLoad <= deflectionLimit ? "PASS" : "FAIL",
      sourceCell: "Calc!B16",
    },
    {
      id: "Calc!B20",
      label: "Shear check",
      inequality: "shear stress <= shear capacity",
      formula: 'IF(B18<=B19,"OK","NOT OK")',
      value: shearStress <= c.shearCapacity ? "OK" : "NOT OK",
      gValue: shearStress - c.shearCapacity,
      status: shearStress <= c.shearCapacity ? "PASS" : "FAIL",
      sourceCell: "Calc!B20",
    },
    {
      id: "Calc!B22",
      label: "Governing utilisation",
      inequality: "governing utilisation <= 1.0",
      formula: "MAX(B11,B18/B19)",
      value: governingUtilisation,
      gValue: governingUtilisation - 1,
      status: governingUtilisation <= 1 ? "PASS" : "FAIL",
      sourceCell: "Calc!B22",
    },
    {
      id: "Calc!B23",
      label: "Adjusted governing utilisation",
      inequality: "adjusted governing utilisation <= 1.0",
      formula: "B22*B13*B21",
      value: adjustedGoverningUtilisation,
      gValue: adjustedGoverningUtilisation - 1,
      status: adjustedGoverningUtilisation <= 1 ? "PASS" : "FAIL",
      sourceCell: "Calc!B23",
    },
  ];

  const failedChecks = constraints
    .filter((constraint) => constraint.status === "FAIL")
    .map((constraint) => constraint.id);

  const traceRecords: TraceRecord[] = [
    inputTrace(input, "spanLength", "Span length L", "m", "Inputs!B3"),
    inputTrace(input, "deckWidth", "Deck width W", "m", "Inputs!B4"),
    inputTrace(input, "girderSpacing", "Girder spacing s", "m", "Inputs!B5"),
    inputTrace(
      input,
      "numberOfGirders",
      "Number of girders n",
      "-",
      "Inputs!B6",
    ),
    inputTrace(
      input,
      "concreteStrength",
      "Concrete strength fck",
      "MPa",
      "Inputs!B7",
    ),
    inputTrace(input, "steelGrade", "Steel grade fy", "MPa", "Inputs!B8"),
    inputTrace(
      input,
      "deckThickness",
      "Deck thickness t",
      "m",
      "Inputs!B9",
    ),
    inputTrace(
      input,
      "liveLoadUdl",
      "Live load UDL wl",
      "kN/m",
      "Inputs!B10",
    ),
    inputTrace(
      input,
      "liveLoadPoint",
      "Live load concentrated Q",
      "kN",
      "Inputs!B11",
    ),
    inputTrace(
      input,
      "secondMoment",
      "Second moment of area I",
      "mm4",
      "Inputs!B12",
    ),
    inputTrace(
      input,
      "sectionModulus",
      "Chosen section modulus Wc",
      "mm3",
      "Calc!B9",
    ),
    coefficientTrace("gammaG", "Gamma_G (self weight)", c.gammaG, "-", "Factors!B3"),
    coefficientTrace("gammaQ", "Gamma_Q (live load)", c.gammaQ, "-", "Factors!B4"),
    coefficientTrace("gammaM", "Gamma_M (steel)", c.gammaM, "-", "Factors!B5"),
    coefficientTrace("gammaC", "Gamma_c (concrete)", c.gammaC, "-", "Factors!B6"),
    coefficientTrace(
      "elasticModulus",
      "Elastic modulus E",
      c.elasticModulus,
      "MPa",
      "Factors!B7",
    ),
    coefficientTrace(
      "concreteUnitWeight",
      "Unit weight concrete",
      c.concreteUnitWeight,
      "kN/m3",
      "Factors!B8",
    ),
    coefficientTrace(
      "asphaltUnitWeight",
      "Unit weight asphalt",
      c.asphaltUnitWeight,
      "kN/m3",
      "Factors!B9",
    ),
    coefficientTrace(
      "shearCapacity",
      "Shear capacity vc",
      c.shearCapacity,
      "MPa",
      "Calc!B19",
    ),
    intermediateTrace(
      "deadLoadSlab",
      "Dead load slab g_slab",
      deadLoadSlab,
      "kN/m",
      "Calc!B3",
      "Inputs!B9*Factors!B7*Factors!B2",
    ),
    intermediateTrace(
      "deadLoadAsphalt",
      "Dead load asphalt g_asph",
      deadLoadAsphalt,
      "kN/m",
      "Calc!B4",
      "Factors!B9*Factors!B8*Factors!B2",
    ),
    intermediateTrace(
      "designUdl",
      "Design UDL including live load",
      designUdl,
      "kN/m",
      "Calc!B5",
      "B3+B4+Inputs!B10*Factors!B3",
    ),
    intermediateTrace(
      "maxBendingMoment",
      "Maximum bending moment M",
      maxBendingMoment,
      "kN*m",
      "Calc!B6",
      "B5*Inputs!B3^2/8",
    ),
    intermediateTrace(
      "maxShear",
      "Maximum shear V",
      maxShear,
      "kN",
      "Calc!B7",
      "B5*Inputs!B3/2+Inputs!B11*Factors!B3",
    ),
    intermediateTrace(
      "bendingStress",
      "Bending stress demand",
      bendingStress,
      "MPa",
      "Calc!B10",
      "B6*1000000/B9",
    ),
    intermediateTrace(
      "bendingUtilisation",
      "Bending utilisation U_b",
      bendingUtilisation,
      "-",
      "Calc!B11",
      "B10/(Inputs!B8/Factors!B4)",
    ),
    intermediateTrace(
      "deflectionLiveLoad",
      "Deflection live load",
      deflectionLiveLoad,
      "mm",
      "Calc!B14",
      "5*Inputs!B10*(Inputs!B3*1000)^4/(384*Factors!B5*Inputs!B12)",
    ),
    intermediateTrace(
      "deflectionLimit",
      "Deflection limit",
      deflectionLimit,
      "mm",
      "Calc!B15",
      "Inputs!B3*1000/Factors!B10",
    ),
    intermediateTrace(
      "shearStress",
      "Shear stress demand",
      shearStress,
      "MPa",
      "Calc!B18",
      "B7*1000/(Inputs!B6*Inputs!B4*1000*Inputs!B9*1000)",
    ),
    intermediateTrace(
      "governingUtilisation",
      "Governing utilisation",
      governingUtilisation,
      "-",
      "Calc!B22",
      "MAX(B11,B18/B19)",
    ),
    intermediateTrace(
      "adjustedGoverningUtilisation",
      "Adjusted governing utilisation",
      adjustedGoverningUtilisation,
      "-",
      "Calc!B23",
      "B22*B13*B21",
    ),
    {
      id: "assumption:factor-b2",
      kind: "assumption",
      label: "Blank source factor retained for workbook parity",
      value: "Factors!B2 is blank in the attached demo workbook; Calc!B3 and Calc!B4 therefore remain zero.",
      units: "-",
      sourceCell: "Factors!B2",
    },
  ];

  return {
    schemaVersion: "bridge-calculation.v1",
    project: {
      projectName: input.projectName,
      projectCode: input.projectCode,
      revision: input.revision,
    },
    input,
    intermediates: {
      deadLoadSlab,
      deadLoadAsphalt,
      designUdl,
      maxBendingMoment,
      maxShear,
      bendingStress,
      bendingUtilisation,
      deflectionLiveLoad,
      deflectionLimit,
      shearStress,
      governingUtilisation,
      adjustedGoverningUtilisation,
    },
    coefficients: c,
    constraints,
    overallStatus: failedChecks.length === 0 ? "PASS" : "FAIL",
    failedChecks,
    traceRecords,
    assumptions: [
      "The formula sequence is migrated from the attached Week 0 demo workbook and is not a substitute for licensed engineering review.",
      "Excel remains the parity reference until an approved canonical workbook is selected.",
      "Factors!B2 is blank in the attached demo workbook and is retained as zero rather than silently corrected.",
      "Alpha and correction k3 use the attached demo decisions as visible engineer-controlled defaults.",
    ],
    reviewStatus: "DRAFT",
  };
}