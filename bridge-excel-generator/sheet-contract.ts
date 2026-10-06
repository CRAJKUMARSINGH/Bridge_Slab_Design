/**
 * Authoritative 56-sheet workbook contract used by the generator and tests.
 * Expanded from 46 → 56 sheets (2026-10-05) with 10 new IRC/IS-compliant
 * design, QA, and admin sheets.
 */
export const EXPECTED_SHEET_NAMES = [
  'INDEX',
  'DESIGN CRITERIA',
  'INPUT DATA SUMMARY',
  'INSERT- HYDRAULICS',
  'afflux calculation',
  'HYDRAULICS',
  'Deck Anchorage',
  'CROSS SECTION',
  'Bed Slope',
  'SBC',
  'SEISMIC ANALYSIS (IS 1893)',
  'WIND LOAD ANALYSIS (IS 875)',
  'STABILITY CHECK FOR PIER',
  'abstract of stresses',
  'STEEL IN FLARED PIER BASE',
  'STEEL IN PIER',
  'FOOTING DESIGN',
  'Footing STRESS DIAGRAM',
  'Pier Cap LL tracked vehicle',
  'Pier Cap',
  'LLOAD',
  'loadsumm',
  'LL-ABSTRACT',
  'BEARING DETAILS',
  'EXPANSION JOINT & DRAINAGE',
  'APPROACH SLAB DESIGN',
  'TYPE1-AbutMENT Drawing',
  'TYPE1-STABILITY CHECK ABUTMENT',
  'TYPE1-ABUTMENT FOOTING DESIGN',
  'TYPE1- Abut Footing STRESS',
  'TYPE1-STEEL IN ABUTMENT',
  'TYPE1-Abutment Cap',
  'TYPE1-DIRT WALL REINFORCEMENT',
  'TYPE1-DIRT DirectLoad_BM',
  'TYPE1-DIRT LL_BM',
  'INSERT C1-ABUT',
  'C1-AbutMENT Drawing',
  'C1-STABILITY CHECK ABUTMENT',
  'C1-ABUTMENT FOOTING DESIGN',
  'C1-Abut Footing STRESS DIAGRAM',
  'CAN-RETURN FOOTING DESIGN',
  'STEEL IN CANT-ABUTMENT',
  'STEEL IN CANT-RETURNS',
  'C1-Abutment Cap',
  'C1-DIRT WALL REINFORCEMENT',
  'C1-DIRT DirectLoad_BM',
  'C1-DIRT LL_BM',
  'TechNote',
  'INSERT ESTIMATE',
  'Tech Report',
  'General Abs.',
  'Abstract',
  'Bridge measurements',
  'IRC CODE COMPLIANCE CHECKLIST',
  'SERVICEABILITY CHECK',
  'REVISION SHEET',
] as const;

export const EXPECTED_SHEET_COUNT = EXPECTED_SHEET_NAMES.length;

/**
 * A4 print-orientation tabulation, keyed by sheet NAME (15 mm margins all
 * around; PRESENTATION-SPEC.md §4). Owner tabulation 2026-10-04:
 * "LANDSCAPE >>> 3, 5, 9, 10, 15, 16, 17, 18 TO 21, 30-31, ALL OTHER PORTRAIT".
 * Those thirteen numbers address the 46-sheet book, so the tabulation is
 * carried by content rather than position: the thirteen owner names come
 * first below, followed by the six wide sheets that arrived with the 56-book.
 *
 * Keyed by name on purpose: a positional set silently re-targeted six sheets
 * when 46 grew to 56, and `legacy-46` output would have been re-targeted
 * again in the other direction.
 */
const LANDSCAPE_SHEET_NAMES: ReadonlyArray<(typeof EXPECTED_SHEET_NAMES)[number]> = [
  // owner tabulation (46-sheet numbers in brackets)
  'afflux calculation',              // [3]
  'Deck Anchorage',                  // [5]
  'STABILITY CHECK FOR PIER',        // [9]
  'abstract of stresses',            // [10]
  'Pier Cap LL tracked vehicle',     // [15]
  'Pier Cap',                        // [16]
  'LLOAD',                           // [17]
  'loadsumm',                        // [18]
  'LL-ABSTRACT',                     // [19]
  'TYPE1-AbutMENT Drawing',          // [20]
  'TYPE1-STABILITY CHECK ABUTMENT',  // [21]
  'C1-AbutMENT Drawing',             // [30]
  'C1-STABILITY CHECK ABUTMENT',     // [31]
  // wide sheets introduced with the 56-book
  'DESIGN CRITERIA',
  'INPUT DATA SUMMARY',
  'SEISMIC ANALYSIS (IS 1893)',
  'WIND LOAD ANALYSIS (IS 875)',
  'BEARING DETAILS',
  'SERVICEABILITY CHECK',
];

const LANDSCAPE_LOOKUP = new Set<string>(LANDSCAPE_SHEET_NAMES);

export function isLandscapeSheet(name: string): boolean {
  return LANDSCAPE_LOOKUP.has(name);
}
