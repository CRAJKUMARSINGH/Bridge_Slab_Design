#!/usr/bin/env tsx
// gate-docs — the anti-empty-file gate.
// 3 assertions: no `{{PLACEHOLDER}}` survives, no file under the doc root is a
// heading with nothing under it, no file is a stub. Scope is the *live*
// instruction corpus (docs/phase-2); legacy Set-1 files are exempted by
// containment/PENDING-RESOLUTIONS.json (PR-04) and printed as advisories.
import { run, is, walk, read, pendingFor } from "./_lib";

await run("gate-docs", 3, async () => {
  const files = (await walk("docs/phase-2", /\.md$/)).sort();
  const ex = await pendingFor("gate-docs");
  const byPlaceholder: string[] = [];
  const byStub: string[] = [];
  const byHeading: string[] = [];
  const exempt: string[] = [];
  for (const f of files) {
    const txt = await read(f);
    const found: string[] = [];
    const placeholders = [...txt.matchAll(/\{\{[A-Z0-9_]+\}\}/g)].map((m) => m[0]);
    const stub = txt.trim().length < 200;
    const heading = /^#.*\n\s*$/m.test(txt) && txt.trim().split("\n").length < 4;
    if (placeholders.length)
      found.push(`${placeholders.length} placeholders (${[...new Set(placeholders)].slice(0, 3).join(",")})`);
    if (stub) found.push(`only ${txt.trim().length} bytes`);
    if (heading) found.push("heading only");
    if (!found.length) continue;
    if (ex.hit(f)) {
      exempt.push(`${f}: ${found[0]}`);
      continue;
    }
    const line = `${f}: ${found.join("; ")}`;
    if (placeholders.length) byPlaceholder.push(line);
    if (stub) byStub.push(line);
    if (heading) byHeading.push(line);
  }
  if (exempt.length) console.log(`  advisory: ${exempt.length} legacy doc(s) exempted, e.g. ${exempt.slice(0, 3).join(" | ")}`);
  console.log(
    `  scanned ${files.length} doc(s): ${byPlaceholder.length} placeholder, ${byStub.length} stub, ${byHeading.length} heading-only`,
  );
  // A malformed exemption entry is itself a failure, so it rides on the first
  // assertion rather than becoming a fourth one.
  is(
    byPlaceholder.length === 0 && ex.broken.length === 0,
    "no placeholder token survives, and every exemption is well-formed",
    [...byPlaceholder, ...ex.broken].join("\n"),
  );
  is(byStub.length === 0, "no doc is a stub", byStub.join("\n"));
  is(byHeading.length === 0, "no doc is a heading with nothing under it", byHeading.join("\n"));
});
