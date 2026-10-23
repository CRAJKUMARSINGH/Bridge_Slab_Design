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
| [0008](0008-single-pdf-stack.md) | One PDF stack: jsPDF, not pdf-lib | ACCEPTED — shaping clause superseded by [0010](0010-devanagari-shaping-admitted.md) |
| [0009](0009-scrypt-not-argon2.md) | Password hashing: node:crypto scrypt, not argon2 | ACCEPTED |
| [0010](0010-devanagari-shaping-admitted.md) | Devanagari shaping admitted; the single PDF writer is kept | ACCEPTED |
| [0011](0011-spec-corpus-placement.md) | Where the Set-3/4/5 specification corpus lives, and who owns it | ACCEPTED |
| [0012](0012-no-dangling-references.md) | No instruction may reference a path that does not resolve | ACCEPTED |

Numbers 0001–0007 are **reserved and unwritten**. They are not listed above
because a record that does not exist cannot be cited. They remain reserved because
the Phase-2 set refers to them by number, and renumbering would break those
references. The names each number is reserved for are recorded in the enrichment
guide's Set-6 list (`CODE-JUNCTION/VENICE-GUIDE.MD`), not in this directory: tier
model, no-gate-reads-prose, re-derivation requirement, gate monotonicity,
contract freeze, escape protocol, and Ka handling (D-15). The opening decision
behind 0009 is likewise recorded in that guide's decision log as `DL-004`; the
record itself is now written and supersedes that row as the citable authority.

`docs/adr/**` is tier 4 (ASSERTED) in `containment/ARTIFACT-TIERS.json`. An ADR is
a statement about intent, not evidence about behaviour: no gate may read one, and
`gate:tiers` fails if one tries.
