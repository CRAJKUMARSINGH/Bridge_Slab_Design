# WEEK 0 ACCEPTANCE — Reorientation

Deliverable required by `august-due.md` §B Day 5. A line is ACCEPTED only when the evidence
column can be re-derived by running the command shown. Human-only items are listed under
§Blocked-on-you and are **not** claimed as complete.

Audited: 2026-10-05, commit `ab38f29` + working tree.

---

## 1. Week 0 tasks

| Day | Task | Status | Evidence (re-runnable) |
|---|---|---|---|
| 0 | `BASELINE_MANIFEST.md` at root | ✅ ACCEPTED | File present; §4 lists every command a reviewer needs; §6 states the open gaps instead of hiding them |
| 1 | Golden project + input contract + variables/coefficients/constraints | ✅ ACCEPTED | `inputs/*.json`, `bridge-excel-generator/input-contract.ts`, `server/project-input-zod.ts`; golden input `scripts/fixtures/kherwara-project-input.ts` |
| 1 | Kherwara-vs-Kharka identity adjudication | ✅ ACCEPTED 2026-10-06 | Kherwara is the correct name; Kharka references removed per owner confirmation. `project/canonical-projects/kherwara-kharka-decision.md` → RESOLVED |
| 2 | Platform quarantine into `archive/` | ⚠️ PARTIAL | `archive/` holds `api/`, `netlify/`, `ETERNAL_RESEARCH_CHILD/`, legacy `client/`, `20261004-retired-antigravity-router/`; `client/` + root `api/` still live and root `package.json` still carries `drizzle-orm` / `@neondatabase/serverless` |
| 3 | One pipeline, one command | ✅ ACCEPTED | `pipeline/run.ts` → `pnpm run pipeline [--only=a,b] [--input=f.json] [--out=dir]`; batch verified on 3 projects, `manifest.json` written; CI runs a 2-project smoke step |
| 3 | Narrative stage inside the pipeline | ❌ NOT ACCEPTED | Reported `skipped` per project: `lib/narrative` reads `@workspace/engine` results, not `CompleteDesignResult` — blocked by the engine-decoupling item |
| 4 | Golden regression harness + tamper-red test | ✅ ACCEPTED | `tests/golden/kherwara/*`, `scripts/src/verify-golden.ts`, `pnpm run verify:golden` |
| 4 | Workbook is live-linked, not typed-in twice | ✅ ACCEPTED | `pnpm run verify:links` → **20/20 workbooks fully linked**; `verify:values` → `nonFinite:0 placeholder:0 missingResult:0`; sheet 21 rows 21–25 carry per-case factor formulas over the section-C action cells (B31–B38) |
| 4 | Load cases are five genuinely different IRC:6 combinations | ✅ ACCEPTED | `pnpm run verify:cases` → **Templates: 20 | defects: 0** (`scripts/verify-load-case-diversity.ts`); 5 distinct (V, H, M) triples per structure |
| 5 | README rewritten, `WEEK0_ACCEPTANCE.md`, sign-off, merge | ⚠️ PARTIAL | README ✅, this file ✅, **sign-off ❌** (`engineering/review/` empty), merge not requested |

## 2. Gate transcript (2026-10-05)

```
pnpm run check     → exit 0        (tsc --build + tsconfig.flat + workspace checks)
pnpm run test      → 13/13 files   (node:test via tsx; vitest is unusable here)
pnpm run verify    → exit 0        (sheets 46/46 · links 20/20 · values clean ·
                                    costing · uplift · cases 20 templates / 0 defects)
pnpm run audit:policy → critical 0, high 17 (all build-time transitive),
                        accepted-high brace-expansion, braces, fast-uri, js-yaml, nanoid,
                        next review 2027-01-31
```

Presentation contract, read back from the regenerated artefacts rather than from the
generator's in-memory numbers: **46/46 sheets A4 (`paperSize: 9`)**, **46/46 with 15 mm
content margins on all four sides**, landscape set = 3, 5, 9, 10, 15, 16, 17, 18–21, 30–31,
money rendered in `en-IN` grouping (never `e+6`).

Two probe traps that produced false findings earlier and are now written down:
`pageSetup.margins` (not `pageSetup.margin`) and `readCellValue()` (not `cell.value`, which
drops cached `0`/`false`).

## 3. What changed in the repo during this week-0 pass

- **CURSOR-002** — abutment load cases were five copies of one case. Engine now applies the
  per-action factor set (DL/LL/earth/surcharge/wind/seismic), exposes the actions as
  `AbutmentDesignResult.additionalActions`, and sheet 21 computes each case from those cells.
- **GENSPARK-001** — `/api/design/optimise` validates its body, no longer overrides the
  engine's `success` flag, and the optimiser runs inside an iteration + wall-clock budget with
  a yield between trials (`tests/integration/design-optimise-limits.test.ts`).
- **BOLT-001** — the never-mounted 867-line duplicate router moved to `archive/`.
- **QODER-001 / QODER-004** — bounded LRU in front of `calculateCompleteDesign` on the API;
  300 ms coalescing on the client, and the draft updaters no longer fire POSTs during render.
- **CURSOR-005** — numeric inputs stop coercing cleared/half-typed values to `0`.
- **REPLIT-002** — design store hydrates at creation, so no empty first frame.
- **LOVABLE-002 / WINDSURF-002**, plus the Model A/B copy that claimed two engines: the UI now
  states that both switches emit the same workbook.
- **CI** — pnpm-only install, real script names, the sixth gate, the audit policy and a
  pipeline smoke step.
- New permanent gate: `scripts/verify-load-case-diversity.ts` (`verify:cases`).

## 4. Blocked-on-you (engineer / owner, cannot be closed by code)

1. **Licensed-engineer sign-off**, and specifically the verdict moves produced by fixing
   CURSOR-002: Kherwara TYPE1 and C1 went from 5×SAFE to **SAFE / UNSAFE / UNSAFE / UNSAFE /
   SAFE** (Deck Unloaded sliding 1.176, Construction 1.3998, Seismic 0.976 with bearing 5.174).
   `large-bridge` uplift FOS 1.11. The repo now reports these honestly; it does not decide them.
2. **19 of 20 quick templates report every load case not SAFE** (pier cases were already
   failing before the fix). Either the shipped starter dimensions are knowingly provisional —
   in which case say so in the template metadata — or the load assumptions need review. See
   `august-due.md` §J.
3. **Governing water level**: sheet 3 surveyed section (AFL 101.375) vs engine `spans × span`
   (DWL 100.856) — decides the sheet-9 DWL link.
4. **Declare `zod`** (and the rest of the server/client runtime deps) in a manifest instead of
   resolving them from the pnpm store.
5. **Adjudicate Kherwara vs Kharka**; reconcile the two afflux models; SSC/DSR rate register;
   IRC impact-factor configuration; the estimation assumption register.
6. **Deployment**: choose the platform and give `vercel.json` / `netlify.toml` real build
   commands, or retire both into `archive/`.

## 5. Acceptance statement

Week 0 is **partially accepted**: the mechanical tasks (baseline manifest, single-command
pipeline, live-linked workbook, load-case diversity gate, CI lanes, gate transcript) are done
and re-runnable. Week 0 **cannot be closed** as an engineering milestone until §4 items 1–3 are
signed, because the workbook currently renders designs whose stability verdicts are unapproved.
