/**
 * Row models mirroring Excel INPUT template sheets (8 columns A–H, same order as workbook samples).
 * Used by the Design page for a ditto workbook UI — keep in sync with:
 *   sheets/00-input-template-hydraulics.ts
 *   sheets/00-input-template-pier-stability.ts
 *   sheets/00-input-template-abutment-stability.ts
 */

import type { ProjectInput } from '../bridge-excel-generator/types';

/** Column widths (ch) — matches setColumnWidths(ws, [5, 35, 15, 15, 15, 20, 15, 15]) */
export const INPUT_TEMPLATE_COL_WIDTHS_CH = [5, 35, 15, 15, 15, 20, 15, 15] as const;

export type WbCellStyle = 'plain' | 'title' | 'section' | 'instr' | 'in-yellow' | 'in-red' | 'calc' | 'hdr-grey';

export type WbMergedRow = { kind: 'merged'; text: string; style: WbCellStyle };

export type WbDataRow = {
  kind: 'data';
  cells: [string, string, string, string, string, string, string, string];
  /** 0-based column index for editable numeric/text cell (usually 3 = Excel D) */
  editCol?: number;
  editField?: keyof ProjectInput;
  editType?: 'text' | 'number';
  /** Per-cell style (optional); default plain */
  styles?: Partial<Record<number, WbCellStyle>>;
  /** Cross-section triple-row: column index → which point and field to edit */
  crossCells?: Partial<Record<number, { pointIndex: number; field: 'chainage' | 'gl' }>>;
};

export type WbRow = WbMergedRow | WbDataRow;

export type WbSheetModel = { tab: string; rows: WbRow[] };

function pad8(parts: string[]): [string, string, string, string, string, string, string, string] {
  const a = [...parts];
  while (a.length < 8) a.push('');
  return a.slice(0, 8) as [string, string, string, string, string, string, string, string];
}

function fmt(n: number, d = 2) {
  if (!Number.isFinite(n)) return '';
  return n.toFixed(d);
}

export function buildInputHydraulicsSheet(input: ProjectInput): WbSheetModel {
  const rows: WbRow[] = [];
  const cs = input.crossSectionData?.length ? input.crossSectionData : [{ chainage: 0, gl: 0 }];

  rows.push({ kind: 'merged', text: 'HYDRAULIC DESIGN INPUT PARAMETERS', style: 'title' });
  rows.push({ kind: 'merged', text: '', style: 'plain' });
  rows.push({
    kind: 'merged',
    text: 'Instructions: Enter your project-specific hydraulic parameters below. These values will automatically update all hydraulic calculations.',
    style: 'instr',
  });
  rows.push({ kind: 'merged', text: '', style: 'plain' });

  rows.push({ kind: 'merged', text: 'PROJECT INFORMATION', style: 'section' });
  rows.push(
    dataRow(['1.', 'Project Name', '', input.projectName || '', '', 'Used in: All sheets', '', ''], {
      editCol: 3,
      editField: 'projectName',
      editType: 'text',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(['2.', 'River Name', '', input.riverName || '', '', 'Used in: Hydraulics, Afflux', '', ''], {
      editCol: 3,
      editField: 'riverName',
      editType: 'text',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(['3.', 'Location', '', input.location || '', '', 'Used in: All sheets', '', ''], {
      editCol: 3,
      editField: 'location',
      editType: 'text',
      styles: { 3: 'in-yellow' },
    }),
  );

  rows.push({ kind: 'merged', text: 'BRIDGE GEOMETRY', style: 'section' });
  rows.push(
    dataRow(['3a.', 'Span Length (m)', '', fmt(input.spanLength, 2), '', 'Linked: ESTIMATION, LLOAD', '', ''], {
      editCol: 3,
      editField: 'spanLength',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(['3b.', 'Number of Spans', '', String(input.numberOfSpans), '', 'Linked: ESTIMATION', '', ''], {
      editCol: 3,
      editField: 'numberOfSpans',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(['3c.', 'Carriageway Width (m)', '', fmt(input.carriageWidth, 2), '', 'Linked: ESTIMATION', '', ''], {
      editCol: 3,
      editField: 'carriageWidth',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(
      [
        '3d.',
        'Total Bridge Length (m)',
        '',
        fmt(input.totalLength ?? input.spanLength * input.numberOfSpans, 2),
        '',
        'Linked: ESTIMATION, BOQ',
        '',
        '',
      ],
      { editCol: 3, editField: 'totalLength', styles: { 3: 'in-yellow' } },
    ),
  );
  rows.push({ kind: 'merged', text: '', style: 'plain' });

  rows.push({ kind: 'merged', text: 'HYDRAULIC LEVELS', style: 'section' });
  rows.push(
    dataRow(['4.', 'Highest Flood Level (HFL)', '', fmt(input.hfl, 3), 'm MSL', 'Critical for afflux calculation', '', ''], {
      editCol: 3,
      editField: 'hfl',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['5.', 'Average Bed Level', '', fmt(input.bedLevel, 3), 'm MSL', 'Used in: Scour, Hydraulics', '', ''], {
      editCol: 3,
      editField: 'bedLevel',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['6.', 'Foundation Level', '', fmt(input.foundationLevel, 3), 'm MSL', 'Used in: Pier, Abutment design', '', ''], {
      editCol: 3,
      editField: 'foundationLevel',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push({ kind: 'merged', text: '', style: 'plain' });

  rows.push({ kind: 'merged', text: 'DISCHARGE & FLOW PARAMETERS', style: 'section' });
  rows.push(
    dataRow(['7.', 'Design Discharge', '', fmt(input.discharge, 2), 'cumecs', 'Critical for afflux & velocity', '', ''], {
      editCol: 3,
      editField: 'discharge',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(["8.", "Manning's Roughness Coefficient (n)", '', String(input.manningN), '-', 'Affects velocity calculation', '', ''], {
      editCol: 3,
      editField: 'manningN',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['9.', 'Bed Slope', '', String(input.bedSlope), '1 in n', "Used in: Manning's equation", '', ''], {
      editCol: 3,
      editField: 'bedSlope',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(["10.", "Lacey's Silt Factor (f)", '', String(input.laceysSiltFactor), '-', 'Used in: Scour depth calculation', '', ''], {
      editCol: 3,
      editField: 'laceysSiltFactor',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push({ kind: 'merged', text: '', style: 'plain' });

  rows.push({ kind: 'merged', text: 'RIVER CROSS SECTION DATA', style: 'section' });
  rows.push({
    kind: 'data',
    cells: pad8([
      'Chainage (m)',
      'G.L. (m MSL)',
      'Chainage (m)',
      'G.L. (m MSL)',
      'Chainage (m)',
      'G.L. (m MSL)',
      '',
      '',
    ]),
    styles: { 0: 'hdr-grey', 1: 'hdr-grey', 2: 'hdr-grey', 3: 'hdr-grey', 4: 'hdr-grey', 5: 'hdr-grey' },
  });

  for (let i = 0; i < Math.ceil(cs.length / 3); i++) {
    const triple: string[] = [];
    const crossCells: NonNullable<WbDataRow['crossCells']> = {};
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;
      if (idx < cs.length) {
        triple.push(fmt(cs[idx].chainage, 2), fmt(cs[idx].gl, 3));
        crossCells[j * 2] = { pointIndex: idx, field: 'chainage' };
        crossCells[j * 2 + 1] = { pointIndex: idx, field: 'gl' };
      } else {
        triple.push('', '');
      }
    }
    rows.push({
      kind: 'data',
      cells: pad8(triple),
      styles: {
        0: 'in-red',
        1: 'in-red',
        2: 'in-red',
        3: 'in-red',
        4: 'in-red',
        5: 'in-red',
      },
      crossCells,
    });
  }

  rows.push({ kind: 'merged', text: '', style: 'plain' });

  const wd = (input.hfl || 0) - (input.bedLevel || 0);
  const vEst = Math.pow((input.discharge || 0) / 100, 0.6) * 0.8;
  const scour = 0.473 * Math.pow((input.discharge || 0) / (input.laceysSiltFactor || 1), 1 / 3);

  rows.push({ kind: 'merged', text: 'CALCULATED HYDRAULIC VALUES', style: 'section' });
  rows.push({
    kind: 'data',
    cells: pad8(['→', 'Water Depth', '', fmt(wd, 3), 'm', 'Auto-calculated', '', '']),
    styles: { 3: 'calc' },
  });
  rows.push({
    kind: 'data',
    cells: pad8(['→', 'Approximate Velocity', '', fmt(vEst, 3), 'm/s', 'Estimated from discharge', '', '']),
    styles: { 3: 'calc' },
  });
  rows.push({
    kind: 'data',
    cells: pad8(['→', 'Normal Scour Depth', '', fmt(scour, 3), 'm', "Lacey's formula", '', '']),
    styles: { 3: 'calc' },
  });
  rows.push({ kind: 'merged', text: '', style: 'plain' });

  rows.push({ kind: 'merged', text: 'VALIDATION CHECKS', style: 'section' });
  const d = input.discharge || 0;
  const passD = d > 100 && d < 10000 ? 'PASS' : 'CHECK';
  const passN = input.manningN > 0.02 && input.manningN < 0.1 ? 'PASS' : 'CHECK';
  const passW = wd > 2 && wd < 20 ? 'PASS' : 'CHECK';
  rows.push({
    kind: 'data',
    cells: pad8(['✓', 'Discharge Range Check', '', passD, '', '100-10000 cumecs typical', '', '']),
    styles: { 3: 'calc' },
  });
  rows.push({
    kind: 'data',
    cells: pad8(["✓", "Manning's n Range Check", '', passN, '', '0.02-0.1 typical range', '', '']),
    styles: { 3: 'calc' },
  });
  rows.push({
    kind: 'data',
    cells: pad8(['✓', 'Water Depth Check', '', passW, '', '2-20m typical depth', '', '']),
    styles: { 3: 'calc' },
  });
  rows.push({ kind: 'merged', text: '', style: 'plain' });

  rows.push({ kind: 'merged', text: 'USAGE INSTRUCTIONS', style: 'section' });
  rows.push({
    kind: 'merged',
    text: '1. Modify YELLOW cells with your project data. 2. RED cells are critical hydraulic parameters. 3. GREEN cells show calculated values. 4. All changes update linked sheets in Excel export.',
    style: 'instr',
  });

  return { tab: 'INPUT-HYDRAULICS', rows };
}

function dataRow(
  cells: string[],
  opts: Omit<WbDataRow, 'kind' | 'cells'> & { cells?: never },
): WbDataRow {
  return { kind: 'data', cells: pad8(cells), ...opts };
}

export function buildInputPierSheet(input: ProjectInput): WbSheetModel {
  const rows: WbRow[] = [];
  rows.push({ kind: 'merged', text: 'PIER STABILITY DESIGN INPUT PARAMETERS', style: 'title' });
  rows.push({ kind: 'merged', text: '', style: 'plain' });
  rows.push({
    kind: 'merged',
    text: 'Instructions: Enter pier geometry and loading parameters below. These values control pier stability analysis and design.',
    style: 'instr',
  });
  rows.push({ kind: 'merged', text: '', style: 'plain' });

  rows.push({ kind: 'merged', text: 'BRIDGE GEOMETRY', style: 'section' });
  rows.push(
    dataRow(['1.', 'Span Length', '', fmt(input.spanLength, 2), 'm', 'Critical for live load distribution', '', ''], {
      editCol: 3,
      editField: 'spanLength',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(['2.', 'Number of Spans', '', String(input.numberOfSpans), 'nos', 'Determines number of piers', '', ''], {
      editCol: 3,
      editField: 'numberOfSpans',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(['3.', 'Carriageway Width', '', fmt(input.carriageWidth, 2), 'm', 'Affects live load magnitude', '', ''], {
      editCol: 3,
      editField: 'carriageWidth',
      styles: { 3: 'in-yellow' },
    }),
  );
  const pierTotalLen = (input.numberOfSpans || 0) * (input.spanLength || 0);
  rows.push(
    dataRow(['4.', 'Total Bridge Length', '', fmt(pierTotalLen, 2), 'm', 'Auto-calculated', '', ''], {
      styles: { 3: 'calc' },
    }),
  );
  rows.push({ kind: 'merged', text: '', style: 'plain' });

  rows.push({ kind: 'merged', text: 'PIER DIMENSIONS', style: 'section' });
  rows.push(
    dataRow(['5.', 'Pier Width (across flow)', '', fmt(input.pierWidth, 2), 'm', 'Critical for water flow obstruction', '', ''], {
      editCol: 3,
      editField: 'pierWidth',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['6.', 'Pier Length (along bridge)', '', fmt(input.pierLength, 2), 'm', 'Affects lateral stability', '', ''], {
      editCol: 3,
      editField: 'pierLength',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['7.', 'Pier Height (from bed)', '', fmt(input.pierDepth, 2), 'm', 'Affects overturning moment', '', ''], {
      editCol: 3,
      editField: 'pierDepth',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['8.', 'Pier Base Width (flared)', '', fmt(input.pierBaseWidth, 2), 'm', 'Foundation bearing area', '', ''], {
      editCol: 3,
      editField: 'pierBaseWidth',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['9.', 'Pier Base Length (flared)', '', fmt(input.pierBaseLength, 2), 'm', 'Foundation bearing area', '', ''], {
      editCol: 3,
      editField: 'pierBaseLength',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push({ kind: 'merged', text: '', style: 'plain' });

  rows.push({ kind: 'merged', text: 'MATERIAL PROPERTIES', style: 'section' });
  rows.push(
    dataRow(['10.', 'Concrete Grade', '', input.concreteGrade || 'M25', '', 'Affects design strength', '', ''], {
      editCol: 3,
      editField: 'concreteGrade',
      editType: 'text',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(['11.', 'Characteristic Strength (fck)', '', String(input.fck), 'MPa', 'Concrete compressive strength', '', ''], {
      editCol: 3,
      editField: 'fck',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['12.', 'Steel Grade', '', input.steelGrade || 'Fe415', '', 'Reinforcement steel type', '', ''], {
      editCol: 3,
      editField: 'steelGrade',
      editType: 'text',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(['13.', 'Yield Strength (fy)', '', String(input.fy), 'MPa', 'Steel yield strength', '', ''], {
      editCol: 3,
      editField: 'fy',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push({ kind: 'merged', text: '', style: 'plain' });

  rows.push({ kind: 'merged', text: 'SOIL PROPERTIES', style: 'section' });
  rows.push(
    dataRow(['14.', 'Safe Bearing Capacity (SBC)', '', String(input.sbc), 'kPa', 'Critical for foundation design', '', ''], {
      editCol: 3,
      editField: 'sbc',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['15.', 'Angle of Internal Friction (φ)', '', String(input.phi), 'degrees', 'Affects lateral earth pressure', '', ''], {
      editCol: 3,
      editField: 'phi',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['16.', 'Unit Weight of Soil (γ)', '', String(input.gamma), 'kN/m³', 'Soil density for calculations', '', ''], {
      editCol: 3,
      editField: 'gamma',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push({ kind: 'merged', text: '', style: 'plain' });

  const nPiers = Math.max(0, (input.numberOfSpans || 1) - 1);
  const vol = (input.pierWidth || 0) * (input.pierLength || 0) * (input.pierDepth || 0);
  const baseA = (input.pierBaseWidth || 0) * (input.pierBaseLength || 0);
  rows.push({ kind: 'merged', text: 'CALCULATED PIER PROPERTIES', style: 'section' });
  rows.push({
    kind: 'data',
    cells: pad8(['→', 'Number of Piers', '', String(nPiers), 'nos', 'Auto-calculated', '', '']),
    styles: { 3: 'calc' },
  });
  rows.push({
    kind: 'data',
    cells: pad8(['→', 'Pier Volume (per pier)', '', fmt(vol, 3), 'm³', 'For self-weight calculation', '', '']),
    styles: { 3: 'calc' },
  });
  rows.push({
    kind: 'data',
    cells: pad8(['→', 'Pier Self Weight', '', fmt(vol * 25, 1), 'kN', 'Concrete unit weight = 25 kN/m³', '', '']),
    styles: { 3: 'calc' },
  });
  rows.push({
    kind: 'data',
    cells: pad8(['→', 'Foundation Base Area', '', fmt(baseA, 3), 'm²', 'For bearing pressure calculation', '', '']),
    styles: { 3: 'calc' },
  });
  rows.push({
    kind: 'data',
    cells: pad8(['→', 'Impact Factor (IRC:6-2016)', '', fmt(4.5 / (6 + (input.spanLength || 1)), 4), '-', 'For live load amplification', '', '']),
    styles: { 3: 'calc' },
  });

  return { tab: 'INPUT-PIER-STABILITY', rows };
}

export function buildInputAbutmentSheet(input: ProjectInput): WbSheetModel {
  const rows: WbRow[] = [];
  rows.push({ kind: 'merged', text: 'ABUTMENT STABILITY DESIGN INPUT PARAMETERS', style: 'title' });
  rows.push({ kind: 'merged', text: '', style: 'plain' });
  rows.push({
    kind: 'merged',
    text: 'Instructions: Enter abutment geometry and soil parameters below. These values control abutment stability analysis for both TYPE1 and C1 designs.',
    style: 'instr',
  });
  rows.push({ kind: 'merged', text: '', style: 'plain' });

  rows.push({ kind: 'merged', text: 'GENERAL ABUTMENT DIMENSIONS', style: 'section' });
  rows.push(
    dataRow(['3.', 'Abutment Height', '', fmt(input.abutmentHeight, 2), 'm', 'From foundation to deck level', '', ''], {
      editCol: 3,
      editField: 'abutmentHeight',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['4.', 'Abutment Thickness', '', fmt(input.abutmentWidth, 3), 'm', 'Stem thickness for both types', '', ''], {
      editCol: 3,
      editField: 'abutmentWidth',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['5.', 'Abutment Depth', '', fmt(input.abutmentDepth, 2), 'm', 'Foundation depth', '', ''], {
      editCol: 3,
      editField: 'abutmentDepth',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['6.', 'Dirt Wall Height', '', fmt(input.dirtWallHeight, 2), 'm', '', '', ''], {
      editCol: 3,
      editField: 'dirtWallHeight',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push(
    dataRow(['7.', 'Return Wall Length', '', fmt(input.returnWallLength, 2), 'm', '', '', ''], {
      editCol: 3,
      editField: 'returnWallLength',
      styles: { 3: 'in-red' },
    }),
  );
  rows.push({ kind: 'merged', text: '', style: 'plain' });

  rows.push({ kind: 'merged', text: 'DESIGN LEVELS (workbook cross-links)', style: 'section' });
  rows.push(
    dataRow(['8.', 'RTL — Road Top Level', '', fmt(input.rtl, 3), 'm MSL', '', '', ''], {
      editCol: 3,
      editField: 'rtl',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(['9.', 'AGL — Avg Ground Level', '', fmt(input.agl, 3), 'm MSL', '', '', ''], {
      editCol: 3,
      editField: 'agl',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(['10.', 'NBL — Normal Bed Level', '', fmt(input.nbl, 3), 'm MSL', '', '', ''], {
      editCol: 3,
      editField: 'nbl',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(['11.', 'OFL — Ordinary Flood Level', '', fmt(input.ofl, 3), 'm MSL', '', '', ''], {
      editCol: 3,
      editField: 'ofl',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(['12.', 'DWL — Design Water Level', '', fmt(input.dwl, 3), 'm MSL', '', '', ''], {
      editCol: 3,
      editField: 'dwl',
      styles: { 3: 'in-yellow' },
    }),
  );
  rows.push(
    dataRow(['13.', 'Number of Lanes', '', String(input.numberOfLanes), '', 'IRC live load', '', ''], {
      editCol: 3,
      editField: 'numberOfLanes',
      styles: { 3: 'in-yellow' },
    }),
  );

  return { tab: 'INPUT-ABUTMENT-STABILITY', rows };
}
