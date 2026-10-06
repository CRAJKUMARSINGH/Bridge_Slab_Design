import fs from 'node:fs';

const due = 'august-due.md';
let s = fs.readFileSync(due, 'utf8');
const before = s;

// 1. O-8 held the lane as "not yet wired" pointing at a non-existent SUMMARY row.
const o8old = "The lane itself is **not yet wired** \u2014 see SUMMARY HIGH #17 \u2014 because the remaining 6 files need decisions, not casts.";
const o8new = "That measurement became the lane: `scripts/tsconfig.tools.json` + `pnpm run typecheck:tools`, wired into `check` (\u00a7P-2). What the lane then found beyond these three is recorded in \u00a7P.";
if (!s.includes(o8old)) { console.log('MISS o8'); process.exit(1); }
s = s.replace(o8old, o8new);

// 2. Footer must cover DUE-8 as well as DUE-7.
const footStart = s.lastIndexOf('*Last updated:');
if (footStart < 0) { console.log('MISS footer'); process.exit(1); }
const footEnd = s.indexOf('*\n', footStart) + 2;
const footNew = '*Last updated: 2026-10-06 \u2014 \u00a7P added (DUE-8): root `scripts/*.ts` given a real typecheck lane (`scripts/tsconfig.tools.json` + `pnpm run typecheck:tools`, wired into `check` and CI); five latent defects fixed by its first run, including the release-bundler crash and a QA field that logged 0 for all 251 load tests; sharp/word-extractor imports marked rather than excluded; three scripts importing a deleted prose layer archived; repo-wide LFS pointer census; \u00a7J-9 re-scoped (A1 works, corpus empty). \u00a7O-8\'s stale "lane not yet wired" note corrected. Earlier same day: \u00a7O added (DUE-7) \u2014 Model A/B retired and archived, J-8\'s root cause corrected from "xlsx not installed" to stale reference paths + Git LFS pointer stubs, new `read-office-workbook.ts` guard, `BackwaterCurvePanel` polyline fix, J-7/J-8 closed, LFS materialization added as an A2\u2013A5 prerequisite.*\n';
s = s.slice(0, footStart) + footNew + s.slice(footEnd);

if (s === before) { console.log('NO CHANGE'); process.exit(1); }
fs.writeFileSync(due, s);
console.log('august-due.md rewritten');

// 3. The tools lane excluded a scratch file that no longer exists.
const tc = 'scripts/tsconfig.tools.json';
let t = fs.readFileSync(tc, 'utf8');
const oldEx = '"exclude": ["src", "tmp-due7-probe.ts"]';
if (!t.includes(oldEx)) { console.log('MISS exclude'); process.exit(1); }
t = t.replace(oldEx, '"exclude": ["src"]');
fs.writeFileSync(tc, t);
console.log('scripts/tsconfig.tools.json trimmed');
