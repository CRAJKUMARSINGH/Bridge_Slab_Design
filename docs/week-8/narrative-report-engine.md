# Week 8 ΓÇö Narrative Report Engine

**Status:** Complete  
**Date:** 11 August 2026

## Deliverable

Narrative report engine implemented in `lib/engine/src/narrative.ts`.

## Report data model

```typescript
interface DesignReport {
  projectCode:      string;     // e.g. "KHERWARA-01"
  projectName:      string;     // human name
  revision:         string;     // semantic version
  engineVersion:    string;     // locked at calculation time
  generatedAt:      string;     // ISO 8601 timestamp
  inputFingerprint: string;     // SHA-256 of canonical inputs
  reviewState:      string;     // PROTOTYPE | REVIEW | APPROVED
  chapters:         ReportChapter[];
  overallStatus:    string;     // PASS | FAIL
  limitations:      string[];
  humanReviewNote:  string;     // mandatory final statement
}

interface ReportChapter {
  id:       string;
  title:    string;
  sections: ReportSection[];
}

interface ReportSection {
  id:      string;
  heading: string;
  body:    string;    // plain text prose
  tables?: ReportTable[];
}
```

## Chapter templates

| Chapter | Contents |
|---|---|
| CH-1 Project basis | Geometry, scope, applicable assumptions |
| CH-2 Loading | Dead load, live UDL, concentrated load, design combination |
| CH-3 Section properties | Second moment of area, section modulus, yield strength |
| CH-4 Bending resistance | Stress, allowable stress, utilisation, PASS/FAIL |
| CH-5 Shear resistance | Shear force, capacity, utilisation, PASS/FAIL |
| CH-6 Serviceability | Deflection, deflection limit, utilisation, PASS/FAIL |
| CH-7 Assumptions | All 8 standing assumptions |
| CH-8 Review status | Overall status, limitations, human review note |

## Key design rule

No narrative paragraph may contain a number that was not computed by the engine.
Every value is pulled from the `CalculationResult` object.

## Exit gate

Report renders for both PASS and FAIL results. Failed checks appear explicitly in
chapters 4ΓÇô6 and in the overall status. Human review note is always present.
