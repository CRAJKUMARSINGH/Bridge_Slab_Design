# CANONICAL.md — which document is authoritative

This repository has accumulated more than one plan for the same work. That is the
defect this file removes: when two plans disagree, neither is falsifiable, and
every agent that reads the wrong one ships the wrong thing quietly.

## The single plan

**`creat.md` is the canonical plan.** It is the only document whose week list,
status field and close-out rows are authoritative. `creat.md` §8 carries the
week-by-week status; §13 carries the open questions.

## Superseded, kept for provenance

These documents still exist and still get read, so their status is declared here
rather than left to guesswork. They are *inputs*, not authority:

| Document | Status | Why it is not canonical |
| --- | --- | --- |
| [origin-weekly-plan.md](origin-weekly-plan.md) | SUPERSEDED | the pre-Phase-2 weekly plan; its week numbering does not match `creat.md` §8 |
| [docs/plan-b/15-week-implementation-plan.md](docs/plan-b/15-week-implementation-plan.md) | SUPERSEDED | an alternative 15-week schedule that was never adopted |
| [PHASE-2-INDEX.md](PHASE-2-INDEX.md) | DERIVED | a convenience index over `creat.md`; regenerate, never edit |
| [CODE-JUNCTION/VENICE-GUIDE.MD](CODE-JUNCTION/VENICE-GUIDE.MD) | REFERENCE | the Phase-2 enrichment specification this foundation work is drawn from; it describes a tree that has since moved on |
| [kiro-impl-plan.md](kiro-impl-plan.md) | REFERENCE | agent-facing implementation notes |
| [august-due.md](august-due.md) | REFERENCE | defect register; referenced by `scripts/tsconfig.tools.json` |

If a superseded document and `creat.md` disagree, `creat.md` wins and the
superseded document is the thing that is wrong.

## Phase-2 instruction set

Instruction set v2 lives under [docs/phase-2/](docs/phase-2). Its live
containment layer is [docs/phase-2/containment/](docs/phase-2/containment)
(C-01..C-12) and its current week is
[docs/phase-2/week-00/AGENT-INSTRUCTIONS.md](docs/phase-2/week-00/AGENT-INSTRUCTIONS.md).
The pre-v2 week files under `docs/phase-2/week-01` … `week-12A` are the Set-1
corpus; they are advisory only and are exempted from `gate:preflight` by
`containment/PENDING-RESOLUTIONS.json` (PR-01..PR-04) until W00 archives them.

## Week-folder spelling

Where a week folder exists under two spellings, `docs/week-N/` is canonical.
The hyphenless copies (`docs/week1/`, `docs/week3/`) are pending archive with a
manifest row. See `containment/PENDING-RESOLUTIONS.json` (PR-05).

## How this is enforced

`gate:preflight` P-12 fails when a competing plan file is present and this file
is empty, and the exemption for PR-06 expires the moment W00 is marked GREEN.
Nothing in the repository may be treated as an instruction merely because it is
written down.
