/**
 * Named coefficient registry — all engineering constants in one place.
 * No unexplained numeric literals in calculate.ts.
 */

export interface CoefficientEntry {
  value:      number;
  unit:       string;
  description:string;
  sourceCell: string;
}

export const COEFFICIENTS = {
  gammaG:              { value: 1.35,    unit: "—",       description: "Partial factor for dead loads",            sourceCell: "Factors!B1" },
  gammaQ:              { value: 1.50,    unit: "—",       description: "Partial factor for live loads",            sourceCell: "Factors!B2" },
  gammaM:              { value: 1.10,    unit: "—",       description: "Partial factor for material",              sourceCell: "Factors!B4" },
  elasticModulusSteel: { value: 210_000, unit: "MPa",     description: "Elastic modulus of steel",                 sourceCell: "Factors!B5" },
  concreteUnitWeight:  { value: 25,      unit: "kN/m³",  description: "Unit weight of reinforced concrete",       sourceCell: "Factors!B6" },
  asphaltUnitWeight:   { value: 24,      unit: "kN/m³",  description: "Unit weight of asphalt",                   sourceCell: "Factors!B7" },
  shearCapacity:       { value: 2.5,     unit: "MPa",     description: "Nominal shear capacity",                   sourceCell: "Factors!B8" },
  momentDivisor:       { value: 8,       unit: "—",       description: "Denominator in wL²/8",                    sourceCell: "migration-constant" },
  shearDivisor:        { value: 2,       unit: "—",       description: "Denominator in wL/2",                     sourceCell: "migration-constant" },
  deflectionNum:       { value: 5,       unit: "—",       description: "Numerator in 5wL⁴/384EI",                 sourceCell: "migration-constant" },
  deflectionDen:       { value: 384,     unit: "—",       description: "Denominator in 5wL⁴/384EI",               sourceCell: "migration-constant" },
  mToMm:               { value: 1_000,   unit: "mm/m",    description: "Metres to millimetres",                    sourceCell: "migration-constant" },
  kNmToNmm:            { value: 1_000_000, unit: "N·mm/kN·m", description: "kN·m to N·mm",                       sourceCell: "migration-constant" },
  kNToN:               { value: 1_000,   unit: "N/kN",    description: "kN to N",                                  sourceCell: "migration-constant" },
} as const;

export type CoefficientKey = keyof typeof COEFFICIENTS;
