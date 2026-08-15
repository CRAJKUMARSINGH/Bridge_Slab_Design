# ETERNAL_RESEARCH_CHILD

Background research daemon for **CURSOR SLAB DESIGN** (submersible / high-level slab bridge suite).

See **`objective.md`** for governance: Git LFS, external references, prudence, and continuous AI-aided upkeep.

**Ecosystem links:** GitHub URLs and optional local study paths are listed in  
`Attached_Assets/0 commands only/assets directory.txt`. A readable mirror lives in **`linked-resources.md`**. The daemon loads those GitHub URLs and appends a random **ecosystem link** to each proposal description.

## What it does

Runs every **15 minutes** and:

1. Scans **`Attached_Assets/`** at the repo root for legacy Excel, Word, HTML, images, and PDFs from real bridge projects.
2. Picks a random file and generates a **research proposal** mapped to this codebase (hydraulics, structural, slab, Excel golden checks, narrative manual, UI).
3. Asks for your approval before marking a proposal approved in the log.
4. Appends all proposals to **`research_log.jsonl`** (approved / rejected / skipped).

The daemon **does not edit application files**; it logs prompts for you or your AI workflow to implement via PRs.

## Proposal categories

| Category | Typical sources | Suggested targets |
|----------|-----------------|-------------------|
| `hydraulics_legacy` | hydraulic/*.xls, scour/afflux docs | `client/src/report-engine/lib/hydraulicCalc.ts`, hydraulics service |
| `structural_stability` | Stability Analysis*.xls, submersible | `services/structural.ts` |
| `live_load_traffic` | liveload*, lanes | `lib/loadCalc.ts` |
| `substructure` | pier/abutment/dirt wall sheets | `lib/pierCalc.ts` |
| `slab_deck` | deck slab, IRC slab, anchorage | `lib/ircSlabCalc.ts` |
| `costing_estimate` | estimate, bill, BOQ | `services/costing.ts` |
| `excel_workbook_golden` | generic .xlsx/.xls | `scripts/verify-kherwara-excel-golden.ts`, `npm run verify:excel` |
| `narrative_report` | .doc/.docx/.htm design notes | `USER_MANUAL.md`, `verify:narrative` |
| `ui_design_drawing` | images/PDF drawings | `client/src/pages/Drawing.tsx`, `Design.tsx` |
| `standards_traceability` | fallback | Random engine `lib` / `services` file |
| `ecosystem_repos` | `0 commands only/assets directory.txt` | `ETERNAL_RESEARCH_CHILD/linked-resources.md` |

## Usage

From the **repository root**:

```bash
npm run research

npm run research:once

# One cycle forced on the ecosystem manifest (demo / CI-friendly)
npm run research:demo
```

## Files

| File | Purpose |
|------|---------|
| `research_daemon.ts` | Daemon source |
| `linked-resources.md` | Mirror of GitHub + local paths from `assets directory.txt` |
| `objective.md` | Mission, LFS, prudence, success criteria |
| `research_log.jsonl` | Append-only JSON lines (gitignored if you prefer — see `.gitignore`) |
| `tsconfig.json` | TypeScript config for the daemon |

## Log format

Each line in `research_log.jsonl` is one JSON object:

```json
{
  "timestamp": "2026-05-02T12:00:00.000Z",
  "sourceFile": "hydraulics.xls",
  "category": "hydraulics_legacy",
  "title": "Reconcile legacy hydraulic sheet with computeHydraulics",
  "description": "...",
  "targetFile": "client/src/report-engine/lib/hydraulicCalc.ts",
  "approved": true
}
```

## Notes

- **`Attached_Assets`** uses the same spelling as in this repo (capital **A**).
- Large binaries belong under **Git LFS** per root `.gitattributes`.
- Press **Ctrl+C** to stop the daemon gracefully.
- **Interactive approval** requires a real TTY (local terminal). From CI or piped stdin, proposals are **logged as skipped** (`approved: null`) with no prompt so the process does not hang or crash.
