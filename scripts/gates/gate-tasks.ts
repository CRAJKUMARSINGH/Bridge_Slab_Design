#!/usr/bin/env tsx
// gate-tasks — the anti-OK gate.
// 3 assertions: no task may be closed without declaring the artefact it produces,
// no task may be closed without saying whether a machine can check it (MACHINE)
// or a person must (MANUAL + a written reason), and the task corpus is not
// silently empty. The third exists because the first two are vacuous when the
// corpus is gone: `walk()` returns [] for a tree that is not there, both per-task
// checks have nothing to run on, and the gate reports PASS having read nothing.
// That is the defect gate-vacuity guards one level down — a check that cannot
// fail. An empty corpus is legitimate only when it is DECLARED, owned and
// explained in containment/VACUITY.json (the documentation purge of 2026-11-19),
// so that a corpus which disappears by accident fails here instead of quietly.
import { run, is, walk, read, pendingFor, declaredEmpty } from "./_lib";

const DOC_ROOT = "docs/phase-2";
const TASK = /^\s*-?\s*(T\d+[A-Z]?\.\d+)\s+(.*)$/;
const PATH_TOKEN = /(?:^|\s|`)([A-Za-z0-9_./@-]+\.(?:ts|tsx|md|json|sql|ya?ml|xlsx|dxf))/;

await run("gate-tasks", 3, async () => {
  const files = (await walk(DOC_ROOT, /AGENT-INSTRUCTIONS\.md$/)).sort();
  const ex = await pendingFor("gate-tasks");
  const emp = await declaredEmpty();
  const emptyDeclared = files.length === 0 && emp.hit(DOC_ROOT);
  if (emptyDeclared)
    console.log(`  advisory: ${DOC_ROOT} is declared empty in containment/VACUITY.json — this gate has no task to examine`);
  const noPath: string[] = [];
  const noMarker: string[] = [];
  let tasks = 0;
  let exemptedFiles = 0;
  for (const f of files) {
    if (ex.hit(f)) {
      exemptedFiles++;
      continue;
    }
    const txt = await read(f);
    // A task is a block, not a line: a task whose declaration wraps is still a
    // task that must declare its artefact. The block ends at the first blank line
    // or heading, so a later paragraph cannot satisfy an earlier task.
    const blocks: { id: string; body: string }[] = [];
    let cur: { id: string; body: string } | null = null;
    for (const line of txt.split("\n")) {
      const m = TASK.exec(line);
      if (m) {
        cur = { id: m[1], body: m[2] };
        blocks.push(cur);
        continue;
      }
      if (!cur) continue;
      if (!line.trim() || line.startsWith("#")) cur = null;
      else cur.body += " " + line.trim();
    }
    for (const { id, body } of blocks) {
      tasks++;
      if (!PATH_TOKEN.test(body)) noPath.push(`${f} ${id}: no output path`);
      // The marker is the leading token of the task, not any occurrence of the
      // word: a task whose text *quotes* `MACHINE|MANUAL` is still a task with a
      // marker of its own.
      const marker = /^\s*(MACHINE|MANUAL)\b/.exec(body)?.[1];
      if (!marker) noMarker.push(`${f} ${id}: not marked MACHINE|MANUAL`);
      else if (marker === "MANUAL" && !/MANUAL because|reason:/i.test(body))
        noMarker.push(`${f} ${id}: MANUAL without a written reason`);
    }
  }
  if (exemptedFiles) console.log(`  advisory: ${exemptedFiles} legacy instruction file(s) exempted (PR-03)`);
  console.log(`  checked ${tasks} task line(s) across ${files.length - exemptedFiles} file(s)`);
  is(noPath.length === 0, "every closed task declares the artefact it produces", noPath.join("\n"));
  // A malformed exemption entry — one with no owner, no closing week, no reason,
  // or a closing week that has already gone GREEN — is itself a failure, and it is
  // why this gate consults containment/PENDING-RESOLUTIONS.json at all.
  is(
    noMarker.length === 0 && ex.broken.length === 0,
    "every closed task is marked MACHINE|MANUAL, and every exemption is well-formed",
    [...noMarker, ...ex.broken].join("\n"),
  );
  // The emptiness check. Without it the two assertions above are satisfied by
  // reading nothing, which is the one failure mode this gate must not have.
  const vacuity = [
    ...(files.length === 0 && !emptyDeclared
      ? [
          `${DOC_ROOT} holds no AGENT-INSTRUCTIONS.md and is not declared empty in containment/VACUITY.json — every assertion above passed without reading a single task`,
        ]
      : []),
    ...emp.broken,
  ];
  is(vacuity.length === 0, "the task corpus is non-empty, or its emptiness is declared", vacuity.join("\n"));
});
