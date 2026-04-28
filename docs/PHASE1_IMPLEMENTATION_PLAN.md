# PHASE 1 — BEST HYBRID DRAWING APP IMPLEMENTATION PLAN
**Date:** 2026-04-27  
**Status:** IN PROGRESS  
**Branch:** `feature/best-hybrid-drawing`

---

## EXECUTION ORDER (Per User Approval)

1. ✅ **Phase 0:** Feature Comparison Matrices — COMPLETED
2. 🔄 **Phase 1:** Best Drawing App (D1–D4 Merger) — IN PROGRESS
3. ⏳ **Phase 2:** Best Main App (M1–M4 Merger) — PENDING
4. ⏳ **Phase 3:** Main App + Drawing App Integration — PENDING

---

## PHASE 1 SCOPE: Best Drawing App (D1–D4)

### Base Architecture: D1 (`Dwg-Dxf-Record-Keeper`)
- **Why D1?** Most complete DXF generation (5 sheets + BOQ + IRC checks)
- **Stack:** Python/PySide6/ezdxf/Streamlit
- **Maturity:** RC v1.0.0, proven production code

### Mergers:
- **D3 (Slope-Logic-Manager):** Expert Bridge Doctor, discharge-band freeboard, NSL scoring
- **D4 (Dwg-Param-Mapper):** TypeScript/React parameter mapper UI, API-first architecture

### Critical Bug Fixes (A1–A6 from REVIEW.md):
| Bug | File | Issue | Fix |
|-----|------|-------|-----|
| **A1** | `src/ui/main_window.py` | Missing imports: `QComboBox`, `Path` | Add to import statements |
| **A2** | `src/modules/bridge_mapper.py` | References `meta.designed_by`, `meta.drawing_no` (don't exist in ProjectMetadata) | Add fields to ProjectMetadata OR update mapper to use existing fields |
| **A3** | `src/modules/boq_engine.py` + `export_service.py` | Key mismatch: `Concrete_Piers_m3` vs `Concrete_Pier_m3` | Create shared `QuantityKey` enum |
| **A4** | `src/analyzer/pattern_matcher.py` | `Path | None` syntax fails on Python 3.9 | Add `from __future__ import annotations` |
| **A5** | `src/generators/dxf_builder.py` | Unicode arrows (↗ ↘ ⚠️ ❌ ℹ️ ✅) break SHX fonts | Replace with ASCII arrows or use TrueType fonts |
| **A6** | `build_exe.py` | Deprecated Nuitka flag `--windows-disable-console` | Change to `--windows-console-mode=disable` |

### Engineering Improvements:
| ID | Improvement | Source | Implementation |
|----|-------------|--------|----------------|
| **E01** | Scour factor: Use 2.0× (IRC conservative) | IRC:78-1983 Cl.704.2.2 | Update design checks to use 2.0× for foundation depth |
| **E02** | Freeboard: Discharge-band table (not hardcoded 0.6m) | D3 Expert Bridge Doctor | Implement IRC:5-2015 Cl.306.2 table |
| **E03** | BOQ keys: Shared `QuantityKey` enum | REVIEW.md F.3 | Create enum shared by BOQ engine + Excel exporter |
| **E04** | Abutment heel length: Log warning + allow override | REVIEW.md B3 | Apply 2.25× default, log WARNING if user overrides |
| **E05** | Git LFS for binary assets | REVIEW.md C1 | Add `.gitattributes` + `reference_drawings/` folder |
| **E06** | Python 3.11+ version pin | REVIEW.md C5 | Add `pyproject.toml` with `requires-python = ">=3.11"` |
| **E07** | CI/CD: pytest + GitHub Actions | REVIEW.md C4 | Add `tests/` + `.github/workflows/ci.yml` |

### Architecture Refactoring:
| Task | Rationale |
|------|-----------|
| Split `src/generators/templates.py` (523 LOC) into `gad.py`, `pier.py`, `deck.py`, `wing_wall.py`, `abutment.py` | REVIEW.md C9: "God files" hinder maintainability |
| Move `src/generators/piers/pier_library.py` (unused) → wire in or delete | REVIEW.md B10 |
| Standardize logging (remove `print` in `pdf_service.py`) | REVIEW.md B8 |
| Add DEBUG logging to `ezdxf_parser.py` exception handler | REVIEW.md B7 |
| Rename `config/app_config.yaml` paths (remove `../` stripping) | REVIEW.md B6 |

---

## DELIVERABLES (Phase 1)

| Deliverable | Status |
|-------------|--------|
| Production-ready updated codebase | 🔄 IN PROGRESS |
| Git branch: `feature/best-hybrid-drawing` | ⏳ PENDING |
| Feature Comparison Matrix | ✅ COMPLETED (in PHASE0_FEATURE_COMPARISON_MATRICES.md) |
| Changelog.md | ⏳ PENDING |
| Decision Log | ⏳ PENDING |
| Regression Test Report | ⏳ PENDING |
| Performance & Stability Audit | ⏳ PENDING |
| Interface Documentation (for Phase 3) | ⏳ PENDING |

---

## NEXT ACTIONS

1. Create `feature/best-hybrid-drawing` git branch
2. Fix bugs A1–A6 in D1 codebase
3. Merge D3 Expert Bridge Doctor logic
4. Integrate D4 parameter mapper architecture
5. Add Git LFS scaffolding
6. Add pytest + GitHub Actions CI/CD
7. Create documentation (Changelog, Decision Log, Regression Report)
8. Run full regression test suite
9. Present for user approval before Phase 2

---

**Proceeding with implementation now.**
