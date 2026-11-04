# C-04 — INDEPENDENT RE-DERIVATION
Why: an oracle derived from the app's own output proves nothing (Set 1 defect #6).
Every T1 artifact must be reproducible from T0 alone, by a different code path.

## CODE — scripts/containment/rederive.ts
```ts
/** Re-derive the oracle from the workbooks using the EXTRACTOR, not the engine. */
export async function rederiveOracle(): Promise<Diff[]> {
  const frozen = JSON.parse(await readFile("corpus/oracle/GOLDEN-ORACLE.json", "utf8"));
  const fresh = await extractFromWorkbooks("corpus/raw");   // independent path
  const diffs: Diff[] = [];

  for (const [code, b] of Object.entries(frozen.bridges) as any) {
    for (const v of b.values) {
      const got = fresh[code]?.values.find((x: any) => x.q === v.q);
      if (!got) { diffs.push({ code, q: v.q, kind: "MISSING_FROM_SOURCE" }); continue; }
      const rel = Math.abs(got.v - v.v) / Math.max(1e-9, Math.abs(v.v));
      if (rel > TOL[v.tol]) diffs.push({ code, q: v.q, kind: "MISMATCH", frozen: v.v, derived: got.v, rel });
      if (got.sheet !== v.sheet) diffs.push({ code, q: v.q, kind: "LOCATOR_DRIFT", frozen: v.sheet, derived: got.sheet });
    }
  }
  return diffs;
}

/** Every T1 artifact must have at least one T0 ancestor. */
export async function assertExternalAncestry() {
  const g = await loadDerivationGraph();
  for (const [id, p] of g) {
    if (p.trust !== "EXTERNAL" && !hasExternalRoot(id, g))
      fail(`${id} (${p.trust}) has no external root — circular`);
  }
}
```

## Rule
Re-derivation is run by the **verifier**, not the author, and its output is a diff
artifact, not a summary. A MISSING_FROM_SOURCE means the app invented a value.

## Exit gate
[ ] rederiveOracle produces zero MISMATCH for all three bridges
[ ] Zero artifacts without an external root
[ ] Every T1 artifact declares its T0 ancestry in ARTIFACT-TIERS.json
[ ] The diff artifact is committed, not summarised
