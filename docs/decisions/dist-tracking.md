# Decision: build output is not tracked

Status: accepted 2026-10-23. Closes PATCH-18 (H-18).

`artifacts/api-server/dist/` and every other `dist/` tree are build output. They are
ignored by `.gitignore` rule 4 (`dist`) and are therefore not in the index —
`git ls-files artifacts/api-server/dist` returns zero paths. The guide's action for
this patch, `git rm -r --cached artifacts/api-server/dist`, is a no-op here because
the ignore rule already keeps the tree out of the index; running it would change
nothing, so it was not run.

The rule this record fixes: a compiled bundle must never be the artefact a gate,
a test, or a reviewer trusts. If build output is committed, a green run can be a
green run against a stale binary rather than against the source that is supposed to
produce it. The source of truth is the source. `artifacts/api-server/dist/index.mjs`
is referenced only by `artifacts/api-server/.replit-artifact/artifact.toml` as a
runtime argument, and only after a build has produced it.

Revert: delete this file and remove `dist` from `.gitignore` — but note that the
revert re-opens H-18, and `gate:hygiene` checks that `.gitignore` agrees with what
is tracked.
