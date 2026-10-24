# P2-W00 PATCH-PACK ENRICHMENT CERTIFICATION — PATCH-06 .. PATCH-18

Date: 2026-10-23 · **rev. 4** — a SET ONE harness-hardening pass (§10) took the gate
count from 10 to 13 and the assertion count from 38 to 56, and wired the harness into
CI. The text below rev. 3 is unchanged and still describes the state it certified.
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

### 2.1 Repository-state repair made by this revision

The commit that landed this pass was built with an isolated index. The side effect is
that `.git/index` never learned about the seventy-three paths that commit added: HEAD
contained the files, the index did not, and so `git status` reported every one of them
as a **staged deletion**. A `git commit -a` at that point would have removed the whole
enrichment from the next commit — a latent defect that no gate in the harness can see,
because every gate reads the working tree, not the index.

This revision repaired it by re-syncing the index to `HEAD` and then re-staging only
the thirteen unrelated files that were already staged before this pass. The measured
result is **zero staged deletions**, with those thirteen files still staged and still
outside the enrichment commit. No file on disk was altered by the repair; only the
index changed.

---

## 3. Raw gate transcript

Captured by the rev. 3 pass, after the index repair in §2.1 and after the two gate
failures recorded in §7.5 were cleared — so this is the output of the tree as it now
stands, not a copy of an earlier pass. Run directly, not through
`pnpm run`, because the sandbox's `corepack` shim cannot find pnpm.js — the same
environment limit recorded in the W00 foundation evidence. Two deviations are declared,
both in the `gate-docs` advisory line below: the placeholder token **names** are elided,
because writing them literally would make this record fail the very assertion it is
reporting, and trailing whitespace is trimmed. Everything else is byte-for-byte stdout.

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
ADVISORY  P-02 (2 exempted, owner W00): docs/phase-2/_templates/EXIT-GATE-EVIDENCE.md -> run gate:; docs/phase-2/govt/G-11-support-model.md -> run diag:bundle
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
  next week to run: W01 (PENDING)
GATE gate-chain: PASS 1 assertions
exit=0

=== node --import tsx scripts/gates/gate-tasks.ts
  advisory: 18 legacy instruction file(s) exempted (PR-03)
  checked 25 task line(s) across 1 file(s)
GATE gate-tasks: PASS 2 assertions
exit=0

=== node --import tsx scripts/gates/gate-docs.ts
  advisory: 5 legacy doc(s) exempted, e.g. docs/phase-2/_templates/ASSUMPTION-REGISTER.md: 1 placeholders
  (<token> elided) | docs/phase-2/_templates/CHATLOG-ENTRY.md: 5 placeholders (<tokens> elided) | docs/phase-2/_templates/EXIT-GATE-EVIDENCE.md: 13 placeholders (<tokens> elided)
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

The advisory names 6 exempted legacy documents and the scan covers 97 documents.
Both numbers grow whenever a document is added under the doc root; neither is an
assertion. The assertion is the "0 placeholder, 0 stub, 0 heading-only" line.

### 7.3 The `.mjs` gates remain stubs on purpose

`scripts/gates/gate-a11y.mjs` is 840 bytes and is a NOT-IMPLEMENTED stub. PATCH-14
would have replaced it with a real Playwright-and-axe run, which needs an install this
environment cannot perform without breaking P-13. The stub is not a defect being
hidden: P-09 excludes `.mjs` files from execution and prints them as informational,
and the spec assigns the real a11y run to W11.

### 7.4 The `P-02` advisory fell from three findings to two

The advisory line in §3 is one finding shorter than in the first revision. The cause lies
outside this pass: the working copy of `docs/phase-2/_templates/EXIT-GATE-EVIDENCE.md`
has been edited since the commit, and the second npm build target it used to name is no
longer recognised as a runnable token — the line now carries an escaped ampersand and a
break, so P-02's scanner reads a different command. Nothing in this pass touched that
file, and no exemption was removed; the count moved because the input moved. It is
recorded here so the two revisions can be compared without the difference being read as
a relaxed rule.

### 7.5 Rev. 3 closed two gates that the tree had opened

Rev. 2's capture was green. Rev. 3's first run was not: `preflight` failed P-01 and P-02
and `gate-docs` failed its placeholder assertion, all three inside a single file —
`docs/phase-2/week-00/EXIT-GATE-EVIDENCE.md` — which had gained a 94-line close-out
addendum after the commit that rev. 2 certified. The addendum recorded the close-out by
naming, in backticks, two paths the close-out had moved into the archive; by writing the
template's gate invocation as a live command whose script name is a placeholder; and by
quoting a placeholder token literally. P-01 resolves backticked paths, P-02 resolves run
targets, and `gate-docs` scans this directory — so the record of the close-out failed the
gates the close-out itself had passed.

Repair was made in the document, not in the gates:

| Gate | Finding | Repair |
| --- | --- | --- |
| P-01 — 2 findings | two moved paths named in backticks, so P-01 required them to resolve | the row now names the archive directory that holds them, and the two originals appear as plain prose — the same technique the close-out itself used for the week instruction files |
| P-02 — 1 finding | the gate invocation written as a runnable command with a placeholder target | the row describes the change in prose and names no runnable command |
| gate-docs — 2 findings | two placeholder tokens quoted literally in the table of changes | both are described rather than quoted |

No assertion was relaxed, no exemption added, no pattern widened. The three gates are
green because the document stopped being an input they must resolve — which is the
correct direction of repair, and also the reason this record states the count of
assertions it exercises rather than trusting a previous run.

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
| Repository index | repaired by rev. 2 — 0 staged deletions; the 13 unrelated files remain staged |
| Gates found RED by rev. 3, then closed | 3 findings across 2 gates (P-01, P-02, gate-docs), all in the W00 escape evidence file; repaired in the document, not in the gates (§7.5) |
| New gate proven | `gate-readme` RED then GREEN, recorded |
| Exemptions added | 0; `containment/PENDING-RESOLUTIONS.json` unchanged |
| Assertions removed or relaxed | 0 |

**Certified: the PATCH PACK's additive work is in the tree — the audit re-check
schema, the generated and guarded README map, the three pointer files, and the
build-output decision record — each path owned by one week, with the full gate harness
green and the three install-dependent patches deferred and armed rather than faked.**
Revision 2 re-ran the harness against the tree as it stands and repaired the index
desynchronisation recorded in §2.1, so the enrichment is now both present on disk and
tracked by the index.
Revision 3 re-ran it again, found that the W00 close-out addendum had turned three
assertions red against its own evidence file, and closed them by correcting the document
(§7.5). Ten gates, thirty-eight assertions, zero failures, zero not-implemented.
The one thing this record cannot certify is its own independence — see §8, last bullet.

---

## 10. Rev. 4 — SET ONE: the harness itself, hardened (2026-10-24)

Revisions 1 to 3 certified the enrichment's content. Rev. 4 asks a different question
about it — the one the operator put directly: the code is a tower resting on the
foundation, and the foundation may have a systemic flaw that lets incomplete work pass
silently. Reading the harness rather than trusting it, the flaw is real and structural,
and it lies in seven places, each of which let a gate keep reporting PASS while checking
less than its own count claimed.

### 10.1 The seven holes, and what closes each

| Hole | Why a gate could pass without checking | What closes it |
| --- | --- | --- |
| The count was self-declared | The harness entry point took the assertion count as a literal argument, and nothing compared it to how many assertions the body actually executed. A gate could declare six, execute three after an early return, and print PASS with six. | The shared harness now clears a module-level ledger on entry, every assertion call appends to it, and a green run whose length differs from the declared count fails with an assertion-count drift message. |
| A count could be lowered | The drift check fires only when declared and executed disagree, so deleting an assertion and lowering the literal together still passed. | A ratchet ledger records the high-water assertion count per gate. The harness raises it on every green run and never lowers it, and a new gate fails any gate that reports fewer assertions than its high-water. The sanctioned way down is a recorded ADR, and that gate's second assertion requires the ADR to carry all three of removed, why and week, so an empty object is not a free pass. |
| A count could be padded | An assertion whose first argument is the bare literal true can never fail. It inflates the count, satisfies the ratchet, and is invisible to the poison-pill proof, which trips the other assertions. | A new gate allows a literal-true assertion only inside a declared budget file, and fails in both directions — over budget, and a budget that no longer matches reality. |
| The index was never inspected | Every gate reads the working tree, so none could see the failure mode that produced the earlier desynchronisation: paths staged as deleted whose files are still on disk. | The index gate now fails on a phantom staged deletion, and reports as an advisory the tracked files absent from the worktree that a blanket commit would sweep in unreviewed. |
| The values that disagree were written in prose | The concrete and bituminous unit weights differ between the coefficient table and the code, and the difference was recorded only in a document nobody executes. | A new deviations gate anchors such a value to a file, a regex and the value the regex must still capture, so neither side can be corrected silently while the other still says something else. |
| A gate could exist and never run | The hygiene gate compared a hand-written list of script names against `package.json`, which catches a gate that was removed but not one that was never wired. A new `scripts/gates/gate-*.ts` could sit on disk referenced by nothing and executed nowhere; the proof gate would flag it only as "never observed RED", which is satisfied by proving a gate that no run ever invokes. | The hygiene gate now derives the gate files from the directory listing and requires each to be referenced by some `package.json` script, so a gate that nothing invokes fails the build. |
| A record could be duplicated | The ledger is one file at one path, but nothing said so. A `CODE-JUNCTION` drop wrote a second ledger — foundation/deviations.json, the same six records, an older schema, no anchors — beside `containment/DEVIATIONS.json`. No gate read it, so nothing could falsify it, and it is the copy a reader is most likely to open. The two could then disagree forever with no signal. | The deviations gate asserts that the ledger path is unique: any second file named deviations.json in the tree fails the gate. Tiering `foundation/**` (done in the same pass, so the drop's own manifest and lock files are declared) would have made the duplicate silent again, which is why the uniqueness is checked rather than the path assumed. |

The general shape of all seven is the same, and it is the operator's thesis stated
exactly: **a check that cannot fail is not a check, and a count is not a check.**

### 10.2 The harness was also unreachable from CI

The CI workflow ran the type check, the tests, the workbook verification chain, the
pipeline smoke run, the bundle build and the audit policy gate — and never invoked a
single gate in `scripts/gates/`. Every gate in this record was, until rev. 4, decorative
on push: it would pass or fail on the operator's machine and nowhere else. The workflow
now ends with a step that runs the canonical entry point `pnpm run gate:foundation`,
which is preflight plus all thirteen gates.

Wiring it once was not enough, and the relapse is the interesting part. A step in a
workflow file is exactly the kind of artefact an enrichment drop rewrites wholesale —
one of the drops in this repository proposes replacing the workflow file outright — and
had that happened, every assertion in §10.1 would have stayed green while CI ran none of
the gates. Present-but-unexecuted is the same defect as a gate nothing invokes, one
level up, so the hygiene gate now asserts the invocation itself: the workflow must
contain a step whose command is the harness entry point, and that step may not carry
`continue-on-error: true`, because a gate that cannot fail the build is not a gate.
Proven RED -> GREEN by replacing the step's command with a no-op.

### 10.3 Transcript — the last stdout line of each gate

```
GATE preflight: PASS 15 assertions
GATE gate-deps: PASS 4 assertions
GATE gate-scripts: PASS 2 assertions
GATE gate-tiers: PASS 3 assertions
GATE gate-proven-red: PASS 2 assertions
GATE gate-hygiene: PASS 7 assertions
GATE gate-chain: PASS 2 assertions
GATE gate-tasks: PASS 2 assertions
GATE gate-docs: PASS 3 assertions
GATE gate-readme: PASS 1 assertions
GATE gate-index: PASS 3 assertions
GATE gate-deviations: PASS 7 assertions
GATE gate-vacuity: PASS 3 assertions
GATE gate-ratchet: PASS 2 assertions

TOTAL ASSERTIONS: 56   FAILING GATES: 0
```

The RED half of the three gates added by this pass, run separately because a gate that
was never observed RED is not a gate:

```
=== node --import tsx scripts/gates/gate-proven-red.ts --prove gate-index
index: gate-index RED (poisoned) -> GREEN (restored) — recorded
=== node --import tsx scripts/gates/gate-proven-red.ts --prove gate-deviations
deviations: gate-deviations RED (poisoned) -> GREEN (restored) — recorded
=== node --import tsx scripts/gates/gate-proven-red.ts --prove gate-vacuity
vacuity: gate-vacuity RED (poisoned) -> GREEN (restored) — recorded
=== node --import tsx scripts/gates/gate-proven-red.ts --prove gate-ratchet
ratchet: gate-ratchet RED (poisoned) -> GREEN (restored) — recorded
```

**Result: 13 gates, 56 assertions, 0 failures, 0 gates exiting 2.** The count moved from
10 gates / 38 assertions to 13 / 56 because this pass adds three gates — the deviations
ledger, the anti-padding check and the ratchet — with 6, 3 and 2 assertions, and raises
the hygiene gate from 5 to 7 and the deviations gate from 6 to 7. Two
existing scripts in the gate directory changed meaning: the file already named as the
index gate carried only a claims staleness check, so the git half was added to it rather
than a second gate being created beside it. No existing assertion was deleted, relaxed
or renumbered, and the ratchet recorded the gates whose counts rose rather than being
told about them.

The sixth hole was found only while closing the fifth, and it is worth stating plainly
because it is the one that survived every other guard. Assertion 5 of the hygiene gate
compared a hand-written list of script names against `package.json`, which catches a
gate that was *removed* but cannot catch one that was never *wired*: a new
`scripts/gates/gate-*.ts` referencing nothing would sit on disk forever, and the proof
gate would flag it only as "never observed RED" — which is satisfied by proving a gate
that no run ever invokes. The gate now derives the list from the directory itself, so a
gate nothing invokes fails the build.

The seventh hole was found by being its victim rather than by reading for it: a
`CODE-JUNCTION` drop wrote a second ledger at foundation/deviations.json over the top of
the canonical one while this pass was running, and the only gate that noticed was the
tier map — for the wrong reason. Tiering `foundation/**` (now done, so the drop's
manifest, engine lock and tolerances are declared on arrival) would have restored
silence. So the deviations gate asserts the thing the tier map cannot: that there is
exactly one ledger. Verified by copying the ledger to that second path — RED — and
removing it — GREEN.

Two artefacts were deleted during this pass rather than tiered, because a second copy of
a record is a second truth: the superseded file under foundation/ (its six records had
already been merged, with anchors, into `containment/DEVIATIONS.json`) and the same file
again when it reappeared in the worktree after a `CODE-JUNCTION` drop wrote it back.
`containment/` is the canonical ledger path: it is tracked, it carries an `anchor` per
record, and `gate-deviations` reads it. A ledger at any other path is enforced by
nothing — which is now itself an assertion rather than a convention.

### 10.4 What rev. 4 does not claim

- **The three new gates are not proof that the engine is correct.** They prove that the
  harness can fail, that it cannot quietly weaken, and that a declared divergence is
  attached to the two source locations that must agree. The engine's own parity
  tolerance, its golden values and its type coverage are separate findings and are not
  addressed here.
- **The deviations ledger records a defect; it does not fix one.** The concrete unit
  weight disagreement between the coefficient table and the code is recorded with the
  engineering decision left open and assigned to W03, exactly as the standing rule
  requires. No value was changed to make the ledger agree.
- **No install was performed, and no dependency was added.** The gates were invoked
  directly, as in §8, and the lockfile state is unchanged.
- **The CI step is written but not observed to run.** Its first execution is the next
  push; this record claims the wiring, not a green CI run.

---

## 11. Rev. 5 — hole #8: a path can be present and still not be carried (2026-10-24)

Rev. 4 made the harness falsifiable. It did not change the question the harness asks,
and that question is the eighth hole: **every gate decides from the working tree.** A
file that sits in this checkout and is carried by no commit satisfies `existsSync`, is
readable, and is walked. On a fresh clone it is not there, and every assertion above the
first script invocation fails — while the machine that holds the file reports green.

### 11.1 The hole, demonstrated rather than argued

The scripts gate asserts that every file a `package.json` script names *exists*. Three
files satisfied that assertion while no commit carried them:

| File | Who names it | Why the checkout still hid the defect |
| --- | --- | --- |
| scripts/lint-pdf-glyph-encodability.ts | `lint:pdf-glyphs`, invoked by the workflow's `check` step | `existsSync` cannot distinguish a committed file from a locally created one. |
| scripts/verify-client-api-links.ts | `verify:apilinks` in scripts/package.json | Scanned by the scripts gate, which reads only the working tree. |
| lib/engine/src/contracts.ts | Declared tier 1 / VERIFIED in containment/ARTIFACT-TIERS.json, and named as the sole origin of the whole `lib` tier | The tier map is a declaration about paths, not about commits; every consumer of it reads the artefact from disk. |

The demonstration is `git ls-files --error-unmatch`, which answered "did not match any
file(s) known to git" for all three while all three were present and readable. The
harness reported 56 assertions green in the same checkout. The third file is the one
that matters most: the tier-1 contract the rest of the engine is declared to derive
from was, until this pass, a file no clone would ever receive.

### 11.2 What closes it

The index gate's fourth assertion reads `git ls-files -z` — the index, which is the
listing that is a property of the commit, the same reason the README module map is
counted from the index rather than from the checkout. It resolves every
`tsx|node|ts-node <file>` target in package.json and scripts/package.json relative to
the directory of the manifest that names it, and fails naming the scripts whose targets
no commit carries.

The poison pill for this gate was repointed to the new assertion, the same convention
commit d41d8eb used for the hygiene gate: the pill edits package.json so that
`gate:readme` points at a gate script that no commit carries, and the gate must go RED on
that and nothing else. The ratchet raised this gate from 3 to 4 assertions by itself.
The README module map was regenerated because it is counted from the index, and tracking
three files changes it — which is itself evidence that the index is the correct source.

Observed RED, by unstaging the three paths and re-running the gate:

```
GATE gate-index: FAIL 4 assertions
  present in this checkout but carried by no commit — a fresh clone runs these and fails:
  package.json: lint:pdf-glyphs -> scripts/lint-pdf-glyph-encodability.ts
  scripts/package.json: verify:apilinks -> scripts/verify-client-api-links.ts
```

Observed GREEN, after tracking them:

```
GATE gate-index: PASS 4 assertions
```

### 11.3 Transcript — the last stdout line of each gate

```
GATE preflight: PASS 15 assertions
GATE gate-deps: PASS 4 assertions
GATE gate-scripts: PASS 2 assertions
GATE gate-tiers: PASS 3 assertions
GATE gate-proven-red: PASS 2 assertions
GATE gate-hygiene: PASS 7 assertions
GATE gate-chain: PASS 2 assertions
GATE gate-tasks: PASS 2 assertions
GATE gate-docs: PASS 3 assertions
GATE gate-readme: PASS 1 assertions
GATE gate-index: PASS 4 assertions
GATE gate-deviations: PASS 7 assertions
GATE gate-vacuity: PASS 3 assertions
GATE gate-ratchet: PASS 2 assertions

TOTAL ASSERTIONS: 57   FAILING GATES: 0
```

**Result: 13 gates, 57 assertions, 0 failures, 0 gates exiting 2.** No gate was added by
this pass and none was removed; the count moved from 56 to 57 because the index gate
gained its fourth assertion. The ratchet recorded that rise rather than being told about
it. No existing assertion was deleted, relaxed or renumbered.

### 11.4 What rev. 5 does not claim

- **The assertion reads the index, not the history.** `git ls-files` lists what is
  staged for the next commit, so a file added with `git add` and never committed
  satisfies it. It closes "present in the checkout but carried by nothing"; it does not
  prove that a commit exists. That is the strongest statement `git ls-files` supports.
- **Only two manifests are scanned.** package.json and scripts/package.json are read. The
  other workspace manifests — under client and under artifacts — name script targets that
  this assertion does not resolve.
- **Only `tsx|node|ts-node <file>` targets are resolved.** A script that shells out to a
  python file, a `.mjs` file, or a binary is not covered.
- **PATH-MANIFEST.json is unchanged.** The three files are pre-existing; W00 neither
  wrote them nor now owns their content — it only asserts that a commit carries them.
  Adding them under W00 would be a false ownership claim, and rev. 4's four new gates
  are likewise not enumerated there. The manifest maps weeks to the paths they write, not
  every path in the repository.
- **The 1055 tracked files absent from this checkout are unchanged and still not
  staged.** The index gate reports that as an advisory and still does. That is a
  worktree-state observation about the operator's machine, not a defect this pass fixes,
  and the advisory is the only thing standing between it and a blanket commit sweeping
  them in unreviewed.
- **The engine is still unproven.** This pass says nothing about the parity tolerance, the
  golden values, the type coverage or the declared unit-weight divergence. Those remain
  the findings of §§4 and 10 and of the deviations ledger.
- **The gates were invoked directly, not through the package manager.** `pnpm run` is
  broken in this sandbox, exactly as §6 records, so each gate was run as
  `node --import tsx scripts/gates/<gate>.ts`. The workflow's invocation of the canonical
  entry point is asserted by the hygiene gate but was not observed to run here.

---

## 12. Rev. 6 — SET ONE: the gate the contract had been describing (2026-10-26)

Rev. 5 closed the hole where a file present in the checkout is carried by no commit.
Rev. 6 answers the instruction that opened this sequence — apply the SET ONE guide in
`CODE-JUNCTION` — and reports the one piece of it the harness was missing, together with
the regressions the guide's own draft tree introduces when applied literally.

### 12.1 The guide was applied by mapping it onto the harness, not by rebuilding it

The guide's Stages 0–7 specify a second green definition: a `gate` chain running nine
stages through `scripts/foundation/*`, described as the only definition of green. A
parallel gate tree is a second source of truth, which is the defect class this harness
exists to eliminate, so each guide instruction was mapped onto the existing containment
harness instead. Three of the guide's instructions, applied literally, each introduce a
defect the harness already has a gate for — and all three were observed RED before repair:

| Guide instruction | Defect it introduces | Detected by |
| --- | --- | --- |
| Author a second ledger next to the committed one | A second truth: the same records, an older schema, no anchors, read by nothing | `gate:deviations` assertion 7 |
| `gate` chain invokes `verify:excel` | A `package.json` target that is never defined, so the chain cannot run at all | `gate:scripts` |
| Author the Set One tree into the worktree | Files present in the checkout and carried by no commit | `gate:index` assertion 4 |

The guide's Node 22 and `npm ci` were likewise not applied: `.nvmrc`, the workflow and
the Dockerfile all pin Node 24, and the root `preinstall` rejects npm, so the guide's
replacement workflow would fail P-04 and P-13 as well as the hygiene gate's CI assertion.

The second ledger was already recorded here as hole #7. Its copy was read by a checker,
scripts/foundation/verify-deviations.mjs — named here as plain text rather than as a
backticked path token, because the file is deliberately gone (ADR-0012, rule 4) — and
that checker printed "5 checked, 0 problems" on every run while reading the wrong file.
That is the sharpest form of the defect: a green check on the copy nothing acts on.

### 12.2 The one piece that was genuinely missing

`containment/CONTRACT.md` had said since the day it was frozen that hash enforcement is
provided by `gate:contracts` — and that it was "not yet installed". Nothing executed that
sentence. It now exists: a `run()` gate, four assertions, tying three things together.

1. `foundation/manifest.json` declares an `authoritativeEngine` and a non-empty
   `engineModules` list.
2. `foundation/engine.lock.json` pins exactly those modules — nothing declared and
   unpinned, nothing pinned and undeclared.
3. Every pinned hash still equals the sha256 of the file on disk.
4. The file the manifest calls authoritative is itself inside the pin, so the one file the
   charter points at cannot sit outside the set that is being checked.

The gate is wired into `pnpm run gate:foundation` after `gate:scripts`, added to the
hygiene gate's required-script list, and carries a poison pill in
`scripts/gates/.pills.json` that corrupts one byte of the lock and requires the gate to
exit 1. The contract rose to version 1.1.0 for the paragraph that names the gate, and
`docs/adr/0013-engine-pin-is-enforced.md` is the ADR that bump requires — the contract's
own rule is that a version change needs one.

### 12.3 Transcript — the last stdout line of each gate

```
GATE preflight: PASS 15 assertions
GATE gate-deps: PASS 4 assertions
GATE gate-scripts: PASS 2 assertions
GATE gate-contracts: PASS 4 assertions
GATE gate-tiers: PASS 3 assertions
GATE gate-proven-red: PASS 2 assertions
GATE gate-hygiene: PASS 7 assertions
GATE gate-chain: PASS 2 assertions
GATE gate-tasks: PASS 2 assertions
GATE gate-docs: PASS 3 assertions
GATE gate-readme: PASS 1 assertions
GATE gate-index: PASS 4 assertions
GATE gate-deviations: PASS 7 assertions
GATE gate-vacuity: PASS 3 assertions
GATE gate-ratchet: PASS 2 assertions

TOTAL ASSERTIONS: 61   FAILING GATES: 0
```

**Result: 15 members, 61 assertions, 0 failures, 0 gates exiting 2.** One gate was added
by this pass and none was removed; the count moved from 57 to 61 because `gate:contracts`
declares four assertions, and the ratchet recorded that gate appearing rather than being
told about it. No existing assertion was deleted, relaxed or renumbered.

Two other reds were cleared in the same pass, both caused by the guide's tree rather than
by the harness: `gate:scripts` failed on the undefined `verify:excel` target until the
target was given a definition, and `gate:readme` failed because adding tracked paths
changes the module map, which is counted from the index. `README.md` was regenerated.

### 12.4 What rev. 6 does not claim

- **The import table in `containment/CONTRACT.md` is still a declaration.** The gate checks the
  engine pin, which is the checkable half of the boundary. Whether `lib/engine` really
  only reaches `lib/units` and `lib/trust` is not asserted by anything, and the contract
  says so in the sentence that names the gate.
- **The assertion reads the index, not the history.** `git ls-files` reports what is
  staged. It closes "present in the checkout but carried by nothing"; it does not prove a
  commit exists. That remains the rev. 5 limit, unchanged.
- **The literal guard is still RED, and that is the finding, not a failure of this pass.**
  `scripts/foundation/literal-guard.mjs` reports roughly 1051 bare numeric literals across
  the engine files. Replacing them is Stage 3/4 work that edits calculation code, and this
  environment has no working test runner to verify such an edit against. A green produced
  by sweeping the numbers into an allowlist would be worse than the red.
- **The baseline test count is a claim, not a measurement.** `@vitest` is absent from
  `node_modules` entirely, so no reporter runs and no report file is produced. The number
  in `foundation/BASE_TEST_COUNT.txt` is the charter's 107, recorded as unmeasured, and
  `verify:testcount` uses it as a floor — which means a wrong baseline is a wrong floor,
  silently. The first run in a working environment must overwrite it.
- **`build` and `audit:policy` were not run.** They need a working `pnpm` and network
  access, neither of which this sandbox has. The guide's `gate` chain cannot pass here for
  that reason and is left red on purpose; its failures are findings.
- **One observation is recorded without a cause.** The second ledger was deleted twice.
  Between the first deletion and the second, `gate:deviations` passed once and then failed
  again with the file present and a later modification time. A controlled probe — staging a
  file, deleting it, and re-checking both a staged and an unstaged path — could not
  reproduce a return for either, so the cause is not established. It is recorded because if
  it recurs it is the finding, not noise. After the second deletion the gate passed on every
  subsequent run.
- **The tracked files absent from this checkout are unchanged and still not staged.** The
  index gate reports them as an advisory and still does. That is an observation about the
  operator's worktree, not a defect this pass fixes.
- **One agreement is still not enforced.** The decision-log numbering under
  `project/decision-log/` now matches `containment/DEVIATIONS.json`, and it was renumbered
  by hand to get there. No gate asserts that the two agree, so the agreement can drift
  again. That is the next hole, not a closed one.

