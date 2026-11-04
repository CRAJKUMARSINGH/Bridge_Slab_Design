# netlify.toml — archived 2026-10-05, not deleted

## Why this moved here

`netlify.toml` described a deployment that has never existed in this repository:

| What it configured | What the repo actually has |
| --- | --- |
| `command = "npm run build:netlify"` | No `build:netlify` script in any `package.json` |
| `functions = "netlify/functions"` | No `netlify/` directory — the function entry it redirects `/api/*` to was never written |
| `npm install` / `npm run …` | The root `preinstall` refuses anything but pnpm (`Use pnpm instead`), so an npm install fails on the first line of the build |
| `publish = "dist/public"` | Real: `vite build` writes here — verified 2026-10-05 (`pnpm run build:client` produces `dist/public/index.html` + hashed assets) |

Netlify would have failed at the install step, then at the build step, then at the first `/api/*` call.
A config file that cannot work is worse than no config file: it reads like a supported deployment path,
and the only way to discover otherwise is to burn a production deploy.

## What still is deployable

`vercel.json` at the repo root, corrected the same day:

- `installCommand` → `pnpm install --frozen-lockfile` (npm is rejected by `preinstall`)
- `buildCommand` → `pnpm run build:vercel`, which now exists and runs `vite build` → `dist/public`
- `api/index.ts` is a real Express wrapper (`createApp()` from `server/app-factory.ts`), and
  `pnpm run check` typechecks `client/**`, `shared/**`, the server entry files and the new build lane.

Verified locally, not on the platform: the client build output and every gate. No Vercel project has been
created or deployed from this repository, so the hosted runtime behaviour (serverless cold start, the
60 s function limit against a ~200-page PDF render, `DATABASE_URL` absence) remains unproven.

## To bring Netlify back

Write the function entry that was always missing — an adapter from Netlify's
`NetlifyFunction` event shape to the Express app in `server/app-factory.ts` — plus a `build:netlify`
script, then restore this file from the archive and correct its install/build commands to pnpm.
Nothing else about the redirect and header blocks needs changing.
