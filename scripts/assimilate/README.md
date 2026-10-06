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

pip install openpyxl    # A2, A3 (reads .xlsx / .xlsm)
pip install xlrd        # A2 (reads legacy .xls BIFF8 files)
pip install ezdxf       # A5 (reads .dxf drawing files)
```

---

## Pipeline order

| Step | Script | pnpm script |
|------|--------|-------------|
| A1 | `inventory.py` | `pnpm run assets:inventory` |
| A2 | `normalize.py` | `pnpm run assimilate:normalize` |
| A3 | `classify_cells.py` | `pnpm run assimilate:classify` |
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
