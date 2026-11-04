#!/usr/bin/env tsx
// gate-contracts — the inter-set boundary CONTRACT.md declares, made falsifiable.
//
// containment/CONTRACT.md has said since it was frozen that "hash enforcement is
// provided by gate:contracts (not yet installed)". Until this file existed that
// sentence was honest: the boundary it describes — a table of allowed imports
// between sets — was a declaration nothing executed. A declaration that nothing
// executes is the failure this harness exists to stop, because the table can
// drift away from the tree and no run objects.
//
// The half of that boundary a gate can check without building a module graph is
// the engine pin: which files ARE the authoritative engine, and whether every one
// of them is still the bytes that were reviewed. foundation/manifest.json names
// them, foundation/engine.lock.json pins their sha256, and this gate refuses to
// let those two disagree with each other or with the disk.
//
// 4 assertions:
//   1. the manifest declares an authoritativeEngine and a non-empty engineModules list.
//   2. engine.lock.json pins exactly the declared modules — nothing missing, nothing orphaned.
//   3. every pinned hash still equals the sha256 of the file on disk.
//   4. the authoritative engine is itself one of the pinned modules.
//
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-contracts: PASS|FAIL <n> assertions"
import { run, is, read } from "./_lib";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const MANIFEST = "foundation/manifest.json";
const LOCK = "foundation/engine.lock.json";

type Manifest = { authoritativeEngine?: string; engineModules?: string[] };

const sha256 = (p: string): string => createHash("sha256").update(readFileSync(p)).digest("hex");

await run("gate-contracts", 4, async () => {
  // 1. the manifest names the engine and the files that compose it
  let manifest: Manifest = {};
  if (existsSync(MANIFEST)) {
    try {
      manifest = JSON.parse(await read(MANIFEST)) as Manifest;
    } catch {
      /* reported by assertion 1 */
    }
  }
  const modules = Array.isArray(manifest.engineModules) ? manifest.engineModules : [];
  is(
    typeof manifest.authoritativeEngine === "string" &&
      manifest.authoritativeEngine.length > 0 &&
      modules.length > 0,
    `${MANIFEST} declares an authoritativeEngine and a non-empty engineModules list`,
    !existsSync(MANIFEST)
      ? `${MANIFEST} not found`
      : `authoritativeEngine=${manifest.authoritativeEngine ?? "(absent)"}, engineModules=${modules.length}`,
  );

  // 2. the lock pins exactly those modules — a missing pin is an unchecked module,
  //    an orphan pin is a hash of something no longer declared as the engine
  let lock: Record<string, string> = {};
  let lockReadable = false;
  if (existsSync(LOCK)) {
    try {
      lock = JSON.parse(await read(LOCK)) as Record<string, string>;
      lockReadable = true;
    } catch {
      /* reported below */
    }
  }
  const pinned = Object.keys(lock).sort();
  const declared = [...modules].sort();
  const missing = declared.filter((m) => !pinned.includes(m));
  const orphans = pinned.filter((m) => !declared.includes(m));
  is(
    lockReadable && pinned.length > 0 && missing.length === 0 && orphans.length === 0,
    `${LOCK} pins exactly the declared engine modules`,
    existsSync(LOCK)
      ? [
          lockReadable ? "" : `${LOCK} is not valid JSON`,
          pinned.length ? "" : `${LOCK} pins nothing`,
          missing.length ? `declared but unpinned: ${missing.join(", ")}` : "",
          orphans.length ? `pinned but undeclared: ${orphans.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("; ")
      : `${LOCK} not found — run: pnpm run lock:engine`,
  );

  // 3. the pin is attached to the bytes, not to a filename
  const absent: string[] = [];
  const drifted: string[] = [];
  for (const rel of pinned) {
    if (!existsSync(rel)) {
      absent.push(rel);
      continue;
    }
    const actual = sha256(rel);
    if (lock[rel] !== actual)
      drifted.push(`${rel}: pinned ${String(lock[rel]).slice(0, 12)}…, disk ${actual.slice(0, 12)}…`);
  }
  is(
    absent.length === 0 && drifted.length === 0,
    "every pinned engine hash still matches the file on disk",
    [...absent.map((f) => `${f}: pinned but absent — re-run: pnpm run lock:engine`), ...drifted].join("\n"),
  );

  // 4. the file the charter calls authoritative may not sit outside the pin
  is(
    typeof manifest.authoritativeEngine === "string" && modules.includes(manifest.authoritativeEngine),
    "the authoritative engine is itself a pinned module",
    `authoritativeEngine "${manifest.authoritativeEngine ?? "(absent)"}" is not in engineModules — ` +
      `the file the charter calls authoritative would be unpinned`,
  );
});
