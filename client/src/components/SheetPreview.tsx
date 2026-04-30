/**
 * SheetPreview — Excel-fidelity HTML renderer
 * Rules:
 *  - No transform:scale, no viewport zoom
 *  - overflow-x:auto at natural cell size
 *  - Formula column visible alongside value
 *  - Workbook-like grid: borders, header bands, monospace numbers
 */

import type { ReportCell } from '../../../bridge-excel-generator/report-model';

/** Section band (spans full width); no value column */
type SheetRowHeader = { isHeader: true; label: string };

/** Data row: Ref / Description / Value / Unit / Formula */
type SheetRowData = {
  isHeader?: false;
  ref?: string;
  label: string;
  value: number | string;
  unit?: string;
  formula?: string;
  isSummary?: boolean;
};

type SheetRow = SheetRowHeader | SheetRowData;

interface SheetPreviewProps {
  title: string;
  rows: SheetRow[];
  columns?: string[];    // column headers
}

const CELL = 'border border-slate-300 px-2 py-1 text-sm';
const NUM  = `${CELL} text-right font-mono tabular-nums`;
const HDR  = 'bg-[#1F496B] text-white font-bold text-xs px-2 py-1 border border-[#1F496B]';
const SUMM = 'bg-yellow-50 font-bold';

export function SheetPreview({ title, rows, columns }: SheetPreviewProps) {
  const cols = columns ?? ['Ref', 'Description', 'Value', 'Unit', 'Formula'];

  return (
    <div className="excel-fidelity-viewport rounded border border-slate-300 bg-white">
      {/* Sheet tab */}
      <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 border-b border-slate-300">
        <span className="text-xs font-semibold text-[#1F496B] uppercase tracking-wide">{title}</span>
      </div>

      {/* Scrollable grid — no shrink */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '70vh' }}>
        <table
          style={{ borderCollapse: 'collapse', minWidth: 'max-content', fontFamily: 'Calibri, Arial, sans-serif', fontSize: 13 }}
        >
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c} className={HDR} style={{ minWidth: c === 'Formula' ? 280 : c === 'Description' ? 260 : 80 }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              if (row.isHeader) {
                return (
                  <tr key={i}>
                    <td colSpan={cols.length}
                      className="bg-[#D9E1F2] text-[#1F496B] font-bold text-xs px-2 py-1 border border-slate-300 uppercase tracking-wide">
                      {row.label}
                    </td>
                  </tr>
                );
              }

              const rowCls = row.isSummary ? SUMM : i % 2 === 0 ? 'bg-white' : 'bg-slate-50';

              return (
                <tr key={i} className={rowCls}>
                  {/* Ref */}
                  <td className={`${CELL} text-slate-400 font-mono text-xs w-16`}>{row.ref ?? ''}</td>
                  {/* Description */}
                  <td className={`${CELL} text-slate-700`}>{row.label}</td>
                  {/* Value */}
                  <td className={`${NUM} ${row.isSummary ? 'text-[#1F496B]' : 'text-slate-900'}`}>
                    {typeof row.value === 'number' ? row.value.toLocaleString('en-IN', { maximumFractionDigits: 4 }) : row.value}
                  </td>
                  {/* Unit */}
                  <td className={`${CELL} text-slate-500 text-xs w-20`}>{row.unit ?? ''}</td>
                  {/* Formula */}
                  <td className={`${CELL} font-mono text-xs text-emerald-700 bg-emerald-50/40`}>
                    {row.formula ? `=${row.formula}` : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Build rows for the HYDRAULICS sheet from the report model */
export function buildHydraulicsRows(cells: Record<string, ReportCell>): SheetRow[] {
  const get = (id: string) => cells[id];
  const rows: SheetRow[] = [];

  rows.push({ label: 'CROSS-SECTION DATA', isHeader: true });
  rows.push({ ref: 'F4',  label: 'Highest Flood Level (HFL)',    value: get('hyd.hfl')?.value ?? '',    unit: 'm MSL', formula: 'F4 = HFL (input)' });
  rows.push({ ref: '',    label: 'Bed Level',                     value: get('hyd.bedLevel')?.value ?? '', unit: 'm MSL' });
  rows.push({ ref: 'C32', label: "Manning's Rugosity (n)",        value: get('hyd.manningN')?.value ?? '', unit: '',     formula: 'C32 = n (input)' });
  rows.push({ ref: 'C33', label: 'Bed Slope (1 in X)',            value: get('hyd.bedSlope')?.value ?? '', unit: '',     formula: "C33 = 'Bed Slope'!J24" });

  rows.push({ label: 'AREA-VELOCITY METHOD', isHeader: true });
  rows.push({ ref: 'F27', label: 'Cross-Sectional Area (A)',      value: get('hyd.area')?.value ?? '',   unit: 'm²',   formula: 'F27 = SUM(F6:F26)' });
  rows.push({ ref: 'G27', label: 'Wetted Perimeter (P)',          value: get('hyd.perim')?.value ?? '',  unit: 'm',    formula: 'G27 = SUM(G6:G26)' });
  rows.push({ ref: 'C31', label: 'Hydraulic Radius (R = A/P)',    value: get('hyd.radius')?.value ?? '', unit: 'm',    formula: 'C31 = C29/C30' });
  rows.push({ ref: 'C34', label: "Manning's Velocity (V)",        value: get('hyd.vel')?.value ?? '',    unit: 'm/s',  formula: 'C34 = (1/n)×R^(2/3)×√(1/S)' });
  rows.push({ ref: 'C35', label: 'Discharge (Q = A × V)',         value: get('hyd.Q')?.value ?? '',      unit: 'm³/s', formula: 'C35 = C29×C34', isSummary: true });

  rows.push({ label: 'REGIME & SCOUR', isHeader: true });
  rows.push({ ref: '',    label: 'Regime Width (4.8√Q)',          value: get('hyd.regime')?.value ?? '', unit: 'm' });
  rows.push({ ref: '',    label: 'Scour Depth (dsm)',             value: get('hyd.scour')?.value ?? '',  unit: 'm' });
  rows.push({ ref: '',    label: 'Design Scour Depth (2×dsm)',    value: get('hyd.scour2')?.value ?? '', unit: 'm', isSummary: true });

  rows.push({ label: 'AFFLUX (Molesworth Formula)', isHeader: true });
  rows.push({ ref: 'B78', label: 'Afflux (h)',                    value: get('afl.afflux')?.value ?? '', unit: 'm',    formula: 'ROUNDUP(((V²/17.85)+0.0152)×((A/a)²-1),2)' });
  rows.push({ ref: 'F79', label: 'Design Water Level (HFL+h)',    value: get('afl.dwl')?.value ?? '',    unit: 'm MSL', formula: 'F79 = B79+D79', isSummary: true });
  rows.push({ ref: 'B33', label: 'Scour Depth (Lacey)',           value: get('afl.scour')?.value ?? '',  unit: 'm',    formula: 'B33 = ROUNDUP(1.34×(q²/f)^(1/3),2)' });

  rows.push({ label: 'FLOW CHARACTERISTICS', isHeader: true });
  rows.push({ ref: '',    label: 'Froude Number (Fr = V/√gh)',    value: get('hyd.froude')?.value ?? '', unit: '' });
  rows.push({ ref: '',    label: 'Flow Type',                     value: get('hyd.flow')?.value ?? '',   unit: '' });

  return rows;
}
