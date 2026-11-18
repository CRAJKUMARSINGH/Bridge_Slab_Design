# C-01 — TRUST TIER & PROVENANCE
Why: without tiers, a README typo and a coefficient error look identical.

## Tiers
T0 EXTERNAL  — workbooks, IRC/IS/MoRTH codes, geotech reports, client briefs. Not ours.
T1 AUTHORITATIVE — oracle, contracts, registries, defect register. 2-agent sign-off to change.
T2 DERIVED   — engine functions, checks, fixtures, gates. Gate-verified.
T3 DELIVERABLE — report, PDF, DXF, BOQ, pack. verify:* gated.
T4 NARRATIVE — README, creat.md, docs, ADRs. Zero downstream by construction.

## CODE — lib/trust/provenance.ts
```ts
export type TrustLevel = "EXTERNAL" | "VERIFIED" | "ASSERTED" | "ASSUMED";
const RANK: Record<TrustLevel, number> = { EXTERNAL: 3, VERIFIED: 2, ASSERTED: 1, ASSUMED: 0 };

export interface Provenance {
  source: string;                 // path, workbook, or clause
  locator?: string;               // sheet!cell, clause number, URL fragment
  sha256?: string;                // required for file sources
  derivedFrom?: string[];         // artifact ids — builds the derivation graph
  trust: TrustLevel;
  assertedBy?: string;            // required when trust === "ASSERTED"
  assertedAt?: string;
}

export class TrustError extends Error {}

export function assertTrust(p: Provenance, min: TrustLevel): Provenance {
  if (RANK[p.trust] < RANK[min])
    throw new TrustError(`${p.source} is ${p.trust}, needs ${min}${p.assertedBy ? ` (asserted by ${p.assertedBy})` : ""}`);
  if (p.trust !== "EXTERNAL" && p.source && !p.locator && !p.derivedFrom?.length)
    throw new TrustError(`${p.source}: ${p.trust} artifact needs a locator or a derivation`);
  return p;
}
```

## Rule
A consumer that needs VERIFIED may not accept ASSERTED. Set 1's outputs enter as
`ASSERTED` with `assertedBy` naming the week and the agent that claimed them. They are
promoted to VERIFIED only by C-04 re-derivation or by a passing gate.

## Exit gate
[ ] Every artifact in ARTIFACT-TIERS.json carries a Provenance
[ ] ASSERTED artifacts without a locator or derivation throw (test)
[ ] gate:trust green; a VERIFIED consumer reading an ASSERTED artifact fails (test)
