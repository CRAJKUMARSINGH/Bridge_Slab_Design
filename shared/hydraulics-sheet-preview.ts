/**
 * HYDRAULICS sheet mirror for HTML preview (Phase 3 pilot).
 * Row layout and formula text follow bridge-excel-generator/sheets/04-hydraulics.ts.
 */

import type { ProjectInput } from '../bridge-excel-generator/types';

export const HYDRAULICS_PREVIEW_COLUMN_WIDTHS_CH = [
  12, 12, 20, 18, 25, 35, 25, 36,
] as const;

/** ProjectInput fields that appear as direct numeric inputs on the HYDRAULICS preview */
export type EditableHydraulicsField =
  | 'hfl'
  | 'manningN'
  | 'bedSlope'
  | 'rtl'
  | 'agl'
  | 'nbl'
  | 'ofl'
  | 'foundationLevel';

export type HydraulicsCellEdit =
  | { type: 'field'; key: EditableHydraulicsField }
  | { type: 'cross'; rowIndex: number; field: 'chainage' | 'gl' };

export type HydraulicsPreviewCell = {
  display: string;
  formula?: string;
  numeric?: boolean;
  bold?: boolean;
  /** When set, the cell can be edited on-screen (HYDRAULICS mirror → ProjectInput) */
  editable?: HydraulicsCellEdit;
};

export type HydraulicsPreviewRow =
  | { type: 'merged'; text: string; bold?: boolean; className?: string }
  | { type: 'cells'; cells: HydraulicsPreviewCell[] };

function fmt(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(decimals);
}

/**
 * Apply a single in-sheet edit back onto ProjectInput (used by client HYDRAULICS preview).
 */
export function applyHydraulicsCellEdit(
  input: ProjectInput,
  edit: HydraulicsCellEdit,
  raw: string,
): ProjectInput {
  const n = parseFloat(String(raw).replace(/,/g, '').trim());
  const num = Number.isFinite(n) ? n : 0;
  if (edit.type === 'field') {
    return { ...input, [edit.key]: num };
  }
  const pts = [...input.crossSectionData];
  const idx = edit.rowIndex;
  if (idx < 0 || idx >= pts.length) return input;
  pts[idx] = { ...pts[idx], [edit.field]: num };
  return { ...input, crossSectionData: pts };
}

/** Excel HYDRAULICS!F4 — HFL (m MSL). */
export function hydraulicsHflCellRef(): string {
  return '$F$4';
}

export function buildHydraulicsPreviewRows(input: ProjectInput): HydraulicsPreviewRow[] {
  const rows: HydraulicsPreviewRow[] = [];
  const pts = input.crossSectionData;
  const n = pts.length;

  const startDataRow = 6;
  const lastDataRow = 5 + n;
  const totalRow = 7 + n;
  const aRow = 9 + n;
  const pRow = 10 + n;
  const nRow = 12 + n;
  const sRow = 13 + n;
  const vRow = 14 + n;

  rows.push({
    type: 'merged',
    text: 'DETERMINATION OF VELOCITY AT PROPOSED SUBMERSIBLE BRIDGE SITE',
    bold: true,
  });
  rows.push({ type: 'merged', text: `Name Of Work :- ${input.projectName}` });
  rows.push({ type: 'merged', text: 'AS PER UP-STREAM SECTION', bold: true });

  rows.push({
    type: 'cells',
    cells: [
      { display: 'HIGHEST FLOOD LEVEL', bold: true },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: fmt(input.hfl, 3), numeric: true, editable: { type: 'field', key: 'hfl' } },
      { display: 'M' },
      { display: '', formula: `HFL @ ${hydraulicsHflCellRef()}` },
    ],
  });

  rows.push({
    type: 'cells',
    cells: [
      { display: 'CHAINAGE', bold: true },
      { display: 'G.L.', bold: true },
      { display: 'DEPTH OF FLOW IN  M', bold: true },
      { display: 'LENGTH OF FLOW', bold: true },
      { display: 'AVERAGE DEPTH OF FLOW', bold: true },
      { display: 'CROSS SECTIONAL AREA OF FLOW', bold: true },
      { display: 'WETTED PERIMETER', bold: true },
      { display: 'Excel formula (preview)', bold: true },
    ],
  });

  let sumF = 0;
  let sumG = 0;

  for (let i = 0; i < n; i++) {
    const point = pts[i];
    const next = pts[i + 1];
    const r = startDataRow + i;
    const depth = Math.max(0, input.hfl - point.gl);
    const depthNext = next ? Math.max(0, input.hfl - next.gl) : 0;

    const cF = `=IF(${hydraulicsHflCellRef()}-B${r}>0,${hydraulicsHflCellRef()}-B${r},0)`;
    let len = 0;
    let avgD = 0;
    let area = 0;
    let wet = 0;
    let dF = '';
    let eF = '';
    let fF = '';
    let gF = '';

    if (next) {
      len = next.chainage - point.chainage;
      dF = `=A${r + 1}-A${r}`;
      eF = `=IF(C${r}>0,(C${r}+C${r + 1})/2,0)`;
      avgD = depth > 0 ? (depth + depthNext) / 2 : 0;
      fF = `=E${r}*D${r}`;
      area = avgD * len;
      gF = `=SQRT(POWER(D${r},2)+POWER(B${r + 1}-B${r},2))`;
      wet = Math.sqrt(len * len + (next.gl - point.gl) ** 2);
      sumF += area;
      sumG += wet;
    }

    const formulaCol = [cF, dF, eF, fF, gF].filter(Boolean).join(' | ');

    rows.push({
      type: 'cells',
      cells: [
        {
          display: fmt(point.chainage, 2),
          numeric: true,
          editable: { type: 'cross', rowIndex: i, field: 'chainage' },
        },
        {
          display: fmt(point.gl, 3),
          numeric: true,
          editable: { type: 'cross', rowIndex: i, field: 'gl' },
        },
        { display: fmt(depth, 3), numeric: true, formula: cF },
        {
          display: next ? fmt(len, 2) : '',
          numeric: !!next,
          formula: dF || undefined,
        },
        {
          display: next ? fmt(avgD, 4) : '',
          numeric: !!next,
          formula: eF || undefined,
        },
        {
          display: next ? fmt(area, 4) : '',
          numeric: !!next,
          formula: fF || undefined,
        },
        {
          display: next ? fmt(wet, 4) : '',
          numeric: !!next,
          formula: gF || undefined,
        },
        { display: '', formula: formulaCol || undefined },
      ],
    });
  }

  rows.push({ type: 'merged', text: '' });

  const lastChain = n > 0 ? pts[n - 1].chainage : 0;

  rows.push({
    type: 'cells',
    cells: [
      { display: '' },
      { display: '' },
      { display: 'TOTAL', bold: true },
      {
        display: fmt(lastChain, 2),
        numeric: true,
        formula: `=A${lastDataRow}`,
      },
      { display: '' },
      {
        display: fmt(sumF, 4),
        numeric: true,
        formula: `=SUM(F${startDataRow}:F${lastDataRow})`,
      },
      {
        display: fmt(sumG, 4),
        numeric: true,
        formula: `=SUM(G${startDataRow}:G${lastDataRow})`,
      },
      { display: '', formula: `Row ${totalRow}` },
    ],
  });

  rows.push({ type: 'merged', text: '' });

  const rHyd = sumG > 0 ? sumF / sumG : 0;
  const vCalc =
    (1 / input.manningN) * Math.pow(rHyd, 2 / 3) * Math.sqrt(1 / input.bedSlope);
  const qCalc = sumF * vCalc;

  rows.push({
    type: 'cells',
    cells: [
      { display: '' },
      { display: 'A', bold: true },
      { display: fmt(sumF, 4), numeric: true, formula: `=F${totalRow}` },
      { display: 'SQM' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '', formula: `=F${totalRow}` },
    ],
  });
  rows.push({
    type: 'cells',
    cells: [
      { display: '' },
      { display: 'P', bold: true },
      { display: fmt(sumG, 4), numeric: true, formula: `=G${totalRow}` },
      { display: 'M' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '', formula: `=G${totalRow}` },
    ],
  });
  rows.push({
    type: 'cells',
    cells: [
      { display: '' },
      { display: 'R', bold: true },
      { display: fmt(rHyd, 4), numeric: true, formula: `=B${aRow}/B${pRow}` },
      { display: 'M' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '', formula: `=B${aRow}/B${pRow}` },
    ],
  });
  rows.push({
    type: 'cells',
    cells: [
      { display: '' },
      { display: 'N', bold: true },
      { display: String(input.manningN), numeric: true, editable: { type: 'field', key: 'manningN' } },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
    ],
  });
  rows.push({
    type: 'cells',
    cells: [
      { display: '' },
      { display: 'S       1 IN', bold: true },
      { display: String(input.bedSlope), numeric: true, editable: { type: 'field', key: 'bedSlope' } },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
    ],
  });
  rows.push({
    type: 'cells',
    cells: [
      { display: '' },
      { display: 'V', bold: true },
      {
        display: fmt(vCalc, 4),
        numeric: true,
        formula: `=(1/B${nRow})*POWER(B${aRow}/B${pRow},2/3)*SQRT(1/C${sRow})`,
      },
      { display: 'M/SEC' },
      { display: '' },
      { display: '' },
      { display: '' },
      {
        display: '',
        formula: `=(1/B${nRow})*POWER(B${aRow}/B${pRow},2/3)*SQRT(1/C${sRow})`,
      },
    ],
  });
  rows.push({
    type: 'cells',
    cells: [
      { display: '' },
      { display: 'Q', bold: true },
      { display: fmt(qCalc, 4), numeric: true, formula: `=B${aRow}*B${vRow}` },
      { display: 'CUMECS' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '', formula: `=B${aRow}*B${vRow}` },
    ],
  });

  rows.push({
    type: 'cells',
    cells: [
      { display: '' },
      { display: 'The design engineer visually observed the river to ascertain' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
    ],
  });

  rows.push({
    type: 'cells',
    cells: [
      { display: '' },
      { display: 'Design Discharge =', bold: true },
      { display: fmt(qCalc, 4), numeric: true, formula: `=B${vRow - 1}` },
      { display: 'CUMECS' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '', formula: `=B${vRow - 1}` },
    ],
  });

  rows.push({ type: 'merged', text: '' });

  rows.push({
    type: 'merged',
    text: 'Critical Levels',
    bold: true,
    className: 'excel-fidelity-section-break',
  });

  const levelsMeta: { label: string; value: number; key?: EditableHydraulicsField }[] = [
    { label: 'Road top level (RTL)', value: input.rtl, key: 'rtl' },
    { label: 'Average Ground Level(AGL)', value: input.agl, key: 'agl' },
    { label: 'Average Height Of Bridge', value: input.rtl - input.nbl },
    { label: 'Lowest Nala Bed level (NBL)', value: input.nbl, key: 'nbl' },
    { label: 'Ordinary flood level (OFL)', value: input.ofl, key: 'ofl' },
    { label: 'Foundation level (FL)', value: input.foundationLevel, key: 'foundationLevel' },
    { label: 'Ht. of bridge h= (RTL-NBL)', value: input.rtl - input.nbl },
    { label: 'Ht. of bridge H=(RTL-FL)', value: input.rtl - input.foundationLevel },
  ];

  for (const row of levelsMeta) {
    rows.push({
      type: 'cells',
      cells: [
        { display: row.label },
        {
          display: fmt(row.value, 3),
          numeric: true,
          editable: row.key ? { type: 'field', key: row.key } : undefined,
        },
        { display: 'm' },
        { display: '' },
        { display: '' },
        { display: '' },
        { display: '' },
        { display: '' },
      ],
    });
  }

  rows.push({
    type: 'cells',
    cells: [
      { display: '** Needs Rational Evaluation w.r.t. afflux.' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
    ],
  });
  rows.push({
    type: 'cells',
    cells: [
      { display: '** Average of GL for points lying below HFL.' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
      { display: '' },
    ],
  });

  return rows;
}
