# C-02 — SET 1 CLAIM LEDGER
Why: "weeks 1-15 implemented" and "week 3 of 15" were both true in the same repo.
Every Set 1 claim becomes a row. Nothing is assumed.

## CODE — containment/claims.schema.ts
```ts
export const ClaimSchema = z.object({
  id: z.string().regex(/^C-\d{3}$/),
  claim: z.string().min(10),
  source: z.string(),
  locator: z.string().optional(),
  status: z.enum(["TRUE", "FALSE", "PARTIAL", "UNADJ", "SUPERSEDED"]),
  counterEvidence: z.string().optional(),
  adjudicator: z.string().optional(),
  adjudicatedAt: z.string().optional(),
  closingWeek: z.string(),
  escapeId: z.string().optional(),
}).refine(c => c.status === "UNADJ" || (c.adjudicator && c.adjudicatedAt), "adjudicated claims need an adjudicator")
  .refine(c => c.status !== "FALSE" || c.counterEvidence, "FALSE needs counter-evidence");
```

## CODE — scripts/gates/gate-claims.ts
```ts
const claims = ClaimSchema.array().parse(JSON.parse(await readFile("containment/claims.json", "utf8")));
const now = Date.now();
for (const c of claims) {
  if (c.status === "UNADJ") {
    const age = (now - Date.parse(c.adjudicatedAt ?? c.closingWeekStart)) / 86_400_000;
    if (age > 7) fail(`${c.id} UNADJ for ${age.toFixed(1)} days`);
  }
  if (c.status === "FALSE" && !c.escapeId) fail(`${c.id} is FALSE with no escape register entry`);
}
pass(`${claims.length} claims, ${claims.filter(c => c.status === "UNADJ").length} unadjudicated`);
```

## Seeded from the analysis
C-001 lib/engine/src/ (FALSE) · C-003 kherwara fixtures valid (FALSE) ·
C-011 enrichment plan path (FALSE) · C-005 weeks 1-15 implemented (PARTIAL) ·
C-009 audit accuracy (UNADJ) · C-012 golden suite green (PARTIAL) · +6 more.

## Exit gate
[ ] Every README, creat.md, DEPLOY.md and tasks.md completion claim is a row
[ ] UNADJ older than 7 days fails the gate
[ ] Every FALSE has an escape register entry and a closing week
[ ] creat.md §13 links the ledger; the progress table is regenerated FROM it, never typed
