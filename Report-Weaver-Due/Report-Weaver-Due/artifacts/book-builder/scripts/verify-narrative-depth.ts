import * as fs from 'fs';
import * as path from 'path';

/**
 * Simple verification script for narrative depth.
 * It scans generated HTML report files (assumed to be under 'reports/html')
 * and ensures each sheet (21‑34) contains at least three <p> paragraphs.
 * Adjust paths or detection logic as needed.
 */
const REPORT_DIR = path.resolve(process.cwd(), 'reports', 'html');

function getSheetFiles(): string[] {
  if (!fs.existsSync(REPORT_DIR)) {
    console.warn(`Report directory not found: ${REPORT_DIR}`);
    return [];
  }
  return fs.readdirSync(REPORT_DIR).filter(f => f.match(/sheet-(21|2[2-9]|3[0-4])\.html$/i));
}

function countParagraphs(html: string): number {
  const matches = html.match(/<p[^>]*>/gi);
  return matches ? matches.length : 0;
}

function verify(): void {
  const files = getSheetFiles();
  let allPass = true;
  for (const file of files) {
    const content = fs.readFileSync(path.join(REPORT_DIR, file), 'utf-8');
    const paraCount = countParagraphs(content);
    if (paraCount < 3) {
      console.error(`❌ ${file} has only ${paraCount} paragraphs (minimum 3 required).`);
      allPass = false;
    } else {
      console.log(`✅ ${file} contains ${paraCount} paragraphs.`);
    }
  }
  if (!allPass) {
    process.exit(1);
  } else {
    console.log('All narrative depth checks passed.');
  }
}

verify();
