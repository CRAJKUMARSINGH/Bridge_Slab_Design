import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BIN = /\.(xls|xlsx|xlsm|pdf|dwg|doc|docx|csv)$/i;
const tracked = execFileSync('git', ['ls-files', '-z'], { maxBuffer: 64e6 }).toString().split('\0').filter(Boolean);
let lfs = 0, stub = 0, materialized = 0, gone = 0;
const per = {};
for (const p of tracked) {
  if (!BIN.test(p)) continue;
  lfs++;
  let buf;
  try { buf = fs.readFileSync(p); } catch { gone++; continue; }
  if (buf.length < 400 && buf.slice(0, 24).toString().startsWith('version https://git-lfs')) {
    stub++;
    const top = p.split('/')[0];
    per[top] = (per[top] || 0) + 1;
  } else materialized++;
}
console.log(JSON.stringify({ trackedBinaryAssets: lfs, pointerStubs: stub, materialized, missingFromWorktree: gone, stubsByTopDir: per }, null, 1));
