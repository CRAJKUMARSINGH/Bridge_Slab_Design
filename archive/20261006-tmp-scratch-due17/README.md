# Scratch evidence — DUE-17 / DUE-18 (2026-10-06 → 2026-10-07)

Temporary evidence for the batch recorded as **august-due.md §X (DUE-17)** and **§Y (DUE-18)**, and
`CREAT-CHATLOG.MD` **Turn 28**. The probe scripts that produced these files were deleted after their
numbers were transcribed into the register; nothing here is needed to run the product, and nothing here
is load-bearing for a gate.

## logs/ — what each file proves

| Log | Proves |
|---|---|
| `check-due18.log` | `pnpm run check` exit 0 after the acceptance-rule sweep (incl. the TS2304 `c1Ok` fix). |
| `verify-full-due18.log` | `pnpm run verify` exit 0 on **eleven** lanes: links 20/20 fully linked with the sheet-9 evidence rows read from `PIER_STABILITY_ROWS` (`B18 =HYDRAULICS!C21 -> 1.718`, `H51 -> 644.638`, `N55 -> SAFE`), outcomes 300 cases SAFE 195 / UNSAFE 105 defects 0, parity 22 facts 0 defects, presentation 19L/37P and 13L/33P, engine **490 pinned / 0 drift / tamper moved 48**, discharge diagnostic 0 of 490. |
| `verify-outcomes-due18.log` | The outcomes lane green, including `OK client UI copy of the acceptance rule`. |
| `verify-outcomes-client-tamper.log` | **Negative control**: with `client/src/lib/stability-limits.ts` temporarily set to `bearingFosMin: 2.5`, the lane prints `DEFECT client UI copy of the acceptance rule` with defects 1 and exits 1. |
| `verify-cases.log`, `verify-cases2.log`, `verify-links.log`, `verify-links2.log` | Intermediate states of the cases/links lanes while the sheet-9 anchors moved (47 -> 51 first case row). |
| `verify-engine-before.log` | `verify:engine` **red at HEAD** before this batch touched anything: 11 of 485 pinned outputs drifted, caused by the other writer's `876a3bd` engine change without a re-pin. |
| `verify-engine-emit.log` | The deliberate `--emit` re-pin: 485 -> **490** outputs. |
| `probe-drift.log` | **Negative control**: a runtime mutation of sheet 9's Section-B offset makes the generator throw `Sheet 9 layout disagrees with PIER_STABILITY_ROWS ... dead: sheet 9 writes 34, PIER_STABILITY_ROWS publishes 33`. |
| `probe-k-divergence.log` | The §706 gap quantified on `irc-t01-jethliya`: cached sliding FOS 0.959 / 0.594 / 0.306 / 0.402 / 1.482 against what HEAD's friction-only formula produces, 0.639 / 0.396 / 0.204 / 0.268 / 0.988 — ratio **exactly 1.500** on all five cases (cap 0.5 binds everywhere), passive term 47.0–229.1 kN. |
| `probe-readback.log` | Read-back of the delivered `test-output/design-workbook.xlsx`: sheet 9 §706 cells (`B22 mu 0.5`, `B28 gamma 18`, `B29 Kp =TAN((45+B27/2)*PI()/180)^2 -> 3`, `B30 cap 0.5`), `K51/K55` carrying the passive-aware formula with results 1.066 / 1.627, `N51 UNSAFE` / `N55 SAFE`, row-3 prose at 1.5/1.8/1; sheet 20 `B18 0.5` feeding `F21 =$B$18*C21/D21 -> 1.7216`; QA rows D1/D2. |
| `probe-due17.log` | **DUE-17 before/after**: module-relative default = `assets/COMPONENT_DRAWINGS_SORTED/Pier Geometry & Dimensions`, **35 files, 4 of 10 templates source-backed**, identical when run from the repo root and from `scripts/`; the old cwd-relative default landed on `Attached_Assets` = **32 files, 0 of 10 source-backed**. |
| `probe-min-fos.log` | Re-measured values behind the four corrected STRUCTURAL REVIEW comments — large-bridge pier sliding 0.228/0.183/0.084/0.117/0.364 (min 0.084), parwan 0.985 bearing / 0.370 sliding / 0.606 overturning, kherka 0.979/0.488/0.846, sukanaka 0.967/0.474/0.890; acceptance in force `{1.5, 1.8, 1}`; 300 cases SAFE 195 / UNSAFE 105. (The file ends with a `TypeError` from the probe's own `main().catch` on a non-async `main` — the printed data above it is complete.) |
| `test-due18.log` | `pnpm run test` exit 0, `Integration lane 13/13`, `Engine unit lane 2/2`, `15/15 files in 2 lanes`, including the five new pier-catalog assertions. |
| `deliverables-due18.log` | The six `test-output/` artefacts regenerated (workbook 109 801 B, sheet-book.pdf 3 247 900 B). |
| `candidate-due18.log` | `pnpm run candidate` exit 0: `check 55.0 s / verify 90.6 s / test 76.5 s / audit:policy 3.5 s`, bundle of 6 deliverables + transcripts against commit `8b5730f2c5ef`. |

## Reproducing any of it

```
pnpm run check
pnpm run verify
pnpm run test
pnpm run deliverables
pnpm run candidate
npx tsx scripts/verify-stability-outcomes.ts        # client-copy check (edit stability-limits.ts to 2.5 to see it bite)
```

Sheet-9 anchor guard and the pier-catalog resolution are covered by permanent tests, not by this folder:
`bridge-excel-generator/sheets/09-stability-check-pier.ts#pierStabilityDrift` runs on every workbook
generation, and `tests/integration/api-pier-cases.test.ts` holds the chdir / 503 / 400 cases.

Nothing was committed from this batch.
