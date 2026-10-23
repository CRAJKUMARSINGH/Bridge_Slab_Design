#!/usr/bin/env tsx
// gate-docs — the anti-empty-file gate.
// 3 assertions: no `{{PLACEHOLDER}}` survives, no file under the doc root is a
// heading with nothing under it, no file is a stub. Scope is the *live*
// instruction corpus (docs/phase-2); legacy Set-1 files are exempted by
// containment/PENDING-RESOLUTIONS.json (PR-04) and printed as advisories.
import { run, walk, read, fail, pendingFor } from "./_lib";

await run("gate-docs", 3, async () => {
  const files = (await walk("docs/phase-2", /\.md$/)).sort();
  const ex = await pendingFor("gate-docs");
  const bad: string[] = [];
  const exempt: string[] = [];
  const counted = { placeholders: 0, stubs: 0, headings: 0 };
  for (const f of files) {
    const txt = await read(f);
    const found: string[] = [];
    const placeholders = [...txt.matchAll(/\{\{[A-Z0-9_]+\}\}/g)].map((m) => m[0]);
    if (placeholders.length)
      found.push(`${placeholders.length} placeholders (${[...new Set(placeholders)].slice(0, 3).join(",")})`);
    if (txt.trim().length < 200) found.push(`only ${txt.trim().length} bytes`);
    if (/^#.*\n\s*$/m.test(txt) && txt.trim().split("\n").length < 4) found.push("heading only");
    if (!found.length) continue;
    if (ex.hit(f)) {
      exempt.push(`${f}: ${found[0]}`);
      continue;
    }
    if (placeholders.length) counted.placeholders++;
    if (txt.trim().length < 200) counted.stubs++;
    if (found.includes("heading only")) counted.headings++;
    bad.push(`${f}: ${found.join("; ")}`);
  }
  if (exempt.length) console.log(`  advisory: ${exempt.length} legacy doc(s) exempted, e.g. ${exempt.slice(0, 3).join(" | ")}`);
  if (ex.broken.length) bad.push(...ex.broken);
  console.log(`  scanned ${files.length} doc(s): ${counted.placeholders} placeholder, ${counted.stubs} stub, ${counted.headings} heading-only`);
  if (bad.length) fail(bad.join("\n"));
});
