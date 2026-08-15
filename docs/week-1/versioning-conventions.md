# Versioning and Evidence Conventions ΓÇö Week 1

## Project and run identifiers
- Project key: lowercase kebab, e.g. `kherwara`
- Run key: `<project-key>-<YYYYMMDD>-<engine-version>`
- Snapshot files: same project key as their input fixture
- Never use a local path or timestamp as the only identifier

## Evidence classes

| Class | Meaning |
|---|---|
| `source` | Original workbook, report, drawing, or owner-provided input |
| `fixture` | Typed project input used by automated checks |
| `expected` | Frozen numerical or structural result for regression |
| `derived` | Output generated from a source or fixture |
| `decision` | Human-approved interpretation or engineering choice |
| `open` | Unresolved item blocking approval |

## Traceability requirement
Every report number must trace to:
1. A versioned input in `inputs/` or a named input field
2. A named coefficient in `inputs/coefficients.json`
3. A calculated intermediate with source formula/cell reference
4. An explicitly recorded engineering decision

## Regression tolerance
- Numeric: `rtol = 1e-6` unless engineering review approves different
- Categorical (status): exact match required
- A changed expected value requires a decision-log entry; never silently regenerate

## Review states
`draft` ΓåÆ `owner-review` ΓåÆ `licensed-engineer-review` ΓåÆ `accepted` ΓåÆ `superseded`

Software passing a test does not imply engineering approval.

## File naming for golden assets
```
tests/golden/<project-key>/inputs.json
tests/golden/<project-key>/expected-<category>-v<semver>.json
tests/golden/<project-key>/snapshots/<run-key>.json
```
