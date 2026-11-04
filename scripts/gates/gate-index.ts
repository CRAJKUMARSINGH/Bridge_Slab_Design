#!/usr/bin/env tsx
// gate-index — the two indexes this repository is trusted through: the claim
// index (containment/claims.json) and the git index.
//
// The claim half is the original gate: every adjudicated claim about the tree
// has the fields a reader needs, and no claim is allowed to sit UNADJ longer
// than one review cycle without someone deciding.
//
// The git half is the one that was missing, and it is the one that hurts. Every
// other gate in this directory — including preflight — reads the WORKING TREE.
// None of them can see the git index. So the harness stayed green through a
// state where 341 tracked files had been removed from the worktree and the
// deletions were never staged, and through the inverse: a path the index
// believed was deleted while the file was still sitting on disk, which is the
// signature the isolated-index enrichment commits (`GIT_INDEX_FILE=.git/enrich.idx`)
// leave behind. A `git commit -a` in either state destroys work that no gate
// would have objected to.
//
// 4 assertions:
//   1. every claim in containment/claims.json has id, claim and status.
//   2. no UNADJ claim is older than 7 days.
//   3. the index carries no phantom deletion — no path staged as deleted whose
//      file is still present in the worktree. This state has no legitimate
//      producer; it is index corruption.
//   4. every file a package.json script points at is TRACKED BY GIT, not merely
//      present in this checkout.
//
// Assertion 4 is the exact dual of the defect assertion 3 catches, and it is the
// ninth hole in the harness. Assertion 3 is about the index disagreeing with the
// disk; assertion 4 is about the disk agreeing with itself while git carries
// nothing. Every gate in this directory, and gate-scripts' own "every file a
// script points at exists", reads the WORKING TREE — so a script target that
// exists here and nowhere else satisfies all of them and breaks `pnpm run check`
// on a fresh clone with no gate objecting. That is how the 15 scripts/gates/*.mjs
// files were found missing in 56af5b3: by hand, not by a check. Assertion 4 makes
// the class falsifiable instead of rediscovered.
//
// Two counts are printed as advisories because they are findings a human must
// decide on, not invariants a gate can fail: staged deletions that a commit
// would carry out, and tracked files that are absent from the worktree.
//
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-index: PASS|FAIL <n> assertions"
import { run, is, json, read } from "./_lib";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const CLAIMS = "containment/claims.json";
const MAX_UNADJ_DAYS = 7;

type Claim = { id?: string; claim?: string; status?: string; adjudicatedAt?: string; createdAt?: string };

await run("gate-index", 4, async () => {
  // ── the claim index ──────────────────────────────────────────────────────
  const claims: Claim[] = existsSync(CLAIMS) ? await json<Claim[]>(CLAIMS) : [];
  if (!existsSync(CLAIMS))
    console.log(`  ${CLAIMS} not present — the claim half of this gate is vacuous`);

  const missing = claims.filter((c) => !c.id || !c.claim || !c.status).map((c) => c.id ?? "(no id)");
  is(
    existsSync(CLAIMS) && Array.isArray(claims) && missing.length === 0,
    "every claim has id, claim and status",
    !existsSync(CLAIMS) ? `${CLAIMS} not found` : `missing fields on: ${missing.join(", ")}`,
  );

  const now = Date.now();
  const stale = claims.filter((c) => {
    if (c.status !== "UNADJ") return false;
    const at = c.adjudicatedAt ?? c.createdAt;
    if (!at) return false; // undated: one review cycle of grace, per the original gate
    return (now - new Date(at).getTime()) / 86_400_000 > MAX_UNADJ_DAYS;
  });
  is(
    stale.length === 0,
    "no UNADJ claim is older than 7 days",
    stale.map((c) => `${c.id}: UNADJ since ${c.adjudicatedAt ?? c.createdAt}`).join("; "),
  );

  // ── the git index ────────────────────────────────────────────────────────
  let entries: string[] = [];
  try {
    entries = execFileSync("git", ["status", "--porcelain", "-z"], { encoding: "utf8" })
      .split("\0")
      .filter(Boolean);
  } catch (e) {
    is(false, "git status is readable", `git status failed: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }

  const path = (e: string) => e.slice(3);
  const stagedDeletions = entries.filter((e) => e[0] === "D").map(path);
  const worktreeDeletions = entries.filter((e) => e[1] === "D").map(path);
  const phantoms = stagedDeletions.filter((p) => existsSync(p));

  is(
    phantoms.length === 0,
    "the index carries no phantom deletion",
    `staged as deleted but still present on disk (index corruption — the isolated-index ` +
      `enrichment signature):\n${phantoms.slice(0, 20).join("\n")}`,
  );

  if (stagedDeletions.length)
    console.log(
      `  ADVISORY  ${stagedDeletions.length} staged deletion(s) — a commit would carry them out: ` +
        stagedDeletions.slice(0, 5).join(", "),
    );
  if (worktreeDeletions.length)
    console.log(
      `  ADVISORY  ${worktreeDeletions.length} tracked file(s) absent from the worktree and NOT staged ` +
        `— "git commit -a" or "git add -A" would sweep them into the next commit unreviewed.`,
    );

  // ── the referenced files git is asked to carry ───────────────────────────
  // Present is not the same as tracked. Assertion 3 catches an index that
  // disagrees with the disk; this catches a disk that agrees with itself while
  // git carries nothing — a script target that exists only in this checkout.
  // `pnpm run check` (CI) runs scripts/lint-pdf-glyph-encodability.ts, and a
  // fresh clone does not have it, because nothing ever committed it.
  let tracked = new Set<string>();
  try {
    tracked = new Set(
      execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
        .split("\0")
        .filter(Boolean)
        .map((p) => p.replace(/\\/g, "/")),
    );
  } catch (e) {
    is(false, "git ls-files is readable", `git ls-files failed: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }

  // The workspace manifests whose `tsx`/`node` targets CI executes.
  const MANIFESTS = ["package.json", "scripts/package.json"];
  const TARGET = /^(?:tsx|node|ts-node)\s+([^\s"']+)/;
  const untracked: string[] = [];
  for (const mf of MANIFESTS) {
    if (!existsSync(mf)) continue;
    const dir = mf.includes("/") ? mf.slice(0, mf.lastIndexOf("/")) : "";
    const pkg = JSON.parse(await read(mf)) as { scripts?: Record<string, string> };
    for (const [name, cmd] of Object.entries(pkg.scripts ?? {}))
      for (const part of String(cmd).split(/&&|;/)) {
        const m = TARGET.exec(part.trim());
        if (!m) continue;
        let file = m[1].replace(/^"|"$/g, "");
        if (file.includes("$") || file.includes("*")) continue;
        if (file.startsWith("./")) file = file.slice(2);
        const full = dir ? `${dir}/${file}` : file;
        if (!tracked.has(full)) untracked.push(`${mf}: ${name} -> ${full}`);
      }
  }

  is(
    untracked.length === 0,
    "every file a package.json script points at is tracked by git",
    "present in this checkout but carried by no commit — a fresh clone runs these and fails:\n" +
      untracked.join("\n"),
  );
});
