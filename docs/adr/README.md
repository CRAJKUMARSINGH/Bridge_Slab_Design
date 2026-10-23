# Architecture decision records

One file per decision, numbered, never edited after the fact. A decision that is
overturned gets a new record that supersedes the old one — the old text stays,
because the reason a choice was made is the thing that gets lost first.

## Format

```
# ADR-NNNN — title

Status: PROPOSED | ACCEPTED | SUPERSEDED by ADR-NNNN
Date:   YYYY-MM-DD
Week:   WNN
Context / Decision / Consequences / Alternatives / Reversal
```

An ADR without a **Reversal** section is not finished: it says what was chosen
but not what would have to become true for the choice to be wrong.

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [0008](0008-single-pdf-stack.md) | One PDF stack: jsPDF, not pdf-lib | ACCEPTED |

Numbers 0001–0007 and 0009–0012 are **reserved and unwritten**. They are not
listed above because a record that does not exist cannot be cited. They remain
reserved because the Phase-2 set refers to them by number, and renumbering would
break those references — the opening decision in each is recorded in
`containment/claims.json` until the record itself is written.

`docs/adr/**` is tier 4 (ASSERTED) in `containment/ARTIFACT-TIERS.json`. An ADR is
a statement about intent, not evidence about behaviour: no gate may read one, and
`gate:tiers` fails if one tries.
