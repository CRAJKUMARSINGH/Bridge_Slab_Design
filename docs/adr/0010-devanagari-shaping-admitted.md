# ADR-0010 — Devanagari shaping admitted; the single PDF writer is kept

Status: ACCEPTED
Date:   2026-10-23
Week:   W10
Supersedes: the shaping clause of [ADR-0008](0008-single-pdf-stack.md)

## Context

[ADR-0008](0008-single-pdf-stack.md) chose one PDF stack — jsPDF, with
`jspdf-autotable` and `html2canvas` — and its **Consequences** section said two
things at once: that complex-script shaping was *not* supported by that decision,
and that if the requirement arrived, "it arrives as a new ADR, not as an
undeclared second library."

The requirement has now arrived. `docs/phase-2/govt/G-03-localisation.md` is the
localisation specification: a Hindi UI, a bilingual government-submission report,
and Devanagari text in the PDF — with the explicit warning that "Devanagari needs
*shaping*, not just font embedding", and a hard precedence: the font must be
embedded before the PDF format freezes (G-03 feeds W10 and W11).

Two facts are already recorded in the W00 layer and are not re-decided here:

- `harfbuzzjs` and `@pdf-lib/fontkit` are both **allowlisted in
  [.deps-plan.json](../../.deps-plan.json) against W10**, with
  `@signpdf/*` against W12A. ADR-0008 states this itself.
- Devanagari was already called out in ADR-0008 as the specific case that would
  force a reconsideration.

What ADR-0008 did not settle is how a shaping library coexists with a
single-writer rule, and G-03's code samples do not settle it either: the
`drawShaped` sample in that file is written against `pdf-lib` (`page.drawText`),
which ADR-0008 explicitly rejected.

## Decision

**The requirement is admitted; the single-writer rule is kept.**

1. **Shaping is admitted.** `harfbuzzjs` is a permitted dependency at W10 for
   one purpose: turning a Devanagari string into positioned glyph ids and
   advances. This is the reversal clause of ADR-0008 firing, and it is recorded
   rather than assumed.
2. **There is still exactly one PDF writer: jsPDF.** ADR-0008 is unchanged in
   force. A second library that *draws* into the document is not admitted by this
   record; `pdf-lib` and `pdf-lib`-flavoured drawing remain off the roadmap.
3. **G-03's `pdf-lib` samples describe the shaping pipeline, not a stack
   change.** They are read as "shape first, then draw the run"; the drawing step
   is the existing jsPDF writer's business. G-03 carries a pointer to this record
   so that a later reader does not take the sample as the decision.
4. **How a shaped run is drawn is a W10 implementation detail**, evidenced by
   that week's report-parity run. It is deliberately not fixed here: this record
   decides the boundary between shaping and writing, not the drawing API.

## Consequences

- Hindi and bilingual reports become deliverable, which is what G-03 requires and
  what a PWD submission implies.
- One writer is preserved, so the HTML/PDF parity check that the report is
  trusted for keeps meaning. A second writer would have given parity two code
  paths to keep in step.
- The dependency allowlist gains a real consumer: `gate:deps` now has a week at
  which `harfbuzzjs` is expected to move from `.deps-plan.json` into
  `package.json`, and it will be red until it does.
- Font files become tracked artefacts with their own manifest rows
  (`lib/report/fonts/`), because a licence-bearing binary in the report path is
  not a build artefact.
- Risk: ADR-0008's `lint:pdf-glyphs` check was the previous answer to
  unencodable text. It stays, and it now has to agree with the shaper. A string
  the shaper handles but the lint rejects, or vice versa, is a defect in W10's
  report, not a reason to relax either.

## Alternatives

- **Install `pdf-lib` as the writer and use its shaping ecosystem.** Rejected:
  this is exactly the reversal ADR-0008 forbade without cause. The cause here is
  *shaping*, which `pdf-lib` does not itself provide — `harfbuzzjs` is the
  shaping library in both designs.
- **Keep jsPDF only, transcribe Hindi text as images.** Rejected: an image is not
  text. It is neither searchable nor selectable, it inflates the deliverable, and
  it removes the string from the glyph lint that ADR-0008 relies on.
- **Ship the bilingual report in transliterated Latin script.** Rejected: this is
  a government-submission requirement for Devanagari, not a UI preference.
- **Admit both shaping libraries and pick per call site.** Rejected: two shaping
  paths with one renderer is the same defect class ADR-0008 rejected for PDF
  writers.

## Reversal

Reverse this if any of the following becomes true:

- `harfbuzzjs` cannot be driven to produce correct Devanagari clusters in a
  serverless runtime, so that shaping has to move to the writer library;
- the jsPDF writer cannot be made to draw a shaped run at all, which would make
  "one writer" and "shaped Hindi" mutually exclusive and force the choice back
  to a superseding record;
- the bilingual requirement is withdrawn, in which case the admission serves
  nothing and the allowlist entry should move back out.

Any of those is a new ADR. None of them is a reason to leave a second PDF writer
in the tree without a record, which is the failure mode ADR-0008 was written to
prevent.
