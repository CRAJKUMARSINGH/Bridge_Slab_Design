# PHASE 2 INTER-SET CONTRACT — version 1.0.0

Frozen: 2026-10-23 · Change requires an ADR and a minor version bump.

Hash enforcement is provided by `gate:contracts` (not yet installed — see P2-W00). Until it
is installed this table is a declaration, not an enforced boundary.

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
