# PHASE-2-DOC-TEMPLATES.md

The doc-template kit: the 22 skeletons that live in
[docs/phase-2/_templates/](docs/phase-2/_templates/), the rule that turns a copied
skeleton into a document, and which week fills which skeleton.

This file is referenced by [PHASE-2-INDEX.md](PHASE-2-INDEX.md) and
[PHASE-2-MASTER-PLAN.md](PHASE-2-MASTER-PLAN.md) as the source of the kit. The
skeletons themselves are on disk verbatim, each carrying a leading HTML comment
that names its own template path, so a week can copy one without guessing.

## The rule — a template is filled only when nothing is left to fill

A week copies a skeleton into its own directory and replaces **every** doubled-brace
token. A file that still contains `{{` `}}` has not been written; it has been
installed.

`scripts/gates/gate-docs.ts` enforces this inside `docs/phase-2/`:

| Assertion | What it rejects |
| --- | --- |
| placeholder | a surviving doubled-brace token whose body is `[A-Z0-9_]` |
| stub | a file shorter than 200 bytes once trimmed |
| heading-only | a heading followed by nothing, in fewer than 4 lines |

The skeletons under `docs/phase-2/_templates/` are the one place a token is
*allowed* to survive: they are exempted for `gate-docs` by
[containment/PENDING-RESOLUTIONS.json](containment/PENDING-RESOLUTIONS.json) (PR-04),
and the exemption is printed as an advisory rather than swallowed. Copying a
skeleton is therefore safe; leaving it unfilled in a week directory is not.

Tier note: the templates are tier 4 (ASSERTED) narrative — no gate may read them as
a contract. A **filled** copy inside `docs/phase-2/week-*/` is tier 1 and may be
read. The blast-radius map is [containment/ARTIFACT-TIERS.json](containment/ARTIFACT-TIERS.json).

## The 22 skeletons

### Filled by one named week

These have their filling week fixed by the guide's own task lists, so there is no
judgement in the mapping.

| Skeleton | Filled as | Week |
| --- | --- | --- |
| [ARCHITECTURE.md](docs/phase-2/_templates/ARCHITECTURE.md) | `docs/phase-2/ARCHITECTURE.md` | W01 (T1.1) |
| [INPUT-DICTIONARY.md](docs/phase-2/_templates/INPUT-DICTIONARY.md) | `docs/phase-2/INPUT-DICTIONARY.md` | W01 (T1.2) |
| [MODULE-MATRIX.md](docs/phase-2/_templates/MODULE-MATRIX.md) | `docs/phase-2/MODULE-MATRIX.md` | W01 (T1.3) |
| [SECURITY.md](docs/phase-2/_templates/SECURITY.md) | `docs/phase-2/SECURITY.md` | W01 (T1.4) |
| [DATA-MODEL.md](docs/phase-2/_templates/DATA-MODEL.md) | `docs/phase-2/DATA-MODEL.md` | W01 (T1.5) |
| [COMPUTE-TOPOLOGY.md](docs/phase-2/_templates/COMPUTE-TOPOLOGY.md) | `docs/phase-2/COMPUTE-TOPOLOGY.md` | W01 (T1.6) |
| [RUNBOOK.md](docs/phase-2/_templates/RUNBOOK.md) | `docs/phase-2/RUNBOOK.md` | W01 (T1.7) |
| [UAT-PLAN.md](docs/phase-2/_templates/UAT-PLAN.md) | `docs/phase-2/UAT-PLAN.md` | W01 (T1.8) |
| [SCORECARD.md](docs/phase-2/_templates/SCORECARD.md) | `docs/phase-2/SCORECARD.md` | W01 (T1.9) |
| [KNOWN-LIMITATIONS.md](docs/phase-2/_templates/KNOWN-LIMITATIONS.md) | `docs/phase-2/KNOWN-LIMITATIONS.md` | W01 (T1.10) |
| [ORACLE-TABLE.md](docs/phase-2/_templates/ORACLE-TABLE.md) | `docs/phase-2/week-02A/ORACLE-TABLE.md` | W02A (T2A.4) |
| [SOURCE-DEFECT-REGISTER.md](docs/phase-2/_templates/SOURCE-DEFECT-REGISTER.md) | `docs/phase-2/week-02A/SOURCE-DEFECT-REGISTER.md` | W02A (T2A.5) |
| [LAYER-STANDARD.md](docs/phase-2/_templates/LAYER-STANDARD.md) | `docs/phase-2/week-08/LAYER-STANDARD.md` | W08 |

### Copied per week, per module or per bridge

These are not one document. Each week that produces the thing named in the left
column copies the skeleton into its own directory; the owning week is the one whose
instruction file names the deliverable.

| Skeleton | Copied when |
| --- | --- |
| [EXIT-GATE-EVIDENCE.md](docs/phase-2/_templates/EXIT-GATE-EVIDENCE.md) | every week, at close-out, holding raw stdout |
| [CHATLOG-ENTRY.md](docs/phase-2/_templates/CHATLOG-ENTRY.md) | every week, appended to `creat.md` §8 |
| [PARITY-DIFF.md](docs/phase-2/_templates/PARITY-DIFF.md) | every week that matches an engine module against the oracle (W06A and W07A name it explicitly) |
| [ASSUMPTION-REGISTER.md](docs/phase-2/_templates/ASSUMPTION-REGISTER.md) | once per engine module — the heading carries the module name |
| [REALITY-AUDIT.md](docs/phase-2/_templates/REALITY-AUDIT.md) | when a week adjudicates a documentation claim against the tree |
| [DRAWING-REGISTER.md](docs/phase-2/_templates/DRAWING-REGISTER.md) | the drawing week, each time a sheet is issued or revised |
| [MEASUREMENT-RULES.md](docs/phase-2/_templates/MEASUREMENT-RULES.md) | the BOQ week, before any quantity is emitted |
| [REPORT-SPEC.md](docs/phase-2/_templates/REPORT-SPEC.md) | the week the report renderer freezes its chapter list |
| [A11Y-REPORT.md](docs/phase-2/_templates/A11Y-REPORT.md) | the accessibility week, per route |

### Not here

The 22 skeletons are the whole kit. Anything a week writes that is **not** one of
these is a normal deliverable and needs no template — a filled skeleton that has
been extended past its own headings is expected, not a deviation.

The week corpus that consumes this kit is indexed in
[PHASE-2-INDEX.md](PHASE-2-INDEX.md); how the kit was placed and why is recorded in
[docs/adr/0011-spec-corpus-placement.md](docs/adr/0011-spec-corpus-placement.md).
