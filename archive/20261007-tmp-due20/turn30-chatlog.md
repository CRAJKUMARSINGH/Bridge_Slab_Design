
---

## Turn 30 — 2026-10-07 (paperwork landed 2026-10-08 00:1x) · DUE-20: the acceptance rule now travels in the design response, and the browser's copy is deleted (§AA)

**Directive in force:** *take up due tasks and complete them one by one* — auto mode, all approvals
presumed, no commits.

### What this turn did

Row 22 (§Y-5) was the last hand copy of the stability acceptance rule left in the product: the
browser could not import engine code, so `client/src/lib/stability-limits.ts` re-typed 1.5 / 1.8 / 1
and `verify:outcomes` grepped it. A gate on a copy is a workaround, so the copy went away instead.

1. **The rule became part of the result.** `types.ts` gained `StabilityAcceptance` and
   `CompleteDesignResult.stabilityAcceptance` (required, not optional — a result arriving without the
   rule it was judged against is a defect). `runCompleteDesign` returns the engine's own
   `STABILITY_ACCEPTANCE`, so the printed factors and the printed rule cannot disagree by construction.
2. **No new endpoint.** `POST /api/design/results` (`server/api-routes.ts:319`) already returns the
   engine result verbatim, so the field arrives untouched — proven against the live server, not argued
   (`tmp-due20-api.json`). A separate `/api/design/acceptance-limits` route was rejected: a second
   source for the same three numbers is the same disease with a nicer URL.
3. **Four verdict-rendering client surfaces converted**, not the two row 22 named:
   `DesignCheckDashboard` (four arc gauges + the `req ≥` caption), `CompareModal` (the `fosReq` map),
   `EngineeringCopilot` (both insight blocks *and* the prose they print), `WindLoadPanel` (two
   `FosRow`s, the wind pass/fail tests, `SpeedRow`'s colour logic — which needed a new `required` prop
   because it had been deriving its own colour from a literal — plus two sentences of method text).
   `DesignCheckDashboard`'s `max={1.5}` was inspected and deliberately **left**: it is the Lacey-ratio
   gauge axis, not a stability limit.
4. **Stale-cache guard.** `useDesignStore` persists `{results}` in `localStorage.lastDesignResults`;
   a payload written before this change has no rule in it, so the rehydrator now returns `null` and
   forces a refetch rather than painting limit-less gauges.
5. **The copy deleted and the grep inverted.** `stability-limits.ts` moved to
   `archive/20261007-tmp-due20/retired/`. Rule 6 of `verify:outcomes` now walks every `.ts`/`.tsx`
   under `client/src` and fails on three things: a hard-coded `*FosMin` literal (file, value, and the
   engine's value quoted beside it), any reference to the retired `STABILITY_LIMITS` name, and a file
   that renders stability verdicts without ever reading `stabilityAcceptance` — the direction the old
   grep could not see, because ignoring the response is how a green gate comes to mean nothing.

### Two real client bugs found while converting

- `CompareModal` had an `fosReq` entry for **"Abutment overturning FOS (worst)"** but that row was
  missing from `fosCols`, so its ✓/✗ indicator had never rendered. Fixed in the same edit; it was
  invisible precisely because the column list, not the requirement map, drove rendering.
- The store's cached-payload case above: without the guard, a returning user gets gauges with no
  threshold, which reads as "no requirement" rather than "stale cache".

### Four planted controls — and the two bugs they found in the guard itself

| Control | Result |
| --- | --- |
| `client/src/lib/tmp-limit-probe.ts` with `slidingFosMin: 2` | `DEFECT acceptance rule reaches the browser from the response`, exit 1 — and it printed `= 2` for a `2.5` literal and only one literal per file: pattern widened to `[0-9]+(?:\.[0-9]+)?` and switched to `matchAll` |
| probe `2.5` + a literal left in `DesignCheckDashboard` | every literal named against the engine's value; but the *reader* arm did not fire — `limitReaders` held bare filenames while the walker compares repo-relative paths, so the defect was unreachable. Fixed to full relative paths and re-proved |
| reader that ignores the response + retired name referenced | `shows stability verdicts but never reads stabilityAcceptance from the response` and the retired-copy defect, exit 1 |
| authoring slip: non-global regex into `matchAll` | lane crashed with a `TypeError` and printed **no** DEFECT line, exit 1 — a red gate that says nothing is indistinguishable from one that never ran; fixed rather than tolerated |

Green run: `OK   acceptance rule reaches the browser from the response`, defects 0.

### Gate state (§T30), all read from the transcripts

`check` **0** · `verify` **0** on eleven lanes (links 20/20 fully linked; outcomes 300 cases
SAFE 195 / UNSAFE 105, 20/20 templates, sliding 99 / overturning 82 / bearing 6; parity 22 facts;
presentation 19L/37P and 13L/33P; engine **493 pinned, 0 drifted**, tamper moved 48) · `test` **0**
15/15 · `deliverables` **0** (6 files) · **`candidate` 0** (check 72.2 s · verify 98.7 s · test 39.7 s
· audit:policy 10.1 s) against `8b5730f2c5ef`. Golden went **490 → 493** and the diff is exactly the
three new keys, so the rule is now pinned too: changing it takes a deliberate re-accept.

### Read-back: the app, not the code

Live `POST /api/design/results` → `stabilityAcceptance {slidingFosMin:1.5, overturningFosMin:1.8,
bearingFosMin:1}`. On `/suite/design`, after "Refresh engine metrics": gauges `req ≥ 1.5 / 1.8 / 1 /
1.5` against worst-pier 0.405 / 0.856 / 6.898 / 0.405 with marks `✗ ✗ ✓ ✗`; copilot `(req ≥ 1.5)`
`(req ≥ 1.8)`; wind panel `sliding ≥ 1.50, overturning ≥ 1.80`. The UI's verdict now matches the
engine's UNSAFE case because it is the engine's rule. Console clean. **Pixels still open (row 12)**:
this host's screenshot surface returns `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE / visibilityState=hidden`,
so the evidence is DOM text, not an image.

### Two honest-residue statements instead of a clean claim

- **42 hand-applied threshold comparisons survive across 12 client files** (`SeismicZonePanel` 9,
  `Design` 7, `engineeringNarrative` 6, `FormulaEvaluator` 4, `OptimisationAtAGlance` 3,
  `AbutmentStability` 3, `PierOptimiser` 2, and five files with 1 each). They are **not all the
  stability rule** — IRC:20 reduced factors, WARN bands that are not verdicts, optimiser design
  limits — so they are filed as **row 24** for site-by-site adjudication. Regex-sweeping them would
  have changed printed verdicts to quiet a grep, which is exactly the §Y-4 mistake in reverse.
- **`test-output/` HTML sizes are characters, not bytes.** `regenerate-test-output.ts` prints
  `design-report.html 430,004` while the file is **432,811 bytes** on disk (and 39,752 vs 39,965 for
  the checklist) — the gap is the multi-byte `≥ — × ₹` set. Measured this turn (`tmp-due20-htmlsize.txt`)
  and §T30 now labels them "chars". The workbook and four PDFs are byte-exact.

### Register / docs touched

`august-due.md`: row 22 struck with the §AA pointer, **new row 24**, **§AA** (AA-1…AA-8),
**§T30** gate run, §Y-5 annotated as closed, next-actions 4c/4d added, footer rewritten (DUE-20
summary plus the char/byte disclosure). `CODE-JUNCTION/august-due.md` re-synced and byte-compared.
Transcripts and the retired module under `archive/20261007-tmp-due20/` with a README.

### Safety

No git commit, branch or push. No `git lfs pull`. The dev server started for the browser pass
(PID 2192, :5180) was stopped and the port confirmed free. `Attached_Assets/**`,
`bridge-excel-generator/sheets-extracted/**` and the pre-existing `.gitignore` state untouched;
scratch files archived, not deleted.
