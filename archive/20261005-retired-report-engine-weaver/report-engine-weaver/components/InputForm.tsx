import { useState } from "react";
import {
  SlabInputs,
  SlabType,
  BoundaryCondition,
  ConcreteGrade,
  SteelGrade,
  bcLabels,
  oneWayBC,
  twoWayBC,
} from "../lib/slabCalc";

interface Props {
  initialValues: SlabInputs;
  onSubmit: (data: SlabInputs) => void;
}

const concreteGrades: ConcreteGrade[] = [
  "M15",
  "M20",
  "M25",
  "M30",
  "M35",
  "M40",
];
const steelGrades: SteelGrade[] = ["Fe250", "Fe415", "Fe500", "Fe550"];
const barDias = [8, 10, 12, 16, 20, 25];

export default function InputForm({ initialValues, onSubmit }: Props) {
  const [f, setF] = useState<SlabInputs>(initialValues);

  function set<K extends keyof SlabInputs>(key: K, value: SlabInputs[K]) {
    setF((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-switch boundary condition when slab type changes
      if (key === "slabType") {
        const validBCs = value === "oneway" ? oneWayBC : twoWayBC;
        if (!validBCs.includes(next.boundaryCondition as BoundaryCondition)) {
          next.boundaryCondition = validBCs[0];
        }
      }
      return next;
    });
  }

  const bcOptions = f.slabType === "oneway" ? oneWayBC : twoWayBC;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(f);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Form Header */}
      <div className="bg-slate-800 text-white px-5 py-3">
        <h2 className="font-semibold text-sm tracking-wide uppercase">
          Slab Design Parameters
        </h2>
        <p className="text-slate-400 text-xs mt-0.5">
          IS 456:2000 Â· Limit State Method
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Identification */}
        <Section title="Identification">
          <Field label="Slab Name">
            <input
              type="text"
              value={f.slabName}
              onChange={(e) => set("slabName", e.target.value)}
              className={input}
              placeholder="e.g. S1"
            />
          </Field>

          <Field label="Slab Type">
            <div className="flex gap-2">
              {(["oneway", "twoway"] as SlabType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("slabType", t)}
                  className={`flex-1 py-2 px-3 text-sm rounded-md border font-medium transition-colors ${
                    f.slabType === t
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                  }`}
                >
                  {t === "oneway" ? "One-Way" : "Two-Way"}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* Materials */}
        <Section title="Materials">
          <Field label="Grade of Concrete">
            <select
              value={f.concreteGrade}
              onChange={(e) =>
                set("concreteGrade", e.target.value as ConcreteGrade)
              }
              className={input}
            >
              {concreteGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Grade of Steel">
            <select
              value={f.steelGrade}
              onChange={(e) => set("steelGrade", e.target.value as SteelGrade)}
              className={input}
            >
              {steelGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        {/* Geometry */}
        <Section title="Geometry">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lx â€” Shorter Span (m)">
              <NumInput
                value={f.lx}
                onChange={(v) => set("lx", v)}
                step={0.01}
                min={0.5}
                max={20}
              />
            </Field>
            <Field label="Ly â€” Longer Span (m)">
              <NumInput
                value={f.ly}
                onChange={(v) => set("ly", v)}
                step={0.01}
                min={0.5}
                max={30}
              />
            </Field>
          </div>
          <Field label="Slab Thickness (mm)">
            <NumInput
              value={f.thickness}
              onChange={(v) => set("thickness", v)}
              step={5}
              min={75}
              max={500}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Clear Cover (mm)">
              <NumInput
                value={f.cover}
                onChange={(v) => set("cover", v)}
                step={5}
                min={15}
                max={75}
              />
            </Field>
            <Field label="Main Bar Dia (mm)">
              <select
                value={f.barDia}
                onChange={(e) => set("barDia", Number(e.target.value))}
                className={input}
              >
                {barDias.map((d) => (
                  <option key={d} value={d}>
                    âˆ…{d}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        {/* Loading */}
        <Section title="Loading (kN/mÂ²)">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Floor Finish">
              <NumInput
                value={f.floorFinish}
                onChange={(v) => set("floorFinish", v)}
                step={0.1}
                min={0}
              />
            </Field>
            <Field label="Sunk Load">
              <NumInput
                value={f.sunkLoad}
                onChange={(v) => set("sunkLoad", v)}
                step={0.1}
                min={0}
              />
            </Field>
          </div>
          <Field label="Live Load">
            <NumInput
              value={f.liveLoad}
              onChange={(v) => set("liveLoad", v)}
              step={0.5}
              min={0}
            />
          </Field>
          <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-2 text-xs text-blue-700">
            Self-weight is auto-computed as Thickness Ã— 25 kN/mÂ³
          </div>
        </Section>

        {/* Boundary Condition */}
        <Section title="Boundary Condition">
          <div className="space-y-1.5">
            {bcOptions.map((bc) => (
              <label
                key={bc}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors text-sm ${
                  f.boundaryCondition === bc
                    ? "border-blue-500 bg-blue-50 text-blue-800"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="bc"
                  value={bc}
                  checked={f.boundaryCondition === bc}
                  onChange={() => set("boundaryCondition", bc)}
                  className="text-blue-600"
                />
                <span>{bcLabels[bc]}</span>
              </label>
            ))}
          </div>
        </Section>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-colors text-sm tracking-wide shadow-sm"
        >
          Compute Design
        </button>
      </div>
    </form>
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
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {title}
        </span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
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
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function NumInput({
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={input}
    />
  );
}

const input =
  "w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";

