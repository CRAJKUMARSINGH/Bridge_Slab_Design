# archive/MANIFEST.md

Nothing in this repository is deleted. When an artefact is retired it moves under
`archive/` and gains one row here. The row is the only evidence that the thing
existed, so it is written before the file moves, not after.

## Row schema

| Column | Meaning |
| --- | --- |
| `path` | the path the artefact had **before** it was archived |
| `archivedAs` | the path it has now |
| `replacedBy` | the artefact that took over its job, or `none` |
| `reason` | why it was retired, in one sentence |
| `week` | the week that retired it |
| `sha256` | hash of the content as archived |
| `verified` | `yes` once a gate or verifier has been run against the replacement |

A row with `replacedBy: none` and no `reason` is a deletion wearing a costume.

## Rows

| path | archivedAs | replacedBy | reason | week | sha256 | verified |
| --- | --- | --- | --- | --- | --- | --- |
| `api/index.ts` | `archive/api/index.ts` | `server/` | pre-Express-split entry point | pre-W00 | TBD | no |
| `client/src/**` | `archive/client/src/**` | `client/src/**` (current) | pre-Vite-split UI tree | pre-W00 | TBD | no |
| `archive/test-outputs/**` | (in place) | `test-output/**` | QA logs kept for provenance, not regenerated | pre-W00 | TBD | no |
| `archive/test-outputs/qa-251/**` | (in place) | — | 251-user stress artefacts, retained as evidence of a run | pre-W00 | TBD | no |

Rows marked `pre-W00` record artefacts that were already under `archive/` when
the Phase-2 foundation week started. `sha256` is `TBD` for those because they were
archived before the manifest existed and the hash is written when the row is
next touched, not invented now.

## Pending retirements (not yet moved)

These are declared so the move is a scheduled action rather than a surprise:

| path | replacedBy | reason | week |
| --- | --- | --- | --- |
| `origin-weekly-plan.md` | `creat.md` | superseded plan; see [CANONICAL.md](../CANONICAL.md) | W00 |
| `docs/plan-b/15-week-implementation-plan.md` | `creat.md` | superseded alternative schedule | W00 |
| `docs/week1/**` | `docs/week-1/**` | duplicated week-folder spelling (H-15) | W00 |
| `docs/week3/**` | `docs/week-3/**` | duplicated week-folder spelling (H-15) | W00 |
| `scripts/gates/*.mjs` | `scripts/gates/*.ts` | NOT-IMPLEMENTED stubs kept beside the real gates | W00 |

Nothing above has been moved yet. The move is what W00 close-out does, and each
move adds its row with a real hash.
