# G-09 — OFFLINE FIELD MODE
Prereq: W11 | Feeds: W12A
Use case: a site laptop with no connectivity captures survey levels and records notes.

## CODE — client/src/sw.ts (shell cache + explicit API policy)
```ts
const SHELL = "brs-shell-v1", RUNTIME = "brs-rt-v1";
const SHELL_ASSETS = ["/", "/index.html", "/assets/app.js", "/assets/app.css", "/offline.html"];

self.addEventListener("install", e => e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;                       // writes go through the queue
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(e.request).then(r => { caches.open(RUNTIME).then(c => c.put(e.request, r.clone())); return r; })
      .catch(() => caches.match(e.request)));                    // stale-but-usable offline
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r ?? fetch(e.request)));
});
```

## CODE — client/src/offline/queue.ts
```ts
type Op = { id: string; kind: "LEVELS" | "NOTE" | "INPUT_PATCH"; runId: string; baseRevision: number; payload: unknown; at: string };

const DB = "brs-offline";
async function db() { return new Promise<IDBDatabase>((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore("ops", { keyPath: "id" });
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }

export async function enqueue(op: Omit<Op, "id" | "at">) {
  const d = await db();
  return new Promise<void>((res, rej) => {
    const tx = d.transaction("ops", "readwrite");
    tx.objectStore("ops").put({ ...op, id: crypto.randomUUID(), at: new Date().toISOString() });
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  });
}

export type Conflict = { opId: string; field: string; base: unknown; local: unknown; remote: unknown };

/** Field-level three-way merge. Same field changed on both sides -> human must choose. */
export async function flush(): Promise<{ applied: number; conflicts: Conflict[] }> {
  const ops = await all(); const conflicts: Conflict[] = []; let applied = 0;
  for (const op of ops.sort((a, b) => a.at.localeCompare(b.at))) {
    const remote = await fetchRun(op.runId).catch(() => null);
    if (!remote) break;
    if (remote.revision !== op.baseRevision) {
      const overlapping = overlap(op.payload, remote, op.baseRevision);
      if (overlapping.length) { conflicts.push(...overlapping.map(f => ({ opId: op.id, ...f }))); continue; }
    }
    await postOp(op); await remove(op.id); applied++;
  }
  return { applied, conflicts };
}
```

## Rule
Never silently last-write-wins across a revision boundary. Overlapping fields become a
CONFLICT the engineer resolves; non-overlapping fields merge automatically.

## Exit gate
[ ] App shell loads offline and shows an unmissable offline banner
[ ] Levels captured offline survive a browser restart
[ ] Flush applies non-overlapping changes and raises conflicts for overlapping ones
[ ] A conflict is resolvable in the UI with base/local/remote shown side by side
[ ] Offline-captured results are labelled "local until saved" (W11 requirement)
