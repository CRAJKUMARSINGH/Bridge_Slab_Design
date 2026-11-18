# C-10 — RECONCILIATION (CLAIM vs LIVE REALITY)
Why: the ledger adjudicates once. Reality keeps moving.

## CODE — scripts/containment/reconcile.ts
```ts
const CHECKS: Record<string, (c: Claim) => Promise<Adjudication>> = {
  "file-exists": async c => existsSync(c.locator!) ? { status: "TRUE" } : { status: "FALSE", why: "path absent" },
  "sha-matches": async c => sha256(await readFile(c.locator!)) === c.expectedSha
      ? { status: "TRUE" } : { status: "FALSE", why: "hash drift" },
  "tests-pass": async c => (await runGate(c.locator!)).code === 0 ? { status: "TRUE" } : { status: "FALSE", why: "gate red" },
  "grep-absent": async c => (await grep(c.locator!, c.pattern!)).length === 0 ? { status: "TRUE" } : { status: "FALSE", why: "pattern still present" },
  "count-equals": async c => (await countMatches(c.locator!, c.pattern!)) === c.expected ? { status: "TRUE" } : { status: "FALSE", why: "count drift" },
};

export async function reconcile() {
  const claims = load();
  const drift: string[] = [];
  for (const c of claims) {
    if (!c.check) continue;
    const now = await CHECKS[c.check.kind]({ ...c, locator: c.check.target, pattern: c.check.pattern, expected: c.check.expected, expectedSha: c.check.sha });
    if (now.status !== c.status) drift.push(`${c.id}: ${c.status} -> ${now.status} (${now.why})`);
  }
  return drift;
}
```
Run weekly and on every PR touching `containment/`. Drift is not a failure — it is a
signal that a claim needs re-adjudication, and it writes a dated row.

## Exit gate
[ ] Every claim has a machine check where one is expressible
[ ] Weekly reconcile job scheduled; drift output committed
[ ] Drift on a VERIFIED claim opens an escape entry
