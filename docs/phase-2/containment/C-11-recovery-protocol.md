# C-11 — RECOVERY & RE-BASELINING
Why: when a Set 1 error surfaces mid-Phase-2, the instinct is to patch it in place.
Patching in place destroys the evidence that it escaped.

## The five steps (in this order, no skipping)
1. **FREEZE** — stop the current week. Do not fix.
2. **REGISTER** — escape entry: what, where, how it escaped, which gate should have caught it.
3. **GATE** — write the gate that would have caught it. Run it. It must go RED.
4. **FIX** — now fix, and the new gate proves the fix.
5. **RE-BASELINE** — recompute affected fingerprints; mark affected runs and signed
   reports STALE_REVIEW_REQUIRED (G-07); bump the engine minor; notify.

## CODE — scripts/containment/escape.ts
```ts
export interface Escape {
  id: string;               // E-001
  foundAt: string; foundBy: string;
  artifact: string; tier: number;
  symptom: string;
  escapedBecause: string;   // "no gate existed" | "gate too weak" | "gate read prose"
  detectingGate: string;    // the gate written in step 3
  gateProvenRed: boolean;   // must be true before the fix lands
  blastRadius: string[];    // artifact ids
  reportsInvalidated: string[];
  fixedInCommit?: string;
  closedAt?: string;
}

export async function registerAndProve(e: Escape) {
  await appendEscape(e);
  if (!e.detectingGate) throw new Error("step 3 skipped");
  const r = await runGate(e.detectingGate);
  if (r.code === 0) throw new Error(`detecting gate ${e.detectingGate} did not go red — the boundary is still decorative`);
  await patchEscape(e.id, { gateProvenRed: true });
}
```

## Rule
An escape is not closed until its detecting gate has been **observed red** and then
observed green after the fix. A gate that was never red proves nothing.

## Exit gate
[ ] Escape register exists with the schema above
[ ] gate:escape green: every escape has a detecting gate and gateProvenRed
[ ] Every escape appears in the WEEKLY containment review
[ ] No escape closed without a commit reference
