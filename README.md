# Bridge Report Studio

A report-first bridge slab design system. The engineer provides a controlled
set of bridge geometry, material, loading, section-property, and
calculation-factor inputs. The system runs one authoritative calculation
pipeline, shows every intermediate and governing check, and produces a
detailed narrative HTML/PDF design report with traceable numbers, charts,
drawings, assumptions, and review status.

**Status:** Week 3 of 15 ΓÇö prototype / review build  
**Engineering sign-off:** Not yet obtained. All outputs are DRAFT.

---

## Quick start

```bash
# Install
npm install          # or: pnpm install

# Development server (existing prototype)
npm run dev

# TypeScript check
npm run check

# Week 0 hydraulics regression
npx tsx scripts/week0/verify-golden.ts

# Week 6+ calculation parity regression (once golden snapshot is frozen)
npx tsx scripts/week6/verify-golden.ts

# Run classifier against a workbook
python scripts/week0/classify_cells.py <workbook.xlsx> \
  --answers inputs/answers_demo.json --outdir docs/week-2/output/
```

---

## Repository map

See [`docs/week-3/repo-map.md`](docs/week-3/repo-map.md) for the full layout.

Key paths:

| Path | Purpose |
|---|---|
| `lib/engine/src/` | **Single authoritative calculation engine** |
| `lib/api-zod/src/` | Zod input schema + validation |
| `lib/api-spec/` | OpenAPI contract |
| `artifacts/api-server/` | Express 5 API server |
| `artifacts/mockup-sandbox/` | React UI + shadcn components |
| `scripts/week0/` | Foundation scripts (classifier, make_demo, harness) |
| `scripts/week6/` | Calculation parity harness |
| `tests/golden/kherwara/` | Golden project fixtures |
| `inputs/` | Foundation variable/coefficient/constraint registries |
| `project/` | Decision log, asset register, open questions |
| `docs/week-1/ ΓÇª week-15/` | Week deliverables |
| `creat.md` | Living project charter |

---

## Week-by-week progress

| Week | Deliverable | Status |
|---|---|---|
| 0 | Foundation JSON registries, demo workbook, classifier | Γ£à |
| 1 | Baseline freeze, decision log, asset register | Γ£à |
| 2 | Classifier run, ambiguity decisions, versioned registries | Γ£à |
| 3 | Archive manifest, repo map, README | Γ£à |
| 4 | Zod input schema, validation, Kherwara fixture | ≡ƒöº |
| 5 | Pure calculation engine functions, unit tests | ≡ƒöº |
| 6 | Golden snapshot, verify:golden harness, tamper test | ≡ƒôï |
| 7 | Traceability surface, engineering review checklist | ≡ƒôï |
| 8 | Narrative report engine, chapter templates | ≡ƒôï |
| 9 | SVG cross-section, chart contracts | ≡ƒôï |
| 10 | Landscape HTML/PDF export | ≡ƒôï |
| 11 | Project persistence, Drizzle schema, run history | ≡ƒôï |
| 12 | Workbook intake, multi-run workspace | ≡ƒôï |
| 13 | Auth, logging, health checks, security | ≡ƒôï |
| 14 | End-to-end acceptance, user manual | ≡ƒôï |
| 15 | Release candidate, sign-off gate | ≡ƒôï |

---

## Engineering important notes

- All outputs are **DRAFT** until a licensed engineer records review status.
- Failed checks are **never suppressed** ΓÇö they appear in UI and report.
- `creat.md` is the project charter. Keep it current.
- The project is **not complete** until `creat.md` records launch evidence.
