import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The client is built with @vitejs/plugin-react (see vite.config.ts), which
  // compiles JSX with the automatic runtime. This config does not load that
  // plugin, so esbuild would fall back to the classic transform and every .tsx
  // would throw "React is not defined". Pin the same runtime here instead of
  // pulling the whole plugin (and its Babel pass) into the node lanes.
  esbuild: { jsx: 'automatic' },
  test: {
    include: [
      'client/src/**/__tests__/**/*.test.ts',
      // .tsx as well as .ts: component tests render JSX, and a glob that only
      // matches .ts silently excludes them — the file is on disk, the lane is
      // green, and nothing was tested.
      'client/src/**/__tests__/**/*.test.tsx',
      'tests/**/*.test.ts',
      'foundation/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'archive/**',
      'Attached_Assets/**',
      'assets/**',
      'merge-refs/**',
      'VENICE-REFERENCES/**',
      // tests/integration/** are node:test lanes run via tsx; vitest cannot
      // execute them and reports them as failures. Keep the two runners disjoint.
      'tests/integration/**',
    ],
    environment: 'node',
    passWithNoTests: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
