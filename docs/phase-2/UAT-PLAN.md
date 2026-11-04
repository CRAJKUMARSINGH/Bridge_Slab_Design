# UAT PLAN — 40 SCENARIOS

User-acceptance test plan for the Phase-2 design suite. Forty scenarios, every class
covered at least three times, every bridge family covered at least once.

## Provenance — what is measured here and what is not

- **Classes** are the fixed set from `docs/phase-2/_templates/UAT-PLAN.md`:
  `VALID | INVALID | FAILED-CHECK | TAMPERED | LARGE | INTERRUPTED | RESTART |
  PERMISSION | UPLOAD-ABUSE | CONCURRENT`.
- **Bridge column** names a family id from `server/default-project-inputs.ts`
  (`PHASE1_QUICK_TEMPLATES`, 20 entries) or a golden bridge from
  `corpus/oracle/GOLDEN-ORACLE.json` (`SOM-KHW`, `SOM-LAR`, `BED-HL`).
- **Steps / Expected / Pass criteria** are written against routes and scripts that
  exist in the repo **today**. Where a scenario depends on something not yet built,
  the Expected cell says so and names the week that builds it — it is not a pretend
  pass. The `PERMISSION` class in particular has no enforcement layer yet
  (see `docs/phase-2/SECURITY.md`, "auth/RBAC matrix = no auth layer"); those
  scenarios therefore record the *current* (open) behaviour and the *target*.
- **Execution status**: this plan is not yet executed. `docs/phase-2/week-12/UAT-RESULTS.md`
  is the results artefact (deliverable-contract row W12). Nothing below is a measured
  result; every row is a **test intent**.

## How a run is expected to be driven

| Host | Entry | Note |
|---|---|---|
| HTTP | `POST /api/design`, `POST /api/design/upload-excel`, `POST /api/projects` | `server/app-factory.ts` mounts `/api` |
| CLI | `pnpm run pipeline` | headless batch; one pipeline (`pipeline/run.ts`) |
| Gate | `node scripts/gates/gate-all-stubs.mjs`, `node scripts/gates/gate-docs.mjs` | runnable in this worktree (`.mjs` only) |
| Gate | `pnpm run gate:foundation` | TS gates; requires `tsx` (not installed in this worktree) |

## 40 scenarios

| # | Scenario | Class | Bridge | Steps | Expected | Pass criteria |
|---|---|---|---|---|---|---|
| V-1 | Golden replay — Kherwara | VALID | SOM-KHW / kherwara-golden | Run pipeline for the Kherwara input; compare every numeric output to `corpus/oracle/GOLDEN-ORACLE.json` SOM-KHW | All checks PASS; ARITH deltas within 1e-6 | Zero numeric deltas outside category tolerance; `RunFingerprint` recorded |
| V-2 | Golden replay — Larathi | VALID | SOM-LAR / larathi-stabil | Same as V-1 for `larathi-stabil` | SOM-LAR match within tolerance | As V-1 |
| V-3 | Golden replay — Bedach high level | VALID | BED-HL / high-level-reference | Same as V-1 for `high-level-reference` | BED-HL match within tolerance | As V-1 |
| V-4 | Small submersible, full deliverables | VALID | submersible / small-bridge | Run `small-bridge` end-to-end: design → workbook → PDF → HTML → DXF | Workbook has `EXPECTED_SHEET_COUNT` sheets; PDF and HTML generated; DXF parses | All five artefacts produced; sheet count matches `sheet-contract.ts` |
| V-5 | Medium bridge, full deliverables | VALID | medium / medium-bridge | As V-4 for `medium-bridge` | As V-4 | As V-4 |
| V-6 | Large bridge, within compute ceiling | VALID | large / large-bridge | As V-4 for `large-bridge`; time the run against the 60 s `maxDuration` (`vercel.json`) | Completes without touching the timeout; every artefact produced | Wall-clock < 60 s on the reference host; nothing truncated |
| I-1 | Missing required geometry field | INVALID | small-bridge | `POST /api/design` with `deckSlabThickness` omitted | 400; body carries a Zod issue with the field path | No partial design returned; no `analysis_records` row written |
| I-2 | Cross-field rule breach | INVALID | irc-bedach-bedla | Send a `bedSlopeDenominator` of 0 and a `freeboard` whose sign is wrong for a submersible | 400; `superRefine` rule id (CF-*) named in the issue | Rejected before the engine runs |
| I-3 | Wrong primitive type | INVALID | irc-sukanaka-matoon | Send `highestFloodLevel` as a string | 400; type error names the field | As I-1 |
| I-4 | Unknown template id | INVALID | — | `POST /api/design` with an id absent from `PHASE1_QUICK_TEMPLATES` | 400 "unknown template"; no silent fallback to a default | No compute performed |
| F-1 | Shear check overstressed | FAILED-CHECK | medium-bridge | Craft a section whose induced shear exceeds capacity | `CheckResult.status = FAIL` with a `codeRef`; run reaches `reviewState = REVIEW_READY` | A failing check is surfaced, never silently clamped to PASS |
| F-2 | Freeboard insufficient | FAILED-CHECK | submersible / small-bridge | Set HFL above the deck soffit for a submersible section | Freeboard check FAIL | As F-1 |
| F-3 | Scour depth below founding | FAILED-CHECK | irc-bedach-bedla | Increase design discharge so computed scour exceeds the founding level | Scour check FAIL | As F-1 |
| F-4 | Infeasible reinforcement | FAILED-CHECK | large-bridge | Force a rebar demand that cannot be met at the minimum spacing | Rebar check FAIL or REVIEW; no negative/auto-clamped steel area | As F-1; the reported steel area is the computed (infeasible) value |
| T-1 | Engine byte tamper | TAMPERED | any | Edit one byte of `bridge-excel-generator/design-engine.ts`; run `pnpm run gate:contracts` | gate:contracts RED — sha256 differs from `foundation/engine.lock.json` | Gate exits 1; message names the file and the ADR-0013 rule |
| T-2 | Golden fixture tamper | TAMPERED | SOM-KHW | Edit `tests/golden/kherwara` expected values; run `pnpm run verify:golden` | verify:golden RED | Exit 1; diff printed |
| T-3 | Manifest provenance tamper | TAMPERED | — | Change a hash inside `foundation/manifest.json`; run gate:contracts | RED — manifest / lock / on-disk hash disagree | Exit 1 |
| T-4 | Unapproved tolerance relaxation | TAMPERED | — | Loosen a value in `foundation/tolerances.json` without `approvedBy`/`approvedOn`; run `pnpm run verify:tolerances -- --strict` | RED — entry missing approval or containing PENDING | Exit 1 (`--strict` is fatal for approval gaps) |
| L-1 | Upload at the size ceiling | LARGE | any | Upload an `.xlsx` exactly at `MAX_UPLOAD_XLSX_BYTES` (10 MB) | Accepted or rejected cleanly at the ceiling — not a crash | Boundary handled; error (if any) is a 4xx |
| L-2 | Upload over the ceiling | LARGE | any | Upload above `MAX_UPLOAD_XLSX_BYTES` | Rejected with 4xx | **See `docs/phase-2/SECURITY.md` U-1**: `express.json({limit:'200kb'})` runs first, so the reachable ceiling is 200 kB, not 10 MB. Scenario currently measures the *body* limit |
| L-3 | Wide geometry, many spans | LARGE | large-bridge | Add spans/piers to maximize the model; time the run | Completes; p95 within budget | Wall-clock recorded; no timeout |
| L-4 | Many analysis records | LARGE | — | Insert thousands of `analysis_records` rows; load the project | Listing stays responsive; no full-table scan | Response time recorded |
| X-1 | Client disconnects mid-request | INTERRUPTED | medium-bridge | Abort the HTTP request during compute | Server logs the abort; no artefact claims success | No manifest/record marked green for the aborted run |
| X-2 | Function hits 60 s maxDuration | INTERRUPTED | large-bridge | Drive a run past the Vercel `maxDuration` (60 s) | Error surfaced to the caller; no silent truncation | Caller receives a failure, not a partial "success" |
| X-3 | Process killed during write | INTERRUPTED | any | Kill the process while writing `tmp/pipeline/<project>/` | Partial files remain; no manifest present | Re-run produces a complete, manifest-backed artefact set |
| X-4 | Browser refresh mid-upload | INTERRUPTED | any | Refresh the page during `POST /api/design/upload-excel` | No orphan `file_records` row; upload can be retried | No half-written record |
| R-1 | Restart with no DATABASE_URL | RESTART | any | Unset `DATABASE_URL`; restart server; load a project | Local JSON fallback store serves (`data/projects-local.json`, LOVABLE-003) | Project loads; no 500 |
| R-2 | Restart mid-run | RESTART | any | Restart the process during a run | **No resumable job exists** (see `docs/phase-2/COMPUTE-TOPOLOGY.md`); the run must be re-issued | Documented as a limitation, not a silent resume |
| R-3 | Cold start after idle | RESTART | any | Idle the host past the cold-start window; issue a request | Latency measured | p95 recorded against the W06 baseline (not yet established) |
| R-4 | Re-run determinism | RESTART | SOM-KHW | Re-run the identical Kherwara input | Identical `RunFingerprint`; byte-identical artefact hashes | Fingerprint and hashes match run 1 |
| P-1 | Unauthenticated design call | PERMISSION | any | Call `POST /api/design` with no credentials | **Current**: 200 — there is no auth layer. **Target**: 401 | Scenario passes today only by recording the open behaviour; W04 closes the gap |
| P-2 | Cross-origin from unlisted origin | PERMISSION | any | Send a browser request with an `Origin` not in `ALLOWED_ORIGINS` | CORS denied (default-deny when `ALLOWED_ORIGINS` is unset — `server/app-factory.ts`) | Browser blocks; server does not echo the origin |
| P-3 | Cross-origin from allowed origin | PERMISSION | any | Same with an origin listed in `ALLOWED_ORIGINS` | Allowed; `credentials` honoured | Access-Control headers correct for an allow-listed origin |
| P-4 | Pier-asset path traversal | PERMISSION | — | Request a pier catalog root outside the installed asset library | Rejected by `isDirectoryWithin` (no arbitrary drive traversal — `server/api-routes.ts`) | Path outside the root is refused |
| U-1 | Non-zip payload named `.xlsx` | UPLOAD-ABUSE | — | Upload base64 of a text file with an `.xlsx` name | Rejected by the `isLikelyXlsxZip` magic-byte check | 4xx; parser never invoked |
| U-2 | Decompression bomb | UPLOAD-ABUSE | — | Upload a small zip that expands enormously | Bounded — **but no explicit decompression cap is recorded**; record actual behaviour | Behaviour recorded; if unbounded, logged as an open limitation |
| U-3 | Script payload in a cell | UPLOAD-ABUSE | — | Put `<script>` in a workbook cell; export HTML/PDF | Value is escaped in generated HTML | No executable markup in the exported report |
| C-1 | Two concurrent runs, same project | CONCURRENT | medium-bridge | Fire two design runs in parallel for one project | Both complete; independent fingerprints | No cross-contamination of results |
| C-2 | Concurrent uploads, same project | CONCURRENT | any | Two uploads to one project at once | Last write wins; no corruption | Both requests get a definite result; record count consistent |
| C-3 | Parallel gate runs | CONCURRENT | — | Run two gates that write `scripts/gates/.out/*.json` simultaneously | No corrupted result file | Each gate's `.out` JSON is parseable after both finish |

## Class coverage

| Class | Scenarios | Count | Rule (>=3) |
|---|---|---|---|
| VALID | V-1…V-6 | 6 | OK |
| INVALID | I-1…I-4 | 4 | OK |
| FAILED-CHECK | F-1…F-4 | 4 | OK |
| TAMPERED | T-1…T-4 | 4 | OK |
| LARGE | L-1…L-4 | 4 | OK |
| INTERRUPTED | X-1…X-4 | 4 | OK |
| RESTART | R-1…R-4 | 4 | OK |
| PERMISSION | P-1…P-4 | 4 | OK |
| UPLOAD-ABUSE | U-1…U-3 | 3 | OK |
| CONCURRENT | C-1…C-3 | 3 | OK |
| **Total** | | **40** | |

## Bridge-family coverage

| Family | Source id | Full-scenario rows |
|---|---|---|
| Submersible slab (small) | `small-bridge` | V-4, F-2 |
| Submersible slab (medium) | `medium-bridge` | V-5, F-1 |
| Large slab | `large-bridge` | V-6, L-3, F-4 |
| High-level (golden) | `high-level-reference` / BED-HL | V-3 |
| Golden SOM-KHW | `kherwara-golden` / SOM-KHW | V-1, T-2, R-4 |
| Golden SOM-LAR | `larathi-stabil` / SOM-LAR | V-2 |
| Bedach/bedla cross-drainage | `irc-bedach-bedla` | I-2, F-3 |
| T-beam girder | `irc-kherka-teegirder` | — *no full row yet; W02A/W07A parity adds it* |
| Other IRC catalog families | `irc-*` (13 ids) | I-3 uses `irc-sukanaka-matoon`; the rest share the same code path and are covered by parity tests in W02A/W07A |

> **Honest gap**: `irc-kherka-teegirder` (T-beam) has no listing in
> `PHASE1_QUICK_TEMPLATES`-driven full scenario yet. The template rule
> ("every bridge family has >=1 full scenario") is therefore **not fully met** for
> the T-beam family. It is recorded here rather than papered over; the parity weeks
> (W02A/W07A) own closing it.
