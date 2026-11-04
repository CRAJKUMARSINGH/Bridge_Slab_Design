# P2-W00 — FOUNDATION HARDENING

Primary: Kiro | Verifier: Antigravity | Prereq: none | Gate: `gate:foundation`

## 0. READ FIRST

[docs/phase-2/containment/](.) C-01..C-12 ·
[containment/claims.json](../../../containment/claims.json) ·
[containment/escapes.json](../../../containment/escapes.json) ·
[containment/PENDING-RESOLUTIONS.json](../../../containment/PENDING-RESOLUTIONS.json)

## 1. OBJECTIVE

Remove every silent-failure vector, so that from W01 onward a wrong instruction
cannot succeed quietly. No engine code this week. The deliverable of W00 is not a
feature; it is the property that a claim about this repository is either checked
or visibly unchecked.

## 2. HARD CONSTRAINTS

- Nothing is deleted. Everything retired moves to `archive/` with a row in
  [archive/MANIFEST.md](../../../archive/MANIFEST.md).
- Every fix is verified by `pnpm run gate:preflight`, not asserted.
- One owner per path, declared in [PATH-MANIFEST.json](../../../PATH-MANIFEST.json).
- No dependency is installed during this pass. A package that referenced code
  needs but that is not installed is recorded in
  [.deps-plan.json](../../../.deps-plan.json) with the week that owes it.
- No existing source artefact is overwritten. W00 adds; it does not clobber.

## 3. TASKS — the foundation

T00.1  MACHINE | publish `archive/MANIFEST.md` with the row schema
       (path | archivedAs | replacedBy | reason | week | sha256 | verified) and the
       pending-retirement table. Satisfies P-07.

T00.2  MACHINE | create the directories P-08 requires and which the tree lacks,
       each with a real `generated/README.md`, `docs/phase-2/specs/README.md` and
       `docs/phase-2/verification/README.md` so the directory is real to git and
       says what belongs in it.

T00.3  MACHINE | publish `containment/ARTIFACT-TIERS.json` — the blast-radius map.
       Ordered globs, first match wins, plus an `ignored` array for the vendor and
       scratch trees (`VENICE-REFERENCES/`, `merge-refs/`, `Attached_Assets/`,
       `_tmp_*`, `.trae`, …). Consumed by `gate:tiers`, `gate:deps` and P-14.

T00.4  MACHINE | publish `containment/claims.json` — the claim ledger C-001..C-012,
       each with source, locator, status, counter-evidence and adjudicator. Every
       claim the Plan makes about this tree is adjudicated against the tree, not
       against another document.

T00.5  MACHINE | publish `containment/GATE-LEDGER.json` — one row per week in
       dependency order, all PENDING until proven otherwise. Consumed by
       `gate:chain`, which forbids a GREEN week after a non-GREEN one.

T00.6  MACHINE | publish `containment/CONTRACT.md`, version 1.0.0, frozen: the
       From/To/Via/Allowed table between layers, and the rule that an undeclared
       cross-boundary import is a build failure.

T00.7  MACHINE | publish `containment/PENDING-RESOLUTIONS.json` — the owned,
       expiring exemptions (PR-01..PR-06) that let the gates run on a tree that
       already has known defects. An entry without an owner or a closing week fails
       the gate that reads it; so does an entry whose week has gone GREEN.

T00.8  MACHINE | publish `containment/escapes.json` — the escape register: each
       artefact that got past a gate, why, which gate detects it now, and whether
       the gate has been proven RED.

T00.9  MACHINE | publish the C-01..C-12 containment rules as
       `docs/phase-2/containment/C-01-trust-tiering.md` through
       `docs/phase-2/containment/C-12-containment-governance.md`. These are the
       rules the rest of the phase is read against.

T00.10 MACHINE | publish `scripts/gates/_lib.ts` — the harness: `run()`, the
       `0/1/2` exit contract, `.out/<name>.json`, `walk()`, `globToRe()`,
       `tierOf()` and the pending-exemption reader. Every gate depends on it, so it
       is written and reviewed first.

T00.11 MACHINE | publish `scripts/gates/preflight.ts` — 15 assertions, P-01..P-15.
       Nothing in Phase 2 may start until 15/15 pass. This is the single control
       that makes the instruction set falsifiable.

T00.12 MACHINE | publish `scripts/gates/gate-deps.ts` — 4 assertions: unresolved
       imports, allowlist week tags, allowlist monotonicity, and an allowlisted
       package outliving its week. Closes the "assumed but not installed" class.

T00.13 MACHINE | publish `scripts/gates/gate-scripts.ts` — 2 assertions: every
       file and every nested script target named in `package.json` exists.

T00.14 MACHINE | publish `scripts/gates/gate-tiers.ts` — 3 assertions: every
       artefact has a declared tier, no gate reads tier-4 prose, no tier-2
       artefact descends from prose.

T00.15 MACHINE | publish `scripts/gates/gate-hygiene.ts` — 5 assertions: one
       lockfile, `.gitignore` agrees with what is tracked, licence present and
       matching `package.json`, root documents present, foundation scripts wired.

T00.16 MACHINE | publish `scripts/gates/gate-chain.ts` — 1 assertion: no week is
       marked GREEN after the first non-GREEN week.

T00.17 MACHINE | publish `scripts/gates/gate-docs.ts` and
       `scripts/gates/gate-tasks.ts` — 3 and 2 assertions. No doc is a placeholder
       or a stub; no task closes without a declared output path and a
       MACHINE|MANUAL marker.

T00.18 MACHINE | publish `scripts/gates/gate-proven-red.ts` together with
       `scripts/gates/.pills.json` — 2 assertions, so that a gate nobody has seen
       fail is a build failure. Prove each gate with
       `pnpm run gate:prove -- <gate>`; the pair is recorded in
       `scripts/gates/.proven.json`.

T00.19 MACHINE | publish `PATH-MANIFEST.json` — one owning week per path. P-15
       reads it; it is also the record that a referenced-but-absent path is
       planned rather than forgotten.

T00.20 MACHINE | publish the root documents: `CANONICAL.md` (one authoritative
       plan), `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`,
       `ARCHITECTURE.md`.

T00.21 MACHINE | publish `eslint.config.js` and `drizzle.config.ts` as inert
       configs: both name packages that are allowlisted in `.deps-plan.json` and
       not yet installed. A config that runs must not be claimed until it runs.

T00.22 MANUAL because it needs an engineer's judgement about the deliverable |
       `docs/adr/0008-single-pdf-stack.md` — decide one PDF stack rather than
       leaving jsPDF in use and pdf-lib in the plan. Recorded in the ADR with a
       Reversal section.

T00.23 MACHINE | wire the scripts in `package.json` (`gate:preflight`, `gate:deps`,
       `gate:scripts`, `gate:docs:strict`, `gate:tasks`, `gate:tiers`,
       `gate:proven-red`, `gate:chain`, `gate:hygiene`, `gate:prove`,
       `gate:foundation`) and run `pnpm run gate:foundation`.

T00.24 MACHINE | write `docs/phase-2/week-00/EXIT-GATE-EVIDENCE.md` with the raw
       output of the run above. Evidence, not a summary of evidence.

T00.25 MANUAL because the archive decision moves files and needs a human owner |
       retire `origin-weekly-plan.md`, `docs/plan-b/15-week-implementation-plan.md`,
       `docs/week1/`, `docs/week3/` and `scripts/gates/*.mjs` per the
       pending-retirement table in `archive/MANIFEST.md`. Nothing has been moved
       yet: the table declares the move, this task performs it.

## 4. EVIDENCE

Raw output of `pnpm run gate:foundation`, the eight `scripts/gates/.proven.json`
entries, `PATH-MANIFEST.json`, the `archive/MANIFEST.md` row count, and
`pnpm run check && pnpm run test`.

## 5. EXIT GATE — all machine-checked

- [ ] `gate:preflight` 15/15 PASS
- [ ] `gate:tiers` PASS — no undeclared artefact, no gate reads tier-4 prose
- [ ] `gate:proven-red` PASS — every gate observed RED then GREEN
- [ ] `gate:hygiene` PASS
- [ ] `gate:deps` PASS — zero unresolved imports
- [ ] `gate:chain` PASS — the ledger starts at W00
- [ ] `gate:scripts` PASS — every `package.json` target exists
- [ ] `gate:tasks` and `gate:docs:strict` PASS on the W00 corpus
- [ ] `pnpm run check` / `pnpm run test` green
- [ ] `archive/MANIFEST.md` exists; nothing deleted
- [ ] `PATH-MANIFEST.json` covers every W00 path with one owner
- [ ] `containment/claims.json` has zero UNADJ entries older than 7 days

## 6. DELIVERABLES

`containment/` (7 files) · `docs/phase-2/containment/` (C-01..C-12) ·
`scripts/gates/` (9 `.ts` gates, plus `scripts/gates/.pills.json`,
`scripts/gates/.proven.json` and `scripts/gates/.ratchet.json`) ·
`CANONICAL.md` · `PATH-MANIFEST.json` · `LICENSE` · `SECURITY.md` ·
`CONTRIBUTING.md` · `CHANGELOG.md` · `ARCHITECTURE.md` · `eslint.config.js` ·
`drizzle.config.ts` · `archive/MANIFEST.md` · `docs/adr/0008-single-pdf-stack.md` ·
`docs/phase-2/week-00/EXIT-GATE-EVIDENCE.md`

## 7. NOT DONE IN THIS PASS — declared, not hidden

- `eslint`, `@typescript-eslint/*`, `eslint-plugin-*` and `archiver` are **not
  installed**. They are allowlisted in `.deps-plan.json` against W00, so
  `gate:deps` fails the moment W00 goes GREEN without them. `drizzle-kit` is
  absent as well but is already declared by `lib/db/package.json`, so it is a
  plain missing install rather than an allowlist entry.
- `eslint-baseline.json` does not exist. A violation baseline that was not
  measured is a fabrication; it is produced by the first real eslint run.
- `docs/phase-2/specs/` and `docs/phase-2/verification/` were empty placeholder
  directories when this pass opened, and their contents belonged to later weeks.
  The enrichment close-out filled them: E-01..E-12 (Set 4) and the verifier
  protocol plus the nine V-scopes (Set 3) now exist, each with one owning week in
  `PATH-MANIFEST.json`. The finding is kept here rather than deleted, because it is
  the state this pass was opened against; it is no longer the state of the tree.
- The Set-1 corpus and the duplicate week folders are exempted, not fixed. The
  exemptions expire with W00.

## 8. CLOSE-OUT

Append the W00 row to `creat.md` §8, set status to
"Phase 2 — W00 foundation hardening", run T00.25, then commit
`P2-W00: foundation hardening — gates live, containment layer installed`.

## 9. REPORT FORMAT

```
P2-W00 STATUS: OK | BLOCKED
Gates: <each exit-gate line, pass/fail, with the assertion count>
Exempted: <PR-nn list, each with owner and closing week>
Unresolved: <list, or NONE>
Next-week blockers: <list, or NONE>
```
