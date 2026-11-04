# Contributing

## Install and run

This workspace is **pnpm only**. The `preinstall` hook in
[package.json](package.json) rejects npm and deletes stray `package-lock.json` /
`yarn.lock` files. Node 24 (see [.nvmrc](.nvmrc)); CI pins the same major.

```
pnpm install
pnpm run check            # typecheck + narrative lint + pdf glyph lint
pnpm run test
pnpm run gate:foundation  # the Phase-2 foundation gates
pnpm run verify           # oracle / golden / parity verification chain
```

## Before you open a change

Run, in this order:

```
pnpm run gate:foundation
pnpm run check
pnpm run test
```

All three must be green. `gate:foundation` runs `gate:preflight` first: if the
instruction set is referencing a path or an npm target that does not exist, that
is a build failure, not a warning.

## House rules

1. **Nothing is deleted.** Retired artefacts move to `archive/` and gain a row in
   [archive/MANIFEST.md](archive/MANIFEST.md) naming the replacement, the reason,
   the week and a content hash. Deleting a file removes the only evidence that it
   ever existed.
2. **A gate is only real once it has been observed RED.** A new gate must be
   proven with `pnpm run gate:prove -- <gate>`, which poisons the artefact the gate
   guards, requires exit 1, restores the bytes and records the observation in
   [scripts/gates/.proven.json](scripts/gates/.proven.json). Regression tests for
   a gate are not prose.
3. **No gate reads narrative.** A gate may read a tier-1 document (a contract, an
   instruction file, a claim) and must not read a tier-4 one (a README, a
   changelog, a design note). `gate:tiers` fails on it. Prose is input for humans,
   never truth for a machine.
4. **One owner per path.** A path is written by exactly one week, declared in
   [PATH-MANIFEST.json](PATH-MANIFEST.json). P-15 enforces it.
5. **The allowed dependency set is declared.** A referenced-but-absent package
   goes in [.deps-plan.json](.deps-plan.json) with the week that owes it. The list
   may only shrink, and `gate:deps` fails once that week is GREEN.
6. **Prose is not a specification.** If two documents disagree, the one named in
   [CANONICAL.md](CANONICAL.md) wins, and the other is the thing that is wrong.

## Commit messages

`type(scope): imperative summary`, with the gate that proves the change named in
the body. One logical change per commit; do not mix a refactor with a behaviour
change or with a new gate.

## Adding a gate

Name the file `scripts/gates/gate-<thing>.ts`, call `run("<gate-name>", n, …)`
from [_lib.ts](scripts/gates/_lib.ts), write the assertion count as the literal
third argument, add a poison pill to
[scripts/gates/.pills.json](scripts/gates/.pills.json), wire a `gate:<thing>`
script in `package.json`, then prove it red.

## Documentation

`docs/phase-2/` is the Phase-2 instruction set. `docs/phase-2/containment/`
holds C-01..C-12, the rules that keep the rest of the set honest. Every task in a
week file must declare the artefact it produces and be marked `MACHINE` or
`MANUAL` — `gate:tasks` fails otherwise.
