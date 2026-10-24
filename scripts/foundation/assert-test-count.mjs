#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';

const { baselineTestCount: MIN } = JSON.parse(readFileSync('foundation/manifest.json', 'utf8'));
if (!existsSync('.vitest-report.json')) {
  console.error('run `pnpm run test:report` first');
  process.exit(1);
}
const r = JSON.parse(readFileSync('.vitest-report.json', 'utf8'));
const total = r.numTotalTests ?? 0;
console.log(`tests: ${r.numPassedTests ?? 0}/${total} passed (baseline floor ${MIN})`);

if (total < MIN) {
  console.error(`FAILED: ${total} tests < baseline ${MIN} — tests were deleted or silently skipped`);
  process.exit(1);
}
if ((r.numFailedTests ?? 0) > 0) {
  console.error(`FAILED: ${r.numFailedTests} test(s) failing`);
  process.exit(1);
}
if ((r.numPendingTests ?? 0) > 0) {
  console.log(`WARN: ${r.numPendingTests} skipped — each needs a written reason`);
}
console.log('verify:testcount PASS');
