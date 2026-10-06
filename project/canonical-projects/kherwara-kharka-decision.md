# Kherwara / Kharka project identity decision

## Status: RESOLVED ✅ — 2026-10-06

**Decision (owner confirmation, 2026-10-06):** Kherwara is the correct name.
Kharka references in code and data have been removed. The project is canonical under the name **KHERWARA**.

## Evidence

The attached assets include files labelled both `KHERWARA` and `KHARKA`. The engineering owner
has confirmed these identify the same project and that **Kherwara** is the authoritative name.

## Actions taken (2026-10-06)

- `lib/engine/src/index.ts` — `projectName` default changed from `"KHERWARA / KHARKA DEMO"` → `"KHERWARA DEMO"`
- `lib/engine/src/traceability.ts` — L-001 limitation statement updated to reference `Kherwara workbook` (not `Kherwara/Kharka`)
- `inputs/KHERWARA.json` — `projectName` field updated from `"KHERWARA / KHARKA DEMO"` → `"KHERWARA DEMO"`
- `tmp/due9/register.json` — `projectHint` slug changed from `"kherwara-kharka-review"` → `"kherwara-review"`
- `project/canonical-projects/kherwara-kharka-decision.md` (this file) — status changed from OPEN → RESOLVED
- `august-due.md` — identity row marked ✅ DONE
- `CODE-JUNCTION/august-due.md` — identity row marked ✅ DONE

## Files left unchanged

- `assets/DRAWINGS_FROM_RAJKUMAR_DESIGNS/drawing_extraction_log.txt` — historical filesystem log of
  external drive paths (`E:\BRIDGE DESIGN\Kharka Bridge Rehabilitation\...`); documents what was
  on disk, not project data.
- `archive/20261006-tmp-scratch-due7-due8/*` — archived historical logs; left as evidence.
- `AUGUST ACTION PLAN.md`, planning/chatlog docs — historical planning documents that reference the
  identity question; the question is now resolved; doc text preserved as audit trail.
- Filenames containing `kharka` or `kherwara-kharka` in the filename (e.g. this file) — not renamed
  to avoid breaking any references to the path.
- `Attached_Assets/DESIGN REPORT KHARKA BRIDGE.docx` — physical asset file reference; not renamed.

## Provisional use (superseded)

~~`KHERWARA` is the golden-fixture key.~~  
~~The fixture is illustrative and reproduces the attached demo workbook registry.~~  
~~It must not be presented as the authoritative 25-sheet production workbook.~~

The project is now canonical under **KHERWARA**. Further adjudication on the authoritative
workbook revision, report set, and applicable design code remains open (engineering sign-off
still due).
