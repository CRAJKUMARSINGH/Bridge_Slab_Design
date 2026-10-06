# Specification: Wire All Key Files to Landing Page

## Problem

The Bridge Design Suite has 18+ application pages, 16+ static design-report HTML sites, and multiple engineering modules, but the Landing page (`Landing.tsx`) only exposes a subset of 6–7 routes via CTA buttons and 4 quick-report links. 10+ critical engineering pages (Dashboard, Formula Evaluator, ASTRA Library, Hydraulics, Pier & Abutment Stability, T-Girder, Slab Design, P-M Diagram, About Scope) and the entire `design-reports/` static site vault are not discoverable from the entry point. This breaks navigation continuity and makes key deliverables invisible on first contact.

## Users

- **Primary**: Bridge design engineers opening the app from `/` — need to find all calculators, reports, and dashboards without using the top navbar.
- **Secondary**: QA reviewers and auditors validating that the repo's "surface area" matches the documented scope.
- **Tertiary**: First-time evaluators comparing ASTRA features and the static report vault.

## Goals

1. Every route registered in `App.tsx` is reachable from the Landing page via an explicit CTA, card, or grid link.
2. Every static HTML site under `design-reports/` is linked from the Landing page with correct absolute/relative URLs.
3. Every major engineering module (Drawing_Module, bridge-excel-generator, lib/engine, python_cad, report-engine) is discoverable by name from the Landing page with a one-click navigation to its primary host page or documentation.
4. Landing page retains the existing auspicious theme (maroon/orange/gold palette, depth-lift cards, stagger animation) and does not regress hero layout.
5. Navigation remains functionally equivalent for all newly wired links (clicking each link must either route through wouter `<Link>`/`setLocation`, or `<a>` with correct `target="_blank" rel="noreferrer"` for external static reports).

## Non-Goals

- **No** refactor of page internals (Design.tsx, Dashboard.tsx, ASTRA Library content).
- **No** new engineering calculations or additions to bridge-excel-generator sheets.
- **No** changes to top Navigation component, App.tsx routing, or route paths.
- **No** changes to theme variables or CSS classes beyond what the Landing page already uses.
- **No** documentation files created (README, etc).

## Functional Requirements

### FR-01: All wouter routes wired from Landing
For each route in the client/src/App.tsx Switch table, the Landing page must expose a clickable navigation element that resolves to that route:

| Route | Page | Required visibility |
|---|---|---|
| `/design` | Design (workbook input) | Hero CTA + module card |
| `/projects` | Projects browser | Hero CTA + project vault card |
| `/estimate` | Estimator | Demo button + module card |
| `/report` | Narrative Report (BridgeSlabReport) | Model selector strip card |
| `/drawing` | CAD Drawings (GADDrawing/PierDrawing/etc from Drawing_Module) | Model selector strip card |
| `/merge` | Merge Integration Hub | Model selector strip card |
| `/pier-stability` | PierStability | NEW dedicated module card |
| `/about-scope` | AboutScope (drawing scope) | NEW footer/info link |
| `/hydraulics` | HydraulicPage | NEW dedicated module card |
| `/slab-design` | SlabPage | NEW dedicated module card |
| `/dashboard` | Dashboard (Design verdicts + ASTRA overview) | NEW hero-level "Engineering Command Center" card |
| `/t-girder` | TGirder analysis | NEW dedicated module card |
| `/astra-library` | AstraLibrary knowledge base | NEW hero-level "ASTRA 15 Vault" card |
| `/interaction-diagram` | P-M InteractionDiagram (Bresler/IS:456) | NEW dedicated module card |
| `/abutment-stability` | AbutmentStability (Coulomb/Mononobe-Okabe) | NEW dedicated module card |
| `/formula-evaluator` | FormulaEvaluator (live 5-tab calculator) | NEW hero-level "Live Formula Sanctum" card |
| `*` → NotFound | 404 | No explicit link (keeps catch-only behaviour) |

### FR-02: design-reports static sites linked as external vault
Landing page must include a "Reports Vault" section linking each static HTML site under `design-reports/`:

- **Index hubs**: `/design-reports/index.html` (Project Registry), `/design-reports/drawings.html`, `/design-reports/apps-hub.html`, `/design-reports/irc-quick-reference.html`, `/design-reports/stats.html`, `/design-reports/api-docs.html`, `/design-reports/lfs-sync.html`
- **All 16 individual bridge reports**: som-river-kherwara, som-river-larathi, banas-river-highlevel, parwan-river-highlevel, jakham-river-mandvi, bedach-river-bedla, ayad-river-fatehpura, ayad-river-maharashtra, sisarama-nalah-highlevel, kumbhalgarh-bridge, katumbi-chandrod, gumaniya-nalah-udaipur, sukanaka-nalah-highlevel, sukanaka-nalah-matoon, t01-road-jethliya, kherka-bridge.
- Each link must open in a new tab (`target="_blank" rel="noreferrer"`) and render as a card with: project name, badge (Submersible / High-Level), and river name as subtitle.

### FR-03: Major engineering modules discoverable by name
Landing page must explicitly name and link the following modules:

- `Drawing_Module/src/components.tsx` → 5 components (GADDrawing, PierDrawing, AbutmentDrawing, DeckingDrawing, CrossSectionDrawing) surfaced via `/drawing` route with a footnote name-mapping.
- `bridge-excel-generator/index.ts` → 47-sheet workbook engine → linked via `/design` card with sub-line "47 IRC sheets, engine entry point".
- `lib/engine/src/calculate.ts` + `functions/` (loads, resistance, serviceability) → linked via `/dashboard` card with "1,482+ formulas" subline.
- `client/src/report-engine/` (sheets/, lib/, BridgeSlabReport.ts) → linked via `/report` card with "Narrative + Workbook mirror" subline.
- `python_cad/main.py` + `pier_engine.py` → surfaced as info badge on Drawing card: "DXF/SVG generation: Python CAD pier engine wired".

### FR-04: Consistent card interaction model
All new cards must:
- Use the existing `auspicious-card depth-lift` classes (or `glass-panel` equivalent where Landing already uses them).
- Use `motion.div` variants `stagger` + `fadeUp` identical to existing cards so animation integrity is preserved.
- Expose `onClick={() => setLocation('/route')}` for internal routes, or `<a href>` + external icon for static reports.
- Include a Lucide icon matching the domain (Droplets for hydraulics, Shield for stability, Calculator for formulas, BarChart3 for dashboard, BookOpen for ASTRA, Waves for reports, etc).

### FR-05: Hero section preserved
The existing hero (Landmark icon, headline, 3 primary CTAs: Start new design / Browse Projects / Demo Kherwara) and Portfolio Stats / Bridge Classification bars must not be removed or reordered. New sections are added **below** those existing 4 cards.

## Non-Functional Requirements

### NFR-01: Visual fidelity
New cards must:
- Match existing auspicious theme color variables (`var(--auspicious-maroon)`, `var(--auspicious-orange)`, `var(--auspicious-gold)`).
- Use the same card dimensions in the 12-col grid (col-span-4, col-span-6, col-span-12 patterns as the 6 feature-cards row already demonstrates).
- Not cause horizontal scroll or overflow at `md` breakpoint.

### NFR-02: Performance
- Landing page bundle size delta must be < 10 KB gzipped. All new icons must be re-exports from the already-imported `lucide-react` set (no new imports beyond icons, and no new npm packages).
- `motion` animations must continue to respect `useReducedMotion`.

### NFR-03: Accessibility
- Every new navigation target needs `aria-label` or visible text describing the destination.
- External links must include visible external-indicator text or icon.
- Color contrast ratios must meet at least 4.5:1 for paragraph text on the cream background and dark backgrounds.

### NFR-04: Compatibility
- All routes already defined in App.tsx continue to resolve identically (no path changes).
- Static report URLs must resolve even when the app is served under the `/suite` base path (use relative `href="/design-reports/..."` or server-provided absolute paths matching the environment).

## Constraints, Dependencies, Assumptions

- **Constraint**: Router base is `/suite` (see `App.tsx` line 60). Internal `setLocation('/foo')` calls from within the Router already respect this; new internal links **must** use wouter hooks (not raw `window.location`).
- **Dependency**: lucide-react already imported in Landing.tsx; expand the destructured import list only with icons actually used.
- **Dependency**: `framer-motion`, `wouter`, Zustand stores already present — no changes.
- **Assumption**: `design-reports/` is served as a static folder at the web root `/design-reports/...` (consistent with how QUICK_REPORTS already uses `/api/reports/...`).
- **Assumption**: Individual page components render correctly when routed; the Landing wiring task only needs navigation to work, not page fixes.

## Open Questions

None at specification time. All route paths are verified in App.tsx, all static files enumerated via LS on design-reports/.

## Acceptance Criteria

### rule AC-01 — Every App route reachable
Open Landing page → click or find at least one visible card/button per route listed in FR-01 table → the route resolves to the matching page component.

### rule AC-02 — Static vault fully linked
Count links in the new "Reports Vault" section: at least 7 hub pages + 16 individual bridge reports = **minimum 23 external links**, each opening a new tab with valid `href` pointing under `/design-reports/`.

### rule AC-03 — Module inventory surfaced
Inspect Landing rendered text: must contain the names **Drawing_Module**, **bridge-excel-generator**, **lib/engine** (or "Engine 1,482 formulas"), **report-engine** (or "Narrative engine"), and **python_cad** (or "Python CAD pier engine"), each linked or annotated with its host page.

### rule AC-04 — Hero preserved
After changes, the hero section still contains: Landmark icon, "Bridge Design System" headline, 3 buttons (Start new design / Browse Projects / Demo (Kherwara)), and the Portfolio Stats + Bridge Classification cards remain present in order before any new module-grid section starts.

### rule AC-05 — No regressions in animations & theme
Reduced-motion test: `useReducedMotion` variants still short-circuit; new cards apply same `fadeUp` variants; no plain-white unstyled divs; scroll position at top still shows the auspicious gradient stripe.

### rule AC-06 — Typecheck & build
Running `pnpm run typecheck` at repo root exits 0 after changes. No new TS errors in Landing.tsx or imported icons.

### rubric AC-07 — Discoverability (0–2)
- **2**: A new engineer landing on the page can find every calculator/report/dashboard in ≤ 3 seconds of visual scan, with icons and labels forming consistent domain groupings (hydraulics/stability together, ASTRA/Formula/Dashboard together, reports vault together).
- **1**: All targets are wired but cards lack domain grouping (mixed order) or icons are inconsistent.
- **0**: At least one route from FR-01 is present in code but visually hidden or indistinguishable from body text (no button/card treatment).
