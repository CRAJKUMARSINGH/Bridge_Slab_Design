// scripts/gates/_lib.ts — the gate harness every gate in this directory shares.
//
// CONTRACT (unchanged):  exit 0 = PASS, 1 = FAIL, 2 = NOT IMPLEMENTED
//                        last stdout line = "GATE <name>: PASS|FAIL <n> assertions"
//                        writes scripts/gates/.out/<name>.json
//
// Adaptations to this repository (2026-10-23), all additive:
//
//   1. `.out/<name>.json` uses the sanitized name because `:` is illegal in a
//      Windows path (`gate:deps` -> `gate-deps.json`). The stdout line keeps the
//      gate name as declared.
//   2. The gate name is the file basename (`gate-deps`), so `.out/<name>.json`,
//      `.pills.json` keys and `scripts/gates/<name>.ts` all agree. The npm script
//      names remain `gate:deps` etc.
//   3. `run()` records `greenAt` in `.proven.json` on every green run, so the
//      "RED then GREEN" pair required by `gate-proven-red` closes itself: RED is
//      written by `gate-prove`, GREEN by ordinary execution.
//   4. `walk()` returns POSIX-style forward-slash paths on every platform, so
//      the glob matching in ARTIFACT-TIERS.json is platform independent.
//   5. `globToRe()` implements `**` and `*` in one pass. The reference version
//      rewrote `**` to `.*` and then let the `*` substitution eat the `*` it had
//      just inserted.
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

export const OUT = "scripts/gates/.out";
export const PROVEN = "scripts/gates/.proven.json";
export const LEDGER = "containment/GATE-LEDGER.json";
export const TIERS = "containment/ARTIFACT-TIERS.json";
export const PENDING = "containment/PENDING-RESOLUTIONS.json";

export class GateFail extends Error {}
export const fail = (msg: string): never => {
  throw new GateFail(msg);
};

export async function run(name: string, assertions: number, body: () => Promise<void>) {
  await mkdir(OUT, { recursive: true });
  let ok = true;
  let detail = "";
  try {
    await body();
  } catch (e: unknown) {
    ok = false;
    detail = e instanceof Error ? e.message || String(e) : String(e);
  }
  await writeFile(
    `${OUT}/${name}.json`,
    JSON.stringify(
      {
        name,
        ts: new Date().toISOString(),
        commit: process.env.GITHUB_SHA ?? "local",
        pass: ok,
        assertions,
        detail,
      },
      null,
      2,
    ),
  );
  if (ok) await markGreen(name);
  console.log(`GATE ${name}: ${ok ? "PASS" : "FAIL"} ${assertions} assertions`);
  if (!ok) console.log("  " + detail.split("\n").join("\n  "));
  process.exit(ok ? 0 : 1);
}

/** A gate is only real once it has been observed GREEN as well as RED. */
async function markGreen(name: string) {
  try {
    const proven: Record<string, Record<string, unknown>> = existsSync(PROVEN)
      ? JSON.parse(await readFile(PROVEN, "utf8"))
      : {};
    proven[name] = { ...(proven[name] ?? {}), greenAt: new Date().toISOString() };
    await writeFile(PROVEN, JSON.stringify(proven, null, 2));
  } catch {
    /* .proven.json is bookkeeping; never let it fail a green gate */
  }
}

/**
 * Trees that are not part of the product: vendor drop, scratch, local stores and
 * build output. Walking them would either be pointless (a gate has no business
 * reading node_modules) or actively wrong (`gate-deps` would treat every package
 * inside `.pnpm-store-local` as "declared" and then fail its own shrink-only
 * assertion). Declared once, here, so every gate prunes the same set.
 */
const SKIP_SEGMENTS = new Set([
  "node_modules",
  "dist",
  "archive",
  "merge-refs",
  "tmp",
  "_tmp_",
  "VENICE-REFERENCES",
  "Attached_Assets",
  "assets",
  ".git",
  ".trae",
  ".local",
  ".pnpm-store-local",
]);

export const isSkippedPath = (p: string): boolean =>
  p.replace(/\\/g, "/").split("/").some((s) => SKIP_SEGMENTS.has(s));

/**
 * Walk `dir`, pruned. The reference used `readdir(..., { recursive: true })`,
 * which enumerates node_modules in full before any filter can reject it; a real
 * recursive walk can decline to descend instead.
 */
export async function walk(
  dir: string,
  re = /\.(ts|tsx|mjs|js|md|json)$/,
  skip: (p: string) => boolean = isSkippedPath,
): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  const stack = [dir.replace(/\\/g, "/").replace(/\/$/, "")];
  while (stack.length) {
    const cur = stack.pop()!;
    let entries;
    try {
      entries = await readdir(cur, { withFileTypes: true });
    } catch {
      continue; // unreadable directory is not a gate finding
    }
    for (const e of entries) {
      const p = `${cur}/${e.name}`;
      if (skip(p)) continue;
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && re.test(e.name)) out.push(p.replace(/^\.\//, ""));
    }
  }
  return out;
}

/**
 * The real gate set: every `.ts` file in this directory that speaks the gate
 * contract. `_lib.ts` is the harness, `preflight.ts` is the raw 15-assertion
 * script (it is not a `run()` gate and cannot poison itself without recursing).
 */
export async function gateFiles(): Promise<string[]> {
  return (await walk("scripts/gates", /\.ts$/))
    .filter((f) => !f.includes("/_lib.ts") && !f.endsWith("/preflight.ts"))
    .sort();
}

export function gateName(file: string): string {
  return file.replace(/\\/g, "/").split("/").pop()!.replace(/\.ts$/, "");
}

export const read = (p: string) => readFile(p, "utf8");
export const json = async <T>(p: string): Promise<T> => JSON.parse(await readFile(p, "utf8")) as T;

/**
 * Glob -> RegExp. `**` crosses `/`, `*` does not, and `[...]` is a real
 * character class (`[0-9]`, `[!0-9]`). The class matters: the PENDING-RESOLUTIONS
 * week patterns are written as `week-0[1-9]` precisely so that the legacy weeks
 * are exempted while `week-00` — the one week under enforcement — is not.
 */
export function globToRe(glob: string): RegExp {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        out += ".*";
        i++;
      } else out += "[^/]*";
    } else if (c === "[") {
      let cls = "[";
      let j = i + 1;
      if (glob[j] === "!" || glob[j] === "^") {
        cls += "^";
        j++;
      }
      while (j < glob.length && glob[j] !== "]") cls += glob[j++];
      if (j < glob.length) {
        out += cls + "]";
        i = j;
      } else out += "\\[";
    } else if ("\\^$+.()|{}[]?".includes(c)) out += "\\" + c;
    else out += c;
  }
  return new RegExp("^" + out + "$");
}

export type TierRule = { glob: string; tier: number; trust?: string };
export type TierMap = { ignored?: string[]; artifacts: TierRule[] };

export function tierOf(p: string, map: TierMap): number | null {
  const path = p.replace(/\\/g, "/");
  for (const a of map.artifacts) if (globToRe(a.glob).test(path)) return a.tier;
  return null;
}

export function isIgnored(p: string, map: TierMap): boolean {
  const path = p.replace(/\\/g, "/");
  return (map.ignored ?? []).some((d) => path === d || path.startsWith(d.replace(/\/$/, "") + "/"));
}

export type PendingEntry = {
  id: string;
  assertion: string;
  patterns: string[];
  owner?: string;
  closingWeek?: string;
  reason?: string;
};
export type PendingFile = { entries?: PendingEntry[] };

/**
 * Is `path` exempt from `assertion` by a recorded, owned, expiring exception?
 * An entry that is missing owner/closingWeek/reason is itself a failure, and so
 * is an entry whose closing week has already gone GREEN — an exemption may not
 * outlive the fix it was granted for.
 */
export async function pendingFor(assertion: string): Promise<{ hit: (p: string) => boolean; broken: string[] }> {
  const broken: string[] = [];
  if (!existsSync(PENDING)) return { hit: () => false, broken };
  const file = await json<PendingFile>(PENDING);
  const entries: PendingEntry[] = [];
  for (const e of file.entries ?? []) {
    const problems: string[] = [];
    if (!e.owner) problems.push("no owner");
    if (!e.closingWeek) problems.push("no closingWeek");
    if (!e.reason) problems.push("no reason");
    if (existsSync(LEDGER)) {
      const ledger = await json<Record<string, string>>(LEDGER);
      if (e.closingWeek && ledger[e.closingWeek] === "GREEN")
        problems.push(`closing recall — ${e.closingWeek} is GREEN`);
    }
    if (problems.length) broken.push(`${e.id}: ${problems.join(", ")}`);
    else entries.push(e);
  }
  const mine = entries.filter((e) => e.assertion === assertion);
  return {
    hit: (p: string) => mine.some((e) => e.patterns.some((g) => globToRe(g).test(p.replace(/\\/g, "/")))),
    broken,
  };
}
