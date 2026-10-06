/**
 * Master QA Orchestrator — Ultra-Strict Integration & QA Tests
 *
 * Sequentially runs Phase 1, Phase 2, Phase 3–9 (integration tests), and Phase 6 (stress test).
 * Consolidates all logs, outputs, and status checks.
 *
 * Usage: pnpm tsx scripts/qa-ultra-strict.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT_DIR = resolve(import.meta.dirname, '..');
const OUTPUT_DIR = join(ROOT_DIR, 'archive', 'test-outputs');

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface TestPhase {
  id: number;
  name: string;
  command: string;
}

const phases: TestPhase[] = [
  {
    id: 1,
    name: 'Static Analysis & Build Verification Gate',
    command: 'pnpm tsx scripts/qa-gate-static.ts'
  },
  {
    id: 2,
    name: 'Engine Calculation Parity & Regression Tests',
    command: 'pnpm tsx --test lib/engine/src/tests/golden-parity-expanded.test.ts'
  },
  {
    id: 3,
    name: 'API Endpoint Health & Metadata Tests',
    command: 'pnpm tsx --test tests/integration/api-health.test.ts'
  },
  {
    id: 4,
    name: 'API Calculation, Design & Optimisation Tests',
    command: 'pnpm tsx --test tests/integration/api-calculate.test.ts'
  },
  {
    id: 5,
    name: 'API Report Generation Tests',
    command: 'pnpm tsx --test tests/integration/api-reports.test.ts'
  },
  {
    id: 6,
    name: 'API Drawings, SVG & DXF Output Tests',
    command: 'pnpm tsx --test tests/integration/api-drawings.test.ts'
  },
  {
    id: 7,
    name: 'API D4 Projects & Files CRUD Tests',
    command: 'pnpm tsx --test tests/integration/api-d4-crud.test.ts'
  },
  {
    id: 8,
    name: 'API Pier Case Recommendation Engine Tests',
    command: 'pnpm tsx --test tests/integration/api-pier-cases.test.ts'
  },
  {
    id: 9,
    name: 'API Specialty, Reinforcement & Estimation Tests',
    command: 'pnpm tsx --test tests/integration/api-specialty.test.ts'
  },
  {
    id: 10,
    name: 'Excel Workbook Integrity Structural Tests',
    command: 'pnpm tsx --test tests/integration/excel-integrity.test.ts'
  },
  {
    id: 11,
    name: 'Narrative Report Output Completeness Tests',
    command: 'pnpm tsx --test tests/integration/report-integrity.test.ts'
  },
  {
    id: 12,
    name: 'Zod API Payload Contract Validation Tests',
    command: 'pnpm tsx --test tests/integration/zod-contract.test.ts'
  },
  {
    id: 13,
    name: 'Security Vulnerability, Rate Limit & Header Tests',
    command: 'pnpm tsx --test tests/integration/security.test.ts'
  },
  {
    id: 14,
    name: 'Deployment Config & Readiness Check Tests',
    command: 'pnpm tsx --test tests/integration/deploy-readiness.test.ts'
  },
  {
    id: 15,
    name: '251-User Calculation Stress Test',
    command: 'pnpm tsx scripts/stress-test-251-users.ts'
  }
];

async function runOrchestrator() {
  console.log('====================================================');
  console.log('   ULTRA-STRICT INTEGRATION & QA TEST SUITE RUNNER  ');
  console.log('====================================================\n');

  const report: any = {
    suiteRunAt: new Date().toISOString(),
    phasesResults: [],
    allPhasesPassed: true,
    totalPhases: phases.length,
    passedPhases: 0
  };

  for (const phase of phases) {
    console.log(`[Phase ${phase.id}/${phases.length}] Running: ${phase.name}...`);
    const start = Date.now();
    let passed = false;
    let errorLog = '';

    try {
      execSync(phase.command, { cwd: ROOT_DIR, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } });
      passed = true;
      console.log(`[Phase ${phase.id}] ✅ PASSED (${((Date.now() - start) / 1000).toFixed(2)}s)\n`);
    } catch (err: any) {
      passed = false;
      errorLog = err.stdout ?? err.message ?? '';
      console.error(`[Phase ${phase.id}] ❌ FAILED (${((Date.now() - start) / 1000).toFixed(2)}s)\n`);
      report.allPhasesPassed = false;
    }

    report.phasesResults.push({
      phaseId: phase.id,
      name: phase.name,
      passed,
      durationMs: Date.now() - start,
      errorLog: passed ? '' : errorLog
    });

    if (passed) {
      report.passedPhases++;
    }
  }

  const reportPath = join(OUTPUT_DIR, 'ultra-strict-qa-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('====================================================');
  console.log('   INTEGRATION SUITE COMPLETE                       ');
  console.log(`   Report written to: ${reportPath}`);
  console.log(`   Status: ${report.allPhasesPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'} (${report.passedPhases}/${report.totalPhases})`);
  console.log('====================================================');

  if (!report.allPhasesPassed) {
    process.exit(1);
  }
  process.exit(0);
}

runOrchestrator().catch(err => {
  console.error('Fatal error during orchestrator execution:', err);
  process.exit(1);
});
