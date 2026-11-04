# ADR-0012 — No instruction may reference a path that does not resolve

Status: ACCEPTED
Date:   2026-10-23
Week:   W00
Supersedes: none

## Context

Set 1's instruction corpus referenced eighteen paths that did not exist in the
tree: an engine directory that had been consolidated elsewhere, `inputs/`,
`tests/`, and `project/` before they were populated. An agent told to "extend
`lib/engine/src/foo.ts`" either invented the file or reported the task done
against nothing, and both outcomes read as success. The register records the
class once, in [containment/escapes.json](../../containment/escapes.json):

```json
{ "id": "E-001", "artifact": "lib/", "tier": 1,
  "symptom": "README advertised an engine path that did not exist",
  "escapedBecause": "no gate existed; README was Tier 4 and never checked against the tree",
  "detectingGate": "gate:preflight", "gateProvenRed": true,
  "class": "REFERENCED_BUT_ABSENT" }
```

The escape is a class, not an instance. Between the README, eleven instruction
tasks and four weeks' read-first lists, the same mistake propagated across
twelve weeks because nothing compared the prose to the tree. The guide's own
formulation of the fix is the decision, verbatim in
[CODE-JUNCTION/VENICE-GUIDE.MD](../../CODE-JUNCTION/VENICE-GUIDE.MD):

> Create the referent, substitute the builtin, generate the assertion — then let
> the gate go red before you fix it.

## Decision

**A path named in an instruction is a claim, and P-01 of `gate:preflight` is the
assertion that tests it.**

1. Every backticked path token in any file under `docs/phase-2/**` must satisfy
   one of exactly three conditions, in this order:
   - **it exists** in the tree; or
   - **it is declared in [PATH-MANIFEST.json](../../PATH-MANIFEST.json)** under
     one owning week, which is how a path that a *later* week will create is
     distinguished from one that was forgotten; or
   - **it is exempted** by an entry in
     [containment/PENDING-RESOLUTIONS.json](../../containment/PENDING-RESOLUTIONS.json)
     that names an owner, a closing week, and a reason.
2. The exemption door is the narrower of the two. An exemption records a defect
   that already exists and is owned; it is printed as an advisory on every run
   and it dies when its closing week goes GREEN in
   [containment/GATE-LEDGER.json](../../containment/GATE-LEDGER.json). The
   allowlist may only shrink.
3. When a reference and the tree disagree, **prefer creating the referent** to
   repointing the instruction. Creating the path is permanent; a repointed
   instruction is still prose about a path, and the next reader has no way to
   tell which of the two was true.
4. A path that is *not* a path in this repository — a member name inside a
   generated archive, a filename that only exists once a tool runs — must not be
   written as a backticked path token. It is text, and backticks are what makes
   it a claim.

## Consequences

- The escape class `REFERENCED_BUT_ABSENT` has a live detecting gate
  (`gate:preflight`, assertion P-01) and the gate was proven red before the
  reference was fixed, which is what makes this an ADR rather than a repair.
- The manifest gains a second job. It is no longer only an ownership table; it is
  the tree's statement of intent, and P-15 keeps that statement unambiguous by
  refusing to let two weeks own one path.
- Instruction prose is now the input to a check. A document that is written
  before its artefacts must be enumerated in the manifest as it is written, which
  is a cost paid at authoring time instead of at week twelve.
- A gate can pass while a *semantic* reference is still wrong. P-01 tests
  resolution, not meaning: a path that exists but is the wrong path passes. That
  limit is accepted and is why sets 3 and 4 ship with a verifier protocol that
  requires a second agent to re-run the gates and falsify them.

## Alternatives

- **Repoint the eleven tasks to real paths and move on.** Rejected by the guide,
  and rejected here: it fixes the instances and leaves the class, because the
  next instruction can make the same mistake with nothing to object.
- **Check paths only in hand-picked "instruction" files.** Rejected: it is the
  current P-01 scope by accident rather than by design. The scope is
  `docs/phase-2/**` and the exemption list is what narrows it, deliberately and
  with an owner.
- **Fail on any path not present, with no manifest door.** Rejected: P-01 and
  P-15 would then contradict each other — P-15 requires a manifest row for the
  path a future week will write, and P-01 would fail on exactly that row.
- **Warn instead of fail.** Rejected: the class survived twelve weeks as a
  warning nobody read.

## Reversal

Reverse this if any of the following becomes true:

- P-01's exemption list stops shrinking, which would mean the assertion is
  describing a permanent state rather than a deficit being worked off;
- the manifest becomes a file that is written to satisfy the gate rather than to
  state intent, at which point the second door is worse than no door;
- a second, meaning-aware check makes resolution redundant.

Until then, this is why every instruction file in `docs/phase-2/` can be read
literally: the sentences and the tree are asserted to agree, and the assertion
has been observed to fail.
