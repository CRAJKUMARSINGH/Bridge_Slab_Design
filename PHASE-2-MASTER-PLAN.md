# PHASE 2 — MASTER PLAN

This file is the front door to Phase 2. It states what the phase is, what governs
it, where each part of the kit lives, and what order it runs in. It contains no
new facts: every statement here is a pointer at the artefact that owns it, so that
when the two disagree the artefact is right and this file is stale.

## What Phase 2 is

Phase 2 turns the existing bridge-design application into a governed engineering
tool: a consolidated engine with clause-referenced methods, an oracle derived from
the real workbooks rather than from the app's own fixtures, drawings and estimates
that agree with each other, and a report that a licensed engineer can sign.

The phase's honest starting position is recorded in
[PHASE-2-GATE-SPECS.md](docs/phase-2/PHASE-2-GATE-SPECS.md) and in the W00 exit
evidence: Set 1's exit gates were prose checklists, and a checklist cannot fail.
Everything Phase 2 adds exists to make a week's claim falsifiable by a command.

## What governs it

| Layer | Artefact | Authority |
| --- | --- | --- |
| Gate contract | [PHASE-2-GATE-SPECS.md](docs/phase-2/PHASE-2-GATE-SPECS.md) | exit 0 PASS / 1 FAIL / 2 NOT IMPLEMENTED; last line `GATE <name>: PASS\|FAIL <n> assertions` |
| Control | `scripts/gates/preflight.ts` | 15 assertions P-01..P-15; nothing runs until 15/15 |
| Prevention | [containment/CONTRACT.md](containment/CONTRACT.md) | tiering, claim ledger, re-derivation, gate monotonicity |
| Blast radius | [containment/ARTIFACT-TIERS.json](containment/ARTIFACT-TIERS.json) | which artefacts a gate may read, and which are prose |
| Ownership | [PATH-MANIFEST.json](PATH-MANIFEST.json) | one owning week per path, and the list of planned-but-absent paths |
| Standing defects | [containment/PENDING-RESOLUTIONS.json](containment/PENDING-RESOLUTIONS.json) | owned, expiring exemptions; the list may only shrink |
| Decisions | [docs/adr/README.md](docs/adr/README.md) | one record per decision, each with a Reversal section |
| Week status | [containment/GATE-LEDGER.json](containment/GATE-LEDGER.json) | one row per week; a week is GREEN only on evidence |

## The weeks

The week table, its prerequisites, and each week's primary agent and verifier are
in [PHASE-2-INDEX.md](PHASE-2-INDEX.md). Each row points at one
`docs/phase-2/week-NN/AGENT-INSTRUCTIONS.md`. The index is the table of record;
it is not duplicated here, because a table in two places is a table that
disagrees with itself.

Ordered entry: **W00** installs the containment layer and the gates. **W01**
installs the document templates, the gate harness wiring, and the deliverable
contracts. Weeks W02..W12A then run against that infrastructure, and the phase
ends with W12A's cutover, launch evidence, and handover pack.

## Where the kit lives

| Set | Files | Location | State |
| --- | --- | --- | --- |
| 1 — week instructions | 12 | `docs/phase-2/week-NN/AGENT-INSTRUCTIONS.md` | present |
| 2 — assimilation inserts | 6 | folded into the week-NA instruction files | present |
| 3 — verifier protocol + 9 scopes | 10 | [docs/phase-2/verification/](docs/phase-2/verification/) | present |
| 4 — engineering algorithm specs | 12 | [docs/phase-2/specs/](docs/phase-2/specs/) | present |
| 5 — government-deployment layer | 12 | [docs/phase-2/govt/](docs/phase-2/govt/) | present |
| 6 — containment | 12 + 7 | [docs/phase-2/containment/](docs/phase-2/containment/) plus [containment/](containment/) | present |

W00 publishes its own instruction file on top of Set 1, so the week corpus on disk
is 13 instruction files, not 12.

Sets 3, 4 and 5 keep the paths the enrichment guide gives them, and each file has
exactly one owning week in [PATH-MANIFEST.json](PATH-MANIFEST.json). The G-series
documents carry their code listings inside the documents: they are the owning
week's brief, and the week creates the source file. That placement rule, and its
reasons, are recorded as
[ADR-0011](docs/adr/0011-spec-corpus-placement.md).

## Two things that are load-bearing

1. **`G-02` (unit systems) and `G-03` (localisation) must land before W10.** If
   the report format freezes before the unit registry and the Devanagari font
   exist, the report renderer is written twice. Devanagari needs *shaping*, not
   only font embedding — see [ADR-0010](docs/adr/0010-devanagari-shaping-admitted.md).
2. **`G-07` (engine versioning) answers the question nobody asks until it
   matters:** the engine changed — is my signed report still valid? Without the
   report-invalidation path, a formula fix silently orphans signed work.

`G-12` (succession) is the one that protects the other fifty-one files: a
handover pack that nobody can follow, and a walkthrough that has never been
followed literally by a second person, means the work survives only as long as
its author does.

## Risks, findings, and the scorecard

- Risk register: [docs/phase-2/RISK-REGISTER.md](docs/phase-2/RISK-REGISTER.md)
- Finding burn-down: [docs/phase-2/FINDING-BURN-DOWN.md](docs/phase-2/FINDING-BURN-DOWN.md)
- Scorecard: [docs/phase-2/SCORECARD.md](docs/phase-2/SCORECARD.md)
- Agent packs: [docs/phase-2/AGENT-PACKS.md](docs/phase-2/AGENT-PACKS.md)
- Template kit index: [PHASE-2-DOC-TEMPLATES.md](PHASE-2-DOC-TEMPLATES.md)

Independence rule: an agent never verifies its own week. The author and the
verifier are always different agents, and the verifier's output is a verdict of
VERIFIED, VERIFIED WITH FINDINGS, or NOT VERIFIED — never an agreement.

## Exit gate

[ ] Every week in [containment/GATE-LEDGER.json](containment/GATE-LEDGER.json) is
    GREEN, or is PENDING with a named blocker
[ ] `gate:preflight` is 15/15 and `gate:foundation` is green on the release commit
[ ] No entry in [containment/PENDING-RESOLUTIONS.json](containment/PENDING-RESOLUTIONS.json)
    outlived its closing week
[ ] The finding burn-down is Closed or Deferred-with-reason for all 50
[ ] W12A's handover pack builds and contains every required section
[ ] A licensed engineer has signed the launch evidence

## Reversal

This file is a doorway, not a decision. It is superseded without a new ADR when
the artefacts it points at change, and it must be amended rather than defended: if
a statement here is not a pointer at something checkable, the statement is wrong
and the artefact is right.
