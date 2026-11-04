# Golden Project Asset Register ΓÇö Week 1

**Status:** Pending asset confirmation  
**Selected golden project:** Kherwara / Kharka Bridge  
**Selection rationale:** Named in the Week 0 bundle as the primary parity reference; project is known to the team with supporting workbooks and reports.

---

## 1. Required assets

The following assets must be located and confirmed before Week 2 begins. If any asset cannot be confirmed, record its status as MISSING and escalate to the engineering owner.

| # | Asset | Expected filename / location | Status |
|---|---|---|---|
| 1 | Canonical design workbook | `Kherwara*.xls` or `Kharka*.xls` | PENDING |
| 2 | Authoritative workbook revision | Revision tag / date in workbook | PENDING |
| 3 | Supporting DOCX design report | `Kherwara*report*.docx` | PENDING |
| 4 | GAD drawing (PDF or DWG) | `Kherwara*GAD*.pdf` or `.dwg` | PENDING |
| 5 | Existing verification scripts | `verify*kherwara*` in scripts/ | PENDING |
| 6 | `VARIABLE_SELECTION_SHEET.xlsx` | Root of main repo | CONFIRMED ΓÇö present in `Bridge_Slab_Design/` |

---

## 2. Naming and versioning conventions

All golden project files must follow this convention:

```
golden/<project-code>/<asset-type>/<filename>.<ext>
```

Example:
```
golden/kherwara/workbook/kherwara_v1.xlsx
golden/kherwara/report/kherwara_design_report_rev1.docx
golden/kherwara/drawings/kherwara_gad_rev1.pdf
golden/kherwara/inputs/kherwara_inputs_v0.1.0.json
golden/kherwara/snapshots/kherwara_expected_v0.1.0.json
```

---

## 3. Engineering review path

| Role | Name | Contact | Status |
|---|---|---|---|
| Project engineer (design owner) | *To be confirmed* | ΓÇö | PENDING |
| Licensed-engineer reviewer | *To be confirmed* | ΓÇö | PENDING |
| Sign-off format | Written review note attached to report bundle | ΓÇö | PENDING |

---

## 4. Exit gate checklist

- [ ] Canonical workbook filename and revision confirmed
- [ ] Supporting report and drawings located
- [ ] Engineering owner and reviewer identified
- [ ] Naming convention applied to all golden assets
- [ ] Asset register updated with confirmed paths
