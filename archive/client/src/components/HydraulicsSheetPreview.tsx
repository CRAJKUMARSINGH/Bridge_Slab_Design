import { useEffect, useMemo, useState } from 'react';
import type { ProjectInput } from '../../../bridge-excel-generator/types';
import {
  applyHydraulicsCellEdit,
  buildHydraulicsPreviewRows,
  HYDRAULICS_PREVIEW_COLUMN_WIDTHS_CH,
  type HydraulicsPreviewCell,
} from '@shared/hydraulics-sheet-preview';

type Props = {
  input: ProjectInput;
  /** Wider scroll area when opened inside a glass modal */
  variant?: 'embedded' | 'modal';
  /**
   * When set, amber-highlighted cells in the HYDRAULICS mirror become editable.
   * Updates apply on blur / Enter and sync engine output via the parent.
   */
  onInputChange?: (next: ProjectInput) => void;
};

function InlineNumericEdit({
  cell,
  input,
  onCommit,
}: {
  cell: HydraulicsPreviewCell;
  input: ProjectInput;
  onCommit: (next: ProjectInput) => void;
}) {
  const edit = cell.editable;
  const [text, setText] = useState(cell.display);

  useEffect(() => {
    setText(cell.display);
  }, [cell.display]);

  if (!edit) return <>{cell.display}</>;

  const commit = () => {
    const next = applyHydraulicsCellEdit(input, edit, text);
    onCommit(next);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label="Editable hydraulics value"
      title="Editable — value applies when you leave this field"
      className={
        'cell-num box-border w-full min-w-[7ch] max-w-[16ch] rounded border border-amber-500/80 bg-amber-50 px-1 py-0.5 ' +
        'font-[inherit] text-inherit shadow-sm outline-none focus:ring-2 focus:ring-amber-500/80 ' +
        'dark:border-amber-400/70 dark:bg-amber-950/50'
      }
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

export function HydraulicsSheetPreview({ input, variant = 'embedded', onInputChange }: Props) {
  const model = useMemo(() => buildHydraulicsPreviewRows(input), [input]);

  const heightClass =
    variant === 'modal' ? 'max-h-[min(88vh,920px)] overflow-auto' : 'max-h-[min(75vh,640px)] overflow-auto';

  return (
    <div
      className={`excel-fidelity-viewport excel-fidelity-print-root rounded border border-slate-200 bg-white p-2 dark:border-white/20 ${heightClass}`}
    >
      <p className="excel-fidelity-caption text-slate-900">
        HYDRAULICS (live preview from ProjectInput)
        {onInputChange ? (
          <span className="ml-2 font-normal text-slate-600">
            — <span className="rounded border border-amber-500/80 bg-amber-50 px-1 dark:bg-amber-950/40">amber</span>{' '}
            cells are editable (apply on blur)
          </span>
        ) : null}
      </p>
      <table className="excel-fidelity-sheet">
        <colgroup>
          {HYDRAULICS_PREVIEW_COLUMN_WIDTHS_CH.map((ch, i) => (
            <col key={i} style={{ width: `${ch}ch` }} />
          ))}
        </colgroup>
        <tbody>
          {model.map((row, ri) => {
            if (row.type === 'merged') {
              if (row.text === '') {
                return (
                  <tr key={ri} className={row.className ?? ''}>
                    <td colSpan={8} className="excel-fidelity-spacer" aria-hidden />
                  </tr>
                );
              }
              return (
                <tr key={ri} className={row.className ?? ''}>
                  <td
                    colSpan={8}
                    className={row.bold && !row.className ? 'font-semibold text-center' : undefined}
                  >
                    {row.text}
                  </td>
                </tr>
              );
            }

            return (
              <tr key={ri} className="excel-print-avoid-break">
                {row.cells.map((cell, ci) => (
                  <td
                    key={ci}
                    className={[
                      cell.numeric ? 'cell-num' : '',
                      cell.bold ? 'font-semibold' : '',
                      cell.formula && ci === 7 ? 'cell-formula' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    title={cell.formula}
                  >
                    {ci === 7 && cell.formula ? (
                      <span className="cell-formula">{cell.formula}</span>
                    ) : cell.editable && onInputChange ? (
                      <InlineNumericEdit cell={cell} input={input} onCommit={onInputChange} />
                    ) : (
                      cell.display
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
