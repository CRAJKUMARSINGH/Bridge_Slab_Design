# Bridge Design Suite — Deployment Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  /suite/*  →  React SPA (Vite build → dist/public)          │
│  /api/*    →  Express API (serverless function)              │
└─────────────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
  CDN (static files)     Serverless Function
  (Netlify / Vercel)     (Netlify / Vercel)
                                    │
                                    ▼
                          Neon PostgreSQL (optional)
                          (projects, files, records)
```

The app works **without a database** — all IRC design calculations, Excel export, DXF, PDF, and SVG drawings function fully. The database only powers the Projects page CRUD and Dashboard stats.

---

## Option A — Deploy to Vercel

### 1. Prerequisites
- Vercel account at https://vercel.com
- GitHub repo connected to Vercel

### 2. Import project
1. Go to https://vercel.com/new
2. Import `CRAJKUMARSINGH/Bridge_Slab_Design`
3. Framework Preset: **Other**
4. Build Command: `npm run build:vercel`
5. Output Directory: `dist/public`
6. Install Command: `npm install`

### 3. Environment variables
In Vercel dashboard → Project → Settings → Environment Variables, add:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | No (app works without it) |
| `NODE_ENV` | `production` | Yes |
| `ALLOWED_ORIGINS` | `https://your-project.vercel.app` | Yes |

### 4. Deploy
Click **Deploy**. Vercel will:
1. Run `npm run build:vercel`
2. Build the React SPA → `dist/public`
3. Bundle `api/index.ts` → Vercel Serverless Function
4. Route `/api/*` → function, `/suite/*` → SPA

### 5. Custom domain (optional)
Vercel dashboard → Project → Settings → Domains → Add domain

---

## Option B — Deploy to Netlify

### 1. Prerequisites
- Netlify account at https://netlify.com
- GitHub repo connected to Netlify

### 2. Import project
1. Go to https://app.netlify.com/start
2. Connect to GitHub → select `CRAJKUMARSINGH/Bridge_Slab_Design`
3. Build settings are auto-detected from `netlify.toml`:
   - Build command: `npm run build:netlify`
   - Publish directory: `dist/public`
   - Functions directory: `netlify/functions`

### 3. Environment variables
In Netlify dashboard → Site settings → Environment variables, add:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | No |
| `NODE_ENV` | `production` | Yes |
| `ALLOWED_ORIGINS` | `https://your-site.netlify.app` | Yes |

### 4. Deploy
Click **Deploy site**. Netlify will:
1. Run `npm run build:netlify`
2. Build the React SPA → `dist/public`
3. Bundle `netlify/functions/api.ts` → Netlify Function
4. Route `/api/*` → `/.netlify/functions/api`, `/suite/*` → SPA

### 5. Custom domain (optional)
Netlify dashboard → Site settings → Domain management → Add custom domain

---

## Database Setup (Neon PostgreSQL)

### 1. Create a Neon project
1. Go to https://console.neon.tech
2. Create a new project (free tier is sufficient)
3. Copy the **Connection string** from the dashboard

### 2. Run migrations
After setting `DATABASE_URL` locally:
```bash
npm run db:push
```
This creates the 4 tables: `projects`, `file_records`, `analysis_records`, `comparisons`.

### 3. Verify
```bash
curl https://your-site.netlify.app/api/stats/summary
# Should return: {"totalProjects":0,"totalFiles":0,...}
```

---

## Local Development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env
# Edit .env — add your DATABASE_URL

# Start dev server (Express + Vite HMR)
npm run dev

# App available at:
# http://localhost:5000/suite/
```

---

## Build Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run build` | Standard build (Replit / self-hosted) |
| `npm run build:vercel` | Vercel build (prod vite config + ESM function bundle) |
| `npm run build:netlify` | Netlify build (prod vite config + CJS function bundle) |
| `npm run db:push` | Push Drizzle schema to Neon PostgreSQL |
| `npm run generate:api` | Regenerate Orval TypeScript hooks from OpenAPI spec |
| `npm run check` | TypeScript type check |
| `npm run test` | Run Vitest test suite |

---

## Troubleshooting

### "Database not configured" (503)
The app is running without `DATABASE_URL`. This is expected — all design features work. Only Projects CRUD and Dashboard stats return 503. Set `DATABASE_URL` in your platform's environment variables to enable persistence.

### Excel download fails on Vercel (timeout)
Vercel Hobby plan has a 10-second function timeout. The Excel generator can take 5–15 seconds for large designs. Options:
- Upgrade to Vercel Pro (60-second timeout — already set in `vercel.json`)
- Use Netlify (26-second timeout on free tier)

### CORS errors
Set `ALLOWED_ORIGINS` to your exact frontend URL (no trailing slash):
```
ALLOWED_ORIGINS=https://bridge-design.netlify.app
```

### `/suite/` returns 404
The SPA rewrite rules in `vercel.json` and `netlify.toml` handle this. If you see 404s, ensure the deploy completed successfully and the rewrite rules are active.

### Sharp (image processing) errors
`sharp` is excluded from the serverless bundle (`--external:sharp`) because it uses native binaries. The app does not require sharp at runtime for core features.

---

## File Structure for Deployment

```
├── api/
│   └── index.ts          ← Vercel Serverless Function entry
├── netlify/
│   └── functions/
│       └── api.ts        ← Netlify Function entry
├── dist/
│   └── public/           ← Built React SPA (generated by build)
├── vercel.json           ← Vercel routing + function config
├── netlify.toml          ← Netlify build + redirect config
├── vite.config.prod.ts   ← Production Vite config (no Replit plugins)
├── .env.example          ← Environment variable template
└── openapi/
    └── bridge-suite.yaml ← OpenAPI spec (served at /api/openapi.yaml)
```
