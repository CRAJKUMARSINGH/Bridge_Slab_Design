// AUTO-GENERATED from docs/week-0/coefficients.json — DO NOT EDIT BY HAND.
// Regenerate: pnpm run gen:coefficients
export const COEFFICIENTS = {
  /** Gamma_G (self weight) [-] — Factors!B3 */
  GAMMA_G: 1.35,
  /** Gamma_Q (live load) [-] — Factors!B4 */
  GAMMA_Q: 1.5,
  /** Elastic modulus E (MPa) [MPa] — Factors!B7 */
  E_STEEL_MPA: 210000,
  /** Unit weight concrete (kN/m3) [kN/m] — Factors!B8 */
  UW_CONCRETE_KN_M3: 25,
  /** Unit weight asphalt (kN/m3) [kN/m] — Factors!B9 */
  UW_ASPHALT_KN_M3: 24,
  /** Shear capacity vc (MPa) [MPa] — Calc!B19 */
  SHEAR_CAPACITY_MPA: 2.5,
  /** Simply-supported moment divisor [-] — Calc!B6 */
  MOMENT_DIVISOR_SS: 8,
  /** Simply-supported shear divisor [-] — Calc!B7 */
  SHEAR_DIVISOR_SS: 2,
  /** kN·m → N·mm [-] — Calc!B10 */
  N_MM2_PER_KNM: 1000000,
  /** m → mm [-] — Calc!B14/B15/B18 */
  MM_PER_M: 1000,
  /** 5wL⁴/384EI numerator [-] — Calc!B14 */
  DEFLECTION_COEFF: 5,
  /** 5wL⁴/384EI denominator [-] — Calc!B14 */
  DEFLECTION_DENOM: 384,
  /** Utilisation limit [-] — Calc!B12 */
  UNITY: 1,
} as const;

export type CoefficientKey = keyof typeof COEFFICIENTS;

/** Workbook cell justifying each coefficient — consumed by the trace layer. */
export const COEFFICIENT_SOURCE: Record<CoefficientKey, string> = {
  GAMMA_G: 'Factors!B3',
  GAMMA_Q: 'Factors!B4',
  E_STEEL_MPA: 'Factors!B7',
  UW_CONCRETE_KN_M3: 'Factors!B8',
  UW_ASPHALT_KN_M3: 'Factors!B9',
  SHEAR_CAPACITY_MPA: 'Calc!B19',
  MOMENT_DIVISOR_SS: 'Calc!B6',
  SHEAR_DIVISOR_SS: 'Calc!B7',
  N_MM2_PER_KNM: 'Calc!B10',
  MM_PER_M: 'Calc!B14/B15/B18',
  DEFLECTION_COEFF: 'Calc!B14',
  DEFLECTION_DENOM: 'Calc!B14',
  UNITY: 'Calc!B12',
};
