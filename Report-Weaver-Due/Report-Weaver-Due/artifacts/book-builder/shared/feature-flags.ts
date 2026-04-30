/**
 * REFERENCE-APP00 / hybrid-merge feature flags (Refapp.md).
 * Read via resolveFeatureFlags(process.env) on the server; document keys in .env.example.
 */

export interface FeatureFlags {
  /** When true, expose cache-clear style endpoints if implemented (default off). */
  referenceApp00CacheApi: boolean;
  /** Excel NARRATIVE REPORT uses golden narratives for all 50 registry sheets (default on). */
  narrativeReportGoldenAllSheets: boolean;
  /** Reserved: run repo as Turborepo root task graph (default off; see docs/SOLUTIONS-MONOREPO-MIGRATION-RUNBOOK.md). */
  turboMonorepoMode: boolean;
}

const truthy = (v: string | undefined) => v === '1' || v?.toLowerCase() === 'true';

export function resolveFeatureFlags(env: Record<string, string | undefined>): FeatureFlags {
  return {
    referenceApp00CacheApi: truthy(env.REFERENCE_APP00_CACHE_API),
    narrativeReportGoldenAllSheets: env.NARRATIVE_REPORT_GOLDEN_ALL_SHEETS !== '0' && env.NARRATIVE_REPORT_GOLDEN_ALL_SHEETS !== 'false',
    turboMonorepoMode: truthy(env.TURBO_MONOREPO_MODE),
  };
}
