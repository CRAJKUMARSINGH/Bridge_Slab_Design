/**
 * Source-defect validations — W03 T3.10 / T3.11.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `docs/phase-2/week-02A/SOURCE-DEFECT-REGISTER.md` records the defects found in the
 * source workbooks. A register entry is a promise that the app will *behave* a
 * certain way when it meets the defect — warn, reject, or flag for review. Until W03
 * that promise had no code behind it. This module is the code: one exported
 * validation per W03-owned defect, each falsifiable and each tested in
 * `tests/integration/source-defects.test.ts`.
 *
 * THE ONE RULE THAT MATTERS
 * -------------------------
 * A validation NEVER silently "fixes" a source value (W03 §2, hard constraint). It
 * returns a verdict and a message; the caller decides. Nothing here rewrites an
 * input, snaps a value to a registry entry, or substitutes one quantity for another.
 *
 * W03 owns D-02, D-06, D-07, D-11 and D-12. D-01/D-03/D-04/D-13/D-14 (W06A),
 * D-05/D-10/D-15/D-16 (W07A) and D-08/D-09 (W09A) are owned by other weeks and are
 * NOT implemented here; an honest gap, recorded in REALITY-AUDIT.md.
 *
 * STATUS VOCABULARY. This module speaks the register's own words — OK / WARN /
 * REVIEW / REJECT — and maps them onto the `CheckStatus` contract:
 *
 *     OK     -> "PASS"    (the validation found nothing to report)
 *     WARN   -> "REVIEW"  (the contract has no WARN state; an unresolved warning is
 *                          not a pass, so it is surfaced as REVIEW and blocks a
 *                          REVIEWED transition. This is stricter than the register
 *                          requires for D-02 — stated, not hidden.)
 *     REVIEW -> "REVIEW"
 *     REJECT -> "FAIL"    (the check fails; it must appear in the report)
 *
 * Dependency-free at runtime: the only import is `import type`, which Node's
 * type-stripping loader erases, so the module runs under plain Node as well as tsx.
 */

import type { CheckResult, CheckStatus, ReviewState } from "../contracts.js";

/** The register's decision vocabulary, as this module returns it. */
export type ValidationSeverity = "OK" | "WARN" | "REVIEW" | "REJECT";

/** One validation verdict. `status` is the CheckStatus the verdict maps to. */
export interface DefectValidation {
  /** The source-defect id this verdict belongs to, e.g. "D-02". */
  defect: string;
  severity: ValidationSeverity;
  /** The CheckResult.status a caller should carry for this verdict. */
  status: CheckStatus;
  /** Human-readable reason. Always names the values, so a report is self-explanatory. */
  message: string;
}

/** Map a severity to the CheckStatus contract. Exported so callers and tests agree. */
export function statusForSeverity(severity: ValidationSeverity): CheckStatus {
  switch (severity) {
    case "OK":
      return "PASS";
    case "REJECT":
      return "FAIL";
    case "WARN":
    case "REVIEW":
      return "REVIEW";
  }
}

function verdict(defect: string, severity: ValidationSeverity, message: string): DefectValidation {
  return { defect, severity, status: statusForSeverity(severity), message };
}

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

// ── D-02 ─────────────────────────────────────────────────────────────────────
// A constant is reused across sections where it is not valid for the local section
// (a value derived for one geometry applied to another). Required behaviour: WARN.
// The register explicitly forbids "never reuse silently" — so this returns WARN, not
// OK, whenever the reused value disagrees with the local section's own value.

export interface ReusedConstantInput {
  /** Quantity name, e.g. "waterway base width". */
  name: string;
  /** The value valid for the local section (derived from the local geometry). */
  localValue: number;
  /** The value being reused, derived for `sourceSection`. */
  reusedValue: number;
  /** Where the reused value came from. */
  sourceSection: string;
  /** The section it is being applied to. */
  localSection: string;
  /** Relative tolerance within which the reuse counts as consistent. Default 1e-3. */
  relativeTolerance?: number;
}

export function validateReusedConstant(i: ReusedConstantInput): DefectValidation {
  if (!finite(i.localValue) || !finite(i.reusedValue)) {
    return verdict("D-02", "REVIEW", `D-02 ${i.name}: non-finite value supplied (local=${i.localValue}, reused=${i.reusedValue})`);
  }
  const tol = i.relativeTolerance ?? 1e-3;
  const scale = Math.max(Math.abs(i.localValue), Math.abs(i.reusedValue), Number.EPSILON);
  const relativeGap = Math.abs(i.localValue - i.reusedValue) / scale;
  if (relativeGap <= tol) {
    return verdict(
      "D-02",
      "OK",
      `D-02 ${i.name}: reused value ${i.reusedValue} agrees with the local section (${i.localSection}) within ${tol}`,
    );
  }
  return verdict(
    "D-02",
    "WARN",
    `D-02 ${i.name}: value ${i.reusedValue} derived for "${i.sourceSection}" is inconsistent with "${i.localSection}" ` +
      `(local ${i.localValue}; relative gap ${(relativeGap * 100).toFixed(2)}%). The reuse is not silent.`,
  );
}

// ── D-06 ─────────────────────────────────────────────────────────────────────
// A cell with non-zero area yields a zero force — a silently dropped load.
// Required behaviour: REVIEW.

export function validateNonZeroAreaZeroForce(area: number, force: number, label: string): DefectValidation {
  if (!finite(area) || !finite(force)) {
    return verdict("D-06", "REVIEW", `D-06 ${label}: non-finite area/force (area=${area}, force=${force})`);
  }
  if (area > 0 && force === 0) {
    return verdict(
      "D-06",
      "REVIEW",
      `D-06 ${label}: area ${area} is non-zero but the computed force is 0 — a load may have been silently dropped`,
    );
  }
  return verdict("D-06", "OK", `D-06 ${label}: area ${area}, force ${force} — no dropped-load signature`);
}

// ── D-07 ─────────────────────────────────────────────────────────────────────
// Live load: a vehicle load that matches NO registry entry. Required behaviour:
// REJECT. The registry is the five vehicles the register names. Class A is carried
// with the engine's current port value (VEHICLE_GEOMETRIES.ClassA.totalLoad = 554 kN
// = 55.4 T) and marked unreconciled: D-16 owns that reconciliation, so a match on an
// unreconciled entry is REVIEW, not OK. Nothing here changes a load — it rejects or
// flags it.

export interface LiveLoadVehicle {
  code: string;
  /** Total load in tonnes. */
  totalLoadT: number;
  /** Provenance of the value. */
  source: string;
  /** False when the value is not yet reconciled against the IRC:6 Annex (D-16). */
  reconciled: boolean;
}

/** Registry of live-load vehicles, per SOURCE-DEFECT-REGISTER.md D-07. */
// IRC:6 Annex B — the live-load vehicle registry the register names.
export const LIVE_LOAD_VEHICLE_REGISTRY: LiveLoadVehicle[] = [
  { code: "70R(W)", totalLoadT: 100, source: "register D-07 — 70R wheeled, 100 T", reconciled: true },
  { code: "70R(T)", totalLoadT: 70, source: "register D-07 — 70R tracked, 70 T", reconciled: true },
  { code: "AA(T)", totalLoadT: 70, source: "register D-07 — AA tracked, 70 T", reconciled: true },
  { code: "AA(W)", totalLoadT: 40, source: "register D-07 — AA wheeled, 2×20 T", reconciled: true },
  {
    code: "ClassA",
    totalLoadT: 55.4,
    source: "engine port — VEHICLE_GEOMETRIES.ClassA.totalLoad = 554 kN; D-16 reconciliation pending",
    reconciled: false,
  },
];

/** Match tolerance, in tonnes. */
const VEHICLE_MATCH_TOLERANCE_T = 0.1;

export function validateVehicleLoad(label: string, totalLoadT: number): DefectValidation {
  if (!finite(totalLoadT)) {
    return verdict("D-07", "REJECT", `D-07 ${label}: non-finite load ${totalLoadT} cannot be matched to the registry`);
  }
  const match = LIVE_LOAD_VEHICLE_REGISTRY.find(
    (v) => Math.abs(v.totalLoadT - totalLoadT) <= VEHICLE_MATCH_TOLERANCE_T,
  );
  if (!match) {
    return verdict(
      "D-07",
      "REJECT",
      `D-07 ${label}: load ${totalLoadT} T matches no vehicle in the registry ` +
        `(${LIVE_LOAD_VEHICLE_REGISTRY.map((v) => `${v.code} ${v.totalLoadT} T`).join(", ")})`,
    );
  }
  if (!match.reconciled) {
    return verdict(
      "D-07",
      "REVIEW",
      `D-07 ${label}: load ${totalLoadT} T matches ${match.code}, but that entry is not yet reconciled ` +
        `against the IRC:6 Annex (D-16) — ${match.source}`,
    );
  }
  return verdict("D-07", "OK", `D-07 ${label}: load ${totalLoadT} T matches registry entry ${match.code}`);
}

// ── D-11 ─────────────────────────────────────────────────────────────────────
// Foundation: carry BOTH permissible-stress criteria (soil vs rock) and state which
// governs. The values are the register's: 250 kN/m² soil; 8000 / −3600 kN/m² rock
// (compression / tension). Nothing is averaged or substituted.

export type FoundingStratum = "SOIL" | "ROCK";

export interface PermissibleStressCriterion {
  medium: FoundingStratum;
  /** Allowable bearing (compression) pressure, kN/m². */
  bearingKNPerM2: number;
  /** Allowable tension (uplift) pressure, kN/m²; negative when tension is permitted. */
  tensionKNPerM2: number;
}

export interface PermissibleStressCriteria {
  /** Both criteria, always carried — never one substituted for the other. */
  carried: PermissibleStressCriterion[];
  /** The criterion that governs for the founding stratum. */
  governing: FoundingStratum;
  governingBearingKNPerM2: number;
  governingTensionKNPerM2: number;
}

/** The two criteria the register records for the foundation check (D-11). */
export const FOUNDATION_PERMISSIBLE_STRESS: Record<FoundingStratum, PermissibleStressCriterion> = {
  SOIL: { medium: "SOIL", bearingKNPerM2: 250, tensionKNPerM2: 0 },
  ROCK: { medium: "ROCK", bearingKNPerM2: 8000, tensionKNPerM2: -3600 },
};

export function permissibleStressCriteria(stratum: FoundingStratum): PermissibleStressCriteria {
  const governing = FOUNDATION_PERMISSIBLE_STRESS[stratum];
  return {
    carried: [FOUNDATION_PERMISSIBLE_STRESS.SOIL, FOUNDATION_PERMISSIBLE_STRESS.ROCK],
    governing: stratum,
    governingBearingKNPerM2: governing.bearingKNPerM2,
    governingTensionKNPerM2: governing.tensionKNPerM2,
  };
}

// ── D-12 / T3.11 ─────────────────────────────────────────────────────────────
// An item whose code basis predates the current IRC edition must be emitted as
// REVIEW, must appear in the report, and must block a REVIEWED transition.

/** The current edition of the governing code, per the register (D-12). */
export const CURRENT_CODE_EDITION = "2017";

/** Extract a 4-digit edition year. Returns null when none is present. */
function editionYear(edition: string): number | null {
  const m = /(\d{4})/.exec(edition);
  return m ? Number(m[1]) : null;
}

export function validateCodeBasisEdition(item: string, itemEdition: string, currentEdition = CURRENT_CODE_EDITION): DefectValidation {
  const a = editionYear(itemEdition);
  const b = editionYear(currentEdition);
  if (a === null || b === null) {
    return verdict(
      "D-12",
      "REVIEW",
      `D-12 ${item}: edition not readable (item="${itemEdition}", current="${currentEdition}") — cannot prove currency`,
    );
  }
  if (a < b) {
    return verdict(
      "D-12",
      "REVIEW",
      `D-12 ${item}: code basis ${itemEdition} predates the current edition ${currentEdition} — REVIEW, blocks REVIEWED`,
    );
  }
  return verdict("D-12", "OK", `D-12 ${item}: code basis ${itemEdition} is not older than ${currentEdition}`);
}

// ── T3.11 ────────────────────────────────────────────────────────────────────
// REVIEW appears in the report and blocks a REVIEWED transition.

export interface ReviewTransitionDecision {
  allowed: boolean;
  /** The ids of the checks whose REVIEW status blocks the transition. */
  blockingCheckIds: string[];
  reason: string;
}

/**
 * Decide whether a design may move to `target` given its checks. Any check carrying
 * `status === "REVIEW"` blocks a transition to `REVIEWED` until it is resolved — the
 * REVIEW item cannot be quietly dropped from the report and signed off.
 */
export function reviewTransition(
  checks: Pick<CheckResult, "id" | "status">[],
  target: ReviewState,
): ReviewTransitionDecision {
  const blockers = checks.filter((c) => c.status === "REVIEW").map((c) => c.id);
  if (target !== "REVIEWED") {
    return { allowed: true, blockingCheckIds: [], reason: `target ${target} is not gated by REVIEW items` };
  }
  if (blockers.length > 0) {
    return {
      allowed: false,
      blockingCheckIds: blockers,
      reason: `cannot transition to REVIEWED: ${blockers.length} check(s) still REVIEW — ${blockers.join(", ")}`,
    };
  }
  return { allowed: true, blockingCheckIds: [], reason: "no REVIEW items block the transition to REVIEWED" };
}
