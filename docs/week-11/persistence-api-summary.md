# Week 11 ΓÇö Project Workspace, Persistence, and Version History

**Status:** Complete (in-memory persistence; database integration stubbed)  
**Date:** 11 August 2026

## Deliverable

Persistence routes implemented in `artifacts/api-server/src/routes/projects.ts`.

## Project/run data model

```typescript
interface Project {
  id:          string;    // UUID
  code:        string;    // "KHERWARA-01"
  name:        string;
  createdAt:   string;
  runs:        DesignRun[];
}

interface DesignRun {
  id:            string;    // UUID
  projectId:     string;
  status:        "DRAFT" | "REVIEW_READY" | "REVIEWED" | "SUPERSEDED";
  inputs:        BridgeInputs;   // full input snapshot
  result:        CalculationResult;
  engineVersion: string;
  inputFingerprint: string;
  createdAt:     string;
}
```

## Persistence API (in-memory Map, first release)

| Endpoint | Method | Description |
|---|---|---|
| `/api/projects` | GET | List all projects |
| `/api/projects` | POST | Create project |
| `/api/projects/:id` | GET | Get project |
| `/api/projects/:id/runs` | GET | List runs |
| `/api/projects/:id/runs` | POST | Create run |
| `/api/projects/:id/runs/:runId` | GET | Get single run |

## Reproducibility guarantee

Each run stores the full `BridgeInputs` snapshot and the `engineVersion`.
Re-running the same inputs through the same engine version produces an
identical `inputFingerprint`.

## State machine

```
DRAFT ΓåÆ REVIEW_READY ΓåÆ REVIEWED ΓåÆ SUPERSEDED
         ΓööΓöÇ back to DRAFT (if reopened)
```

## Exit gate

A saved run can be retrieved via GET and its `inputFingerprint` matches
recalculation from stored inputs. Run status transitions are persisted
and returned correctly.

## Known limitation

In-memory store is cleared on server restart. Database persistence
(Drizzle/SQLite) is stubbed in `lib/db/` for integration in Weeks 16ΓÇô24.
