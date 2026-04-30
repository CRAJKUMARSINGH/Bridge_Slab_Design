/**
 * Minimum vertical freeboard above **HFL** vs **design discharge Q** (m�/s).
 *
 * Stepped limits follow the usual IRC:5-2015 hydraulic practice (Section 106 family �
 * freeboard / vertical clearance related to magnitude of design flood discharge). Exact
 * clause numbers and breakpoints shall be verified against the project�s IRC:5 extract;
 * this table is the standard tiered screening used in many Indian bridge design offices.
 *
 * Discharge shall be the **design discharge** adopted for the hydraulic run (here: engine
 * continuity discharge Q = A�V after Manning).
 */

/** Upper bound of Q band (m�/s); use Infinity for the top band. */
const DISCHARGE_FREEBOARD_STEPS: { qUpper: number; minFreeboardM: number }[] = [
  { qUpper: 0.3, minFreeboardM: 0.5 },
  { qUpper: 3, minFreeboardM: 0.6 },
  { qUpper: 30, minFreeboardM: 0.75 },
  { qUpper: 200, minFreeboardM: 1.0 },
  { qUpper: 1000, minFreeboardM: 1.2 },
  { qUpper: Infinity, minFreeboardM: 1.5 },
];

export function ircMinimumFreeboardAboveHflFromDischarge(designDischargeCumecs: number): number {
  const Q = Number.isFinite(designDischargeCumecs) ? Math.max(0, designDischargeCumecs) : 0;
  for (const step of DISCHARGE_FREEBOARD_STEPS) {
    if (Q <= step.qUpper) return step.minFreeboardM;
  }
  return DISCHARGE_FREEBOARD_STEPS[DISCHARGE_FREEBOARD_STEPS.length - 1].minFreeboardM;
}
