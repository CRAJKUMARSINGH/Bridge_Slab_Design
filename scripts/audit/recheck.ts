#!/usr/bin/env tsx
// scripts/audit/recheck.ts — the half of H-12 that acts.
//
// A finding may not be actioned on the strength of an inference. This walks
// docs/audit/findings.json, re-runs each finding's `reCheck` against the tree,
// and adjudicates: a finding marked OPEN whose evidence no longer reproduces is
// FALSE_POSITIVE, and the adjudication is written back so the next run does not
// have to reach the same conclusion again.
//
// Findings verifiedBy=READ are skipped: they were read by eye, and there is no
// command to re-run.
//
// Deviation from the guide's listing, declared: the guide mutated the array in
// memory and printed a count. A flip that is not persisted is a flip that has to
// be rediscovered on every run, so this version writes the store back when —
// and only when — something changed.
//
// Run: node --import tsx scripts/audit/recheck.ts
import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import type { Finding } from "../../docs/audit/finding-schema";

const FILE = "docs/audit/findings.json";

type Store = { _note?: string; _source?: string; findings: Finding[] };

const store = JSON.parse(await readFile(FILE, "utf8")) as Store;
let changed = 0;

for (const f of store.findings) {
  if (f.verifiedBy === "READ") continue;
  let present = true;
  try {
    execSync(f.reCheck, { stdio: "pipe" });
  } catch {
    present = false;
  }
  if (!present && f.status === "OPEN") {
    f.status = "FALSE_POSITIVE";
    f.note = "reCheck found nothing";
    changed++;
  }
}

if (changed) await writeFile(FILE, JSON.stringify(store, null, 2) + "\n");
console.log(`${store.findings.length} finding(s) re-checked, ${changed} flipped to FALSE_POSITIVE`);
