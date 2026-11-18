# C-06 — GATE MONOTONICITY (ANTI-WEAKENING)
Why: the fastest way to go green is to delete an assertion.

## CODE — scripts/gates/gate-monotonic.ts
```ts
interface Ratchet { [gate: string]: { assertions: number; tests: number; checks: string[] } }

export async function checkMonotonic() {
  const prev: Ratchet = JSON.parse(await readFile("scripts/gates/.ratchet.json", "utf8").catch(() => "{}"));
  const next: Ratchet = await measureAll();
  const regressions: string[] = [];

  for (const [gate, cur] of Object.entries(next)) {
    const old = prev[gate];
    if (!old) continue;
    if (cur.assertions < old.assertions) regressions.push(`${gate}: assertions ${old.assertions} -> ${cur.assertions}`);
    if (cur.tests < old.tests) regressions.push(`${gate}: tests ${old.tests} -> ${cur.tests}`);
    for (const c of old.checks) if (!cur.checks.includes(c)) regressions.push(`${gate}: lost check "${c}"`);
  }
  if (regressions.length && !hasAdr("weaken-gate"))
    fail(regressions.join("; ") + " — requires an ADR to weaken");
  await writeFile("scripts/gates/.ratchet.json", JSON.stringify(next, null, 2));
  pass(`${Object.keys(next).length} gates ratcheted`);
}
```

## Rule
Gates only get stronger. Weakening requires an ADR naming the assertion removed and
why it was wrong. `measureAll()` counts assertions by parsing gate output, and tests by
counting `it(`/`test(` declarations in the gate's own test file.

## Exit gate
[ ] .ratchet.json committed and seeded from the current gate set
[ ] Removing one assertion fails the gate without an ADR (test)
[ ] Adding an assertion never fails
