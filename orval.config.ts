import { defineConfig } from 'orval';

export default defineConfig({
  bridgeSuite: {
    input: {
      target: './openapi/bridge-suite.yaml',
    },
    output: {
      target: './client/src/generated/api/index.ts',
      schemas: './client/src/generated/api/schemas',
      client: 'react-query',
      mode: 'tags-split',
      override: {
        mutator: {
          path: './client/src/lib/api-client.ts',
          name: 'apiClient',
        },
        header: () => ['// @ts-nocheck'],
        query: {
          useQuery: true,
          useMutation: true,
        },
        zod: {
          generate: true,
          coerce: false,
        },
      },
    },
  },
});
