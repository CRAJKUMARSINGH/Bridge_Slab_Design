// docs/audit/finding-schema.ts — the shape every audit finding must have.
//
// H-12: AUDIT-REPORT-v1.0.md recorded findings without saying HOW each one was
// established, so a finding inferred from a call site was indistinguishable from
// one that had been read, and BOLT-004 — a "phantom Drawing_Module alias" — was
// actioned although the alias it named was real. Two fields close that:
// `verifiedBy` names the evidence, `reCheck` is a command that re-establishes it
// against the tree.
//
// Rule: a finding whose verifiedBy is INFERRED_FROM_CALLSITE may not be
// actioned until its reCheck confirms it. scripts/audit/recheck.ts is what
// enforces that mechanically.
//
// `reCheck` must be a command that runs on every platform the repository is
// developed on. The v1.0 report's reCheck for BOLT-004 was a POSIX `test -f`,
// which fails on a Windows checkout and would have adjudicated the finding the
// wrong way for a reason that had nothing to do with the finding (ADR-0012: a
// check must be executable, not prose).
export type VerifiedBy = "READ" | "GREPPED" | "INFERRED_FROM_CALLSITE";

export interface Finding {
  id: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  title: string;
  file: string;
  verifiedBy: VerifiedBy;
  reCheck: string;
  status: "OPEN" | "CLOSED" | "FALSE_POSITIVE" | "DEFERRED";
  note?: string;
}
