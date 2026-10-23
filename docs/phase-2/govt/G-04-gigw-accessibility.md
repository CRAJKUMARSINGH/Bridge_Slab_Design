# G-04 — GIGW 3.0 + WCAG 2.2 AA FOR GOVERNMENT PORTALS
Prereq: W11 | Feeds: W12

## GIGW mapping (each row needs a test, not a claim)
| GIGW requirement | Implementation | Test |
| Quality 1.1 govt identity | footer: dept, NIC, "Government of Rajasthan" | snapshot |
| 1.2 date of last update | footer, generated | snapshot |
| 2.1 all pages reachable by keyboard | focus trap + skip link | keyboard walkthrough |
| 3.1 language attribute | `<html lang>` switches with locale | assertion |
| 3.2 Hindi content | G-03 catalogue | key coverage |
| 4.1 screen-reader labels | Field component | axe |
| 5.1 text resizing 200% | rem-only typography | zoom test |
| 6.1 alt text | every figure | axe |
| 7.1 form labels associated | Field component | axe |
| 8.1 colour contrast 4.5:1 | token audit, both themes | contrast script |

## CODE — client/src/components/Field.tsx
```tsx
export function Field({ id, label, unit, hint, error, required, children }: FieldProps) {
  const hintId = `${id}-hint`, errId = `${id}-err`;
  return (
    <div className="field" data-invalid={!!error}>
      <label htmlFor={id}>
        {label}{required && <span aria-hidden="true"> *</span>}
        {unit && <span className="unit" aria-hidden="true"> ({unit})</span>}
      </label>
      {cloneElement(children as any, {
        id, required,
        "aria-describedby": [hint && hintId, error && errId].filter(Boolean).join(" ") || undefined,
        "aria-invalid": !!error,
      })}
      {hint && <p id={hintId} className="hint">{hint}</p>}
      {error && <p id={errId} className="error" role="alert">{error}</p>}
    </div>
  );
}
```

## CODE — client/src/hooks/useFocusTrap.ts
```ts
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const prev = document.activeElement as HTMLElement | null;
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
    const first = el.querySelectorAll<HTMLElement>(sel)[0];
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = [...el.querySelectorAll<HTMLElement>(sel)].filter(n => n.offsetParent !== null);
      if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && el.dispatchEvent(new Event("trap:escape"));
    el.addEventListener("keydown", onKey); el.addEventListener("keydown", onEsc);
    return () => { el.removeEventListener("keydown", onKey); el.removeEventListener("keydown", onEsc); prev?.focus(); };
  }, [active]);
  return ref;
}
```

## CODE — scripts/gates/gate-a11y.mjs
```js
import puppeteer from "puppeteer";
import { AxePuppeteer } from "@axe-core/puppeteer";

const ROUTES = ["/", "/design", "/drawing", "/estimate", "/projects", "/report"];
const BASE = process.env.PREVIEW_URL ?? "http://localhost:5000";
const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
let fail = 0;
for (const route of ROUTES) {
  const page = await browser.newPage();
  await page.goto(BASE + route, { waitUntil: "networkidle0" });
  const { violations } = await new AxePuppeteer(page).withTags(["wcag2aa", "wcag22aa"]).analyze();
  const bad = violations.filter(v => v.impact === "critical" || v.impact === "serious");
  console.log(`${route}: ${bad.length} critical/serious`);
  bad.forEach(v => console.log(`  ${v.id} — ${v.help} (${v.nodes.length})`));
  fail += bad.length;
  await page.close();
}
await browser.close();
console.log(`GATE gate:a11y: ${fail === 0 ? "PASS" : "FAIL"} ${ROUTES.length} routes`);
process.exit(fail === 0 ? 0 : 1);
```

## CODE — client/src/components/SkipLink.tsx
```tsx
export const SkipLink = () => (
  <a href="#main" className="skip">Skip to main content / मुख्य सामग्री पर जाएँ</a>
);
```

## Exit gate
[ ] axe zero critical/serious on 6 routes, both themes, artifact attached
[ ] Full keyboard walkthrough documented step by step
[ ] 200% zoom and 320 px width usable
[ ] GIGW table has a passing test per row
[ ] `lang` switches with locale; Hindi screen-reader labels present
