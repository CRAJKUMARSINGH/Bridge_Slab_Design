// eslint.config.js — flat config.
//
// STATUS: inert. The packages this file names are declared in .deps-plan.json
// with owning week W00 and are NOT installed yet, so nothing runs this config
// today. It is committed now because the rule set is a decision, and the
// decision is what has to be reviewed — not the syntax that later expresses it.
//
// Run: pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
//        eslint-plugin-jsx-a11y eslint-plugin-import eslint-plugin-react-hooks
// then: pnpm run lint
//
// The intended rule set, from the Phase-2 foundation week:
//   * no-explicit-any = error            — an `any` at the engine boundary is a
//                                          silent unwitnessed substitution
//   * jsx-a11y/label-has-associated-control = error
//   * no-restricted-imports enforcing containment/CONTRACT.md — the layer table
//                                          becomes a lint failure, not a note in a doc
//   * no-sync in server/                 — a synchronous filesystem call in a
//                                          request handler is an availability defect
//
// When it is installed, the current violation set is recorded once as an
// allowlist (`eslint-baseline.json`) with a burn-down week per rule, so that
// turning the gate on does not require fixing twelve weeks of drift in one
// commit. That baseline does not exist yet, because a baseline that was not
// measured is a fabrication.
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
    // The layer rule of containment/CONTRACT.md, as a failing lint rather than a
    // paragraph. The engine is the bottom of the tree; nothing in it may reach
    // upward into a consumer.
    files: ["lib/engine/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["server/**", "client/**", "bridge-excel-generator/**"], message: "lib/engine is the bottom layer: see containment/CONTRACT.md" },
          ],
        },
      ],
    },
  },
];
