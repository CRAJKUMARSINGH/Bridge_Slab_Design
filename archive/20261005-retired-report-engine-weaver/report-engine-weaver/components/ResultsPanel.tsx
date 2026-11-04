import { SlabResult, SteelPosition } from "../lib/slabCalc";

const n3 = (v: number) => v.toFixed(3);
const n2 = (v: number) => v.toFixed(2);

export default function ResultsPanel({
  result: r,
  onPrint,
}: {
  result: SlabResult;
  onPrint: () => void;
}) {
  const i = r.inputs;
  const st = r.effectiveSlabType === "oneway" ? "One-Way Slab" : "Two-Way Slab";
  const lx = Math.min(i.lx, i.ly);
  const ly = Math.max(i.lx, i.ly);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm font-mono">
      {/* Header */}
      <div className="bg-[#1a3a5c] text-white px-6 py-4 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wide">
              DESIGN OF SLAB
            </h2>
            <p className="text-blue-300 text-xs mt-0.5 print:text-slate-500">
              IS 456:2000 Â· Limit State Method
            </p>
          </div>
          <button
            onClick={onPrint}
            className="print:hidden px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded border border-white/20 transition-colors"
          >
            Print Report
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 text-xs print:p-4 print:text-[10pt]">
        {/* â”€â”€ Project Info â”€â”€ */}
        <table className="w-full border-collapse">
          <tbody>
            <InfoRow label="Design Method" val="Limit State Method" />
            <InfoRow label="Design Code" val="IS 456:2000" />
            <InfoRow label="Slab Name" val={i.slabName} />
            <InfoRow label="Slab Type" val={st} />
            <InfoRow label="Grade of Concrete" val={i.concreteGrade} />
            <InfoRow label="Grade of Steel" val={i.steelGrade} />
            <InfoRow
              label="Dimensions"
              val={`Lx = ${lx.toFixed(3)} m,  Ly = ${ly.toFixed(3)} m,  Thickness = ${i.thickness} mm`}
            />
            <InfoRow
              label="Span Ratio (Longer/Shorter)"
              val={`${r.spanRatio.toFixed(3)}`}
            />
            <InfoRow
              label="Effective Depth"
              val={`d = ${r.effectiveDepth.toFixed(1)} mm`}
            />
            <InfoRow
              label="Boundary Condition"
              val={i.boundaryCondition
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            />
          </tbody>
        </table>

        {/* â”€â”€ Loading Table â”€â”€ */}
        <Section title="Loading on Slab (Table 1)">
          <p className="text-slate-500 mb-2">
            Total DL = Self Weight + Floor Finish + Sunk Load
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border border-slate-300 border-collapse text-center text-[10px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-2 py-1.5">
                    Self Weight (1) kN/mÂ²
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Floor Finish (2) kN/mÂ²
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Sunk Load (3) kN/mÂ²
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Total DL (4) kN/mÂ²
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Live Load (5) kN/mÂ²
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Total LL (6) kN/mÂ²
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Total Design Load 1.5Ã—[(4)+(6)] kN/mÂ²
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-2 py-1.5 font-semibold">
                    {n3(r.selfWeight)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5">
                    {n3(i.floorFinish)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5">
                    {n3(i.sunkLoad)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 font-semibold">
                    {n3(r.totalDL)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5">
                    {n3(i.liveLoad)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5">
                    {n3(r.totalLL)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 font-bold bg-blue-50">
                    {n3(r.totalDesignLoad)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* â”€â”€ Deflection Check â”€â”€ */}
        <Section title="Deflection Check (Table 2)">
          <p className="text-slate-500 mb-2">
            As per Clause 23.2.1 of IS 456:2000:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border border-slate-300 border-collapse text-center text-[10px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-2 py-1.5">
                    (Span/Depth) Ratio
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Modification Factor (a)
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Basic Factor (b)
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Permissible Ratio (aÃ—b)
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-2 py-1.5">
                    {n3(r.spanDepthRatio)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5">
                    {n3(r.modificationFactor)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5">
                    {n3(r.basicFactor)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 font-semibold">
                    {n3(r.permissibleRatio)}
                  </td>
                  <td
                    className={`border border-slate-300 px-2 py-1.5 font-bold ${r.deflectionStatus === "OK" ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}`}
                  >
                    {r.deflectionStatus}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* â”€â”€ Moment and Steel â”€â”€ */}
        <Section title="Moment And Steel Calculations">
          {r.effectiveSlabType === "twoway" && (
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[10px] mb-3">
              <p>Coefficients (Î±x and Î±y) per Clause D-1.1 of IS 456:2000:</p>
              <p className="mt-1">
                Mx = Î±x Ã— W Ã— LxÂ² &nbsp;|&nbsp; My = Î±y Ã— W Ã— LxÂ²
              </p>
              <p>
                W = Total Design Load = {n3(r.totalDesignLoad)}{" "}
                kN/mÂ²&nbsp;&nbsp;&nbsp;Lx = {lx.toFixed(3)} m
              </p>
            </div>
          )}
          {r.effectiveSlabType === "oneway" && (
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[10px] mb-3">
              <p>
                W = Total Design Load = {n3(r.totalDesignLoad)}{" "}
                kN/mÂ²&nbsp;&nbsp;&nbsp;Lx = {lx.toFixed(3)} m
              </p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border border-slate-300 border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-2 py-1.5 text-left">
                    Position
                  </th>
                  {r.effectiveSlabType === "twoway" && (
                    <th className="border border-slate-300 px-2 py-1.5">
                      Coeff. Î±x or Î±y
                    </th>
                  )}
                  <th className="border border-slate-300 px-2 py-1.5">
                    Moment kN-m
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Ast_req mmÂ²/m
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Steel Detail dia@spc mm c/c
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Ast_prv mmÂ²/m
                  </th>
                  <th className="border border-slate-300 px-2 py-1.5">
                    Remark
                  </th>
                </tr>
              </thead>
              <tbody>
                {r.steelPositions.map((p, idx) => (
                  <SteelRow
                    key={idx}
                    p={p}
                    isTwoWay={r.effectiveSlabType === "twoway"}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Distribution steel (one-way only) */}
          {r.effectiveSlabType === "oneway" && r.distributionSpacing > 0 && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-md px-4 py-2.5 text-[10px]">
              <p>
                Provide{" "}
                <strong>
                  #{r.distributionBarDia} @ {r.distributionSpacing}
                </strong>{" "}
                ({n3(r.distributionAst)} mmÂ²) as Distribution Steel
              </p>
            </div>
          )}
        </Section>

        {/* â”€â”€ Minimum Steel â”€â”€ */}
        <Section title="Minimum Steel Check">
          <p className="text-slate-500 mb-2">
            As per Clause 26.5.2.1 of IS 456:2000:
          </p>
          <div className="space-y-1">
            <p>
              Minimum area of steel for Main Steel = 0.12 Ã— C/S Area = 0.12 Ã—{" "}
              {i.thickness} Ã— 1000 / 100 ={" "}
              <strong>{n3(r.minSteelMain)} mmÂ²</strong>
            </p>
            {r.effectiveSlabType === "oneway" && (
              <p>
                Minimum area of steel for Distribution Steel = 0.12 Ã— C/S Area ={" "}
                <strong>{n3(r.minSteelDist)} mmÂ²</strong>
              </p>
            )}
          </div>
        </Section>

        {/* Warnings */}
        {r.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-md px-4 py-3">
            <p className="font-semibold text-amber-800 mb-1">
              Notes / Warnings:
            </p>
            {r.warnings.map((w, i) => (
              <p key={i} className="text-amber-700">
                {w}
              </p>
            ))}
          </div>
        )}

        {/* Standard Note */}
        <div className="bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-[10px] text-slate-600 italic">
          <strong>Note:</strong> Extra steel at top supports is computed
          considering bent-ups, if any, coming from the adjoining span. It is
          the maximum of the extra steel required for each slab at that common
          support. fck = {r.fck} N/mmÂ² &nbsp;|&nbsp; fy = {r.fy} N/mmÂ²
        </div>
      </div>
    </div>
  );
}

function SteelRow({ p, isTwoWay }: { p: SteelPosition; isTwoWay: boolean }) {
  const isTop = p.remark.includes("Top");
  return (
    <tr className={isTop ? "bg-orange-50" : ""}>
      <td className="border border-slate-300 px-2 py-1.5 font-semibold text-left">
        {p.position}
      </td>
      {isTwoWay && (
        <td className="border border-slate-300 px-2 py-1.5 text-center">
          {p.coeff != null && p.coeff > 0 ? p.coeff.toFixed(3) : "0.000"}
        </td>
      )}
      <td className="border border-slate-300 px-2 py-1.5 text-center">
        {p.moment !== null && p.moment > 0
          ? p.moment.toFixed(3)
          : p.moment === null
            ? "--"
            : "0.000"}
      </td>
      <td className="border border-slate-300 px-2 py-1.5 text-center">
        {p.astReq > 0 ? p.astReq.toFixed(3) : "0.000"}
      </td>
      <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold">
        {p.spacing > 0 ? `#${p.barDia} @ ${p.spacing}` : "--"}
      </td>
      <td className="border border-slate-300 px-2 py-1.5 text-center">
        {p.astPrv > 0 ? p.astPrv.toFixed(3) : "0.000"}
      </td>
      <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-500 italic">
        {p.remark}
      </td>
    </tr>
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
    <div className="print-section">
      <div className="flex items-center gap-2 mb-3 pb-1 border-b-2 border-slate-300">
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, val }: { label: string; val: string }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-1 pr-4 text-slate-500 w-48">{label}</td>
      <td className="py-1 pr-2 text-slate-400 w-4">:</td>
      <td className="py-1 font-semibold text-slate-800">{val}</td>
    </tr>
  );
}

