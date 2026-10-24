#!/usr/bin/env tsx
// gate-vacuity — the anti-padding meta-gate.
//
// The three guards this harness already has are each blind to the same trick.
//   _lib.run() fails a gate whose executed count differs from its declared count,
//   so a gate cannot silently stop checking. gate-ratchet fails a gate whose
//   declared count ever falls, so nobody can lower a number to hide a removal.
//   gate-proven-red fails a gate that has never been observed RED, so a gate
//   cannot be born already-green and untested.
//
// None of them notices an assertion that CANNOT FAIL. A gate that appends
// assertions whose first argument is the bare literal true keeps every one of
// those guards satisfied — the count matches, the count rises, and the gate does
// go RED when the pill is applied, because the pill trips the OTHER assertions.
// The padding assertions sit there inflating the number that the ratchet, the
// drift check and preflight P-10 all read as the measure of how much is being
// checked. A count is not a check.
//
// This gate makes the padding visible instead of forbidden: literal-true
// assertions may exist only in a declared budget in containment/VACUITY.json,
// and the budget must match reality in both directions.
//
// 3 assertions:
//   1. every gate file declares at least one assertion in its run() call.
//   2. no gate carries more literal-true assertions than its declared allowance.
//   3. no declared allowance is stale — every allowance still corresponds to a
//      real literal-true assertion in that gate.
//
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-vacuity: PASS|FAIL <n> assertions"
import { run, is, read, gateFiles, gateName } from "./_lib";
import { existsSync } from "node:fs";

const VAC = "containment/VACUITY.json";

// "is(" then optional whitespace then the bare token true then optional
// whitespace then a comma. Written with escaped parens so that this literal,
// sitting in this file's own source, is not itself matched when the gate scans
// gate-vacuity.ts.
const BARE_TRUE = /is\(\s*true\s*,/g;

// The harness call: run(<name-or-const>, <declared count>, async () => ...
// Matched generically because gate-proven-red passes the constant SELF rather
// than its own name as a string literal.
const DECLARED = /run\(\s*[^,()]+,\s*(\d+)\s*,/;

type Vacuity = { allowed?: Record<string, number> };

await run("gate-vacuity", 3, async () => {
  const gates = await gateFiles();
  const sources = new Map<string, string>();
  for (const g of gates) sources.set(gateName(g), await read(g));

  // 1. a gate that declares zero assertions is a stub wearing a gate's file name.
  const declaredCount = new Map<string, number>();
  const zeroDeclared: string[] = [];
  for (const [name, src] of sources) {
    const m = DECLARED.exec(src);
    const n = m ? Number(m[1]) : 0;
    declaredCount.set(name, n);
    if (n < 1) zeroDeclared.push(`${name} (${m ? "declares 0" : "no run(name, N, ...) call found"})`);
  }
  is(
    zeroDeclared.length === 0,
    "every gate declares at least one assertion",
    `declares no assertions: ${zeroDeclared.join(", ")}`,
  );

  // 2. the padding check.
  const vac: Vacuity = existsSync(VAC) ? (JSON.parse(await read(VAC)) as Vacuity) : {};
  const allowed = vac.allowed ?? {};
  const actual = new Map<string, number>();
  const overBudget: string[] = [];
  for (const [name, src] of sources) {
    const n = (src.match(BARE_TRUE) ?? []).length;
    actual.set(name, n);
    const budget = allowed[name] ?? 0;
    if (n > budget) {
      overBudget.push(
        `${name}: ${n} assertion(s) whose first argument is the literal true, allowance ${budget}` +
          ` — an assertion that cannot fail is not a check; remove it, or raise its number in ${VAC} and say why`,
      );
    }
  }
  is(
    overBudget.length === 0,
    "no gate pads its count with assertions that cannot fail",
    overBudget.join("\n"),
  );

  // 3. the budget may not be pre-paid. An allowance larger than the number of
  // literal-true assertions actually present is headroom for the next one, which
  // is exactly the silent-growth path this gate exists to close.
  const stale: string[] = [];
  for (const [name, budget] of Object.entries(allowed)) {
    const n = actual.get(name);
    if (n === undefined) stale.push(`${name}: allowance ${budget} but no gate file of that name`);
    else if (n < budget) stale.push(`${name}: allowance ${budget} but only ${n} literal-true assertion(s) present`);
  }
  is(
    stale.length === 0,
    "every declared allowance still matches a real literal-true assertion",
    stale.join("\n"),
  );
});
