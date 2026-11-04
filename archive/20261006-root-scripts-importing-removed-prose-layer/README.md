# Archived 2026-10-06 — root scripts that import a module layer that no longer exists

Moved out of `scripts/` by the DUE-8 pass (root `scripts/*.ts` typecheck lane). Nothing here was deleted.

## What is here

| File | Broken import |
|---|---|
| `debug-ctx.ts` | `../bridge-excel-generator/prose/deck-narrative-math` |
| `debug-wind.ts` | `../bridge-excel-generator/prose/deck-narrative-math`, `…/prose/sheet-narratives` |
| `test-narratives-output.ts` | `…/prose/sheet-narratives`, `…/prose/deck-narrative-math`, `../bridge-excel-generator/fixtures/kherwara-design` |

## Why they were archived rather than repaired

`bridge-excel-generator/prose/` and `bridge-excel-generator/fixtures/` do not exist anywhere in the
repository — `test -d bridge-excel-generator/prose` returns false, and neither `computeDeckNarrativeBundle`
nor `getComprehensiveNarrative` is defined by any live file. These three scripts cannot be run, and could
not have been run for as long as that layer has been gone.

The narrative work they were written to inspect now lives in
`bridge-excel-generator/narrative-engine.ts` (`buildNarrativeContext`, `buildSheetNarratives`) and in
`lib/narrative`. Repairing these harnesses would mean rewriting them against a different API — that is a
new tool, not a fix — and no script, gate, doc or CI workflow references any of the three:

```
grep -rl "debug-ctx\|debug-wind\|test-narratives-output" --include='*.ts' --include='*.json' --include='*.yml' --include='*.md' .
→ (nothing outside archive/)
```

## Why they could not simply be left in `scripts/`

Because they import modules that do not exist. Leaving them there would have forced the new
`pnpm run typecheck:tools` lane to exclude them — the exact `tsconfig.flat.json` `baseUrl`-and-excludes
pattern this repository's own comments forbid ("the fix is to declare that package at the root, not to
re-add a baseUrl or to drop files from `include`"). Dead code that constrains a gate is worse than dead
code that is visibly parked.

## Restore

Copy the file back to `scripts/` and repoint the prose imports at `bridge-excel-generator/narrative-engine.ts`.
`debug-ctx.ts` and `debug-wind.ts` also read `scripts/fixtures/kherwara-project-input.ts`, which is still
live, so only the `prose/` lines need attention. `test-narratives-output.ts` additionally needs a
`kherwaraDesign` fixture; the current fixture is `scripts/fixtures/kherwara-project-input.ts`.
