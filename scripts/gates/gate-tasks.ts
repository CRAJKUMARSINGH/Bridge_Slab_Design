#!/usr/bin/env tsx
// gate-tasks — the anti-OK gate.
// 2 assertions: no task may be closed without declaring the artefact it produces,
// and no task may be closed without saying whether a machine can check it
// (MACHINE) or a person must (MANUAL + a written reason).
import { run, walk, read, fail, pendingFor } from "./_lib";

const TASK = /^\s*-?\s*(T\d+[A-Z]?\.\d+)\s+(.*)$/;
const PATH_TOKEN = /(?:^|\s|`)([A-Za-z0-9_./@-]+\.(?:ts|tsx|md|json|sql|ya?ml|xlsx|dxf))/;

await run("gate-tasks", 2, async () => {
  const files = (await walk("docs/phase-2", /AGENT-INSTRUCTIONS\.md$/)).sort();
  const ex = await pendingFor("gate-tasks");
  const problems: string[] = [];
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
      if (!PATH_TOKEN.test(body)) problems.push(`${f} ${id}: no output path`);
      // The marker is the leading token of the task, not any occurrence of the
      // word: a task whose text *quotes* `MACHINE|MANUAL` is still a task with a
      // marker of its own.
      const marker = /^\s*(MACHINE|MANUAL)\b/.exec(body)?.[1];
      if (!marker) problems.push(`${f} ${id}: not marked MACHINE|MANUAL`);
      else if (marker === "MANUAL" && !/MANUAL because|reason:/i.test(body))
        problems.push(`${f} ${id}: MANUAL without a written reason`);
    }
  }
  if (exemptedFiles) console.log(`  advisory: ${exemptedFiles} legacy instruction file(s) exempted (PR-03)`);
  if (ex.broken.length) problems.push(...ex.broken);
  console.log(`  checked ${tasks} task line(s) across ${files.length - exemptedFiles} file(s)`);
  if (problems.length) fail(problems.join("\n"));
});
