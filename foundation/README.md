# Foundation — Set One artefacts

Two different things live under this name, and conflating them is how a foundation rots.

- `foundation/` holds the **data** Set One froze: the engine pin, the tolerance register, the
  manifest that names what the engine *is*.
- `scripts/foundation/` holds the **stage scripts** that read that data. They are independent
  `node`/`tsx` programs, not harness gates.

## The two entry points

| Command | What it is | Status |
|---|---|---|
| `pnpm run gate:foundation` | **The canonical green.** The containment harness — preflight + 14 gates — and the step CI runs blocking. | green |
| `pnpm run gate` | The Set One stage chain (`verify:*`, then `build`, then `audit:policy`). | **not green — see below** |

`gate:foundation` is the only definition of green that CI enforces. `gate` is a wider chain that
cannot pass until the items in the next section are done; it is kept because its failures are
findings, not noise.

## Current state of `pnpm run gate`

| Stage | Script | Status |
|---|---|---|
| G1 | `verify:foundation` | PASS — paths, engine pin, lockfile discipline, LFS resolution |
| G3a | `tests/golden/kherwara/golden.test.ts` | needs a working vitest (see below) |
| G4 | `verify:excel` | PASS — workbook shape |
| G6 | `validate:registries` | PASS — `docs/week-0/*.json` against their schemas |
| G7 | `verify:literals` | **RED — ~1051 bare numeric literals** in the engine files |
| G8 | `verify:imports` | PASS — no mirror tree exists to diverge from |
| G9 | `build` / `audit:policy` | not runnable without a working pnpm and network access |

The literals red is the Stage 3/4 work: replacing the engine's magic numbers with
`COEFFICIENTS.*` and annotating the rest. It is not applied, because it edits calculation code
and this environment has no working test runner to verify the change against. **A red here is
the deliverable; a green produced by sweeping numbers into an allowlist would not be.**

## Rules

1. Never widen a tolerance without adding `approvedBy` + `approvedOn` to
   `foundation/tolerances.json`.
2. Never change engine math without `pnpm run lock:engine` in the same commit — `gate:contracts`
   fails otherwise.
3. Never fix a formula discrepancy silently. There is **one** deviation ledger,
   `containment/DEVIATIONS.json`, and `gate:deviations` is the one checker. A second file named
   `deviations.json` anywhere in the tree fails that gate — this was tried once and reverted.
4. Never delete a test to make CI pass.
5. `foundation/manifest.json` is the only list of engine modules. Adding an engine file means
   adding it there and re-running `lock:engine`.

## Adding an engine module

1. Add the path to `foundation/manifest.json` → `engineModules`.
2. Run `pnpm run lock:engine` (writes `foundation/engine.lock.json`).
3. Commit both files together, with the module.

## Resolving a deviation

1. Make the code change.
2. Update the record in `containment/DEVIATIONS.json` and the anchor it carries.
3. Fill in the ruling under `project/decision-log/`.
4. Re-run `pnpm run lock:engine` if the change touched an engine module.
5. Re-run `pnpm run golden:bless` if the change moved any numeric output.
6. Commit the deviation, the fix, the log and the pin together so they are atomic.
