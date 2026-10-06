# Headless batch run of the design pipeline (inputs -> calculate -> workbook -> PDF -> HTML).
#
# NOT BUILT YET — 2026-10-06. There is no Docker engine on the machine this file was written on
# (`docker: command not found`), so nothing below is verified by a local build. `.github/workflows/ci.yml`
# has a `container-image-build` job that runs `docker build .` on the first push, with
# `continue-on-error: true` until it goes green; remove that flag once it has, and this header changes
# from "not built" to "built by CI run <url>".
#
# It deliberately does NOT follow ACTION 6.3 of AUGUST ACTION PLAN.md, which describes a stack this repo
# does not have:
#   - `npm install -g pnpm` installs an arbitrary pnpm; this repo pins pnpm@10.33.0 via `packageManager`
#     and its root `preinstall` script rejects npm, so corepack is used instead.
#   - Chromium + PUPPETEER_EXECUTABLE_PATH: the PDF path is jsPDF (`server/pdf-export.ts`,
#     `comprehensive-pdf-export.ts`), which renders in pure Node. No browser, no fonts package.
#   - `COPY lib/ pipeline/ inputs/ scripts/`: pnpm workspaces also need `artifacts/*`, `shared/`,
#     `bridge-excel-generator/`, `server/`, `project/` and the root tsconfigs, so the context is copied
#     whole and `.dockerignore` decides what stays out.
#   - `pnpm run design -- --input ... --out ...pdf`: `design` writes HTML. The one-command batch entry is
#     `pnpm run pipeline`.

FROM node:24-slim-bookworm

# python3 is here for the A1 assimilation gate (`pnpm run assimilate`), not for the design pipeline.
# ca-certificates so corepack can fetch the pinned pnpm.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# Copied whole rather than manifest-first: pnpm resolves the workspace from every package.json under
# artifacts/, lib/ and scripts/, so a cached install layer would need all of them anyway.
COPY . .

# --frozen-lockfile, matching CI. The root preinstall hook refuses npm, and pnpm-workspace.yaml's
# minimumReleaseAge: 1440 stays active here.
RUN pnpm install --frozen-lockfile

# Set after the install: the build needs devDependencies (tsx drives every script), while the logger in
# server/logger.ts switches to plain JSON at info level when NODE_ENV=production.
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Deliverables land in /app/tmp/pipeline/<project>/ — mount a volume there to keep them, e.g.
#   docker run --rm -v "$PWD/out:/app/tmp/pipeline" bridge-design
# Other entries worth knowing:
#   docker run --rm -v "$PWD/out:/app/test-output" bridge-design pnpm run deliverables
#   docker run --rm bridge-design pnpm run check
#   docker run --rm bridge-design pnpm run verify
CMD ["pnpm", "run", "pipeline"]
