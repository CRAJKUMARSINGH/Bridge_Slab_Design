# Changelog

Notable changes to this repository, newest first. Dates are ISO-8601.

## Unreleased — Phase 2 / W00: foundation hardening (2026-10-23)

The phase-2 plan's first week. No engine behaviour changes: this entry is the
containment layer that makes the instruction set itself falsifiable, so that a
wrong instruction cannot succeed quietly from week 1 onward.

### Added — gates

- `pnpm run gate:preflight` — 15 assertions (P-01..P-15). Verifies every path and
  npm target an instruction doc names, that bare imports resolve, that the Node
  version is agreed, that no gate exits 2, that every gate has been observed
  RED and GREEN, that the lockfile story is singular, and that one week owns each
  path.
- `pnpm run gate:foundation` — `preflight && deps && scripts && tiers &&
  proven-red && hygiene && chain && tasks && docs:strict`.
- `pnpm run gate:deps` — unresolved-import detection, workspace-aware, honouring
  `.deps-plan.json` and failing when an allowlisted package outlives its week.
- `pnpm run gate:scripts` — every file and every nested script target named by
  `package.json` exists.
- `pnpm run gate:tiers` — every artefact carries a declared blast-radius tier, no
  gate reads a narrative document, no derived artefact descends from prose.
- `pnpm run gate:proven-red` / `pnpm run gate:prove -- <gate>` — no stub gates:
  RED is recorded by poisoning the guarded artefact, GREEN by ordinary execution.
- `pnpm run gate:chain` — the ledger may not mark a week GREEN out of order.
- `pnpm run gate:hygiene` — one lockfile, `.gitignore` agrees with what is
  tracked, licence and root documents present, foundation scripts wired.
- `pnpm run gate:tasks`, `pnpm run gate:docs:strict` — no task closes without a
  declared artefact and a MACHINE/MANUAL marker; no doc is a placeholder or a stub.

### Added — containment layer

- `containment/` — `ARTIFACT-TIERS.json` (blast radius, first match wins),
  `CONTRACT.md` (the frozen inter-set contract), `GATE-LEDGER.json` (week order),
  `claims.json` (claim ledger C-001..C-012), `escapes.json` (the escape register),
  `PENDING-RESOLUTIONS.json` (owned, expiring exemptions), `REVIEW-LOG.md`.
- `docs/phase-2/containment/C-01..C-12` — trust tiering, claim ledger, contract
  freeze, re-derivation, circularity, gate monotonicity, blast radius, poison
  pills, evidence-or-silence, reconciliation, recovery, governance.
- `docs/phase-2/week-00/AGENT-INSTRUCTIONS.md` — the W00 task list.

### Added — root documents

- `CANONICAL.md` declares `creat.md` the single authoritative plan and labels
  every competing plan superseded or reference.
- `PATH-MANIFEST.json`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`,
  `ARCHITECTURE.md`, `CHANGELOG.md`, `archive/MANIFEST.md`.
- `eslint.config.js` (flat) and `drizzle.config.ts`. Both are **inert until the
  packages they name are installed** — see `.deps-plan.json`.
- `docs/adr/0008-single-pdf-stack.md` — one PDF stack, not two.
- `docs/phase-2/week-00/EXIT-GATE-EVIDENCE.md` — the raw output of the foundation
  run, the eight RED/GREEN proof pairs, and the environment limits below.

### Added — PATCH PACK, additive only

- `lib/auth/scrypt.ts` — password hashing on `node:crypto`: zero dependency, no
  native build. PATCH-09, closing H-09.
- `tests/auth/scrypt.test.ts` — round-trip, wrong-password rejection, per-call
  salt and NFKC normalisation. The four behaviours were exercised directly and
  all pass.
- `docs/audit/finding-schema.ts` and `docs/audit/findings.json` — an audit finding
  now carries `verifiedBy` and an executable `reCheck`; `scripts/audit/recheck.ts`
  flips an `OPEN` finding to `FALSE_POSITIVE` when its `reCheck` finds nothing.
  PATCH-12, closing H-12. BOLT-004 is re-adjudicated to `FALSE_POSITIVE` because
  `Drawing_Module/src/components.tsx` exists — the v1.0 report's `test -f` is not
  portable to a Windows checkout.
- `scripts/gen-readme-map.ts` and `scripts/gates/gate-readme.ts` — the README
  module map is generated between `<!-- GEN:module-map -->` markers, and the gate
  re-runs the generator with `--check` and fails if the block is stale. PATCH-13,
  closing H-13.
- `docs/week1/README.md`, `docs/week3/README.md` — compatibility pointers to the
  canonical `docs/week-1/` and `docs/week-3/`. PATCH-15, closing H-15.
- `docs/plan-b/README.md` — a "MOVED → `creat.md` §6" pointer; PATCH-16, closing
  H-16.
- `docs/decisions/dist-tracking.md` — build output is not tracked. PATCH-18, closing
  H-18. The guide's `git rm -r --cached artifacts/api-server/dist` was verified to be
  a no-op here: `.gitignore` already ignores `dist`, and `git ls-files` returns zero
  paths for that tree.
- `docs/phase-2/week-00/PATCH-PACK-CERTIFICATION.md` — the evidence record for this
  pass, in the same format as the Set-3/4/5 certification.

### Verified

- The ten foundation gates were each observed passing: 10 PASS, 38 assertions
  total (`preflight` 15, `deps` 4, `scripts` 2, `tiers` 3, `proven-red` 2,
  `hygiene` 5, `chain` 1, `tasks` 2, `docs:strict` 3, `readme` 1).
- Every gate was also observed RED: `gate:prove` poisoned each guarded artefact,
  required exit 1, restored the original bytes and required exit 0, recording the
  pair in `scripts/gates/.proven.json`.

### Changed

- `package.json` gains `gate:*` scripts, `gate:prove`, `gate:foundation`,
  `gate:readme` and `gen:readme`. No dependency was added, removed or upgraded,
  and no Node version was changed.

### Corrected and extended — the harness, rev. 4 and rev. 5 (2026-10-24)

- **Rev. 4 closed seven holes**, each of which let a gate keep reporting PASS while
  checking less than its own count claimed: the self-declared assertion count, a count
  that could be lowered, a count that could be padded with a literal `true`, an index no
  gate ever inspected, diverging values recorded only in prose, a gate that could exist
  and never run, and a record that could be duplicated. It added `gate:deviations`,
  `gate:vacuity` and `gate:ratchet`, raised `gate:hygiene` from 5 to 7 assertions, and
  wired the canonical entry point into CI as a blocking step. The counts in `### Verified`
  above are the rev. 1 figures and are superseded: the harness is now `preflight` plus 13
  gates at 57 assertions.
- **Rev. 5 closed the eighth hole: every gate decided from the working tree**, so a file
  present in this checkout and carried by no commit satisfied every check and would be
  absent from a fresh clone. `gate:index` now reads `git ls-files` and fails any
  `tsx`/`node`/`ts-node` target named by `package.json` or `scripts/package.json` that no
  commit carries. Three files were the finding, and are now tracked:
  `scripts/lint-pdf-glyph-encodability.ts` (the target of `lint:pdf-glyphs`, run by CI's
  `check` step), `scripts/verify-client-api-links.ts` (the target of `verify:apilinks`),
  and `lib/engine/src/contracts.ts` — the tier-1 contract the whole `lib` tier is declared
  to derive from, which until now no clone would have received. The index gate was 3
  assertions and is 4; the ratchet recorded that rise rather than being told about it.
  `README.md` was regenerated because its module map is counted from the index.
- `PATH-MANIFEST.json` is unchanged by rev. 5. The three files are pre-existing; W00
  neither wrote them nor now owns their content, and adding them would be a false
  ownership claim. `docs/phase-2/week-00/PATCH-PACK-CERTIFICATION.md` §11 is the record.
- **Rev. 6 installed the gate the contract had been describing and did not have.**
  `containment/CONTRACT.md` had said since it was frozen that "hash enforcement is
  provided by gate:contracts (not yet installed)", which was honest and also a
  declaration nothing executed. `gate:contracts` now ties `foundation/engine.lock.json`
  to the `engineModules` declared in `foundation/manifest.json` and to the sha256 of each
  module on disk, in four assertions, and refuses a run in which any of the three
  disagree. Editing engine bytes now requires `lock:engine` in the same commit. The
  contract rose to 1.1.0 for the paragraph that names the gate, and `docs/adr/0013-engine-pin-is-enforced.md`
  is the ADR that bump requires. The gate is in the canonical entry point, in the
  hygiene gate's required-script list, and carries a poison pill. The harness is now
  `preflight` plus 14 gates at 61 assertions.
- **Rev. 6 also removed a second deviation ledger that had returned.** The SET ONE
  guide asks for `foundation/deviations.json` as well as `containment/DEVIATIONS.json`.
  That is hole #7, which rev. 4 closed by asserting the ledger path is unique: the two
  files carried the same six records under different schemas and different numbering,
  nothing read the copy, and its checker
  (`scripts/foundation/verify-deviations.mjs`) printed "5 checked, 0 problems" while
  reading the wrong file. Both were deleted and `verify:deviations` was dropped from the
  chain; `gate:deviations` is the one checker. The decision-log entries under
  `project/decision-log/` were renumbered to agree with `containment/DEVIATIONS.json`,
  because the guide's numbering and the ledger's had collided.
- `README.md` was regenerated again in rev. 6, for the same reason rev. 5 regenerated it:
  its module map is counted from the index, and tracking the Set One tree changes it.

### Recorded, not hidden

- The pre-existing `scripts/gates/*.mjs` files are NOT-IMPLEMENTED stubs. They are
  left in place; the real gates are the `.ts` files alongside them, and
  `gate:preflight` P-09 excludes the stubs rather than pretending they pass.
- The Set-1 instruction corpus (`docs/phase-2/week-01` … `week-12A`) is exempted
  from `gate:preflight` by `containment/PENDING-RESOLUTIONS.json` with a W00
  closing week — the exemptions expire with the week.
- Nothing was installed, and no Node version was changed. `eslint`,
  `@typescript-eslint/*`, `eslint-plugin-*` and `archiver` remain absent and are
  allowlisted in `.deps-plan.json` against W00, so `gate:deps` fails the moment
  W00 goes GREEN without them. `drizzle-kit` is absent too, but `lib/db/package.json`
  already declares it, so it cannot be an allowlist entry — it is recorded as a
  plain missing install, not as an exempted one.
- `node --import tsx` needed the top-level `node_modules/esbuild` link, which was
  absent while the store copy existed. A directory junction was created to
  `.pnpm/esbuild@0.28.1/node_modules/esbuild`. This is an environment repair, not
  a dependency change.
- `pnpm run <script>` is broken in the sandbox this was verified in (the
  `corepack` shim cannot find `pnpm.js`), so the gates were invoked directly as
  `node --import tsx scripts/gates/<gate>.ts`. The sandbox runs Node `v26.5.0`
  while `.nvmrc` and `.github/workflows/ci.yml` pin 24; P-04 compares the workflow
  against `.nvmrc` and passes, so the runtime mismatch is recorded here instead.
- `pnpm run check` and `pnpm run test` were therefore **not** run and are not
  claimed green. See `docs/phase-2/week-00/EXIT-GATE-EVIDENCE.md` §6.

### PATCH PACK items deliberately not applied

- PATCH-02 (`scripts/gen-registries.ts` plus generated `inputs/`) — `inputs/`
  already holds curated tier-1 JSON (`coefficients.json`, `constraints.json`,
  `variables.json`, `schema.json`, `trace-map.json`, `KHERWARA.json`), and the
  patch exists to make exactly that directory generated output. Applying it would
  overwrite authoritative data, so the curated files stand.
- PATCH-06 (`eslint.config.js` + `eslint-baseline.json` + `scripts/gates/gate-lint.ts`)
  — the config is in the tree, but the baseline cannot be produced without an
  eslint run and `eslint` is not installed. A baseline nobody measured is a
  fabrication, so `eslint-baseline.json` is declared in `PATH-MANIFEST.json`
  against W00 and allowlisted in `.deps-plan.json` rather than invented. Adding
  `gate-lint.ts` now would also make `gate:proven-red` unsatisfiable — a gate that
  can never go GREEN.
- PATCH-07 (`archiver`) and PATCH-14 (`puppeteer` + `@axe-core/puppeteer` plus a
  real `scripts/gates/gate-a11y.mjs`) — both need an install, and every install
  path here writes `package-lock.json`, which `gate:preflight` P-13 fails on while
  `pnpm-lock.yaml` exists. The packages stay allowlisted in `.deps-plan.json`
  against W00/W11. `scripts/gates/gate-a11y.mjs` is an 840-byte NOT-IMPLEMENTED
  stub and is honest about being one; the real a11y run belongs to W11, the week
  the spec assigns it to.
- ADR-0009..0012 were reserved by `docs/adr/README.md` and have since been written:
  0009 (scrypt over argon2), 0010 (Devanagari shaping admitted, superseding the
  shaping clause of 0008), 0011 (where the Set-3/4/5 corpus lives and who owns it),
  0012 (no instruction may reference a path that does not resolve). Numbers
  0001–0007 remain reserved and unwritten; the index says so rather than implying
  the opening decisions live in `containment/claims.json`, which they never did.

## Before this entry

Work preceding the Phase-2 plan is not reconstructed here. Where it is still
authoritative it is described in [CANONICAL.md](CANONICAL.md) and
[ARCHITECTURE.md](ARCHITECTURE.md). The 0.15.0 release candidate mentioned in the
plan has not been cut.
