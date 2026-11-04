/**
 * Compatibility shim for legacy imports.
 * Newer implementations bundle estimation sheets in `29-46-estimation.ts`.
 */

export function getEstimationGrandTotalExcelRow(args: {
  boqCount: number;
  hasEstimationQuantities?: boolean;
}): number {
  const headerRows = 10;
  const boqRows = Math.max(0, args.boqCount);
  const subtotalOffset = 1;
  const profitOffset = 1;
  const overheadOffset = 1;
  const gstOffset = 1;
  const grandTotalOffset = 1;

  return (
    headerRows +
    boqRows +
    subtotalOffset +
    profitOffset +
    overheadOffset +
    gstOffset +
    grandTotalOffset
  );
}

