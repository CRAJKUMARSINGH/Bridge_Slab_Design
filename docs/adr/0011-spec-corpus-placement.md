# ADR-0011 — Where the Set-3/4/5 specification corpus lives, and who owns it

Status: ACCEPTED
Date:   2026-10-23
Week:   W00
Supersedes: none

## Context

The enrichment guide carries five sets of documents: week instructions (Set 1),
assimilation inserts (Set 2), a verifier protocol plus nine verification scopes
(Set 3), twelve engineering algorithm specs E-01..E-12 (Set 4), and a twelve-part
government-deployment layer G-01..G-12 (Set 5). Sets 1 and 2 are already in the
tree as `docs/phase-2/week-NN/AGENT-INSTRUCTIONS.md`. Sets 3, 4 and 5 were not.

Adopting them raised four questions the W00 containment layer does not answer,
and answering them ad hoc would have produced exactly the defect the containment
layer exists to prevent — a document that is authoritative, unowned, and outside
the manifest.

1. **Path.** The guide names these files under its own kit tree. Re-pathing them
   into the week folders would break the guide's own cross-references
   (`G-03 feeds W10`, `V-02 verifies W02`) at the moment those references become
   load-bearing.
2. **Ownership.** `gate:preflight` P-15 requires one owning week per path, and
   P-01 accepts a `PATH-MANIFEST.json` entry as the evidence that an absent path
   is planned rather than forgotten. A 34-file corpus with no manifest rows is
   34 dangling references by construction.
3. **Tier.** The blast-radius map classifies `docs/**` as tier 4 (prose, no gate
   may read it) and `docs/phase-2/specs/**` as tier 1 (authoritative). The new
   trees sit between those two rules.
4. **Code.** The G-series documents embed complete source listings — tour
   definitions, i18n catalogues, handover generators, gate scripts. Whether those
   listings become files at W00 is a decision with a blast radius, because
   `scripts/**` and `lib/**` are tier 2.

## Decision

1. **Keep the guide's paths.** The corpus lands where the guide says it lands:
   `docs/phase-2/specs/` (Set 4), `docs/phase-2/verification/` (Set 3), and
   `docs/phase-2/govt/` (Set 5). Cross-references between the guide's weeks and
   these files stay literal and checkable.
2. **Every file gets exactly one owning week, recorded in
   `PATH-MANIFEST.json`.** The rule is written into the manifest's own note so
   that it can be applied again without re-deriving it: `verification/V-<week>/`
   is owned by the week it verifies; `verification/README.md` and
   `VERIFIER-PROTOCOL.md` by W01, the week that installs the verifier;
   `govt/G-NN-*.md` by its own `Prereq:` week, falling back to the first `Feeds:`
   week when the prerequisite is another G-file; `specs/E-NN-*.md` by the week
   whose method-parity work the spec describes. No path is claimed twice, which
   is the only thing P-15 asks.
3. **The specification trees are tier 1, not tier 4.** A requirement that a week
   is gated on is a contract, not a description, and a gate must be allowed to
   read it. `docs/phase-2/govt/**` and `docs/phase-2/verification/**` are added
   to `containment/ARTIFACT-TIERS.json` as tier 1, matching the existing
   `docs/phase-2/specs/**` rule. Tier 4 remains the default for the rest of
   `docs/**`.
4. **Specs only — no source file is created for a G-series listing.** The code
   blocks stay inside their documents at W00. They are the week's brief, and the
   week that owns them creates the file, at which point `gate:tiers` and
   `gate:deps` see a real artefact with a real owner instead of an early copy
   with neither. The two exceptions are decisions, not code: nothing in this
   corpus is installed, and no dependency is added by landing it.

## Consequences

- P-01 has a manifest answer for every path the corpus names but does not yet
  contain, so a genuine dangling reference in these files is still a finding
  rather than noise.
- An owner exists for every new file, so the "empty directory with an
  explanation" pattern the W00 layer used for `specs/` and `verification/` can be
  retired honestly rather than left asserting that the directories are empty.
- The tier map now distinguishes "authoritative because a week is gated on it"
  from "narrative because it describes". That distinction is what makes P-14 a
  real constraint instead of a path prefix test.
- The G-series code listings are documentation until their week claims them. A
  reader who copies a listing into the tree without a manifest row will find
  `gate:tiers` failing, which is the intended outcome.

## Alternatives

- **Re-path the corpus into `week-NN/` folders.** Rejected: it breaks the guide's
  cross-references at the moment they start being used, and it makes ownership
  ambiguous for the many files that feed more than one week.
- **Land the G-series code as real files at W00.** Rejected: it creates tier-2
  artefacts with no owning week, no test, and no gate — the exact shape of
  artefact that the W00 layer was built to prevent. It also pre-empts the
  superseding decisions those weeks are entitled to make, as ADR-0010 shows.
- **Leave the corpus unenumerated and add a blanket P-01 exemption.** Rejected:
  that is how eighteen absent paths survived twelve weeks in Set 1. An exemption
  records a known defect; it does not resolve one.
- **Classify the new trees as tier 4 like the rest of `docs/`.** Rejected: it
  would make the verification scopes unreadable by the gates that verify against
  them, and would silently demote a contract to a description.

## Reversal

Reverse this if any of the following becomes true:

- a week's first act is to move its spec into its own folder, in which case the
  manifest row moves with it and this record's path decision is obsolete;
- the corpus turns out to be consumed only as prose, so tier 1 overstates its
  authority and P-14 should not have been relaxed for it;
- a G-series listing is needed as a working file before its owning week, which
  would mean the "specs only" rule is blocking work rather than sequencing it.

Any of those is a new ADR. It is not a reason to move a file without moving its
manifest row, which is the one thing that would make the corpus unowned again.
