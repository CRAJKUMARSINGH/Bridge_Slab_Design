# Decision Log

**Project:** Bridge Report Studio  
**Repository sub-tree:** `CODE-JUNCTION/Bridge-Reorient-System`

Decisions are numbered sequentially. Each entry records what was decided, why, who owns it, and what must be revisited.

---

## DEC-001 ΓÇö Report-first product

| Field | Value |
|---|---|
| Date | 09 August 2026 |
| Decision | The detailed HTML/PDF design report is the primary deliverable. The spreadsheet is a parity reference during migration, not the product interface. |
| Rationale | Engineers rely on defensible, readable design records. The existing repo contains duplicate platform layers that cloud this goal. |
| Owner | Project lead |
| Review trigger | Architecture change or customer request to expose spreadsheet as primary UI |

---

## DEC-002 ΓÇö One authoritative pipeline

| Field | Value |
|---|---|
| Date | 09 August 2026 |
| Decision | User-facing calculations, CLI runs, golden tests, and report generation must all use the same `@workspace/engine` calculation core. |
| Rationale | Multiple calculation paths lead to silent divergence and untraceable results. |
| Owner | Engineering lead |
| Review trigger | Any proposal to add a second calculation path |

---

## DEC-003 ΓÇö alpha classified as engineer-controlled coefficient (default 0.9)

| Field | Value |
|---|---|
| Date | 09 August 2026 |
| Decision | `alpha` (Factors!B9) is treated as a named, visible, engineer-controlled reduction factor with default 0.9. |
| Source | `answers_demo.json` |
| Owner | Engineering lead |
| Review trigger | Canonical Kherwara workbook review ΓÇö must re-confirm against real project cell |

---

## DEC-004 ΓÇö correctionK3 classified as engineer-controlled coefficient (default 1.2)

| Field | Value |
|---|---|
| Date | 09 August 2026 |
| Decision | `correctionK3` (Factors!B10) is treated as a named, visible, engineer-controlled correction factor with default 1.2. The cell is mislabelled "asphalt thickness" in the demo workbook; this is recorded as an ambiguity and must be resolved against the canonical workbook. |
| Source | `answers_demo.json` |
| Owner | Engineering lead |
| Review trigger | Week 2 workbook classification ΓÇö Factors!B10 must be re-examined in canonical workbook |

---

## DEC-005 ΓÇö Deflection limit formula retained as workbook-parity formula

| Field | Value |
|---|---|
| Date | 09 August 2026 |
| Decision | The demo workbook's deflection limit formula (`span ├ù 1000 / correctionK3`) is retained as-is for parity. The intentional FAIL result in the demo workbook must not be suppressed. |
| Source | `answers_demo.json` |
| Owner | Engineering lead |
| Review trigger | Any proposed formula correction must update both this log and the golden snapshot together |

---

## DEC-006 ΓÇö Golden project is Kherwara / Kharka

| Field | Value |
|---|---|
| Date | 09 August 2026 |
| Decision | Kherwara/Kharka is the first golden project subject to asset confirmation. No feature work expands to new project types until this golden project passes numerical regression. |
| Owner | Project lead |
| Review trigger | Asset confirmation failure ΓÇö if canonical workbook cannot be located, an alternative must be selected |

---

## Open questions

| # | Question | Owner | Target week |
|---|---|---|---|
| OQ-001 | Canonical Kherwara/Kharka workbook filename and authoritative revision | Engineering owner | Week 2 |
| OQ-002 | Applicable design code and jurisdiction (IRC, BS, Eurocode?) | Engineering owner | Week 2 |
| OQ-003 | Licensed-engineer reviewer identity and sign-off format | Project lead | Week 3 |
| OQ-004 | Required PDF length for first release (full ~200-page legacy style, or smaller complete prototype?) | Project lead | Week 8 |
| OQ-005 | Approved tolerance for workbook parity by calculation category | Engineering lead | Week 6 |
| OQ-006 | Whether Excel remains a runtime dependency after parity is proven | Engineering lead | Week 7 |
| OQ-007 | Which drawings and charts are mandatory for first release | Engineering lead | Week 9 |
| OQ-008 | Retention and access requirements for uploaded workbooks and generated reports | Project lead | Week 13 |
