import { useState, useRef } from "react";
import {
  computeHydraulics,
  HydraulicInputs,
  HydraulicResult,
  DEFAULT_HYDRAULIC,
} from "@/report-engine/lib/hydraulicCalc";
import HydraulicReport from "@/report-engine/components/HydraulicReport";
import { AstraContextPanel } from "@/components/AstraContextPanel";

export default function HydraulicPage() {
  const [inp, setInp] = useState<HydraulicInputs>(DEFAULT_HYDRAULIC);
  const [result, setResult] = useState<HydraulicResult | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  function set<K extends keyof HydraulicInputs>(
    key: K,
    val: HydraulicInputs[K],
  ) {
    setInp((prev) => ({ ...prev, [key]: val }));
  }

  function compute(e: React.FormEvent) {
    e.preventDefault();
    setResult(computeHydraulics(inp));
    setTimeout(
      () => reportRef.current?.scrollIntoView({ behavior: "smooth" }),
      80,
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

    {/* ── ASTRA Reference Banner ──────────────────────────────────────── */}
    <AstraContextPanel
      pageKey="hydraulics"
      title="Hydraulic Calculations & Hydrology (IRC SP-13, IS:7784, Manning, Lacey)"
      defaultOpen={false}
      compact={true}
    />

    <div className="grid grid-cols-1 xl:grid-cols-[480px_1fr] gap-6 items-start">
      {/* â”€â”€ Input Panel â”€â”€ */}
      <form
        onSubmit={compute}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:hidden"
      >
        <div className="bg-[#1a3a5c] text-white px-5 py-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide">
            Hydraulic Design Parameters
          </h2>
          <p className="text-blue-300 text-xs mt-0.5">
            IRC SP-13 Â· IRC:78-1983 Â· IS:7784 (Part-I)
          </p>
        </div>
        <div className="p-5 space-y-5 text-sm">
          <Section title="Project">
            <Field label="Name of Work">
              <textarea
                value={inp.workName}
                onChange={(e) => set("workName", e.target.value)}
                className={cx("resize-none h-16")}
              />
            </Field>
          </Section>

          <Section title="Discharge â€” Area Velocity Method (IRC SP-13, Art. 5)">
            <Grid2>
              <Field label="Cross-sectional Area A (mÂ²)">
                <Num
                  v={inp.crossSectionalArea ?? 0}
                  onChange={(v) => set("crossSectionalArea", v)}
                  step={0.01}
                />
              </Field>
              <Field label="Perimeter P (m)">
                <Num
                  v={inp.perimeter ?? 0}
                  onChange={(v) => set("perimeter", v)}
                  step={0.01}
                />
              </Field>
              <Field label="Slope â€” enter denominator (1 in n)">
                <Num v={inp.slope} onChange={(v) => set("slope", v)} step={1} />
              </Field>
              <Field label="Rugosity coefficient n">
                <Num
                  v={inp.rugosity}
                  onChange={(v) => set("rugosity", v)}
                  step={0.001}
                />
              </Field>
            </Grid2>
          </Section>

          <Section title="Waterway Arrangement">
            <Grid2>
              <Field label="Number of Spans">
                <Num
                  v={inp.numSpans}
                  onChange={(v) => set("numSpans", v)}
                  step={1}
                  min={1}
                />
              </Field>
              <Field label="Span Length (m)">
                <Num
                  v={inp.spanLength}
                  onChange={(v) => set("spanLength", v)}
                  step={0.5}
                />
              </Field>
            </Grid2>
          </Section>

          <Section title="Scour Parameters (IRC:78-1983 Cl. 703.2.2.1)">
            <Grid2>
              <Field label="Number of Piers">
                <Num
                  v={inp.numPiers}
                  onChange={(v) => set("numPiers", v)}
                  step={1}
                  min={0}
                />
              </Field>
              <Field label="Pier Width (m)">
                <Num
                  v={inp.pierWidth}
                  onChange={(v) => set("pierWidth", v)}
                  step={0.1}
                />
              </Field>
              <Field label="Silt Factor Ksf">
                <Num
                  v={inp.siltFactor}
                  onChange={(v) => set("siltFactor", v)}
                  step={0.1}
                />
              </Field>
            </Grid2>
          </Section>

          <Section title="Obstruction â€” Abutments">
            <Grid2>
              <Field label="Number of Abutments">
                <Num
                  v={inp.numAbutments}
                  onChange={(v) => set("numAbutments", v)}
                  step={1}
                />
              </Field>
              <Field label="Abut. Top Width (m)">
                <Num
                  v={inp.abutTopWidth}
                  onChange={(v) => set("abutTopWidth", v)}
                  step={0.05}
                />
              </Field>
              <Field label="Abut. Bottom Width (m)">
                <Num
                  v={inp.abutBottomWidth}
                  onChange={(v) => set("abutBottomWidth", v)}
                  step={0.05}
                />
              </Field>
            </Grid2>
          </Section>

          <Section title="Levels (m)">
            <Grid2>
              <Field label="HFL (m)">
                <Num v={inp.hfl} onChange={(v) => set("hfl", v)} step={0.001} />
              </Field>
              <Field label="Avg. River Bed Level (m)">
                <Num
                  v={inp.avgRiverBedLevel}
                  onChange={(v) => set("avgRiverBedLevel", v)}
                  step={0.001}
                />
              </Field>
              <Field label="Soffit Level (m)">
                <Num
                  v={inp.sofitLevel}
                  onChange={(v) => set("sofitLevel", v)}
                  step={0.001}
                />
              </Field>
              <Field label="Top of Deck Slab (m)">
                <Num
                  v={inp.topOfDeck}
                  onChange={(v) => set("topOfDeck", v)}
                  step={0.001}
                />
              </Field>
              <Field label="Deck Thickness incl. WC (m)">
                <Num
                  v={inp.deckThickness}
                  onChange={(v) => set("deckThickness", v)}
                  step={0.01}
                />
              </Field>
            </Grid2>
          </Section>

          <button
            type="submit"
            className="w-full py-3 bg-[#1a3a5c] hover:bg-[#0f2840] text-white font-semibold rounded-lg transition-colors tracking-wide"
          >
            Compute Hydraulic Design
          </button>
        </div>
      </form>

      {/* â”€â”€ Output Panel â”€â”€ */}
      <div ref={reportRef}>
        {result ? (
          <HydraulicReport result={result} onPrint={() => window.print()} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] rounded-xl border-2 border-dashed border-slate-300 bg-white text-center p-8">
      <svg
        className="w-16 h-16 text-slate-300 mb-4"
        viewBox="0 0 64 64"
        fill="none"
      >
        <rect
          x="4"
          y="44"
          width="56"
          height="6"
          rx="2"
          fill="currentColor"
          opacity="0.5"
        />
        <rect
          x="4"
          y="50"
          width="10"
          height="10"
          rx="2"
          fill="currentColor"
          opacity="0.35"
        />
        <rect
          x="50"
          y="50"
          width="10"
          height="10"
          rx="2"
          fill="currentColor"
          opacity="0.35"
        />
        <path
          d="M14 44 L14 18 L32 6 L50 18 L50 44"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
        <line
          x1="14"
          y1="18"
          x2="32"
          y2="44"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
        />
        <line
          x1="50"
          y1="18"
          x2="32"
          y2="44"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
        />
        <path
          d="M24 56 Q32 52 40 56"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M18 58 Q32 54 46 58"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.3"
        />
      </svg>
      <h2 className="text-lg font-semibold text-slate-500 mb-2">
        No Calculation Yet
      </h2>
      <p className="text-slate-400 text-sm max-w-xs">
        Enter bridge parameters and click{" "}
        <strong>Compute Hydraulic Design</strong> to generate your design
        report.
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          {title}
        </span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-500 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Num({
  v,
  onChange,
  step = 1,
  min,
}: {
  v: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <input
      type="number"
      value={v}
      step={step}
      min={min}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={cx()}
    />
  );
}

function cx(extra?: string) {
  return `w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-[#1a3a5c] transition-colors ${extra ?? ""}`;
}

