# ADR-0008 — One PDF stack: jsPDF, not pdf-lib

Status: ACCEPTED
Date:   2026-10-23
Week:   W00
Supersedes: none

## Context

The Phase-2 foundation week found the deliverable pipeline importing two
incompatible PDF toolchains. The installed and shipped stack is jsPDF, together
with `jspdf-autotable` for tables and `html2canvas` for the raster fallback —
declared in [package.json](../../package.json) and used by
[server/pdf-export.ts](../../server/pdf-export.ts) and
[server/landscape-pdf-export.ts](../../server/landscape-pdf-export.ts). The plan,
separately, called for `pdf-lib` and `@pdf-lib/fontkit`, and named `harfbuzzjs`
for text shaping.

Nothing in the tree imports `pdf-lib`. The plan's own alternative ("or an ADR
choosing jspdf-only") is cheaper than adding a second stack, and a second stack is
not a neutral addition: two writers of the same document type mean the HTML-to-PDF
parity check has two code paths to keep in step, and parity is the property the
report is trusted for.

## Decision

**jsPDF is the single PDF stack for this repository.** `pdf-lib`,
`@pdf-lib/fontkit` and `harfbuzzjs` are not installed and are not on the roadmap.
They are recorded in [.deps-plan.json](../../.deps-plan.json) with owning weeks
W10 and W12A so that the plan's later references to them fail loudly rather than
silently resolve to nothing.

Glyph encodability — the reason harfbuzzjs was proposed — is instead handled by
the existing lint, `pnpm run lint:pdf-glyphs`, which runs inside
`pnpm run check`.

## Consequences

- One code path produces PDFs; the HTML/PDF parity check stays meaningful.
- Devanagari and other complex-script shaping is **not** supported by this
  decision. `pnpm run lint:pdf-glyphs` is what keeps an unencodable string out of
  a deliverable; if the requirement arrives, it arrives as a new ADR, not as an
  undeclared second library.
- Anyone following the Phase-2 specification literally will try to install
  `pdf-lib`. `gate:deps` reports those imports as expected-red until the owning
  week, which is why the allowlist entries exist.

## Alternatives

- **Adopt pdf-lib as the single stack.** Rejected: it is not installed, it is not
  imported anywhere, and it would replace a stack that already passes parity
  verification. The migration cost is real and the benefit is unscheduled.
- **Keep both, choosing per document type.** Rejected: two writers of one artefact
  type is the defect this repository already suffers from elsewhere (two plan
  documents, two lockfile conventions, two week-folder spellings).

## Reversal

Reverse this if any of the following becomes true:

- a deliverable must contain text that `lint:pdf-glyphs` cannot encode and shaping
  cannot be done upstream of the PDF writer;
- jsPDF becomes unmaintained, or a dependency advisory lands that cannot be
  pinned away in the `overrides` block of [pnpm-workspace.yaml](../../pnpm-workspace.yaml);
- a signed or certified PDF requires an API jsPDF does not expose.

Any of those is a new ADR that supersedes this one. It is not a reason to add a
second library quietly.
