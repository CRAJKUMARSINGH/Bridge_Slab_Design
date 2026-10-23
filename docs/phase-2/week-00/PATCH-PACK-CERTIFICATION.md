# P2-W00 PATCH-PACK ENRICHMENT CERTIFICATION — PATCH-06 .. PATCH-18

Date: 2026-10-23
Operator: Kiro (agent) · Verifier: **not yet run** — see §8
Pass: W00 close-out, additive only

The instruction this record answers:

> aply enrichment from >>>>>C:\Users\Rajkumar\Bridge_Slab_Design\CODE-JUNCTION >>>\*.md >>>>certify when completed

"Certify" here means **evidence, not a claim**. Section 3 is the raw stdout of the
gate harness; sections 4 and 5 are what changed and why; section 8 is what this
record deliberately does **not** claim.

The source is the single markdown file in the junction directory, the Venice guide,
and specifically its PATCH PACK — the "18 breakages, 3 classes, 18 PATCHES" block
that closes H-01..H-18. This pass ran against the W00 containment layer that is
already committed, so two of the guide's actions had to be adjudicated against
artefacts the guide could not see. Both adjudications are declared, not hidden.

The scope decisions that bound the pass:

| Question | Decision |
| --- | --- |
| Scope | The PATCH PACK only: PATCH-06 .. PATCH-18. Sets 3/4/5 are a separate, already-certified pass |
| Placement | Keep each patch's own paths; every new path gets exactly one owning week |
| Existing patches | PATCH-00..05, 08, 09, 10, 11, 17 and the tracked-file half of 18 were already in the tree; they were re-verified, not re-applied |
| Unrunnable installs | No dependency was installed. See §8, bullet 2 |
| Extra requirement | Remove conflicts with the committed W00 layer, and never widen a gate |

---

## 1. What landed

### 1.1 PATCH-12 — audit findings carry an executable re-check (closes H-12)

| File | What it is |
| --- | --- |
| `docs/audit/finding-schema.ts` | The shape: `VerifiedBy = READ \| GREPPED \| INFERRED_FROM_CALLSITE`, and every finding carries `reCheck`, an executable command |
| `docs/audit/findings.json` | The store, migrated from the v1.0 report; currently one row, BOLT-004, `status: FALSE_POSITIVE` |
| `scripts/audit/recheck.ts` | Re-establishes each finding: runs `reCheck`, and flips `OPEN` to `FALSE_POSITIVE` when it finds nothing |

The rule the patch establishes, and which the code implements: **a finding whose
`verifiedBy` is `INFERRED_FROM_CALLSITE` may not be actioned until its `reCheck`
confirms it.** BOLT-004 is the worked example. The v1.0 report called the
`@drawing/*` alias phantom and proposed removing the `include` entry, on the evidence
of a re-check written as `test -f Drawing_Module/src/components.tsx`. That command
does not exist on a Windows checkout, so the v1.0 process would have re-adjudicated
the finding on the wrong grounds. `Drawing_Module/src/components.tsx` exists, the
alias is real, and the finding was a false positive — corroborated independently by
`august-due.md`, which records the same item as done because the directory exists.
The re-check is written portably, as a one-line Node existence probe.

### 1.2 PATCH-13 — the README module map is generated and guarded (closes H-13)

| File | What it is |
| --- | --- |
| `scripts/gen-readme-map.ts` | Walks the tree and writes a table between `<!-- GEN:module-map -->` and `<!-- /GEN:module-map -->` in `README.md`; `--check` compares instead of writing |
| `scripts/gates/gate-readme.ts` | One assertion: re-runs the generator in check mode and fails if the block is stale |

30 rows are generated. The gate never reads the README as text — the README is a
tier-4 narrative artefact, so a gate may not decide anything from it. It runs the
generator and reads the exit code, which keeps the assertion on a tier-2 artefact
(the generator) and honours P-14.

### 1.3 PATCH-15 and PATCH-16 — competing copies become pointers (closes H-15, H-16)

| File | What it is |
| --- | --- |
| `docs/week1/README.md` | Line 1 says canonical content lives in `docs/week-1/`; the directory is a compatibility pointer |
| `docs/week3/README.md` | Same shape, pointing at `docs/week-3/` |
| `docs/plan-b/README.md` | "MOVED → `creat.md` §6"; the alternative 15-week schedule is retained as history, not authority |

### 1.4 PATCH-18 — the decision about build output is written down (closes H-18)

| File | What it is |
| --- | --- |
| `docs/decisions/dist-tracking.md` | Why build output is not tracked, and what the rule protects |

The guide's action for this patch is `git rm -r --cached artifacts/api-server/dist`.
It was **not run, because it would change nothing**: `.gitignore` rule 4 is `dist`,
`git check-ignore` resolves `artifacts/api-server/dist` to that rule, and
`git ls-files artifacts/api-server/dist` returns zero paths. The tree is already out
of the index. The record is the part that was actually missing.

### 1.5 Patches already in the tree, re-verified rather than re-applied

| Patch | On-disk evidence | Verdict |
| --- | --- | --- |
| PATCH-08 | `docs/adr/0008-single-pdf-stack.md`, 3,101 bytes | already landed |
| PATCH-09 | `lib/auth/scrypt.ts`, `tests/auth/scrypt.test.ts` | already landed |
| PATCH-10 | `drizzle.config.ts`, 899 bytes; P-06 passes | already landed |
| PATCH-11 | `.nvmrc` = 24, CI pins 24, and the CI comment records that a Dockerfile pins the same value | landed in adapted form — see §4.4 |
| PATCH-17 | `.deps-plan.json` allowlist with `W\d{2}[A-Z]?` week tags; `gate-deps` asserts the shape | already landed |

---

## 2. Files modified in the contained layer

| File | Change | Why |
| --- | --- | --- |
| `README.md` | a Repository map section added, then generated in place | PATCH-13's target block |
| `package.json` | `gate:readme` and `gen:readme` added; `gate:readme` appended to `gate:foundation` | the new gate must be reachable from the canonical entry point |
| `scripts/gates/.pills.json` | a `readme` pill added | a gate with no poison pill cannot be proven RED, and P-10 would fail |
| `PATH-MANIFEST.json` | nine paths added under W00 | P-15 requires exactly one owning week per path |
| `CHANGELOG.md` | PATCH-12/13/15/16/18 entries added; the deferred-patch bullet rewritten | the deferrals changed |

---

## 3. Raw gate transcript

Run directly, not through `pnpm run`, because the sandbox's `corepack` shim cannot
find pnpm.js — the same environment limit recorded in the W00 foundation evidence.
One deviation is declared: in the `gate-docs` advisory line below, the placeholder
token **names** are elided, because writing them literally would make this record
fail the very assertion it is reporting. Everything else is byte-for-byte stdout.

```
=== node --import tsx scripts/gates/preflight.ts
PASS  P-01
PASS  P-02
PASS  P-03
PASS  P-04
PASS  P-05
PASS  P-06
PASS  P-07
PASS  P-08
PASS  P-09
PASS  P-10
PASS  P-11
PASS  P-12
PASS  P-13
PASS  P-14
PASS  P-15
ADVISORY  P-11 (4 exempted, owner W00): docs/week-1 vs docs/week1; docs/week-3 vs docs/week3; docs/week1 vs docs/week-1; docs/week3 vs docs/week-3
ADVISORY  P-12 (2 exempted, owner W00): origin-weekly-plan.md; docs/plan-b/15-week-implementation-plan.md
ADVISORY  P-02 (3 exempted, owner W00): docs/phase-2/_templates/EXIT-GATE-EVIDENCE.md -> run gate:; docs/phase-2/_templates/EXIT-GATE-EVIDENCE.md -> run build:netlify; docs/phase-2/govt/G-11-support-model.md -> run diag:bundle
ADVISORY  P-03 (1 exempted, owner W00): server/dossier-compiler.ts -> archiver
GATE preflight: PASS 15 assertions
exit=0

=== node --import tsx scripts/gates/gate-deps.ts
  expected-red (1 pkg): e.g. server/dossier-compiler.ts -> archiver
GATE gate-deps: PASS 4 assertions
exit=0

=== node --import tsx scripts/gates/gate-scripts.ts
GATE gate-scripts: PASS 2 assertions
exit=0

=== node --import tsx scripts/gates/gate-tiers.ts
  43 tier rule(s), 12 ignored tree(s)
GATE gate-tiers: PASS 3 assertions
exit=0

=== node --import tsx scripts/gates/gate-proven-red.ts
  9 gate(s): gate-chain, gate-deps, gate-docs, gate-hygiene, gate-proven-red, gate-readme, gate-scripts, gate-tasks, gate-tiers
GATE gate-proven-red: PASS 2 assertions
exit=0

=== node --import tsx scripts/gates/gate-hygiene.ts
GATE gate-hygiene: PASS 5 assertions
exit=0

=== node --import tsx scripts/gates/gate-chain.ts
  next week to run: W00 (PENDING)
GATE gate-chain: PASS 1 assertions
exit=0

=== node --import tsx scripts/gates/gate-tasks.ts
  advisory: 18 legacy instruction file(s) exempted (PR-03)
  checked 25 task line(s) across 1 file(s)
GATE gate-tasks: PASS 2 assertions
exit=0

=== node --import tsx scripts/gates/gate-docs.ts
  advisory: 6 legacy doc(s) exempted, e.g. docs/phase-2/_templates/ASSUMPTION-REGISTER.md: 1 placeholders
  (<token> elided) | docs/phase-2/_templates/CHATLOG-ENTRY.md: 5 placeholders (<tokens> elided) | docs/phase-2/_templates/EXIT-GATE-EVIDENCE.md: 14 placeholders (<tokens> elided)
  scanned 97 doc(s): 0 placeholder, 0 stub, 0 heading-only
GATE gate-docs: PASS 3 assertions
exit=0

=== node --import tsx scripts/gates/gate-readme.ts
GATE gate-readme: PASS 1 assertions
exit=0
```

The RED half of the new gate, run separately because a gate that was never observed
RED is not a gate:

```
=== node --import tsx scripts/gates/gate-proven-red.ts --prove readme
readme: gate-readme RED (poisoned) -> GREEN (restored) — recorded

1 gate(s) proven RED then GREEN
exit=0
```

**Result: 10 gates, 38 assertions, 0 failures, 0 gates exiting 2.** The count moved
from 9 gates / 37 assertions to 10 / 38 because this pass adds exactly one gate with
one assertion, and it moves 3 to 4 and 4 to 3 respectively. No existing assertion was
deleted, relaxed or renumbered.

---

## 4. Conflicts removed, and adjudications made

### 4.1 The guide's patch list was written before the W00 layer existed

The W00 containment layer is committed. The guide's PATCH PACK assumes a tree without
it, so three of its actions would have collided with it. Each was resolved in the
direction the containment layer itself points:

- **PATCH-06 and PATCH-07 want an install.** The containment layer's preflight P-13
  fails whenever two lockfiles coexist. Every install path available here writes a
  lockfile. The resolution is not to delete or widen P-13; it is to keep the packages
  allowlisted and declare the deferral. See §8, bullet 2.
- **PATCH-06 and PATCH-13 add a gate file.** A new file in `scripts/gates/` enters
  `gateFiles()`, and `gate-proven-red` then requires a poison pill for it. PATCH-13's
  pill was written this pass. PATCH-06's gate was deliberately **not** created: with
  `eslint` uninstalled it could never go GREEN, and `gate:proven-red` would become
  permanently unsatisfiable. A gate that cannot pass is worse than an absent one.
- **PATCH-11 names a Netlify config file.** P-04, as adapted for this repository,
  treats that file as optional; the repo deploys with `vercel.json` and P-04's
  comment says so. The assertion is therefore "CI agrees with `.nvmrc`", which passes.

### 4.2 A pointer may not be too short for this repository's own doc gate

PATCH-16 states a convention: if a file is a pointer, it says so on line 1 and is
under 5 lines. The repository's `gate-docs` independently fails any document under
200 characters as a stub. A 4-line pointer satisfies both; a 3-line one would not.
The three pointer files were consequently written as **4 lines, each comfortably
over 200 characters**, and the rationale that would otherwise have been re-listed in
them stays in `CANONICAL.md` and in the PR-05/PR-06 exemption entries, which both
files name. Two repo rules were reconciled rather than one being waived.

### 4.3 PATCH-11's literal Node version was not applied

The guide asks for `.nvmrc` = 22. This repository's `.nvmrc` is 24, its CI workflow
pins 24 in a comment that records the Dockerfile base image as the same value, and
`tests/integration/deploy-readiness.test.ts` contains a check whose own comment says
it fails if those three drift. Downgrading to 22 would break a real test to satisfy a
number that no assertion in this repository checks. **The single-source-of-truth
intent of PATCH-11 is met** — one file, `.nvmrc`, and the CI and Dockerfile agree with
it — and P-04 verifies exactly that. The literal value is a deliberate deviation.

### 4.4 The new gate was added to the canonical entry point

The guide's completion check is the foundation run. `gate:foundation` listed nine
gates; a tenth gate outside it would be a gate the canonical entry point does not
exercise. `gate:readme` was appended to it. This strengthens the entry point; it does
not add a requirement to any week.

---

## 5. References created, substituted, or exempted

| Token | Resolution |
| --- | --- |
| `scripts/gen-readme-map.ts`, `scripts/gates/gate-readme.ts`, `scripts/audit/recheck.ts` | created, declared under W00 |
| `docs/audit/finding-schema.ts`, `docs/audit/findings.json`, `docs/decisions/dist-tracking.md` | created, declared under W00 |
| `docs/week1/README.md`, `docs/week3/README.md`, `docs/plan-b/README.md` | created as pointers, declared under W00 |
| `eslint-baseline.json` | not created; declared in the manifest against W00, which is the door P-01 provides for a planned artefact |
| the lint gate file PATCH-06 names | not created; see §4.1. Named without a file extension wherever it is discussed, so it is not presented to P-01 as a path |
| a Netlify config file | not created; P-04 makes it optional, and PATCH-11's intent is met without it — see §4.3 |

---

## 6. Why no gate was weakened to make this pass green

- No assertion was removed or renumbered. The delta is one new gate, one new
  assertion, and nothing else.
- No exemption was added. `containment/PENDING-RESOLUTIONS.json` is unchanged; PR-01
  through PR-07 are byte-identical to the committed version. The list still says it
  may only shrink.
- No pattern was widened. The advisories in §3 are the same seven exemptions that
  were already there before this pass, with the same owners and closing weeks.
- `gate-readme` was made **harder to satisfy**, not easier: it re-runs a generator and
  compares, so the README cannot drift from the tree without the gate failing.
- The one gate-level change is additive: `gate:foundation` now runs one more gate.
- The `readme` poison pill poisons the generator's table header, so the gate's RED is
  produced by a real change in the artefact it guards, not by stubbing the gate.

---

## 7. Observations — reported, not treated as defects

### 7.1 BOLT-004 is a false positive, and the v1.0 method could not have known

`AUDIT-REPORT-v1.0.md` states that `tsconfig.json` includes a `Drawing_Module` glob
while no such directory exists. The directory exists, and its component file is the
one the alias resolves to. The defect was not in the finding's subject but in its
re-check: a POSIX-only file test on a checkout where it silently fails is a
re-check that cannot falsify anything. This is the reason PATCH-12 asks for an
executable `reCheck` rather than a described one.

### 7.2 The `gate-docs` advisory is a moving number, not a regression

The advisory names 6 exempted legacy documents and the scan covers 96 documents.
Both numbers grow whenever a document is added under the doc root; neither is an
assertion. The assertion is the "0 placeholder, 0 stub, 0 heading-only" line.

### 7.3 The `.mjs` gates remain stubs on purpose

`scripts/gates/gate-a11y.mjs` is 840 bytes and is a NOT-IMPLEMENTED stub. PATCH-14
would have replaced it with a real Playwright-and-axe run, which needs an install this
environment cannot perform without breaking P-13. The stub is not a defect being
hidden: P-09 excludes `.mjs` files from execution and prints them as informational,
and the spec assigns the real a11y run to W11.

---

## 8. What this record does NOT claim

- **No dependency was installed and no Node version was changed.** `eslint`,
  `@typescript-eslint/*`, `eslint-plugin-*` and `archiver` remain absent and stay
  allowlisted in `.deps-plan.json`. `gate-deps` is designed to fail the moment W00
  goes GREEN without them, which is the forcing function, and it is still armed.
- **The deferrals are environmental, not editorial.** The `pnpm` shim is broken in
  this environment — it cannot find pnpm.js — so the gates were invoked directly as
  `node --import tsx scripts/gates/<gate>.ts`. Because the npm lockfile is absent
  while `pnpm-lock.yaml` is present, any install here would create the second lockfile
  and fail P-13. That is why PATCH-06's baseline, PATCH-07, and PATCH-14 are deferred
  rather than done.
- **No exception was taken to install anything by bypassing a gate.** No file was
  written to make a gate's input agree with its output.
- **`pnpm run check` and `pnpm run test` were not run.** No test result is claimed in
  this record. The gates above are the only evidence it carries.
- **The nine pre-existing patches were re-verified by inspection, not re-applied.**
  For those, this record's evidence is the on-disk file and the passing gate named
  against it, not a diff.
- **No independent verifier has read this.** The W00 task list assigns verification to
  Antigravity; the operator who applied the patches is the operator who ran the gates.
  The two adjudications in §4.2 and §4.3 are exactly what a verifier should attack
  first, and §8's first bullet is a live, armed failure that will fire when W00 is
  marked GREEN.

---

## 9. Verdict

| Check | Result |
| --- | --- |
| PATCH-12 landed | 3 files; the schema, the store, and the re-check runner |
| PATCH-13 landed | 2 files; generator and gate, plus the README block and the poison pill |
| PATCH-15 landed | 2 pointer READMEs, each 4 lines and over 200 characters |
| PATCH-16 landed | 1 pointer README; the supersession table already stood in `CANONICAL.md` |
| PATCH-18 landed | decision record written; the untrack step was verified to be a no-op |
| Patches already present, re-verified | 5 (PATCH-08, 09, 10, 11, 17) |
| Patches deferred, declared | 3 (PATCH-06, 07, 14), all blocked by the install limit |
| Gates | 10 gates · 38 assertions · 0 failures · 0 NOT-IMPLEMENTED |
| New gate proven | `gate-readme` RED then GREEN, recorded |
| Exemptions added | 0; `containment/PENDING-RESOLUTIONS.json` unchanged |
| Assertions removed or relaxed | 0 |

**Certified: the PATCH PACK's additive work is in the tree — the audit re-check
schema, the generated and guarded README map, the three pointer files, and the
build-output decision record — each path owned by one week, with the full gate harness
green and the three install-dependent patches deferred and armed rather than faked.**
The one thing this record cannot certify is its own independence — see §8, last bullet.
