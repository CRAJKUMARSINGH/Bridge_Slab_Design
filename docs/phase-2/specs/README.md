# docs/phase-2/specs/

Week specifications: the per-week statement of what is being built, what it is
verified against, and what would make it wrong.

A specification here is tier 1 (AUTHORITATIVE) in
`containment/ARTIFACT-TIERS.json`, which means two things:

- a gate **may** read it, because it is a contract rather than a description;
- therefore it may contain no placeholders and no unfalsifiable claims.
  `pnpm run gate:docs:strict` fails on a doubled-brace placeholder token, on a
  stub shorter than 200 bytes, or on a heading with nothing under it.

This directory is deliberately empty at W00. The files that belong here are the
per-week specifications of W01 onward, written by the week that owns them and
listed in [PATH-MANIFEST.json](../../../PATH-MANIFEST.json) with a single owner.
An empty directory with an explanation is honest; a directory of stubs that look
like specifications is how twelve weeks of prose happened.
