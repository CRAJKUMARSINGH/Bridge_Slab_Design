# G-03 — LOCALISATION (Hindi UI + BILINGUAL REPORT)
Prereq: G-02 | Feeds: W10, W11 — HARD PRECEDENCE (font must be embedded before PDF freeze)

## CODE — lib/i18n/catalogue.ts
```ts
export const en = {
  "app.title": "Bridge Report Studio",
  "nav.design": "Design", "nav.drawing": "Drawings", "nav.estimate": "Estimate",
  "check.overturning": "Overturning stability",
  "check.sliding": "Sliding stability",
  "check.bearing": "Base pressure",
  "status.PASS": "PASS", "status.FAIL": "FAIL", "status.REVIEW": "REVIEW",
  "report.certification": "Certification",
  "report.draft": "DRAFT — no licensed engineer has signed this run.",
  "unit.1in": "1 in {n}",
  "qty.value": "{v} {u}",
} as const;
export type MsgKey = keyof typeof en;

export const hi: Record<MsgKey, string> = {
  "app.title": "सेतु प्रतिवेदन स्टूडियो",
  "nav.design": "अभिकल्प", "nav.drawing": "आरेखण", "nav.estimate": "अनुमान",
  "check.overturning": "उत्पलन स्थायित्व",
  "check.sliding": "सर्पण स्थायित्व",
  "check.bearing": "आधार दाब",
  "status.PASS": "संतुष्ट", "status.FAIL": "असंतुष्ट", "status.REVIEW": "पुनरीक्षण",
  "report.certification": "प्रमाणन",
  "report.draft": "प्रारूप — किसी अधिकृत अभियंता द्वारा हस्ताक्षरित नहीं।",
  "unit.1in": "{n} में 1",
  "qty.value": "{v} {u}",
};
```

## CODE — lib/i18n/t.ts
```ts
export type Locale = "en" | "hi";
const CATS = { en, hi };
export function t(locale: Locale, key: MsgKey, vars: Record<string, string | number> = {}): string {
  const s = CATS[locale][key] ?? CATS.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
/** report mode: side-by-side bilingual for a government submission */
export function tb(key: MsgKey, vars?: Record<string, string | number>) {
  return { en: t("en", key, vars), hi: t("hi", key, vars) };
}
```

## CODE — lib/i18n/shape.ts (Devanagari needs shaping, not just a font)
```ts
// pdf-lib alone does not do complex-script shaping. Shape with harfbuzzjs, then draw glyph runs.
import initHarfBuzz from "harfbuzzjs";

let hb: any;
export async function shape(text: string, fontBytes: Uint8Array) {
  hb ??= await initHarfBuzz();
  const blob = hb.createBlob(fontBytes);
  const face = hb.createFace(blob, 0);
  const font = hb.createFont(face);
  const buffer = hb.createBuffer();
  buffer.addText(text);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  const glyphs = buffer.json() as { g: number; cl: number; dx: number; dy: number; ax: number; ay: number }[];
  buffer.destroy(); font.destroy(); face.destroy(); blob.destroy();
  return glyphs;                      // glyph ids + advances, correct for Devanagari clusters
}

/** draw a shaped run with pdf-lib */
export async function drawShaped(page: any, text: string, x: number, y: number, size: number, fontBytes: Uint8Array) {
  const runs = await shape(text, fontBytes);
  let cx = x;
  for (const g of runs) {
    page.drawText(String.fromCharCode(g.g), { x: cx, y, size });   // via a glyph-id font subset
    cx += (g.ax / 1000) * size;
  }
}
```

## Fonts
`lib/report/fonts/NotoSans-Regular.ttf`, `lib/report/fonts/NotoSans-Bold.ttf` (Latin) and
`lib/report/fonts/NotoSansDevanagari-Regular.ttf`, `lib/report/fonts/NotoSansDevanagari-Bold.ttf`,
subset-embedded.
Register with `@pdf-lib/fontkit`. Ship them in `lib/report/fonts/`, licence OFL, recorded
in a font register.
Governing decision: ADR-0008 keeps one PDF writer (jspdf); ADR-0010 admits shaping for
Devanagari. This file's `pdf-lib` samples describe the shaping pipeline, not a second
writer.

## Report modes
`locale: "en" | "hi" | "bilingual"`. Bilingual renders a two-column table for every
labelled value and every check title. Numbers stay Latin numerals in both.

## Exit gate
[ ] Typed catalogue: `hi` is exhaustive over `MsgKey` (compile error if a key is missed)
[ ] Hindi renders correctly in the PDF — conjuncts and matras, not broken glyphs
[ ] Bilingual report mode produces a reviewer-readable two-column layout
[ ] Dates DD/MM/YYYY; numbers Indian-grouped; rupees in words
[ ] No hardcoded English string in any report template (grep gate)
