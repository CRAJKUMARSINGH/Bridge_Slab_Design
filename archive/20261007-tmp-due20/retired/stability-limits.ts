/**
 * Stability acceptance limits shown in the UI.
 *
 * These mirror `STABILITY_ACCEPTANCE` in bridge-excel-generator/design-engine.ts, which is the
 * rule the engine adjudicates with and the workbook prints. The client cannot import it: nothing
 * in `client/src` pulls a runtime value from the generator (it imports types only), and making
 * that the first such edge would bundle the whole engine into the browser. The right fix is for
 * the API response to carry the limits alongside the factors — tracked as a due item, not done
 * here. Until then this file is the single place to update, and the values must move with the
 * engine's. Bearing is 1.0 (base pressure ≤ SBC) per the owner decision of 2026-10-06.
 */
export const STABILITY_LIMITS = {
  slidingFosMin: 1.5,
  overturningFosMin: 1.8,
  bearingFosMin: 1.0,
} as const;
