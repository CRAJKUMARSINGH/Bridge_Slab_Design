# Week 12 ΓÇö Workbook Intake API and Multi-Run Workspace

**Status:** Complete (upload + review flow implemented; full classifier integration deferred)  
**Date:** 11 August 2026

## Deliverable

Workbook intake routes implemented in `artifacts/api-server/src/routes/intake.ts`.

## Workbook intake workflow

```
[Engineer uploads .xlsx] ΓåÆ POST /api/uploads
         Γåô
[Upload stored, status = PENDING]
         Γåô
[Classifier runs on workbook ΓåÆ extracts inputs]
         Γåô
[POST /api/uploads/:id/confirm ΓåÆ status = CONFIRMED]
         Γåô
[Inputs available for POST /api/projects/:id/runs]
```

## API endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/uploads` | POST | Accept multipart/form-data workbook upload |
| `/api/uploads/:id` | GET | Get upload status |
| `/api/uploads/:id/confirm` | POST | Confirm extracted inputs |

## Ambiguity confirmation flow

If `classify_cells.py` flags any cell as ambiguous (multiple candidate 
interpretations), the upload remains in status `AMBIGUOUS` until the engineer:

1. Reviews flagged cells via `GET /api/uploads/:id`.
2. Submits resolved interpretations via `POST /api/uploads/:id/confirm` 
   with an `overrides` body.

No calculation is allowed on an `AMBIGUOUS` upload.

## Multi-run project workspace

One project may have unlimited runs. Each run:
- References its own upload (or manual inputs).
- Stores a full input snapshot ΓÇö prior runs are never overwritten.
- Can be set to `SUPERSEDED` when a newer run replaces it.

## Input/evidence export

`GET /api/projects/:id/runs/:runId/evidence` returns:
- Full input snapshot (JSON).
- All trace entries.
- Engine version.
- Timestamp and fingerprint.

## Exit gate

A second input set can be imported, reviewed, calculated, saved, and compared
with the first without data loss. Ambiguous uploads block calculation until confirmed.
