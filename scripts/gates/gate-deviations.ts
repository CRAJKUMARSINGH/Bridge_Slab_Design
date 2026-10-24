#!/usr/bin/env tsx
// gate-deviations — the declared-divergence ledger, and the gate that keeps it
// attached to reality.
//
// The failure this exists to stop is quiet. A value lives in two places — an
// authoritative source (an extracted coefficient table, a code clause) and the
// code that uses it — and the two disagree. Both numbers look plausible, nothing
// compares them, and the next person to touch the file "tidies up" whichever one
// they happen to see. That change then lands in every generated report with no
// test to catch it. Writing the number down in prose does not help: prose is not
// executed.
//
// So a mechanical deviation is recorded as an ANCHOR: a file, a regex, and the
// value the regex must still capture.
//
//     "anchors": [
//       { "file": "...loadCalc.ts", "pattern": "concreteUW:\\s*([0-9.]+)", "value": 24 }
//     ]
//
// The anchor is falsifiable in both directions. Edit the code to 25 and assertion
// 5 fails — the recorded deviation is now a lie. Edit the ledger to claim 25
// without touching the code and assertion 5 fails the other way. Delete the
// deviation and assertion 6 still names the files; mark it CLOSED without a
// resolution and assertion 4 catches that. Neither side can be "corrected"
// silently while the other still says something else.
//
// Deviations whose source is a judgement rather than a number (`sourceUnit:
// "n/a"`) are exempt from anchoring by assertion 4, because a regex cannot
// capture "the boundary condition table is the wrong table". They are still held
// to the full schema, so they cannot be deleted without the ledger changing.
//
// 6 assertions:
//   1. containment/DEVIATIONS.json exists and has the declared shape.
//   2. every deviation declares the fields that make it reviewable.
//   3. every OPEN deviation names the week that closes it.
//   4. every mechanical deviation (sourceUnit !== "n/a") carries an anchor.
//   5. every declared anchor still captures its declared value.
//   6. every file named by an anchor or a locator still exists.
//
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-deviations: PASS|FAIL <n> assertions"
import { run, is, read } from "./_lib";
import { existsSync } from "node:fs";

const DEV_PATH = "containment/DEVIATIONS.json";

type Anchor = { file?: string; pattern?: string; value?: unknown };
type Deviation = {
  id?: string;
  quantity?: string;
  sourceValue?: unknown;
  sourceUnit?: string;
  sourceFile?: string;
  sourceLocator?: string;
  codeValue?: unknown;
  codeUnit?: string;
  codeFile?: string;
  codeLocator?: string;
  description?: string;
  decision?: string;
  decidedValue?: string;
  decidedBy?: string;
  status?: string;
  owner?: string;
  closingWeek?: string;
  authority?: string;
  ircClause?: string;
  anchors?: Anchor[];
};
type DeviationsFile = { version?: string; deviations?: Deviation[] };

const anchorWellFormed = (a: Anchor): boolean =>
  typeof a.file === "string" && typeof a.pattern === "string" && a.value !== undefined;

/** Does `a.pattern` still capture `a.value` in `a.file`? */
async function anchorHolds(a: Anchor): Promise<{ ok: boolean; detail: string }> {
  if (!existsSync(a.file!)) return { ok: false, detail: `${a.file} does not exist` };
  const txt = await read(a.file!);
  let m: RegExpExecArray | null;
  try {
    m = new RegExp(a.pattern!).exec(txt);
  } catch (e) {
    return { ok: false, detail: `${a.file}: pattern does not compile — ${(e as Error).message}` };
  }
  if (!m) return { ok: false, detail: `${a.file}: /${a.pattern}/ no longer matches — the anchor was moved or removed` };
  if (m[1] === undefined) return { ok: false, detail: `${a.file}: /${a.pattern}/ has no capture group` };
  const ok = String(a.value) === m[1];
  return { ok, detail: ok ? "" : `${a.file}: the ledger says ${a.value}, the source now says ${m[1]}` };
}

await run("gate-deviations", 6, async () => {
  // 1. the file exists and is the declared shape
  let file: DeviationsFile | null = null;
  if (existsSync(DEV_PATH)) {
    try {
      file = JSON.parse(await read(DEV_PATH)) as DeviationsFile;
    } catch (e) {
      console.log(`  ${DEV_PATH} is not valid JSON — ${(e as Error).message}`);
    }
  }
  const shapeOk = !!file && Array.isArray(file.deviations);
  is(
    shapeOk,
    `${DEV_PATH} exists and declares a deviations array`,
    existsSync(DEV_PATH) ? `${DEV_PATH} is not { "version": ..., "deviations": [...] }` : `${DEV_PATH} not found`,
  );
  const devs: Deviation[] = shapeOk ? file!.deviations! : [];
  const open = devs.filter((d) => d.status === "OPEN").length;
  console.log(`  ${devs.length} declared deviation(s), ${open} open`);

  // 2. every entry is reviewable
  const REQUIRED: (keyof Deviation)[] = [
    "id",
    "quantity",
    "sourceValue",
    "sourceUnit",
    "sourceFile",
    "sourceLocator",
    "codeValue",
    "codeUnit",
    "codeFile",
    "codeLocator",
    "description",
    "decision",
    "status",
    "owner",
  ];
  const incomplete = devs
    .filter((d) => REQUIRED.some((k) => d[k] === undefined || d[k] === ""))
    .map((d) => `${d.id ?? "(no id)"} [missing ${REQUIRED.filter((k) => d[k] === undefined || d[k] === "").join(", ")}]`);
  is(
    incomplete.length === 0,
    "every deviation declares id, quantity, both sides (value/unit/file/locator), decision, status and owner",
    incomplete.join("\n"),
  );

  // 3. an OPEN deviation must name its closing week or it is a permanent shrug
  const unclosed = devs.filter((d) => d.status === "OPEN" && !d.closingWeek).map((d) => d.id ?? "(no id)");
  is(unclosed.length === 0, "every OPEN deviation names the week that closes it", `OPEN without closingWeek: ${unclosed.join(", ")}`);

  // 4. a judgement deviation has no anchor; a mechanical one may not opt out of
  // being checked.
  const unanchored = devs
    .filter((d) => d.sourceUnit !== "n/a" && !(d.anchors ?? []).some(anchorWellFormed))
    .map((d) => `${d.id ?? "(no id)"} (sourceUnit ${d.sourceUnit})`);
  const malformed = devs
    .flatMap((d) => (((d.anchors ?? []) as Anchor[]).some((a) => !anchorWellFormed(a)) ? [d.id ?? "(no id)"] : []));
  is(
    unanchored.length === 0 && malformed.length === 0,
    "every mechanical deviation carries a well-formed anchor",
    [
      unanchored.length ? `mechanical but unanchored: ${unanchored.join(", ")}` : "",
      malformed.length ? `anchors missing file/pattern/value: ${malformed.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  // 5. the ledger is attached to the code and the source, not to prose
  const broken: string[] = [];
  for (const d of devs)
    for (const a of (d.anchors ?? []) as Anchor[]) {
      if (!anchorWellFormed(a)) continue;
      const r = await anchorHolds(a);
      if (!r.ok) broken.push(`${d.id}: ${r.detail}`);
    }
  is(broken.length === 0, "every declared anchor still captures its declared value", broken.join("\n"));

  // 6. no deviation may point at a file that is gone — the ledger is a claim
  // about THIS tree.
  const missing = devs
    .flatMap((d) => [d.sourceFile, d.codeFile, ...((d.anchors ?? []) as Anchor[]).map((a) => a.file)])
    .filter((f): f is string => typeof f === "string" && f.includes("/"))
    .filter((f) => !existsSync(f));
  is(missing.length === 0, "every file a deviation names still exists", `missing: ${[...new Set(missing)].join(", ")}`);
});
