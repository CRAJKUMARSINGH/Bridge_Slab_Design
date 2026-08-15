/** Grid snapshot of one worksheet (matches server workbook preview JSON). */
export type SheetPreview = {
  name: string;
  rowCount: number;
  colCount: number;
  rows: string[][];
};
