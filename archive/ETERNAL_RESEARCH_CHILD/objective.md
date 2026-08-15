# ETERNAL_RESEARCH_CHILD — Objective (Bridge Slab Design)

## Mission

**ETERNAL_RESEARCH_CHILD** is the long-running research and upkeep lane for **CURSOR SLAB DESIGN** (submersible slab bridge design suite). Its purpose is to enable **continuous, AI-aided refinement** of the application—engineering logic, reports, drawings, assets, and documentation—while staying aligned with this repository and external truth sources.

This child process does **not** replace human judgment. It **feeds** structured proposals, logs, and cues so that updates remain **regular**, **traceable**, and **prudent**.

---

## What “continuous” means here

- **Cadence**: Scheduled or on-demand cycles (e.g. daemon intervals, CI hooks, or manual `research:once`-style runs) that revisit inputs and surface actionable items—not one-off spikes of work.
- **Scope**: Hydraulics and structural calculations, IRC-aligned checks, Excel workbook / report engine behavior, DXF generation, tests, and UX tied to design workflows.
- **Stop conditions**: No change is “live” without explicit approval in your workflow (human or gated automation); the log is the audit trail.

---

## Synchronization with this app (this repo)

1. **Canonical product**: The Bridge Slab Design stack at the repository root (`client/`, `server/`, report engines, tests, `USER_MANUAL.md`, etc.).
2. **Assets**: Use **`Attached_Assets/`** (and related paths) as the primary attach surface for legacy Excel, notes, reference PDFs, and imagery—consistent with how this project organizes supplementary material.
3. **Large binaries**: Follow **Git LFS** as defined in the root **`.gitattributes`** (e.g. `.dxf`, `.dwg`, `.xlsx`, images, archives, and designated asset trees). The child’s outputs and recommendations should assume LFS for anything that would bloat history or belong in binary storage—not giant blobs in normal Git text history.
4. **Evidence**: Prefer proposals that cite **file paths, sheet names, formula cells, or test names** so implementation is reviewable.

---

## Git LFS (prudence + performance)

- Treat LFS-tracked patterns as **mandatory** for new reference drawings, templates, exports, and bundled research artifacts stored in-repo.
- When suggesting “add this sample workbook/drawing,” the objective is to add it **under LFS**, document **why** it exists, and avoid duplicate blobs.
- If LFS is not installed locally, document that `git lfs install` / `git lfs pull` may be required before working with those paths—without blocking the research loop from proposing improvements.

---

## Web links and external reference

- **Standards & codes**: IRC and related Indian bridge/concrete/hydraulic references (as applicable to modules in this suite)—used to justify formula updates, limit checks, or report wording.
- **Libraries & tools**: Upstream docs for stack pieces (e.g. Node, Vite, ezdxf/CAD ecosystem, Excel generation libraries) when proposing dependency or API updates.
- **Sibling repos & ecosystem**: Maintain **`Attached_Assets/0 commands only/assets directory.txt`** as the canonical list of related GitHub repositories (and optional local study paths on your machine). The daemon reads GitHub URLs from that file and mirrors them in **`ETERNAL_RESEARCH_CHILD/linked-resources.md`** for navigation.
- **Discipline**: Every external claim should be **linkable or citable** (URL, standard clause, or official PDF section). The child process should favor **verifiable** references over anecdotal “best practice” only.

---

## AI-aided updates (how the child uses AI)

- **Research & diff intelligence**: Use AI to summarize large attachments, compare legacy spreadsheets to current engine outputs, or draft patch-sized proposals—always **reviewed** by a human or strict CI.
- **Implementation**: Changes land in the repo through normal engineering flow (PR, tests, audit scripts)—not silent auto-writes to production paths unless you explicitly build that later with safeguards.
- **Logging**: Maintain append-only logs (e.g. `research_log.jsonl`) for proposals and decisions so “why we changed this” survives turnover and model refreshes.

---

## Prudence (non-negotiables)

1. **Safety & correctness**: Bridge design outputs affect real structures—prefer conservative assumptions, document assumptions, and preserve regression tests (golden cases, audit thresholds).
2. **No unbounded autonomy**: Continuous does not mean “unsupervised merge.” Gate risky edits (calculations, load factors, material defaults) behind review.
3. **Data hygiene**: Do not exfiltrate proprietary project data to untrusted endpoints; align with your org’s AI and secret-handling policies.
4. **Reversibility**: Favor small, revert-friendly commits and feature flags where the codebase supports them.

---

## Success criteria (for this child lane)

- Research cycles consistently produce **prioritized, implementable** items tied to this codebase and **Attached_Assets**.
- LFS and repo conventions are **respected** for binaries and large references.
- External updates (standards, docs, dependencies) are **tracked** via links and reflected in proposals—not rumor.
- The team can answer **what changed, when, and on what authority** using logs and commits.

---

## Relationship to legacy copy

This folder began as a research-daemon pattern from another application. **`objective.md` remains canonical.** `research_daemon.ts` and `README.md` are now aligned with **CURSOR SLAB DESIGN** (`Attached_Assets/`, `client/src/report-engine/`, verification scripts, Git LFS). Extend categories or targets here first, then mirror them in the daemon if needed.
