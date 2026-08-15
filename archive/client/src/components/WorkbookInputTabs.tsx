import { useMemo, useState } from 'react';
import type { ProjectInput } from '../../../bridge-excel-generator/types';
import {
  INPUT_TEMPLATE_COL_WIDTHS_CH,
  buildInputHydraulicsSheet,
  buildInputPierSheet,
  buildInputAbutmentSheet,
  type WbCellStyle,
  type WbRow,
} from '@shared/input-workbook-previews';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

const styleClass = (s: WbCellStyle | undefined): string => {
  switch (s) {
    case 'title':
      return 'wb-in-title text-center font-bold text-[#0066cc] bg-[#e6f3ff]';
    case 'section':
      return 'wb-in-section text-left font-bold text-[#0066cc] bg-[#f0f8ff]';
    case 'instr':
      return 'wb-in-instr text-left italic text-[#666] text-[10px] leading-snug';
    case 'in-yellow':
      return 'wb-in-yellow bg-[#ffff99]';
    case 'in-red':
      return 'wb-in-red bg-[#ffe6e6]';
    case 'calc':
      return 'wb-in-calc bg-[#e6ffe6] font-mono text-[10px]';
    case 'hdr-grey':
      return 'wb-in-hdr bg-[#e0e0e0] font-bold text-center text-[10px]';
    default:
      return '';
  }
};

type Props = {
  draft: ProjectInput;
  onApply: (fn: (prev: ProjectInput) => ProjectInput) => void;
};

function CellInput({
  value,
  type,
  className,
  onCommit,
}: {
  value: string;
  type: 'text' | 'number';
  className: string;
  onCommit: (raw: string) => void;
}) {
  return (
    <input
      type={type === 'number' ? 'text' : 'text'}
      inputMode={type === 'number' ? 'decimal' : undefined}
      defaultValue={value}
      key={value}
      className={`box-border w-full min-w-0 border border-[#bfbfbf] px-1 py-0.5 text-[11px] ${className}`}
      onBlur={(e) => onCommit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

function renderRow(
  row: WbRow,
  ri: number,
  draft: ProjectInput,
  onApply: Props['onApply'],
) {
  if (row.kind === 'merged') {
    return (
      <tr key={ri} className="excel-print-avoid-break">
        <td colSpan={9} className={`border border-[#bfbfbf] px-1 py-0.5 ${styleClass(row.style)}`}>
          {row.text || '\u00a0'}
        </td>
      </tr>
    );
  }

  const { cells, editCol, editField, editType, styles, crossCells } = row;
  return (
    <tr key={ri} className="excel-print-avoid-break">
      <td className="wb-rn border border-[#bfbfbf] bg-[#f3f3f3] px-0.5 text-right text-[9px] text-[#595959]">
        {ri + 1}
      </td>
      {cells.map((text, ci) => {
        const st = styles?.[ci];
        const base = `border border-[#bfbfbf] px-1 py-0.5 text-[11px] ${styleClass(st)} ${ci >= 0 && (cells[ci] !== '' || st) ? 'cell-num' : ''}`;

        const cross = crossCells?.[ci];
        if (cross) {
          return (
            <td key={ci} className={base}>
              <CellInput
                value={text}
                type="number"
                className={styleClass('in-red')}
                onCommit={(raw) => {
                  const n = parseFloat(raw);
                  onApply((prev) => {
                    const pts = [...prev.crossSectionData];
                    const p = pts[cross.pointIndex];
                    if (!p) return prev;
                    pts[cross.pointIndex] = {
                      ...p,
                      [cross.field]: Number.isFinite(n) ? n : 0,
                    };
                    return { ...prev, crossSectionData: pts };
                  });
                }}
              />
            </td>
          );
        }

        if (editField !== undefined && editCol === ci) {
          return (
            <td key={ci} className={base}>
              <CellInput
                value={text}
                type={editType === 'text' ? 'text' : 'number'}
                className={styleClass(st as WbCellStyle)}
                onCommit={(raw) => {
                  onApply((prev) => {
                    if (editType === 'text') {
                      return { ...prev, [editField]: raw } as ProjectInput;
                    }
                    const n = parseFloat(raw);
                    const num = Number.isFinite(n) ? n : 0;
                    return { ...prev, [editField]: num } as ProjectInput;
                  });
                }}
              />
            </td>
          );
        }

        const isNum = st === 'calc' || /^-?[\d.]+([eE][+-]?\d+)?$/.test(text.trim());
        return (
          <td key={ci} className={`${base} ${isNum ? 'cell-num' : ''}`}>
            {text}
          </td>
        );
      })}
    </tr>
  );
}

export function WorkbookInputTabs({ draft, onApply }: Props) {
  const [tab, setTab] = useState(0);
  const sheets = useMemo(
    () => [buildInputHydraulicsSheet(draft), buildInputPierSheet(draft), buildInputAbutmentSheet(draft)],
    [draft],
  );
  const model = sheets[tab];

  return (
    <div className="glass-panel overflow-hidden p-0">
      <div className="flex flex-wrap border-b border-[var(--app-glass-border)] bg-app-card/50">
        {sheets.map((s, i) => (
          <button
            key={s.tab}
            type="button"
            onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
              tab === i
                ? 'border-b-2 border-app-accent text-app-fg bg-app-bg'
                : 'text-app-muted hover:text-app-fg'
            }`}
          >
            {s.tab}
          </button>
        ))}
      </div>
      <p className="border-b border-[var(--app-glass-border)] px-3 py-2 text-[10px] text-app-muted sm:text-xs">
        Layout mirrors Excel INPUT templates (columns A–H). Edit yellow/red cells; calculated rows follow the workbook
        colour cues.
      </p>
      <div className="excel-fidelity-viewport max-h-[min(72vh,720px)] overflow-auto bg-white p-2 text-slate-900 dark:bg-white dark:text-slate-900">
        <table className="excel-fidelity-sheet" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '2.2ch' }} />
            {INPUT_TEMPLATE_COL_WIDTHS_CH.map((ch, i) => (
              <col key={i} style={{ width: `${ch}ch` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="border border-[#bfbfbf] bg-[#d9d9d9] px-0.5 text-[9px]">#</th>
              {COLS.map((L) => (
                <th key={L} className="border border-[#bfbfbf] bg-[#d9d9d9] px-1 text-center text-[10px] font-semibold">
                  {L}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{model.rows.map((row, ri) => renderRow(row, ri, draft, onApply))}</tbody>
        </table>
      </div>
    </div>
  );
}
