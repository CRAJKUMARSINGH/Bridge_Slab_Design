# C-12 — CONTAINMENT GOVERNANCE
## Weekly containment review (15 minutes, every week, before the gate closes)
1. New escapes this week? Each one's detecting gate observed red?
2. Any gate weakened? ADR present?
3. Any artifact promoted ASSERTED -> VERIFIED? By re-derivation, not by assertion?
4. Any undeclared artifact? Any Tier 4 ancestor in Tier 2?
5. Poison pills: all 8 behaving?
6. Claim ledger: anything UNADJ past 7 days?
Output: a dated row appended to containment/REVIEW-LOG.md.

## CODE — scripts/gates/gate-escape.ts
```ts
const escapes = loadEscapes();
const unresolved = escapes.filter(e => !e.closedAt);
for (const e of unresolved) {
  if (!e.detectingGate) fail(`${e.id}: no detecting gate`);
  if (!e.gateProvenRed) fail(`${e.id}: gate never proven red`);
}
const gates = await listGates();
const ungated = unresolved.filter(e => !gates.includes(e.detectingGate));
if (ungated.length) fail(`escapes without a live gate: ${ungated.map(e => e.id).join(", ")}`);
pass(`${escapes.length} escapes, ${unresolved.length} open, all gated`);
```

## ADR set required by Set 6
ADR-0001 tier model · ADR-0002 no-gate-reads-prose · ADR-0003 re-derivation requirement ·
ADR-0004 gate monotonicity · ADR-0005 contract freeze · ADR-0006 escape protocol ·
ADR-0007 Ka handling (D-15) · ADR-0008 .xls strategy.

## Exit gate
[ ] REVIEW-LOG.md started with week 0
[ ] All 8 ADRs written
[ ] gate:escape green
[ ] Containment section added to creat.md §13 and to PHASE-2-INDEX.md
[ ] The board's blast-radius map is generated from ARTIFACT-TIERS.json, not drawn by hand
