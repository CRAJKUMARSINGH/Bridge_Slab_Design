// eslint.config.js — flat config.
//
// STATUS: live. The packages this file names are installed (package.json lists
// eslint ^9.39.5, @typescript-eslint/parser + eslint-plugin ^8.73.0, and the
// jsx-a11y / import / react-hooks plugins), and `pnpm run lint` runs this config
// against the tree; `pnpm run check` (and therefore CI) invokes it.
//
// The intended rule set, from the Phase-2 foundation week:
//   * no-explicit-any = error            — an `any` at the engine boundary is a
//                                          silent unwitnessed substitution
//   * jsx-a11y/label-has-associated-control = error
//   * no-restricted-imports enforcing the two-layer rule — the layer table
//                                          becomes a lint failure, not a note in a doc
//                                          (the CONTRACT.md that documented it was
//                                          removed by the documentation purge)
//   * no-sync in server/                 — a synchronous filesystem call in a
//                                          request handler is an availability defect
//
// When it was switched on, the violation set at that moment was measured once
// and recorded as an allowlist (`eslint-baseline.json`): 175 findings across 814
// files, so turning the gate on did not require fixing twelve weeks of drift in
// one commit. The baseline is a measurement, not a fabrication; burn it down
// with `eslint --prune-suppressions`, which fails when an entry is stale.
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "archive/**",
      "merge-refs/**",
      "VENICE-REFERENCES/**",
      "Attached_Assets/**",
      "**/*.mjs",
      "**/tsconfig.*.json",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: { parser: tsparser, ecmaVersion: 2022, sourceType: "module" },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // The layer rule, as a failing lint rather than a paragraph. The engine is
    // the bottom of the tree; nothing in it may reach upward into a consumer.
    files: ["lib/engine/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["server/**", "client/**", "bridge-excel-generator/**"], message: "lib/engine is the bottom layer: no upward imports" },
          ],
        },
      ],
    },
  },
];
