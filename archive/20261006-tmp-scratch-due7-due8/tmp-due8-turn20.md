
---

## Turn 20 — 2026-10-06 · DUE-8: a real typecheck lane for the root tooling (`take up due tasks and complete them one by one`)

**What moved.** DUE-7 ended with a standing rule: refresh `evidence/release-candidate/` whenever tracked
code moves. The first execution of that rule failed. `pnpm run candidate` exited 1 with no stdout; run
through `execFileSync` to capture the error it was `TypeError: Cannot read properties of undefined
(reading 'split')` at `scripts/build-release-candidate.ts:128`, and after that fix the same error again at
`:161`. Both lines read `g.cmd` while the manifest gates are built as `{ command, exit }` — and both sit on
code paths that only execute when a bundle is actually assembled, which is why every dry reading of that
file looked correct. Fixed at both sites; the rebuilt bundle now writes the gate table properly.

**Why a typo survived, which was the real finding.** It could not be caught, because nothing compiles
those files. `scripts/tsconfig.json` is `"include": ["src"]` with `rootDir: src`, and `tsconfig.flat.json`
reaches root-level scripts only through the glob `scripts/verify-*.ts`. So **39 of the 46 root-level
`scripts/*.ts` were typechecked by nothing** — including the release bundler and the narrative linter,
both of which run inside `check` and `candidate`. This is the same diagnosis as §J-2 ("green gates prove
nothing about the code they skip"), on the tooling side of the repo.

**The lane.** `scripts/tsconfig.tools.json` (extends `tsconfig.flat.json`; includes `*.ts` +
`phase-zero/*.ts`) plus `pnpm run typecheck:tools`, inserted into the `typecheck` chain so it runs inside
`check` and CI. First attempt extended `tsconfig.base.json` instead and reported 24 errors, most of them
`noImplicitAny` noise on scripts written for `tsx`; switching to the flat config's options isolated **15
real errors**. No exclusion lists: `tsconfig.flat.json`'s header already says the fix for a broken file is
to fix the file.

**What the lane found beyond the crash — four more latent defects, all in tools the pipeline uses.**
1. `lint-narrative-no-hardcoded-numbers.ts` declared `skipTemplateBody(start): number` while returning the
   template **string**; its two callers then called `.trim()` and `.length` on a `number`.
2. `run-five-samples-workbook-label-match.ts` and 3. `test-storytelling.ts` passed Node 24's
   `Buffer<ArrayBufferLike>` into ExcelJS's pre-generic `Buffer` — bridged once per file with a commented
   `Uint8Array` binding.
4. `test-storytelling.ts` also called `row.values.map(...)` where ExcelJS types `row.values` as a union of
   an array getter and a `(begin,end)` method; now normalised through an explicit union test.

And the one that mattered most: **`stress-test-251-users.ts` recorded
`pier_max_moment: results.pier?.maxMoment ?? 0` — `PierDesignResult` has no `maxMoment` field**, so all
251 load-test payloads logged a pier moment of 0. It is now the worst of the pier load cases
(`Math.max(0, …loadCases.map(c => c.moment))`), which is what the field was always meant to hold. That
script is invoked by `scripts/qa-ultra-strict.ts`, so this was a QA number, not cosmetics.

**Two undeclared imports, handled without hiding them.** `export-sample-output-bundle.ts` imports `sharp`
and `phase-zero/extract-word.ts` imports `word-extractor`; neither package is declared by any
`package.json` in this repo or present in the store, so neither script can run. They stay **inside** the
lane with a targeted `@ts-expect-error` naming §P-3 on the import line — declaring a package turns its
marker "unused" and fails the lane, which is the deliberate signal to delete the marker. They were not
silently installed: `sharp` is a native binary and the repo pins `minimumReleaseAge: 1440`.

**Three scripts archived, not deleted.** `debug-ctx.ts`, `debug-wind.ts`, `test-narratives-output.ts`
import `bridge-excel-generator/prose/…` and `…/fixtures/kherwara-design` — a module layer that no longer
exists (narratives live in `bridge-excel-generator/narrative-engine.ts` now). Zero references from any
script, gate, doc or workflow, so they moved to
`archive/20261006-root-scripts-importing-removed-prose-layer/` with a README giving the repair path.

**LFS census, now repo-wide and in two scopes** (§P-6). Tracked binary assets: 1,659 total, **1,529 still
pointer stubs**, 17 materialised, 113 absent from the worktree (the pre-existing `Attached_Assets/**` and
`sheets-extracted/**` deletions this register deliberately does not touch); stubs by directory —
`assets/` 1,400, `Attached_Assets/` 68, `sample/` 60, root 1. Files actually on disk: `assets/` 1,876
stubs of 2,080; `Attached_Assets/` 710 of 715. §O-4's single-scope figure understated this.

**§J-9 was half wrong, and is corrected.** `pnpm run assets:inventory` is not a stub and not even
TypeScript — it runs `python scripts/assimilate/inventory.py`, exited 0, and replaced a 985-byte file with
a **46,396-byte register of 97 Office/CAD assets** (49 `workbook-legacy`, 32 `drawing-cad`, 14 `workbook`,
2 `workbook-macro`, sha256 per file). Reading each indexed file back showed **96 of 97 are LFS pointers**:
the register is honest, the corpus behind it is empty. 93 of 97 still say `projectHint: "unassigned"`. So
**A1 is done**; A2–A5 need `git lfs pull` first.

**Tooling notes for future turns.** Bash stdout was dropped again for the candidate run, so the exit code
went to `tmp-due8-candexit.txt` and was read back. Inline `node -e` with a regex containing backslashes got
mangled by shell escaping (`SyntaxError: missing ) after argument list`) — write the probe as a `.mjs`
file instead of quoting it. Editing the register by script (BOM-preserving) remains the reliable path
around the box-drawing/em-dash mojibake that breaks the Edit tool in this repo.

**Evidence.** `pnpm run check` **exit 0** with the new step in it (43 root files compiled,
`pnpm run typecheck:tools` exit 0 on its own after the stale exclude entry was trimmed). `pnpm run
candidate` **exit 0**; `MANIFEST.md` shows `| \`pnpm run check\` | 0 | gates/check.txt |` and the same for
`verify`, with six deliverables digested. Those digests differ from Turn 19's bundle while every gate
value is unchanged — ExcelJS and the PDF writer stamp creation times, so `sha256sum` proves nothing about
numbers and `verify` is the numeric proof.

**Register.** `august-due.md` — new §P (P-1 crash, P-2 lane gap, P-3 four latent defects + the QA field,
P-4 undeclared packages, P-5 archived scripts, P-6 two-scope LFS census, P-7 §J-9 re-scope, P-8 evidence);
§O-8's "lane not yet wired / SUMMARY HIGH #17" cross-reference corrected to row 10a; SUMMARY gained rows
10a (lane, DONE) and 18a (declare `sharp`/`word-extractor` or retire the two tools); BLOCKING #4 rewritten
with both census scopes; DUE-5/6/7/8 recorded under COMPLETED; footer now covers §O and §P.
`CODE-JUNCTION/august-due.md` re-synced byte-identical.
**Still DUE:** engineer sign-off (`engineering/review/` empty), Kherwara/Kharka identity, governing water
level, `git lfs pull` then A2–A5 and `assimilate --report`, `Dockerfile` + `lib/log.ts`, engine decoupling
(J-5), the 18a package decision, and a real visual pass for the A4/15 mm/landscape policy.
