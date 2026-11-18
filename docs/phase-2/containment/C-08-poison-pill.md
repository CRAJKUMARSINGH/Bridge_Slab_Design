# C-08 — POISON-PILL SUITE (PROVE THE BOUNDARIES WORK)
Why: a containment boundary that never fails is a diagram, not a control.

## CODE — scripts/containment/poison.ts
```ts
interface Pill { id: string; corrupt: () => Promise<void>; restore: () => Promise<void>; gate: string; expect: "FAIL" }

const PILLS: Pill[] = [
  { id: "P-01", gate: "gate:oracle", expect: "FAIL",
    corrupt: async () => mutateJson("corpus/oracle/GOLDEN-ORACLE.json", o => { o.bridges["SOM-KHW"].values[0].v *= 1.01 }),
    restore: async () => gitCheckout("corpus/oracle/GOLDEN-ORACLE.json") },
  { id: "P-02", gate: "gate:contracts", expect: "FAIL",
    corrupt: async () => prepend("lib/engine/src/index.ts", 'import x from "../../client/src/App";\n'),
    restore: async () => gitCheckout("lib/engine/src/index.ts") },
  { id: "P-03", gate: "verify:report", expect: "FAIL",
    corrupt: async () => flipOneByte("generated/report.pdf"),
    restore: async () => gitCheckout("generated/report.pdf") },
  { id: "P-04", gate: "gate:docs", expect: "FAIL",
    corrupt: async () => append("docs/phase-2/week-01/EXIT-GATE-EVIDENCE.md", "\n" + placeholder("LEFTOVER") + "\n"),
    restore: async () => gitCheckout("docs/phase-2/week-01/EXIT-GATE-EVIDENCE.md") },
  { id: "P-05", gate: "gate:claims", expect: "FAIL",
    corrupt: async () => mutateJson("containment/claims.json", c => { c.find((x:any)=>x.id==="C-001").status = "TRUE" }),
    restore: async () => gitCheckout("containment/claims.json") },
  { id: "P-06", gate: "gate:monotonic", expect: "FAIL",
    corrupt: async () => mutateJson("scripts/gates/.ratchet.json", r => { r["gate:oracle"].assertions += 10 }),
    restore: async () => gitCheckout("scripts/gates/.ratchet.json") },
];

/** and the proof of S-02: corrupting Tier 4 must NOT fail any gate */
const TIER4_PILLS = [
  { id: "P-07", gate: "*", expect: "PASS", corrupt: async () => overwrite("README.md", "# total nonsense\n"), restore: async () => gitCheckout("README.md") },
  { id: "P-08", gate: "*", expect: "PASS", corrupt: async () => overwrite("creat.md", "x\n"), restore: async () => gitCheckout("creat.md") },
];

for (const p of [...PILLS, ...TIER4_PILLS]) {
  await p.corrupt();
  const r = await runGate(p.gate);
  const ok = p.expect === "FAIL" ? r.code !== 0 : r.code === 0;
  console.log(`${ok ? "OK  " : "BAD "} ${p.id} ${p.gate} expected ${p.expect} got code ${r.code}`);
  await p.restore();
  if (!ok) failures.push(p.id);
}
```

## Exit gate
[ ] 6 boundary pills go red as expected
[ ] 2 Tier 4 pills leave every gate green — **this is the proof that Set 1's prose is harmless**
[ ] Suite runs in CI on every PR
[ ] A pill that stops failing is treated as a containment regression
