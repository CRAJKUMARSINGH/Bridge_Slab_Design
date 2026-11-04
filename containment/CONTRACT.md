# PHASE 2 INTER-SET CONTRACT — version 1.1.0

Frozen: 2026-10-23 · Change requires an ADR and a minor version bump.

Engine-pin enforcement is provided by `gate:contracts`. It ties `foundation/engine.lock.json`
to `foundation/manifest.json` (the declared `engineModules`) and to the sha256 of each module
on disk, and refuses a run in which any of the three disagree. What it does **not** enforce is
the import table below: that table is still a declaration. The gate's scope and this 1.1.0
bump are recorded in CHANGELOG.md.

| From | To | Via | Allowed |
|---|---|---|---|
| lib/engine | lib/units | @units | yes |
| lib/engine | lib/trust | @trust | yes |
| lib/engine | node:crypto | builtin | yes |
| lib/engine | client/ | any | NO |
| lib/engine | server/ | any | NO |
| lib/drawing | lib/engine | @engine (read-only) | yes |
| client/ | lib/engine | @engine | yes |
| client/ | server/ | HTTP only | yes |
| server/ | lib/engine | @engine | yes |
| scripts/ | lib/engine | @engine | yes |
| any | README.md / docs/* | never parsed | NO |

## Rule

An undeclared cross-boundary import is a build failure, not a style note. Adding one
requires editing this file, bumping its version, and recording an ADR.
