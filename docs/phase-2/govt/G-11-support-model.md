# G-11 — SUPPORT MODEL, TRIAGE & RELEASE CADENCE
Prereq: W12 | Feeds: W12A

## Severity & SLA
| Sev | Definition | First response | Fix target |
| S1 | Wrong number in a signed report | 4 h | 3 days + re-review |
| S2 | Cannot generate a deliverable | 1 day | 7 days |
| S3 | Degraded but workaround exists | 3 days | next minor |
| S4 | Cosmetic / request | 10 days | backlog |

## CODE — scripts/diag-bundle.ts (redacted support bundle, one command)
```ts
const REDACT = [/(bearer\s+)[\w.-]+/gi, /postgres:\/\/[^\s"]+/g, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/g];

export async function diagBundle(out = "diag.zip") {
  const zip = archiver("zip");
  const safe = (s: string) => REDACT.reduce((acc, re) => acc.replace(re, m => m.startsWith("postgres") ? "postgres://<redacted>" : m), s);

  zip.append(safe(JSON.stringify({
    appVersion: pkg.version, engine: ENGINE_VERSION, commit: await gitHead(),
    node: process.version, platform: process.platform, netlify: !!process.env.NETLIFY,
    envNames: Object.keys(process.env).filter(k => k === k.toUpperCase()).sort(),
  }, null, 2)), { name: "versions.json" });

  zip.append(await lastErrors(200).then(e => safe(JSON.stringify(e, null, 2))), { name: "errors.json" });
  zip.append(await healthDeep().then(h => JSON.stringify(h, null, 2)), { name: "health.json" });
  zip.append(await gateSummary(), { name: "gates.txt" });
  zip.append(await listMigrations(), { name: "migrations.txt" });
  zip.finalize();
  return out;
}
```
`npm run diag:bundle` — the user attaches one file. No screenshots needed.

## Release cadence & deprecation
- Patch: weekly, no invalidation. Minor: monthly, offers recompute. Major: quarterly, may invalidate.
- Engine major bump always ships with release notes naming the changed formulas and which
  prior reports go stale.
- Deprecation: announce → 2 minors of warnings → remove. Nothing removed in a patch.
- Every release has a rollback tag retained 90 days.

## Exit gate
[ ] SLA table published; S1 has a named path and a re-review trigger
[ ] diag:bundle produces a redacted zip with no secrets (verified by grep)
[ ] Cadence and deprecation policy written and agreed
[ ] Triage matrix maps symptom -> severity -> owner
[ ] Incident template with a blameless post-mortem section
