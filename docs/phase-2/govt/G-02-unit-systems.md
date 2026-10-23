# G-02 — UNIT SYSTEMS (SI / FPS / PWD-LEGACY)
Prereq: W02 (engine) | Feeds: W03, W07A, W09A, W10 — HARD PRECEDENCE
Risk: HIGH — the source workbooks mix T, kN, kg/cm2, N/mm2 in a single sheet (D-14).

## Rule
A dimensional engine input is NEVER a bare `number`. It is a `Quantity`.
Conversion happens exactly once, at the boundary, and the conversion trace is printed.

## CODE — lib/units/quantity.ts
```ts
export const DIMENSIONS = ["LENGTH","AREA","VOLUME","MASS","FORCE","MOMENT","PRESSURE",
  "STRESS","DENSITY","VELOCITY","DISCHARGE","SLOPE","TEMPERATURE","COUNT","UNITLESS"] as const;
export type Dimension = (typeof DIMENSIONS)[number];
export type System = "SI" | "FPS" | "PWD_LEGACY";

export interface UnitDef { symbol: string; dimension: Dimension; toSI: number; offset?: number; system: System }

export const UNITS: Record<string, UnitDef> = {
  m:   { symbol:"m",   dimension:"LENGTH",  toSI:1,        system:"SI" },
  ft:  { symbol:"ft",  dimension:"LENGTH",  toSI:0.3048,   system:"FPS" },
  in:  { symbol:"in",  dimension:"LENGTH",  toSI:0.0254,   system:"FPS" },
  Rmt: { symbol:"Rmt", dimension:"LENGTH",  toSI:1,        system:"PWD_LEGACY" },
  kN:  { symbol:"kN",  dimension:"FORCE",   toSI:1,        system:"SI" },
  T:   { symbol:"T",   dimension:"FORCE",   toSI:9.80665,  system:"PWD_LEGACY" },
  kgf: { symbol:"kgf", dimension:"FORCE",   toSI:0.00980665, system:"PWD_LEGACY" },
  "kN/m2": { symbol:"kN/m2", dimension:"PRESSURE", toSI:1,       system:"SI" },
  "kg/cm2":{ symbol:"kg/cm2",dimension:"PRESSURE", toSI:98.0665, system:"PWD_LEGACY" },
  "N/mm2": { symbol:"N/mm2", dimension:"STRESS",   toSI:1,       system:"SI" },
  Cum: { symbol:"Cum", dimension:"VOLUME",  toSI:1,         system:"PWD_LEGACY" },
  Cft: { symbol:"Cft", dimension:"VOLUME",  toSI:0.0283168, system:"FPS" },
  MT:  { symbol:"MT",  dimension:"MASS",    toSI:1000,      system:"PWD_LEGACY" },
  cumecs: { symbol:"cumecs", dimension:"DISCHARGE", toSI:1, system:"SI" },
  cusecs: { symbol:"cusecs", dimension:"DISCHARGE", toSI:0.0283168, system:"FPS" },
  "1in":  { symbol:"1 in N", dimension:"SLOPE", toSI:1, system:"PWD_LEGACY" },
};

export interface Quantity<D extends Dimension = Dimension> { readonly value:number; readonly unit:string; readonly dimension:D }

export function q<D extends Dimension>(value: number, unit: string, dimension: D): Quantity<D> {
  const d = UNITS[unit];
  if (!d) throw new UnitError(`unknown unit ${unit}`);
  if (d.dimension !== dimension) throw new UnitError(`${unit} is ${d.dimension}, expected ${dimension}`);
  return Object.freeze({ value, unit, dimension });
}
export const toSI = (x: Quantity) => x.value * UNITS[x.unit].toSI;
export const convert = <D extends Dimension>(x: Quantity<D>, to: string): Quantity<D> => {
  const d = UNITS[to];
  if (!d || d.dimension !== x.dimension) throw new UnitError(`cannot convert ${x.unit} -> ${to}`);
  return q((x.value * UNITS[x.unit].toSI) / d.toSI, to, x.dimension);
};
/** legacy "1 in N" slope -> dimensionless */
export const slopeFromRatio = (n: number) => q(1 / n, "1in", "SLOPE");
```

## CODE — lib/units/format.ts (Indian grouping — see live demo above)
```ts
export function formatIndian(n: number, dp = 2): string {
  const neg = n < 0, s = Math.abs(n).toFixed(dp).split(".");
  let whole = s[0].slice(-3), rest = s[0].slice(0, -3);
  if (rest) rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return (neg ? "-" : "") + (rest ? rest + "," : "") + whole + "." + s[1];
}
const ONES = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven",
  "Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
const TENS = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
const two = (n:number) => n < 20 ? ONES[n] : TENS[(n/10)|0] + (n%10 ? " " + ONES[n%10] : "");
const three = (n:number) => (n > 99 ? ONES[(n/100)|0] + " Hundred" + (n%100 ? " " : "") : "") + (n%100 ? two(n%100) : "");

export function inIndianWords(n: number): string {
  n = Math.floor(Math.abs(n)); if (!n) return "Zero";
  const cr = (n/1e7)|0, r1 = n%1e7, lk = (r1/1e5)|0, r2 = r1%1e5, th = (r2/1000)|0, r3 = r2%1000;
  const out: string[] = [];
  if (cr) out.push(three(cr) + " Crore");
  if (lk) out.push(three(lk) + " Lakh");
  if (th) out.push(three(th) + " Thousand");
  if (r3) out.push(three(r3));
  return out.join(" ");
}
export function rupeesInWords(n: number): string {
  const whole = Math.floor(Math.abs(n)), paise = Math.round((Math.abs(n) - whole) * 100);
  return `Rupees ${inIndianWords(whole)}${paise ? " and Paise " + two(paise) : ""} Only`;
}
```

## CODE — lib/units/zod.ts
```ts
export const quantity = <D extends Dimension>(dimension: D) =>
  z.object({ value: z.number().finite(), unit: z.string().refine(u => UNITS[u]?.dimension === dimension,
    `wrong dimension for ${dimension}`), dimension: z.literal(dimension) })
   .transform(v => q(v.value, v.unit, dimension));
```

## Enforcement
ESLint `no-restricted-syntax`: forbid `number` on annotated dimensional engine params —
verify by a `gate:units` script that greps engine signatures for bare `: number` on the
13 dimensional fields and fails on a hit.

## Exit gate
[ ] Every dimensional engine input is a Quantity (gate:units green)
[ ] Legacy units parse from the corpus workbooks and normalise with a printed trace (D-14)
[ ] Indian grouping and rupees-in-words match the live demo exactly
[ ] FPS round-trip is lossless within 1e-12
[ ] A wrong-dimension input throws UnitError, not NaN
