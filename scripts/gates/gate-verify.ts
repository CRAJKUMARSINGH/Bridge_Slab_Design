#!/usr/bin/env tsx
// gate-verify — the VERIFIER-PROTOCOL W01 installs, as an executable check.
//
// W01 installs the verification apparatus: the 22 template shapes every week
// fills in, and the protocol a verifier follows. Both were prose markdown, and
// the 2026-11-19 documentation purge removed them. The instruction this week
// implements (CODE-JUNCTION/CODEX2.txt) is explicit that the deleted template
// contents must NOT be reconstructed from assumptions: "If an original template
// requirement cannot be recovered, mark it UNRESOLVED rather than silently
// defining a replacement."
//
// So this gate is the part that survives as a check rather than a document. It
// is the meta-schema for containment/VERIFY-SCHEMAS.json and the proof that the
// meta-schema works:
//
//   * it validates the registry against a machine-readable meta-schema
//     (types, enums, required keys, uniqueness, supported schema version);
//   * it asserts the registry accounts for EXACTLY the template set
//     PATH-MANIFEST.json assigns to W01 — so a template can neither be
//     forgotten nor quietly invented;
//   * it drives containment/VERIFY-FIXTURES.json: every valid fixture must be
//     accepted and every invalid fixture must be rejected, each for the rule it
//     targets — positive AND negative tests, not just a count;
//   * it asserts validation is deterministic and that no GREEN week in
//     containment/GATE-LEDGER.json is GREEN without a verifier record whose
//     evidence exists on disk.
//
// Every template in the registry is UNRESOLVED, because the template documents
// were purged with no surviving copy. That is the recorded disposition the
// instruction asks for, not a claim that the kit was recovered.
//
// 9 assertions:
//   1. the registry declares a schema version the verifier supports.
//   2. the registry is well-formed against the meta-schema.
//   3. no template identifier is duplicated.
//   4. the registry accounts for exactly the manifest's W01 template set.
//   5. every template carries an explicit disposition (DEFINED or UNRESOLVED).
//   6. every valid registry fixture is accepted.
//   7. every invalid registry fixture is rejected for the rule it targets.
//   8. validation is deterministic.
//   9. every GREEN week has a verifier record whose evidence exists.
//
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-verify: PASS|FAIL <n> assertions"
import { run, is, json, LEDGER } from "./_lib";
import { existsSync } from "node:fs";

const SCHEMAS = "containment/VERIFY-SCHEMAS.json";
const FIXTURES = "containment/VERIFY-FIXTURES.json";
const VERIFICATION = "containment/VERIFICATION.json";
const MANIFEST = "PATH-MANIFEST.json";

const STATUSES = ["DEFINED", "UNRESOLVED"];

type Field = { name?: string; type?: string };
type TemplateEntry = {
  id?: string;
  status?: string;
  purpose?: string;
  source?: string;
  required?: Field[];
  optional?: Field[];
  unresolved?: string;
};
type Registry = {
  version?: string;
  knownVersions?: string[];
  fieldTypes?: string[];
  templates?: TemplateEntry[];
};
type Fixture = { name?: string; rule?: string; value?: unknown };
type Fixtures = { registry?: { valid?: Fixture[]; invalid?: Fixture[] } };
type VerifierRecord = { verifier?: string; verifiedAt?: string; evidence?: string[] };
type VerifierLedger = { weeks?: Record<string, VerifierRecord> };

/**
 * The meta-schema. Returns a list of errors, each prefixed with the rule id it
 * violated, so a fixture can name the rule it exists to exercise and the test
 * fails when the wrong rule fires (or none does). Pure and deterministic.
 */
function validateRegistry(value: unknown, knownVersions: string[], fieldTypes: string[]): string[] {
  const errs: string[] = [];
  const add = (rule: string, msg: string) => errs.push(`${rule}: ${msg}`);

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    add("registry-shape", "the registry must be an object");
    return errs;
  }
  const r = value as Registry;

  if (typeof r.version !== "string") add("registry-shape", "version must be a string");
  else if (!knownVersions.includes(r.version))
    add("unknown-version", `schema version '${r.version}' is not supported (known: ${knownVersions.join(", ")})`);

  if (!Array.isArray(r.templates) || r.templates.length === 0) {
    add("registry-shape", "templates must be a non-empty array");
    return errs;
  }

  const seen = new Set<string>();
  r.templates.forEach((t, i) => {
    const at = `templates[${i}]`;
    if (typeof t !== "object" || t === null || Array.isArray(t)) {
      add("template-shape", `${at} must be an object`);
      return;
    }
    if (typeof t.id !== "string" || t.id.trim() === "") add("template-shape", `${at}.id must be a non-empty string`);
    else if (seen.has(t.id)) add("duplicate-id", `template id '${t.id}' is declared more than once`);
    else seen.add(t.id);

    if (typeof t.purpose !== "string" || t.purpose.trim() === "")
      add("missing-purpose", `${at}.purpose must be a non-empty string`);
    if (typeof t.source !== "string" || t.source.trim() === "")
      add("missing-source", `${at}.source must name where the requirement comes from (provenance)`);

    if (typeof t.status !== "string" || !STATUSES.includes(t.status)) {
      add("bad-status", `${at}.status must be one of ${STATUSES.join(", ")}`);
      return;
    }
    if (t.status === "DEFINED") {
      if (!Array.isArray(t.required) || t.required.length === 0)
        add("empty-required", `${at} is DEFINED but declares no required fields`);
      else
        t.required.forEach((f, j) => {
          if (typeof f?.name !== "string" || f.name.trim() === "")
            add("empty-required", `${at}.required[${j}].name must be a non-empty string`);
          if (typeof f?.type !== "string" || !fieldTypes.includes(f.type))
            add("invalid-type", `${at}.required[${j}].type '${String(f?.type)}' is not one of ${fieldTypes.join(", ")}`);
        });
    } else if (typeof t.unresolved !== "string" || t.unresolved.trim() === "") {
      add("unresolved-without-reason", `${at} is UNRESOLVED but records no reason`);
    }
  });

  return errs;
}

await run("gate-verify", 9, async () => {
  const registry: Registry = existsSync(SCHEMAS) ? await json<Registry>(SCHEMAS) : {};
  const knownVersions = registry.knownVersions ?? [];
  const fieldTypes = registry.fieldTypes ?? [];
  const validate = (v: unknown) => validateRegistry(v, knownVersions, fieldTypes);

  // 1. the registry declares a schema version the verifier supports.
  is(
    typeof registry.version === "string" && knownVersions.includes(registry.version),
    "the registry declares a supported schema version",
    `version '${String(registry.version)}'; supported: ${knownVersions.join(", ") || "(none declared)"}`,
  );

  // 2. the registry is well-formed against the meta-schema.
  const regErrors = validate(registry);
  is(regErrors.length === 0, "the registry is well-formed against the meta-schema", regErrors.slice(0, 20).join("\n"));

  // 3. no template identifier is duplicated. (The validator also catches this;
  //    asserted separately because C-06 requires the identifier rule to be
  //    visible in the gate's own output, not only inside a helper.)
  const ids = (registry.templates ?? []).map((t) => t.id).filter((x): x is string => typeof x === "string");
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  is(dupes.length === 0, "no template identifier is duplicated", `duplicated: ${dupes.join(", ")}`);

  // 4. manifest consistency: the registry accounts for exactly the W01 set.
  const manifest = existsSync(MANIFEST) ? await json<{ weeks?: Record<string, string[]> }>(MANIFEST) : {};
  const planned = new Set(
    (manifest.weeks?.W01 ?? [])
      .filter((p) => p.startsWith("docs/phase-2/_templates/"))
      .map((p) => p.replace(/^.*\//, "").replace(/\.md$/, "")),
  );
  const declared = new Set(ids);
  const missing = [...planned].filter((t) => !declared.has(t));
  const extra = [...declared].filter((t) => !planned.has(t));
  is(
    planned.size > 0 && missing.length === 0 && extra.length === 0,
    "the registry accounts for exactly the manifest's W01 template set",
    planned.size === 0
      ? `no W01 templates found in ${MANIFEST} — the comparison has nothing to check`
      : `missing: ${missing.join(", ")}; extra: ${extra.join(", ")}`,
  );

  // 5. every template carries an explicit disposition — nothing is silently absent.
  const entries = registry.templates ?? [];
  const undispositioned = entries
    .filter((t) => t.status !== "DEFINED" && t.status !== "UNRESOLVED")
    .map((t) => String(t.id));
  const defined = entries.filter((t) => t.status === "DEFINED").length;
  const unresolved = entries.filter((t) => t.status === "UNRESOLVED").length;
  console.log(`  ${entries.length} template(s): ${defined} defined, ${unresolved} unresolved`);
  is(
    undispositioned.length === 0 && defined + unresolved === entries.length,
    "every template carries an explicit disposition",
    `undispositioned: ${undispositioned.join(", ")}`,
  );

  // 6. every valid fixture is accepted.
  const fixtures: Fixtures = existsSync(FIXTURES) ? await json<Fixtures>(FIXTURES) : {};
  const validFixtures = fixtures.registry?.valid ?? [];
  const rejectedValid = validFixtures.filter((f) => validate(f.value).length > 0).map((f) => String(f.name));
  is(
    validFixtures.length > 0 && rejectedValid.length === 0,
    "every valid registry fixture is accepted",
    validFixtures.length === 0 ? `no valid fixtures declared in ${FIXTURES}` : `wrongly rejected: ${rejectedValid.join(", ")}`,
  );

  // 7. every invalid fixture is rejected — for the rule it targets.
  const invalidFixtures = fixtures.registry?.invalid ?? [];
  const misbehaved: string[] = [];
  for (const f of invalidFixtures) {
    const errs = validate(f.value);
    if (errs.length === 0) misbehaved.push(`${f.name}: accepted, but must be rejected`);
    else if (f.rule && !errs.some((e) => e.startsWith(`${f.rule}:`)))
      misbehaved.push(`${f.name}: rejected, but not for rule '${f.rule}' (got: ${errs.map((e) => e.split(":")[0]).join(", ")})`);
  }
  is(
    invalidFixtures.length > 0 && misbehaved.length === 0,
    "every invalid registry fixture is rejected for the rule it targets",
    invalidFixtures.length === 0 ? `no invalid fixtures declared in ${FIXTURES}` : misbehaved.join("\n"),
  );

  // 8. validation is deterministic.
  is(
    JSON.stringify(validate(registry)) === JSON.stringify(validate(registry)),
    "validation is deterministic",
    "two runs of the validator over the same input disagreed",
  );

  // 9. evidence provenance: a GREEN week must be backed by evidence on disk.
  const verifier: VerifierLedger = existsSync(VERIFICATION) ? await json<VerifierLedger>(VERIFICATION) : {};
  const ledger = existsSync(LEDGER) ? await json<Record<string, string>>(LEDGER) : {};
  const broken: string[] = [];
  for (const [week, rec] of Object.entries(verifier.weeks ?? {})) {
    if (!rec?.verifier || !rec?.verifiedAt || !Array.isArray(rec.evidence) || rec.evidence.length === 0) {
      broken.push(`${week}: incomplete record (needs verifier, verifiedAt and at least one evidence path)`);
      continue;
    }
    for (const e of rec.evidence) if (!existsSync(e)) broken.push(`${week}: evidence missing on disk: ${e}`);
  }
  for (const [week, status] of Object.entries(ledger))
    if (status === "GREEN" && !verifier.weeks?.[week])
      broken.push(`${week}: GREEN in ${LEDGER} with no verifier record`);
  is(broken.length === 0, "every GREEN week has a verifier record whose evidence exists", broken.join("\n"));
});
