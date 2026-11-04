# Controlled asset assimilation

This directory contains the five-stage pipeline that safely ingests the legacy
Office and CAD corpus into the project without modifying any source file.

---

## Scripts

### A1 — `inventory.py`

**Purpose:** Hash and classify every source file under `Attached_Assets/`.
Produces `asset-register.json` at the repo root. No files are modified.

**Inputs:** `Attached_Assets/` directory tree

**Outputs:** `asset-register.json` (root), `evidence/assimilation-coverage.md`

**How to run:**
```bash
python scripts/assimilate/inventory.py --root Attached_Assets --out evidence/asset-register.json
# or via pnpm:
pnpm run assets:inventory
```

---

### A2 — `normalize.py`

**Purpose:** Open each workbook in `asset-register.json` and extract:
- `sheet_names` — list of sheet names
- `non_empty_cell_count` — count of cells that contain a value
- `column_headers` — first-row values per sheet

LFS pointer stubs are detected by their first 42-byte magic header and written
with `{"status": "lfs-stub"}` — no openpyxl/xlrd call is made for them.
Legacy `.xls` (BIFF8) files are read with `xlrd`; `.xlsx`/`.xlsm` use `openpyxl`.

**Inputs:** `asset-register.json`

**Outputs:** `evidence/assimilation/normalized/<sha256-prefix>_<filename>.json`
(one file per asset; status is `ok`, `lfs-stub`, `missing`, `error`, or `skipped-non-excel`)

**How to run:**
```bash
python scripts/assimilate/normalize.py
# or via pnpm:
pnpm run assimilate:normalize
```

---

### A3 — `classify_cells.py`  *(batch header classifier)*

**Purpose:** Read each normalized JSON from `evidence/assimilation/normalized/`
and classify its column headers into categories:
- `engineering-value` — header contains a unit token (mm, kN, MPa, …)
- `numeric` — header is purely numeric
- `label` — descriptive text
- `blank` — empty

Assets with status `lfs-stub`, `missing`, `error`, or `skipped-non-excel` are
passed through with `classification_status: skipped`.

> **Note:** For deep per-workbook analysis (variable/coefficient/constraint
> extraction, dependency-graph classification, interactive `--confirm` mode),
> use `classify_workbook.py` in this same directory.

**Inputs:** `evidence/assimilation/normalized/*.json`

**Outputs:** `evidence/assimilation/classified/<same filename>.json`

**How to run:**
```bash
python scripts/assimilate/classify_cells.py
# or via pnpm:
pnpm run assimilate:classify
```

---

### A3b — `classify_workbook.py`  *(deep per-workbook classifier)*

**Purpose:** Ported 2026-10-06 from `docs/week-0/classify_cells.py` (the original
stays untouched). Where A3 reads A2's summaries and sorts *headers* by pattern,
this script opens one workbook twice (formulas, then Excel's cached values),
builds the dependency graph, and sorts every **cell** into:

- `variable` — a hard-coded number with no formula precedents: an input root
- `coefficient` — a factor / property / code limit, as a cell **or** a numeric
  literal embedded inside someone else's formula
- `constraint` — a design check (`IF(...<=..., "OK", ...)`, utilisation, deflection)
- `intermediate` — calculated, feeds only later formulas
- `ambiguous` — a guess below `--min-confidence`, i.e. a question for a human

**Refusals (each one is a measured failure, not a guess):** legacy BIFF `.xls`
(points at A2, which has xlrd), a Git LFS pointer stub (would otherwise parse as
a nearly-empty workbook and report a confident blank), a missing file, and an
`--outdir` inside `project/asset-catalog/` — a proposal must never land in the
ledger.

**`--proposal`** writes `catalogue-proposal.json` with one suggested
`asset-classification.v1` record (sha256, suggested bucket, evidence counts, the
ambiguous cells needing a decision) and `decidedBy: null`. It grants nothing:
`inventory.py --report` reads only `project/asset-catalog/asset-classification.json`,
and a bucket there requires a human `reason` and name. Copy the record or reject
it — do not edit the proposal in place.

**`--answers`** applies previously reviewed decisions in batch. Keys match
case-insensitively (`stability check for pier!b7` hits `STABILITY CHECK FOR
PIER!B7`), and any key that matches no cell is **reported**, not dropped.

**Inputs:** one `.xlsx` / `.xlsm` workbook

**Outputs:** `<outdir>/registry.json`, `variables.json`, `coefficients.json`,
`constraints.json`, and `catalogue-proposal.json` with `--proposal`

**How to run:**
```bash
python scripts/assimilate/classify_workbook.py test-output/design-workbook.xlsx --outdir tmp-a3 --proposal
# or via pnpm (the literal `--` pnpm forwards is filtered out):
pnpm run assimilate:classify:workbook -- docs/week-0/demo_bridge_raw.xlsx
```

> **Known-broken fixture:** `docs/week-0/demo_bridge_raw.xlsx` carries a UTF-8
> BOM (`EF BB BF`) before its `PK` signature, so no zip-based reader — openpyxl,
> ExcelJS, `zipfile` — can open it. Use `test-output/design-workbook.xlsx` to
> exercise this script until the fixture is regenerated.

---

### A4 — `mine_narrative.py`

**Purpose:** Scan normalized column headers for candidate narrative sentences:
strings ≥ 15 characters that contain at least one space. These are collected
as `candidate_sentences` for downstream use in report generation.

**Inputs:** `evidence/assimilation/normalized/*.json`

**Outputs:** `evidence/assimilation/narrative/<same filename>.json`

**How to run:**
```bash
python scripts/assimilate/mine_narrative.py
# or via pnpm:
pnpm run assimilate:narrative
```

---

### A5 — `map_drawings.py`

**Purpose:** For each `drawing-cad` asset (or `.dxf` file) in the register,
count entity types in the modelspace (`LINE`, `ARC`, `TEXT`, etc.).
LFS stubs are detected and written with `{"status": "lfs-stub"}`.

**Inputs:** `asset-register.json`

**Outputs:** `evidence/assimilation/drawings/<sha256-prefix>_<filename>.json`

**How to run:**
```bash
python scripts/assimilate/map_drawings.py
# or via pnpm:
pnpm run assimilate:drawings
```

---

## Prerequisites

```
git lfs pull            # REQUIRED before A2–A5 produce real data
                        # Without this, all workbooks are 42-byte pointer stubs
                        # and all outputs will carry status: lfs-stub

pip install -r requirements.txt
                        # the pinned set: openpyxl (A2, A3, A3b), xlrd (A2 legacy .xls),
                        # ezdxf (A5 + python_cad), pydantic (python_cad CLI models)
                        # Versions are read back from the development host with
                        # `python -m pip list`, not guessed.
```

---

## Pipeline order

| Step | Script | pnpm script |
|------|--------|-------------|
| A1 | `inventory.py` | `pnpm run assets:inventory` |
| A2 | `normalize.py` | `pnpm run assimilate:normalize` |
| A3 | `classify_cells.py` | `pnpm run assimilate:classify` |
| A3b | `classify_workbook.py` | `pnpm run assimilate:classify:workbook -- <workbook>` |
| A4 | `mine_narrative.py` | `pnpm run assimilate:narrative` |
| A5 | `map_drawings.py` | `pnpm run assimilate:drawings` |

Run A1 first to produce `asset-register.json`. Then run A2–A5 in any order
(A3 and A4 depend on A2's outputs; A5 is independent).

---

## Coverage gate (A1)

`pnpm run assimilate` runs `inventory.py --report`. It exits 1 while any
indexed asset remains `unclassified`. Decisions are recorded in
`project/asset-catalog/asset-classification.json`, keyed on sha256.
The gate is **red by design** until a reviewer signs off on each asset.

---

## Immutability guarantee

No script in this directory modifies, moves, or deletes any file under
`Attached_Assets/`. Source workbooks are opened read-only. All outputs go
to `evidence/assimilation/`.
