# C-05 — CIRCULARITY DETECTION
Why: Set 1's "golden suite is green" was true and meaningless — green against a fixture
the app itself produced.

## CODE — scripts/gates/gate-circular.ts
```ts
export function findCircularity(graph: Map<string, Provenance>) {
  const findings: Finding[] = [];
  const visiting = new Set<string>(), done = new Set<string>();

  const walk = (id: string, path: string[]) => {
    if (done.has(id)) return;
    if (visiting.has(id)) { findings.push({ kind: "CYCLE", id, path: [...path, id] }); return; }
    visiting.add(id);
    for (const p of graph.get(id)?.derivedFrom ?? []) walk(p, [...path, id]);
    visiting.delete(id); done.add(id);
  };
  for (const id of graph.keys()) walk(id, []);

  for (const [id, p] of graph) {
    if (p.trust === "EXTERNAL") continue;
    const roots = externalRoots(id, graph);
    if (roots.size === 0) findings.push({ kind: "NO_EXTERNAL_ROOT", id });
    if (roots.size === 1 && roots.has(id)) findings.push({ kind: "SELF_ROOTED", id });
  }
  return findings;
}
```

## Rule
A fixture whose only ancestry is the engine that consumes it is **self-validating** and
must be marked as such. A fixture with a workbook ancestor is real evidence.

## Exit gate
[ ] gate:circular green: no cycles, no rootless artifacts, no self-rooted fixtures
[ ] The kherwara and high-level fixtures are re-rooted at their workbooks
[ ] Every gate names whether it validates against T0 or against app output
