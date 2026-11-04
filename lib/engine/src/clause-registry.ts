/**
 * Clause registry — the single source of truth for every IRC/IS clause the
 * W02 engine package (`lib/engine/src`) cites.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `contracts.ts` already promised it: "verify:clauses fails if any codeRef is
 * unregistered." Until W03 (T3.1) that promise had no registry behind it. Every
 * clause citation in the engine lived in prose comments — "IRC:6 Cl.208",
 * "IS 456:2000 Table 21" — where nothing could check it.
 *
 * This file turns those citations into data, and `scripts/gates/verify-clauses.mjs`
 * turns the data into two falsifiable assertions:
 *
 *   A. NO ORPHAN CITATION. Every clause citation token found anywhere under
 *      `lib/engine/src` must resolve to an entry here. Adding a `IS:<number>`
 *      citation to a comment without registering it turns the gate RED, naming
 *      the file and the token. (That last sentence is deliberately written so
 *      it does not itself contain a scannable token — this file is scanned.)
 *   B. EVERY CITED CLAUSE HAS AN IMPLEMENTING TEST. Each entry names the module
 *      that implements it, the verbatim citation strings that reference it, and
 *      the test file that exercises it. The gate asserts the module exists and
 *      carries the citation, and that the test file names the clause as
 *      `[<id>]`.
 *
 * SCOPE, STATED HONESTLY. The scan root is `lib/engine/src` — the package the
 * `CheckResult.codeRef` contract lives in. It deliberately does NOT scan
 * `bridge-excel-generator/**` (the ADR-0013-locked `authoritativeEngine`) or
 * `client/src/report-engine/lib/**` (the parity source). Those are separate,
 * byte-locked/parity surfaces owned by `gate:contracts` and `gate:parity`; a
 * W03 clause gate has no business rewriting their comments. The residual is
 * recorded in docs/phase-2/week-03/CLAUSE-COVERAGE.md rather than hidden.
 *
 * NO ENGINEERING VALUES LIVE HERE. The strings below are citations that already
 * exist in the code, copied verbatim; the titles are the clause names as the
 * engine itself paraphrases them. Nothing in this file may become a source of
 * a design value.
 */

/** One cited clause, its implementing surface, and the test that exercises it. */
export type ClauseEntry = {
  /** Stable id. Also the token the test file must name as `[<id>]`. */
  id: string;
  /** The standard + edition family the id belongs to. */
  standard: string;
  /** What the engine uses this clause for, as the engine's own comments state it. */
  title: string;
  /** Editions observed in the engine's citations (D-12 reads this). */
  editions: string[];
  /** Repo-relative POSIX paths of the engine modules that cite/implement it. */
  modules: string[];
  /** Exported symbols that carry the clause. */
  symbols: string[];
  /** Citation strings, VERBATIM, as they appear in `modules`. */
  citations: string[];
  /** The test file that must name `[<id>]`. */
  testFile: string;
};

const CLAUSE_TEST_FILE = "tests/integration/clause-coverage.test.ts";

export const CLAUSE_REGISTRY: ClauseEntry[] = [
  {
    id: "SP:13",
    standard: "IRC:SP:13",
    title:
      "Area-velocity method and regime waterway; skew moment projection beyond 30° requires engineer sign-off",
    editions: ["2004"],
    modules: ["lib/engine/src/hydraulics/index.ts", "lib/engine/src/stability/index.ts"],
    symbols: ["computeHydraulics", "skewMomentProjection"],
    citations: [
      "IRC SP-13",
      "IRC SP-13, Article 5",
      "IRC SP:13 Appendix C",
    ],
    testFile: CLAUSE_TEST_FILE,
  },
  {
    id: "IS:7784",
    standard: "IS:7784",
    title: "Molesworth afflux formula for a bridge waterway constriction",
    editions: ["Part-I"],
    modules: ["lib/engine/src/hydraulics/index.ts"],
    symbols: ["computeHydraulics"],
    citations: ["IS:7784 Part-I"],
    testFile: CLAUSE_TEST_FILE,
  },
  {
    id: "IRC:78",
    standard: "IRC:78",
    title: "Mean and maximum scour depth; passive earth resistance cap",
    editions: ["1983", "2000"],
    modules: ["lib/engine/src/hydraulics/index.ts", "lib/engine/src/stability/index.ts"],
    symbols: ["computeHydraulics", "STABILITY_CONSTANTS"],
    citations: [
      "IRC:78-1983 (cl. 703.2.2.1)",
      "IRC:78-1983 Cl. 703.2.2.1",
      "IRC:78-2000 §706",
    ],
    testFile: CLAUSE_TEST_FILE,
  },
  {
    id: "IS:875",
    standard: "IS:875",
    title: "Wind load: design wind speed and pressure (Part 3)",
    editions: ["Part-3"],
    modules: ["lib/engine/src/loads/index.ts", "lib/engine/src/stability/index.ts"],
    symbols: ["calcWindLoad", "designWindPressure"],
    citations: ["IS 875 Part-3", "IS:875", "IS:875 Part-3"],
    testFile: CLAUSE_TEST_FILE,
  },
  {
    id: "IS:1893",
    standard: "IS:1893",
    title: "Seismic zone factor and horizontal seismic coefficient for bridges",
    editions: ["2002"],
    modules: ["lib/engine/src/loads/index.ts", "lib/engine/src/stability/index.ts"],
    symbols: ["SEISMIC_ZONE_FACTOR", "seismicCoefficient", "calcSeismic"],
    citations: ["IS:1893:2002"],
    testFile: CLAUSE_TEST_FILE,
  },
  {
    id: "IRC:112",
    standard: "IRC:112",
    title: "Concrete road bridges — limit-state basis referenced by the rebar module",
    editions: ["2015"],
    modules: ["lib/engine/src/rebar/index.ts"],
    symbols: ["wsdSectionSteel"],
    citations: ["IRC:112-2015 §9.3.2"],
    testFile: CLAUSE_TEST_FILE,
  },
  {
    id: "IRC:21",
    standard: "IRC:21",
    title: "Cement concrete road bridges — working-stress design of deck steel",
    editions: ["2000"],
    modules: ["lib/engine/src/loads/index.ts", "lib/engine/src/rebar/index.ts"],
    symbols: ["wsdSectionSteel", "calcLiveLoad"],
    citations: ["IRC:21:2000", "IRC 21:2000"],
    testFile: CLAUSE_TEST_FILE,
  },
  {
    id: "IS:456",
    standard: "IS:456",
    title:
      "Plain and reinforced concrete — permissible stresses (Table 21), modular ratio (Cl. B-1.3), steel from Mu (Cl. G-1)",
    editions: ["2000"],
    modules: ["lib/engine/src/rebar/index.ts"],
    symbols: ["calcAst", "getSigmaCb", "getSigmaSt", "wsdSectionSteel"],
    citations: ["IS 456:2000", "IS 456:2000 Table 21", "IS 456:2000 Cl. B-1.3", "IS 456:2000 Clause G-1", "IS 456 Cl. G-1"],
    testFile: CLAUSE_TEST_FILE,
  },
  {
    id: "IRC:6",
    standard: "IRC:6",
    title:
      "Road bridges — live-load impact (Cl.208), water current (Cl.213), braking (Cl.214), wind (Cl.209), traffic surcharge, pier drag and stability acceptance limits",
    editions: ["2016", "2017"],
    modules: ["lib/engine/src/loads/index.ts", "lib/engine/src/stability/index.ts"],
    symbols: [
      "calcLiveLoad",
      "calcWaterCurrent",
      "calcBraking",
      "STABILITY_ACCEPTANCE",
      "STABILITY_CONSTANTS",
      "ABUTMENT_SURCHARGE_KN_PER_M2",
    ],
    citations: [
      "IRC:6 Cl.208",
      "IRC:6 Cl.213",
      "IRC:6 Cl.214",
      "IRC:6-2016",
      "IRC:6-2016 Table 5",
      "IRC:6-2017 §209",
      "IRC:6 traffic surcharge",
      "IRC:6 lane idealisation",
      "IRC:6 stability acceptance limits",
    ],
    testFile: CLAUSE_TEST_FILE,
  },
];

/**
 * The clause ids, in registry order. Exported as flat data so the gate (plain
 * Node, no bundler) does not have to know the entry shape.
 */
export const REGISTERED_CLAUSE_IDS: string[] = CLAUSE_REGISTRY.map((c) => c.id);

/** Lookup by id. Returns `undefined` rather than throwing — the gate reports. */
export function clauseById(id: string): ClauseEntry | undefined {
  return CLAUSE_REGISTRY.find((c) => c.id === id);
}

/** The tree the orphan-citation scan walks. */
export const CLAUSE_SCAN_ROOT = "lib/engine/src";

/**
 * A citation token, as it appears in engine prose. Deliberately narrow:
 *   IRC:<num>  IS:<num>  SP:<num>   — optional edition year, optional sub-clause.
 * The number is 1–4 digits so that "IS 875", "IS:875", "IS 456:2000" and
 * "IS:1893:2002" all reduce to their base number. The digit run is GREEDY, and
 * that is load-bearing: were a shorter run tried first, a four-digit clause
 * number would match only its leading three digits and normalise to a clause
 * nobody registered.
 *
 * The scanner applies this to code with double- and single-quoted string
 * contents blanked first, so the syntax example in `contracts.ts` is not read as
 * a citation and the citation strings stored as data in this very file do not
 * register themselves.
 */
export const CLAUSE_TOKEN_PATTERN = "\\b(IRC|IS|SP)[-\\s:]*(\\d{1,4})(?:[-:]\\d{2,4})?";

/** Normalise a matched token to its registry id. Editions are folded in. */
export function normaliseClauseToken(kind: string, number: string): string {
  const base = number.split(/[-:]/)[0];
  return `${kind}:${base}`;
}
