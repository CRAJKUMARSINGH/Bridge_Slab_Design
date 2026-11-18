# G-06 — CLIENT DATA PRIVACY & TENANT ISOLATION
Prereq: W05 | Feeds: W12
Context: PWD project data belongs to a client. Assume an NDA.

## CODE — migrations/00X_rls.sql
```sql
ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events   ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON projects
  USING (org_id = current_setting('app.org_id', true)::uuid);

CREATE POLICY run_via_project ON runs
  USING (EXISTS (SELECT 1 FROM projects p
                 WHERE p.id = runs.project_id
                   AND p.org_id = current_setting('app.org_id', true)::uuid));

CREATE POLICY upload_via_project ON uploads
  USING (EXISTS (SELECT 1 FROM projects p
                 WHERE p.id = uploads.project_id
                   AND p.org_id = current_setting('app.org_id', true)::uuid));
```
Set the tenant per request in a transaction wrapper — never trust a client-supplied org id:
```ts
export async function withTenant<T>(orgId: string, fn: (db: Db) => Promise<T>) {
  return db.transaction(async tx => {
    await tx.execute(sql`SELECT set_config('app.org_id', ${orgId}, true)`);
    return fn(tx);
  });
}
```

## CODE — lib/security/seal.ts (uploads encrypted at rest)
```ts
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
const KEY = () => Buffer.from(process.env.UPLOAD_KEY!, "base64");   // 32 bytes

export function seal(buf: Buffer): Buffer {
  const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", KEY(), iv);
  const ct = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]);                   // [iv|tag|ct]
}
export function open_(s: Buffer): Buffer {
  const iv = s.subarray(0, 12), tag = s.subarray(12, 28), ct = s.subarray(28);
  const d = createDecipheriv("aes-256-gcm", KEY(), iv); d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]);
}
```

## CODE — retention
```sql
CREATE OR REPLACE FUNCTION purge_expired() RETURNS TABLE(kind text, n int) AS $$
BEGIN
  RETURN QUERY
  WITH u AS (DELETE FROM uploads WHERE created_at < now() - interval '365 days' RETURNING 1)
  SELECT 'uploads', count(*)::int FROM u;
END $$ LANGUAGE plpgsql;
```

## CODE — export-on-exit bundle
```ts
export async function exportOrg(orgId: string): Promise<Buffer> {
  const zip = archiver("zip");
  for (const p of await listProjects(orgId)) {
    zip.append(JSON.stringify(await projectSnapshot(p.id), null, 2), { name: `${p.code}/project.json` });
    for (const r of await listRuns(p.id)) {
      zip.append(JSON.stringify(await runSnapshot(r.id)), { name: `${p.code}/runs/${r.id}.json` });
      for (const a of await listArtifacts(r.id)) zip.append(await readArtifact(r.id, a.path), { name: `${p.code}/runs/${r.id}/${a.path}` });
    }
  }
  zip.append(await auditTrail(orgId), { name: "audit.jsonl" });
  return zip.finalize() as unknown as Buffer;
}
```

## Exit gate
[ ] RLS enabled and proven: org A cannot read org B's run (test, not claim)
[ ] `app.org_id` set per transaction, never from the request body
[ ] Uploads sealed at rest; a raw DB read shows ciphertext
[ ] Retention function scheduled; dry-run output attached
[ ] exportOrg produces a re-importable bundle (round-trip test)
[ ] PII inventory: only name, email, licence no. — recorded
