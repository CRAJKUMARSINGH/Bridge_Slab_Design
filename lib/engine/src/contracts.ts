/**
 * Shared type contracts for the engine.
 *
 * Written in W02. Everything else depends on it.
 * Enforcement: gate:parity fails if any check has status === "FAIL" without
 * appearing in the report; verify:clauses fails if any codeRef is unregistered.
 */

export type CheckStatus = "PASS" | "FAIL" | "REVIEW" | "NOT_APPLICABLE";

export interface FormulaTrace {
  expression: string;              // "0.5 * w * h^2 * Ka"
  substituted: string;             // "0.5 * 18 * 6.15^2 * 0.496"
  result: number;
  unit: string;
  sourceCell?: string;             // "STABILITY CHECK ABUTMENT!D22"
  coefficientRefs: string[];        // ids into coefficient-registry
  clauseRef?: string;              // "IRC:6-2017 cl.214.3"
}

export interface CheckResult {
  id: string;                      // "ABUT-OT-FS"
  title: string;                   // "Abutment overturning stability"
  category: "STRENGTH" | "SERVICEABILITY" | "STABILITY" | "DURABILITY" | "HYDRAULIC" | "GEOMETRIC";
  codeRef: string;
  demand: number;
  capacity: number;
  utilisation: number;
  unit: string;
  status: CheckStatus;
  governing: boolean;
  trace: FormulaTrace[];
  reviewReason?: string;           // required when status === "REVIEW"
  assumptionRefs: string[];
}

export interface EngineVersion {
  engine: string;
  coefficients: string;
  codes: string;
}

export interface RunFingerprint {
  inputSha256: string;
  engineVersion: EngineVersion;
  registryVersions: Record<string, string>;
}

export type ReviewState = "DRAFT" | "REVIEW_READY" | "UNDER_REVIEW" | "REVIEWED" | "SUPERSEDED";

export interface DesignResult {
  runId: string;
  fingerprint: RunFingerprint;
  checks: CheckResult[];
  governingCheckId: string;
  reviewState: ReviewState;
  deviations: string[];            // SOURCE-DEFECT-REGISTER ids encountered
  producedAt: string;
}
