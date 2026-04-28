/**
 * Builds bridge-excel-generator/variable-audit-matrix.csv
 * Maps each ProjectInput field to design-engine + Excel tab names (from addWorksheet in scanned files).
 *
 * npm exec tsx scripts/build-variable-audit-matrix.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'bridge-excel-generator', 'variable-audit-matrix.csv');
const OUT_SUMMARY = path.join(ROOT, 'bridge-excel-generator', 'variable-audit-matrix.summary.json');

/** Matches `types.ts` ProjectInput (order preserved for readability). */
const PROJECT_INPUT_FIELDS = [
  'projectName',
  'location',
  'riverName',
  'spanLength',
  'numberOfSpans',
  'carriageWidth',
  'numberOfLanes',
  'totalLength',
  'hfl',
  'bedLevel',
  'foundationLevel',
  'discharge',
  'manningN',
  'bedSlope',
  'laceysSiltFactor',
  'crossSectionData',
  'pierWidth',
  'pierLength',
  'pierDepth',
  'numberOfPiers',
  'pierBaseWidth',
  'pierBaseLength',
  'abutmentHeight',
  'abutmentWidth',
  'abutmentDepth',
  'dirtWallHeight',
  'returnWallLength',
  'concreteGrade',
  'fck',
  'steelGrade',
  'fy',
  'sbc',
  'phi',
  'gamma',
  'rtl',
  'agl',
  'nbl',
  'ofl',
  'dwl',
  'issuingAuthority',
  'jobNumber',
  'hardRockAvailable',
  'concreteGradeFoundation',
  'concreteGradePier',
  'concreteGradeAbutment',
  'concreteGradeDeck',
  'concreteGradeWearing',
] as const;

/** Files on the generateCompleteExcel path (see bridge-excel-generator/index.ts + C1 chain). */
const SCAN_FILES = [
  'bridge-excel-generator/design-engine.ts',
  'bridge-excel-generator/sheets/00-input-template-hydraulics.ts',
  'bridge-excel-generator/sheets/00-input-template-pier-stability.ts',
  'bridge-excel-generator/sheets/00-input-template-abutment-stability.ts',
  'bridge-excel-generator/sheets/01-index.ts',
  'bridge-excel-generator/sheets/02-insert-hydraulics.ts',
  'bridge-excel-generator/sheets/03-afflux-calculation.ts',
  'bridge-excel-generator/sheets/04-hydraulics.ts',
  'bridge-excel-generator/sheets/05-deck-anchorage.ts',
  'bridge-excel-generator/sheets/06-cross-section.ts',
  'bridge-excel-generator/sheets/07-bed-slope.ts',
  'bridge-excel-generator/sheets/08-sbc.ts',
  'bridge-excel-generator/sheets/09-stability-check-pier.ts',
  'bridge-excel-generator/sheets/10-abstract-of-stresses.ts',
  'bridge-excel-generator/sheets/11-steel-flared-pier.ts',
  'bridge-excel-generator/sheets/12-18-pier-remaining.ts',
  'bridge-excel-generator/sheets/17-lload.ts',
  'bridge-excel-generator/sheets/19-28-abutment-type1.ts',
  'bridge-excel-generator/sheets/21-type1-stability-check-abutment.ts',
  'bridge-excel-generator/sheets/22-c1-stability-check-abutment.ts',
  'bridge-excel-generator/sheets/29-31-technote-techreport.ts',
  'bridge-excel-generator/sheets/29-46-estimation.ts',
  'bridge-excel-generator/sheets/46-estimation.ts',
  'bridge-excel-generator/sheets/c1-sheets-append.ts',
  'bridge-excel-generator/sheets/c1-sheets-38-46.ts',
];

function extractSheetNames(fileContent: string): string[] {
  const names: string[] = [];
  const re = /addWorksheet\s*\(\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fileContent)) !== null) {
    names.push(m[1]);
  }
  return names;
}

function fieldReferenced(content: string, field: string): boolean {
  const re = new RegExp(`\\binput\\.${field}\\b`);
  return re.test(content);
}

function csvCell(s: string): string {
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function main() {
  const rows: string[][] = [];
  rows.push([
    'variable_key',
    'category',
    'design_engine',
    'excel_sheet_name',
    'generator_source_file',
    'notes',
  ]);

  const category = (f: string): string => {
    if (['projectName', 'location', 'riverName'].includes(f)) return 'project';
    if (
      ['spanLength', 'numberOfSpans', 'carriageWidth', 'numberOfLanes', 'totalLength'].includes(f)
    )
      return 'geometry';
    if (
      [
        'hfl',
        'bedLevel',
        'foundationLevel',
        'discharge',
        'manningN',
        'bedSlope',
        'laceysSiltFactor',
        'crossSectionData',
      ].includes(f)
    )
      return 'hydraulics_survey';
    if (f.startsWith('pier')) return 'pier';
    if (f.startsWith('abutment') || ['dirtWallHeight', 'returnWallLength'].includes(f)) return 'abutment';
    if (['concreteGrade', 'fck', 'steelGrade', 'fy'].includes(f)) return 'materials';
    if (['sbc', 'phi', 'gamma'].includes(f)) return 'soil';
    if (['rtl', 'agl', 'nbl', 'ofl', 'dwl'].includes(f)) return 'levels';
    if (['issuingAuthority', 'jobNumber', 'hardRockAvailable'].includes(f)) return 'documentation';
    if (
      [
        'concreteGradeFoundation',
        'concreteGradePier',
        'concreteGradeAbutment',
        'concreteGradeDeck',
        'concreteGradeWearing',
      ].includes(f)
    )
      return 'materials_optional';
    return 'other';
  };

  const enginePath = path.join(ROOT, 'bridge-excel-generator', 'design-engine.ts');
  const engineContent = fs.readFileSync(enginePath, 'utf8');

  for (const field of PROJECT_INPUT_FIELDS) {
    for (const rel of SCAN_FILES) {
      const abs = path.join(ROOT, rel);
      if (!fs.existsSync(abs)) {
        rows.push([field, category(field), '?', '?', rel, 'MISSING_FILE']);
        continue;
      }
      const content = fs.readFileSync(abs, 'utf8');
      if (!fieldReferenced(content, field)) continue;

      const isEngine = rel.endsWith('design-engine.ts');

      const sheets = isEngine ? ['__DESIGN_ENGINE__'] : extractSheetNames(content);
      const sheetList = sheets.length ? sheets : ['__NO_WORKSHEET_IN_FILE__'];

      for (const sheet of sheetList) {
        rows.push([
          field,
          category(field),
          isEngine ? 'Y' : 'N',
          sheet,
          rel.replace(/\\/g, '/'),
          '',
        ]);
      }
    }

    // Gap hint: in ProjectInput but never referenced in scanned files
    const fieldRows = rows.filter((r) => r[0] === field && r[5] !== 'MISSING_FILE');
    if (fieldRows.length === 0) {
      rows.push([
        field,
        category(field),
        'N',
        '—',
        '—',
        'Not referenced in scanned generator files (may be API-only or future)',
      ]);
    }
  }

  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  fs.writeFileSync(OUT, csv, 'utf8');

  const inEngine = PROJECT_INPUT_FIELDS.filter((f) => fieldReferenced(engineContent, f));
  const inExcelPath = PROJECT_INPUT_FIELDS.filter((f) =>
    SCAN_FILES.some((rel) => {
      if (rel.endsWith('design-engine.ts')) return false;
      const abs = path.join(ROOT, rel);
      if (!fs.existsSync(abs)) return false;
      return fieldReferenced(fs.readFileSync(abs, 'utf8'), f);
    })
  );
  const excelOnly = inExcelPath.filter((f) => !inEngine.includes(f));
  const engineOnly = inEngine.filter((f) => !inExcelPath.includes(f));

  fs.writeFileSync(
    OUT_SUMMARY,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        scannedFiles: SCAN_FILES,
        inDesignEngine: inEngine,
        inExcelGeneratorsOnly: excelOnly,
        inDesignEngineOnly: engineOnly,
        note:
          'excelOnly = present in sheet TS but not referenced in design-engine.ts (documentation / Excel parity / future engine). engineOnly = engine uses field but no scanned sheet references it (possible dead field or indirect via formula refs).',
        dischargeNote:
          'input.discharge appears on INPUT/HYDRAULICS/afflux sheets but calculateHydraulics() computes Q from cross-section and Manning; engine ignores input.discharge.',
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`Wrote ${rows.length - 1} data rows -> ${OUT}`);
  console.log(`Wrote summary -> ${OUT_SUMMARY}`);
}

main();
