# G-07 — ENGINE VERSIONING & REPORT STALENESS
Prereq: W02 | Feeds: W05 (HARD), W10
The question this answers: "the engine changed — is my signed report still valid?"

## CODE — lib/engine/formula-registry.ts
```ts
export interface FormulaRecord {
  id: string; version: string; introduced: string;
  supersededBy?: string;
  invalidatesReports: boolean;      // true = a signed report must be re-reviewed
  clause: string; note?: string;
}

export const FORMULAS: Record<string, FormulaRecord> = {
  "HYD.MANNING":      { id:"HYD.MANNING", version:"1.0.0", introduced:"2026-11-01", invalidatesReports:true,  clause:"IRC:SP:13 Art.5" },
  "HYD.SCOUR.DSM":    { id:"HYD.SCOUR.DSM", version:"1.0.0", introduced:"2026-11-01", invalidatesReports:true, clause:"IRC:78 703.2.2.1" },
  "AFFLUX.MOLESWORTH":{ id:"AFFLUX.MOLESWORTH", version:"1.0.0", introduced:"2026-11-01", invalidatesReports:true, clause:"IS:7784 Pt-I" },
  "ABUT.KA":          { id:"ABUT.KA", version:"1.0.0", introduced:"2026-11-01", invalidatesReports:true,  clause:"Coulomb", note:"D-15 unresolved: source 0.496 vs textbook 0.271" },
  "PIER.BUOYANCY":    { id:"PIER.BUOYANCY", version:"1.0.0", introduced:"2026-11-01", invalidatesReports:true, clause:"-" },
  "BOQ.ROUNDING":     { id:"BOQ.ROUNDING", version:"1.0.0", introduced:"2026-11-01", invalidatesReports:false, clause:"MoRTH" },
};
```

## CODE — lib/engine/staleness.ts
```ts
export type Staleness = "CURRENT" | "STALE_RECOMPUTE" | "STALE_REVIEW_REQUIRED" | "SUPERSEDED";

export function assess(run: RunFingerprint, current: EngineVersion): { verdict: Staleness; reasons: string[] } {
  const reasons: string[] = [];
  if (run.engineVersion.engine === current.engine && run.engineVersion.coefficients === current.coefficients)
    return { verdict: "CURRENT", reasons };

  const changed = diffFormulaVersions(run.engineVersion, current);
  if (changed.some(id => FORMULAS[id]?.invalidatesReports)) {
    reasons.push(...changed.filter(id => FORMULAS[id]?.invalidatesReports).map(id => `${id} changed`));
    return { verdict: "STALE_REVIEW_REQUIRED", reasons };
  }
  reasons.push("non-invalidating formula changed");
  return { verdict: "STALE_RECOMPUTE", reasons };
}
```

## Rule
A change to any formula with `invalidatesReports: true` requires a **major** engine bump,
a `gate:engine-version` pass, and it flips every prior signed report to
STALE_REVIEW_REQUIRED. A non-invalidating change requires a **minor** bump and a
recompute offer. Patch bumps never invalidate.

## CODE — scripts/gates/gate-engine-version.ts
```ts
const base = await gitShow("HEAD~1:lib/engine/formula-registry.ts");
const head = await readFile("lib/engine/formula-registry.ts", "utf8");
const changed = diffRegistries(parse(base), parse(head));
for (const c of changed) {
  if (FORMULAS[c.id]?.invalidatesReports && !semverDiff(c.from, c.to).major)
    fail(`${c.id} invalidates reports but only got a ${semverDiff(c.from, c.to)} bump`);
}
pass(`${changed.length} formula versions checked`);
```

## Exit gate
[ ] formula-registry complete: every check in the code registry has a formula record
[ ] gate:engine-version green; a minor bump on an invalidating formula fails (test)
[ ] Stale reports are visibly marked, not silently recomputed
[ ] ENGINE-CHANGELOG.md auto-generated from the registry
[ ] Migration rules documented: what a user must do when a report goes stale
