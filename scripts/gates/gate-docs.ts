#!/usr/bin/env tsx
// gate-docs — the anti-empty-file gate.
// 4 assertions: no `{{PLACEHOLDER}}` survives, no file under the doc root is a
// heading with nothing under it, no file is a stub, and the doc root is not
// empty unless containment/VACUITY.json declares it so. Scope is the *live*
// instruction corpus (docs/phase-2); legacy Set-1 files are exempted by
// containment/PENDING-RESOLUTIONS.json (PR-04) and printed as advisories.
//
// The fourth assertion exists because the first three are vacuous when the
// corpus is empty: `walk()` returns [] for a tree that is not there, every
// per-file check has nothing to run on, and the gate reports PASS having read
// nothing at all. That is the defect gate-vacuity guards one level down — a
// check that cannot fail. An empty corpus is not itself wrong; a deliberately
// purged tree is a legitimate state. It must be DECLARED, owned and explained in
// containment/VACUITY.json, so that a corpus which disappears by accident fails
// here instead of passing quietly.
import { run, is, walk, read, pendingFor, declaredEmpty } from "./_lib";

const DOC_ROOT = "docs/phase-2";

await run("gate-docs", 4, async () => {
  const files = (await walk(DOC_ROOT, /\.md$/)).sort();
  const ex = await pendingFor("gate-docs");
  const emp = await declaredEmpty();
  const emptyDeclared = files.length === 0 && emp.hit(DOC_ROOT);
  if (emptyDeclared)
    console.log(`  advisory: ${DOC_ROOT} is declared empty in containment/VACUITY.json — this gate has no document to examine`);
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
  // The emptiness check. Without it the three assertions above are satisfied by
  // reading nothing, which is the one failure mode this gate must not have.
  const vacuity = [
    ...(files.length === 0 && !emptyDeclared
      ? [`${DOC_ROOT} holds no document and is not declared empty in containment/VACUITY.json — every assertion above passed without reading a single file`]
      : []),
    ...emp.broken,
  ];
  is(vacuity.length === 0, "the doc corpus is non-empty, or its emptiness is declared", vacuity.join("\n"));
});
