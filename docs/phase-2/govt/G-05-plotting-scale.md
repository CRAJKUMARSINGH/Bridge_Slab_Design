# G-05 — TRUE-SCALE PLOTTING (A1/A0, CALIBRATION, LINEWEIGHTS)
Prereq: W08A | Feeds: W12A

## The rule
A printed A1 sheet measured with a scale rule must read the true dimension. If it does
not, the drawing is decoration, not a deliverable.

## CODE — lib/drawing/sheet.ts
```ts
export const SHEETS = {
  A4: { mm: [297, 210] }, A3: { mm: [420, 297] }, A2: { mm: [594, 420] },
  A1: { mm: [841, 594] }, A0: { mm: [1189, 841] },
} as const;
export type SheetSize = keyof typeof SHEETS;
export const MM_TO_PT = 72 / 25.4;                       // 2.834645669

export const pageSizePt = (s: SheetSize, landscape = true): [number, number] => {
  const [w, h] = SHEETS[s].mm;
  return landscape ? [w * MM_TO_PT, h * MM_TO_PT] : [h * MM_TO_PT, w * MM_TO_PT];
};

/** model units are metres; at 1:100, 1 m of model = 10 mm on paper */
export const mmPerModelUnit = (scaleDenom: number) => 1000 / scaleDenom;

/** calibration bar: draws 0-1-2-3-4-5 m at true scale so a plot can be checked */
export function scaleBar(page: any, x: number, y: number, metres: number, scaleDenom: number, font: any) {
  const mm = mmPerModelUnit(scaleDenom) * metres;
  const pt = mm * MM_TO_PT;
  for (let i = 0; i <= metres; i++) {
    const seg = pt / metres, sx = x + i * seg;
    page.drawLine({ start: { x: sx, y }, end: { x: sx, y: y + (i % 1 === 0 ? 8 : 4) }, thickness: 0.5 });
    if (i < metres) page.drawRectangle({
      x: sx, y, width: seg, height: 3,
      color: i % 2 ? rgb(0,0,0) : rgb(1,1,1), borderColor: rgb(0,0,0), borderWidth: 0.3,
    });
  }
  page.drawText(`SCALE 1:${scaleDenom} — verify with a scale rule`, { x, y: y - 12, size: 7, font });
}
```

## CODE — lib/drawing/dxf-header.ts (DXF must declare its own units and scales)
```ts
export function dxfHeader(opts: { insUnits?: number; dimScale: number; ltScale: number; scaleDenom: number }) {
  const { insUnits = 6, dimScale, ltScale } = opts;      // 6 = metres
  return [
    "0","SECTION","2","HEADER",
    "9","$ACADVER","1","AC1015",
    "9","$INSUNITS","70",String(insUnits),
    "9","$MEASUREMENT","70","1",                          // metric
    "9","$DIMSCALE","40",dimScale.toFixed(4),
    "9","$LTSCALE","40",ltScale.toFixed(4),
    "9","$DIMASZ","40","2.5",                             // arrow size in mm-equivalent
    "9","$DIMTXT","40","2.5",
    "9","$PLIMCHECK","70","0",
    "0","ENDSEC",
  ].join("\n") + "\n";
}
```

## CODE — lib/drawing/lineweights.ts (plotter-safe, in mm)
```ts
export const LINEWEIGHT_MM = {
  OUTLINE: 0.50, HIDDEN: 0.25, DIM: 0.18, TEXT: 0.25, REBAR: 0.35,
  HATCH: 0.13, CENTRELINE: 0.18, TITLEBLOCK: 0.35, REVBLOCK: 0.25,
} as const;
```
Note honestly: a DXF carries lineweights; a **CTB plot-style table is plotter-side**.
Ship a `.ctb` and document that it must be loaded for correct output.

## CODE — verify:dxf scale assertion
```ts
// assert the sheet geometry at 1:100 maps to the expected paper mm within 0.2 mm
const expected = mmPerModelUnit(100) * modelWidthM;
assertNear(bboxWidthMm(dxf), expected, 0.2);
```

## Exit gate
[ ] PDF page size is exactly A1/A0 in mm at 100% print scale (measured, not asserted)
[ ] Calibration bar on every sheet
[ ] DXF declares $INSUNITS, $MEASUREMENT, $DIMSCALE, $LTSCALE
[ ] `.ctb` shipped and documented
[ ] verify:dxf asserts true scale within 0.2 mm
[ ] A plotter test: print one A1 sheet and measure it
