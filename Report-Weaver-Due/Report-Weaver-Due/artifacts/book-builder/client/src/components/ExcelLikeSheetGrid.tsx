import type { SheetPreview } from '@/types/sheetPreview';

function colLetters(n: number): string[] {
  const out: string[] = [];
  for (let c = 0; c < n; c++) {
    let x = c + 1;
    let s = '';
    while (x > 0) {
      const m = (x - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      x = Math.floor((x - 1) / 26);
    }
    out.push(s);
  }
  return out;
}

type Props = {
  sheet: SheetPreview;
  /** e.g. min(70vh, 720px) — pier sheet is tall */
  maxHeight?: string;
  /** Slightly larger cells for readability on dedicated sheet pages */
  cellClassName?: string;
};

/**
 * Excel-style grid (row numbers + column letters) — same rendering as Design workbook viewer.
 */
export function ExcelLikeSheetGrid({ sheet, maxHeight = 'min(70vh, 640px)', cellClassName }: Props) {
  const letters = colLetters(sheet.colCount);
  const tdClass = cellClassName ?? 'border border-[#bfbfbf] px-1 py-0.5 align-top text-[10px] leading-snug';

  return (
    <div
      className="excel-fidelity-viewport overflow-auto bg-white p-2 text-slate-900 dark:bg-white"
      style={{ maxHeight }}
    >
      <table className="excel-fidelity-sheet text-[10px]" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th className="border border-[#bfbfbf] bg-[#d9d9d9] px-0.5 text-[9px]"> </th>
            {letters.map((L) => (
              <th
                key={L}
                className="border border-[#bfbfbf] bg-[#d9d9d9] px-0.5 text-center text-[9px] font-semibold"
              >
                {L}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((row, ri) => (
            <tr key={ri} className="excel-print-avoid-break">
              <td className="wb-rn border border-[#bfbfbf] bg-[#f3f3f3] px-0.5 text-right text-[9px] text-[#595959]">
                {ri + 1}
              </td>
              {row.map((cell, ci) => (
                <td key={ci} className={tdClass} title={cell}>
                  {cell || '\u00a0'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
