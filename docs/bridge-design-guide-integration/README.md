# Bridge Design Guide archive integration

This is a curated, reference-only integration of material from
`attached_assets/Bridge-Design-Guide_1786471895053.zip`.

## Included

- Provenance and source-scope boundaries.
- Report-integrity testing lessons from the uploaded causeway project.
- An improved Plan B 15-week hardening schedule.

## Domain boundary

The uploaded archive primarily documents a **vented submersible causeway**
project using IRC SP:82-2008 and related IRC provisions. The public repository
is a **bridge-slab design report system**. These domains are not automatically
interchangeable.

Causeway formulas, narratives, drawings, assumptions, and regulatory
references must not be treated as bridge-slab calculation authority without:

1. Explicit engineering mapping.
2. Named source and revision.
3. Unit and range review.
4. Golden-case verification.
5. Independent licensed-engineer review.

## Deliberately excluded

The patch does not copy:

- `.git/` history or remotes.
- `.local/`, package caches, `node_modules/`, or build output.
- Credentials, environment values, or machine-local paths.
- Unreviewed PDFs, spreadsheets, CAD files, or generated reports.
- Causeway-specific calculation implementation code.

## Acceptance rule

Report-integrity checks are separate from numerical correctness. A report can
have the expected page count and required phrases while still containing an
incorrect calculation. Keep all results marked **DRAFT** until engineering
review is recorded.
