# Archived: the second, weaker asset inventory

Moved here on 2026-10-06 (DUE-9, `august-due.md` §Q). `scripts/src/assimilate.py` was a duplicate of
`scripts/assimilate/inventory.py`: same job (hash the legacy Office corpus into an
`asset-register.v1` JSON), different defaults and a smaller schema.

## Why it was removed from the pipeline

Two divergent inventories meant `pnpm run assimilate` and `pnpm run assets:inventory` wrote **different
registers**:

| | `src/assimilate.py` (archived) | `assimilate/inventory.py` (live) |
| --- | --- | --- |
| default root | `attached_assets` — a directory that does not exist in this checkout | `Attached_Assets` |
| default output | `project/asset-catalog/asset-register.json` | `asset-register.json` |
| per-file fields | `role: "unresolved"`, `disposition`, `reviewStatus` | `projectHint`, `disposition`, `reviewStatus` |
| summary | `fileCount` only | `fileCount`, `byKind` |
| content-type coverage | no `.dxf`, no `.zip` | `.dxf` and `.zip` indexed |
| `generatedAt` | absent | present |

The archive of this file is what `pnpm run assimilate` called until now. Run with no arguments it points at
a root that does not exist in this checkout, so it exits with `Asset root does not exist` — and the
414-byte `project/asset-catalog/asset-register.json` it was said to have produced matches neither this
script nor `inventory.py` (its `supportedOfficeFilesPresent` / `note` keys are hand-written), so that stub
is an authored placeholder rather than generated output. Either way the command was not a coverage gate.
Action 1.6 of the August plan asks for `assimilate --report` to gate on classification, which is
meaningless while two inventories disagree about what exists.

`pnpm run assimilate` now routes to the live script with explicit paths and `--report`.

## If this file is ever needed again

Restore it to `scripts/src/assimilate.py` only as part of deliberately splitting the lanes — the `.doc`
lane this script was written for is still not implemented anywhere (DUE-9 note in §Q), so there is nothing
here to recover that `inventory.py` lacks other than that narrower scope.
