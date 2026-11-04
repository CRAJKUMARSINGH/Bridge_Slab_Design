#!/usr/bin/env tsx
// gate-ratchet — the second half of "a gate may not silently stop checking"
// (docs/phase-2/containment/C-06-gate-monotonicity.md).
//
// The first half is the drift check in `_lib.run()`: a green run whose executed
// assertion count differs from the count it declared fails. That catches a gate
// that deletes a check and forgets the literal. It does NOT catch the same edit
// made deliberately — delete the check, lower the literal to match, and declared
// and executed agree again, so the gate is green while checking less than it did
// yesterday. This gate is what remembers yesterday.
//
// `_lib.markGreen()` records the HIGH-WATER assertion count of every gate in
// scripts/gates/.ratchet.json on each green run. This gate fails when a gate
// that is green today reports fewer assertions than that record.
//
// 2 assertions:
//   1. no gate that has gone GREEN is green today with fewer assertions than it
//      has ever run with.
//   2. every ADR in .ratchet.json is well-formed. An ADR is the documented way to
//      lower a count — C-06 requires it to name the assertion that was removed
//      and why that assertion was wrong. Asserting the shape of the record is
//      what stops `"adr": { "gate-x": {} }` from being a free pass to weaken a
//      gate.
//
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-ratchet: PASS|FAIL <n> assertions"
import { run, is, read, json, RATCHET, OUT } from "./_lib";
import { existsSync } from "node:fs";

type Adr = { removed?: string; why?: string; week?: string };
type Ratchet = { version?: string; gates?: Record<string, number>; adr?: Record<string, Adr> };

await run("gate-ratchet", 2, async () => {
  if (!existsSync(RATCHET)) {
    // No record yet. Nothing has ever gone green in this tree, so there is no
    // count that could have fallen. The file is created by the first green run.
    console.log(`  no ${RATCHET} yet — first pass, nothing to compare against`);
    is(true, "no gate assertion-count regression", "no ratchet recorded yet");
    is(true, "every ADR is well-formed", "no ratchet recorded yet");
    return;
  }

  const ratchet = await json<Ratchet>(RATCHET);
  const recorded = ratchet.gates ?? {};
  const adr = ratchet.adr ?? {};

  // 1. the count may not fall. Only enforced against gates that ran green in
  // this session: a gate that has not been run has no `.out` to compare, and
  // "not run" is not the same finding as "ran with fewer assertions".
  const regressions: string[] = [];
  for (const [gate, highWater] of Object.entries(recorded)) {
    const outPath = `${OUT}/${gate}.json`;
    if (!existsSync(outPath)) continue;
    try {
      const last = JSON.parse(await read(outPath)) as { assertions?: number; pass?: boolean };
      if (!last.pass) continue; // a red run is a finding in its own gate, not here
      const now = last.assertions ?? 0;
      if (now < highWater) regressions.push(`${gate}: has run with ${highWater} assertions, now reports ${now}`);
    } catch {
      /* an unreadable .out is not this gate's finding */
    }
  }
  console.log(`  ${Object.keys(recorded).length} gate(s) under the ratchet, ${Object.keys(adr).length} ADR(s)`);
  is(regressions.length === 0, "no gate assertion-count regression", regressions.join("\n"));

  // 2. the escape hatch is itself falsifiable.
  const bad: string[] = [];
  for (const [gate, a] of Object.entries(adr)) {
    const missing = (["removed", "why", "week"] as const).filter((k) => !a?.[k]).join(", ");
    if (missing) bad.push(`${gate}: ADR missing ${missing}`);
  }
  is(bad.length === 0, "every ADR is well-formed", bad.join("\n"));
});
