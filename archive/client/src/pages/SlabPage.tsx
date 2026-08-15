import { useState, useRef } from "react";
import InputForm from "@/report-engine/components/InputForm";
import SlabReport from "@/report-engine/components/ResultsPanel";
import { designSlab, SlabInputs, SlabResult } from "@/report-engine/lib/slabCalc";

const DEFAULT: SlabInputs = {
  slabName: "S1",
  slabType: "oneway",
  concreteGrade: "M25",
  steelGrade: "Fe415",
  lx: 3.58,
  ly: 7.62,
  thickness: 150,
  floorFinish: 1.0,
  sunkLoad: 0.0,
  liveLoad: 5.0,
  boundaryCondition: "propped",
  cover: 25,
  barDia: 10,
};

export default function SlabPage() {
  const [inputs, setInputs] = useState<SlabInputs>(DEFAULT);
  const [result, setResult] = useState<SlabResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  function handle(data: SlabInputs) {
    try {
      setError(null);
      const r = designSlab(data);
      setInputs(data);
      setResult(r);
      setTimeout(
        () =>
          reportRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        100,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calculation error");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start">
      <div className="print:hidden">
        <InputForm initialValues={inputs} onSubmit={handle} />
      </div>
      <div ref={reportRef}>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}
        {result ? (
          <SlabReport result={result} onPrint={() => window.print()} />
        ) : (
          <EmptyState />
        )}
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
        width="64"
        height="64"
        fill="none"
      >
        <rect
          x="4"
          y="10"
          width="56"
          height="44"
          rx="3"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          opacity="0.5"
        />
        <line
          x1="4"
          y1="20"
          x2="60"
          y2="20"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.4"
        />
        <line
          x1="4"
          y1="30"
          x2="60"
          y2="30"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
        <line
          x1="4"
          y1="40"
          x2="60"
          y2="40"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
        <line
          x1="22"
          y1="20"
          x2="22"
          y2="54"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
        <line
          x1="40"
          y1="20"
          x2="40"
          y2="54"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
        <circle cx="32" cy="15" r="2" fill="currentColor" opacity="0.5" />
      </svg>
      <h2 className="text-lg font-semibold text-slate-500 mb-2">
        No Design Computed
      </h2>
      <p className="text-slate-400 text-sm max-w-xs">
        Fill in the slab parameters and click <strong>Compute Design</strong> to
        generate the IS 456:2000 design report.
      </p>
    </div>
  );
}

