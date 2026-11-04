# ADR-0013 — The inter-set contract's engine pin is enforced, not asserted

Status: ACCEPTED
Date:   2026-10-26
Week:   W00
Supersedes: none

## Context

`containment/CONTRACT.md` was frozen on 2026-10-23 at version 1.0.0. Its import table
is a declaration — nothing executed it — and since the day it was frozen its own text
admitted the gap:

> hash enforcement is provided by gate:contracts (not yet installed)

A sentence naming a checker that does not exist is the failure this harness exists to
stop, one level up: the boundary can drift away from the tree and no run objects. The
full import table is not checkable here, because it needs a resolved module graph and
this environment has no working install to resolve one with. One half of the boundary
*is* checkable without a module graph: which files constitute the engine, and whether
every one of them is still the bytes that were reviewed.

## Decision

**The authoritative engine is pinned, and the pin is asserted by `gate:contracts`.**

1. `foundation/manifest.json` declares `authoritativeEngine` and the `engineModules`
   list that composes it. It is the only such list.
2. `foundation/engine.lock.json` pins the sha256 of every declared module.
3. `gate:contracts` fails when the manifest and the lock disagree — a declared module
   with no pin, or a pin for a file no longer declared — or when any pinned hash no
   longer matches the file on disk.
4. Editing engine bytes therefore requires `lock:engine` in the same commit. A change
   that forgets the step fails the gate instead of passing quietly.
5. The import table in `CONTRACT.md` remains a declaration, and this record does not
   claim otherwise. The contract's version rose to 1.1.0 for the added paragraph; this
   ADR is the record that bump requires.

## Consequences

- The set boundary is now attached to bytes. Reviewing the engine means reviewing a
  named set of files whose hashes are recorded, so "the engine is unchanged" becomes a
  statement a machine can contradict.
- An engine edit gains a second, non-optional step. That cost is the point: it is paid
  at edit time rather than at the week the drift is discovered.
- The gate is four assertions and was observed RED before it was GREEN. The poison pill
  in `scripts/gates/.pills.json` corrupts one byte of the lock, the gate must exit 1,
  the byte is restored and the gate must exit 0.
- `CONTRACT.md` may still be wrong about the import table. This closes the pin, not the
  table, and the file says so in the same sentence that names the gate.

## Alternatives

- **Assert the import table instead.** Rejected: it needs a resolved module graph, which
  cannot be built without a working install, and a checker that cannot run is the defect
  being repaired.
- **Leave both the sentence and the version at 1.0.0.** Rejected: the contract would keep
  describing an enforcement that does not exist, which is precisely what it was honest
  enough to flag, and the flag would then be the permanent state.
- **Rely on review to keep the pin current.** Rejected: a hash nothing compares is a
  comment.

## Reversal

Reverse this if any of the following becomes true:

- a real module-graph check makes the pin redundant;
- `lock:engine` stops being run deliberately and becomes a step executed to silence the
  gate, at which point the pin records compliance rather than agreement;
- the engine stops being a small, nameable set of files.
