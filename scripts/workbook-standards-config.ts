/**
 * Office reference workbooks used for assimilation / parity checks.
 * First standard: Stability analysis `stabil*.xls` under Attached_Assets (LARATHI SOM RIVER sample).
 * Add more entries here as standards are adopted.
 */

import fs from 'fs';
import path from 'path';

export type WorkbookStandardDef = {
  id: string;
  /** Human label for logs and reports */
  label: string;
  /** Try these paths in order */
  paths: string[];
  /** If no path exists, still try glob in Attached_Assets for stabil*.xls (first standard only) */
  tryStabilGlob?: boolean;
  /** Skip silently if missing (e.g. future optional golden files) */
  optional?: boolean;
};

export const WORKBOOK_STANDARDS: WorkbookStandardDef[] = [
  {
    id: 'larathi-som-river',
    label: 'Stability — SUBMERSIBLE BRIDGE ACROSS LARATHI SOM RIVER (stabil*.xls)',
    paths: [
      path.resolve('Attached_Assets/Stability Analysis SUBMERSIBLE BRIDGE ACROSS LARATHI SOM RIVER.xls'),
    ],
    tryStabilGlob: true,
  },
  {
    id: 'final-result-46',
    label: 'FINAL_RESULT.xls — full 46-sheet template',
    paths: [path.resolve('REMOTE_APP/attached_assets/FINAL_RESULT.xls')],
    optional: true,
  },
];

function globFirstStabilXlsInAttachedAssets(): string | null {
  const dir = path.resolve('Attached_Assets');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => /^stabil/i.test(f) && /\.xls$/i.test(f));
  if (files.length === 0) return null;
  files.sort();
  return path.join(dir, files[0]);
}

/** Resolve filesystem path for a standard definition. */
export function resolveStandardFilePath(def: WorkbookStandardDef): string | null {
  for (const p of def.paths) {
    if (fs.existsSync(p)) return p;
  }
  if (def.tryStabilGlob) {
    const g = globFirstStabilXlsInAttachedAssets();
    if (g) return g;
  }
  return null;
}

/** All standards that resolve to an existing file (optional ones omitted if missing). */
export function listResolvedStandards(): { def: WorkbookStandardDef; filePath: string }[] {
  const out: { def: WorkbookStandardDef; filePath: string }[] = [];
  for (const def of WORKBOOK_STANDARDS) {
    const filePath = resolveStandardFilePath(def);
    if (filePath) out.push({ def, filePath });
    else if (!def.optional) {
      console.warn(`[standards] Missing required standard "${def.id}" — expected one of: ${def.paths.join(', ')}`);
    }
  }
  return out;
}
