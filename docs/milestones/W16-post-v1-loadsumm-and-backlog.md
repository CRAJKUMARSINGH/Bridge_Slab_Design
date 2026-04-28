# Milestone W16 — Post-v1: loadsumm ↔ LLOAD & v2 programme boot

**Week:** 16 (extension after W15 programme closure)  
**Instruction note:** Executes documented **W07 parity plan phase C** (loadsumm); §11 — no new product suggestions in v1 closure artefacts; **single** v2 suggestions document **after** client sign-off on v1.

## Purpose

Open the **post-v1** track: ship the first **parity** improvement from the approved W07 backlog (loadsumm no longer a static stub), and record **governance** tasks for the v2 programme (sign-off gate, consolidated suggestions doc).

## Entry criteria

- W15 exit satisfied (`npm run qa` green; v1 handoff recorded in `STATUS.md`).

## Tasks

- [x] Rebuild **loadsumm** with formulas to **LLOAD** for tracked / wheeled / Class A span totals, governing resultant, and factored service / ultimate / seismic values — `LloadSummaryRefs` from `bridge-excel-generator/sheets/17-lload.ts` passed into `generateLoadSummSheet` (`12-18-pier-remaining.ts`). Golden check: loadsumm contains **LLOAD!** references (`scripts/verify-kherwara-excel-golden.ts`).
- [x] **Demo seed & first complete output:** `GET /api/design/demo-seed` (Kherwara golden); client `installFirstRunDemoIfNeeded` + Landing **View demo output**; `npm run demo:workbook` → `archive/w16-demo/`. See [`artifacts/W16-first-complete-design-output.md`](./artifacts/W16-first-complete-design-output.md).
- [x] Record waiver in `STATUS.md` (2026-04-15): operator instructed proceed without waiting for client v1 sign-off.
- [x] Run source audit for provided Repo B path and capture findings in [`artifacts/W16-repo-b-source-audit.md`](./artifacts/W16-repo-b-source-audit.md).
- [x] Prepare execution runbook for immediate unified merge once valid Repo B source is provided: [`artifacts/W16-unified-merge-runbook.md`](./artifacts/W16-unified-merge-runbook.md).
- [x] Source-state gate: direct read access to Repo B artifacts confirmed (`Bridge_Slab_Design_Replit/artifacts/bridge-slab-design/**` available for porting even with partially pruned root checkout).
- [x] Created merge branch `feature/unified-merge-2026` and aligned execution to user-supplied `Attached_Assets/2 SOLUTIONS.md` with implementation record in [`artifacts/W16-2-solutions-application.md`](./artifacts/W16-2-solutions-application.md).
- [~] Execute unified merge stream from runbook after source gate clears (in progress: model selector integrated; workbook narrative prose adapted in TechNote/Tech Report; additive `DesignCheckDashboard` (Repo B-inspired checks + SVG bars), `OptimisationAtAGlance`, and `ModelOptimisersPanel` integrated on `Design` page; Landing includes SVG capability snapshot panel; comprehensive PDF narrative depth upgraded for **Sheet 09** (pier design and case-wise stability derivations) plus abutment/footing narrative sections (**TYPE1-21/23** and **C1-32/34**) and enhanced hydraulics/afflux derivation narration in sheets 03/04).

## Deliverables

| Artifact | Note |
|----------|------|
| Code | `17-lload.ts` → `LloadSummaryRefs`; `generateLoadSummSheet(..., lloadRefs)` |
| Regression | `verify:excel` loadsumm **LLOAD!** assertion |
| This card | W16 scope and exit |

## Verification

```bash
npm run qa
```

## Exit criteria

- `npm run qa` green.
- loadsumm **linked** to LLOAD for the seven summary lines above; remaining W07 items (e.g. HYDRAULICS row helpers, pier grid parity) stay in `docs/KNOWN-GAPS-v1.md` / W07 artifact.

## Handoff / discontinuity

**Next:** W07-GAP-002 / **B** (HYDRAULICS dynamic row refs on pier) or W05/W06 formal parity sign-offs — prioritise with client after v2 suggestions doc exists.

---

**Opened:** 2026-04-12
