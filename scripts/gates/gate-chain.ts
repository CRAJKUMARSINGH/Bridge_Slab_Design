#!/usr/bin/env tsx
// gate-chain — no week starts on a broken week.
// 1 assertion: the ledger may not contain a GREEN week after the first non-GREEN
// week. The ledger holds PENDING/GREEN/RED per week, in dependency order, so a
// skipped week is visible rather than inferred from prose.
import { run, json, fail, LEDGER } from "./_lib";

await run("gate-chain", 1, async () => {
  const order = [
    "W00", "W01", "W02", "W02A", "W03", "W04", "W05", "W06", "W06A", "W07",
    "W07A", "W08", "W08A", "W09", "W09A", "W10", "W11", "W12", "W12A",
  ];
  const ledger = await json<Record<string, "GREEN" | "RED" | "PENDING">>(LEDGER);
  const unknown = Object.keys(ledger).filter((w) => !order.includes(w));
  const firstPending = order.findIndex((w) => ledger[w] !== "GREEN");
  const gaps = order.slice(Math.max(firstPending, 0)).filter((w) => ledger[w] === "GREEN" && order.indexOf(w) > firstPending);
  if (unknown.length) fail(`ledger names weeks outside the phase order: ${unknown.join(", ")}`);
  if (firstPending === -1) console.log("  next week to run: none — phase complete");
  else console.log(`  next week to run: ${order[firstPending]} (${ledger[order[firstPending]] ?? "missing"})`);
  if (gaps.length) fail(`gates marked GREEN out of order: ${gaps.join(", ")}`);
});
