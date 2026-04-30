import { HydraulicResult } from "../lib/hydraulicCalc";

const n4 = (v: number) => v.toFixed(4);
const n3 = (v: number) => v.toFixed(3);
const n2 = (v: number) => v.toFixed(2);

export default function HydraulicReport({
  result: r,
  onPrint,
}: {
  result: HydraulicResult;
  onPrint: () => void;
}) {
  const i = r.inputs;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Report Header */}
      <div className="bg-[#1a3a5c] text-white px-6 py-4 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wide">
              DESIGN OF SUBMERSIBLE BRIDGE
            </h2>
            <p className="text-blue-300 text-xs mt-1 print:text-slate-600">
              Hydraulic Design Calculations
            </p>
          </div>
          <button
            onClick={onPrint}
            className="print:hidden px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded border border-white/20 transition-colors"
          >
            Print Report
          </button>
        </div>
        <div className="mt-3 bg-white/10 rounded-md px-4 py-2 print:bg-slate-50 print:text-slate-800">
          <p className="text-sm font-medium text-white print:text-slate-800">
            <span className="font-semibold">Name of Work:</span> {i.workName}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6 text-sm font-mono print:text-xs print:p-4">
        {/* â”€â”€ Section 1: Discharge â”€â”€ */}
        <Section
          title="1. Computation of Discharge"
          ref_code="IRC SP-13, Article 5 â€” Area Velocity Method"
        >
          <FormulaLine
            label="Method"
            value="Flood Calculation by Area Velocity Method"
          />
          <Divider />
          <table className="w-full text-left text-xs border-collapse">
            <tbody>
              <TRow
                label="Cross-sectional Area"
                sym="A"
                val={`${n2(i.crossSectionalArea ?? 0)} mÂ²`}
              />
              <TRow
                label="Wetted Perimeter"
                sym="P"
                val={`${n2(i.perimeter ?? 0)} m`}
              />
              <TRow label="Slope" sym="S" val={`1 in ${i.slope}`} />
              <TRow
                label="Rugosity Coefficient (Manning's n)"
                sym="n"
                val={`${i.rugosity}`}
              />
            </tbody>
          </table>
          <Divider />
          <FormulaBlock>
            V = (1/n) Ã— (A/P)^(2/3) Ã— S^(1/2)
            {"\n"} = {n2(1 / i.rugosity)} Ã— (
            {n2((i.crossSectionalArea ?? 0) / (i.perimeter ?? 1))})^(2/3) Ã— (1/{i.slope}
            )^(1/2)
            {"\n"} = <strong>{n2(r.velocityManning)} m/sec</strong>
          </FormulaBlock>
          <FormulaBlock>
            Q = A Ã— V{"\n"} = {n2(i.crossSectionalArea ?? 0)} Ã— {n2(r.velocityManning)}
            {"\n"} = <strong>{n2(r.discharge)} Cumecs</strong>
          </FormulaBlock>
        </Section>

        {/* â”€â”€ Section 2: Linear Waterway â”€â”€ */}
        <Section title="2. Linear Waterway Calculation">
          <FormulaBlock>
            Regime Surface Width L = 4.8 Ã— âˆšQ
            {"\n"} = 4.8 Ã— âˆš{n2(r.discharge)}
            {"\n"} = <strong>{n2(r.regimeWidth)} m</strong>
          </FormulaBlock>
          <p className="text-slate-600 italic text-xs">
            Adopted:{" "}
            <strong>
              {i.numSpans} spans Ã— {i.spanLength} m each
            </strong>{" "}
            (Urban area constraints)
          </p>
          <ResultLine
            label="Effective Linear Waterway Proposed"
            value={`${i.numSpans} Ã— ${i.spanLength} = ${r.effectiveWaterway} m`}
          />
        </Section>

        {/* â”€â”€ Section 3: Scour Depth â”€â”€ */}
        <Section
          title="3. Scour Depth Calculation"
          ref_code="IRC:78-1983, Clause 703.2.2.1"
        >
          <p className="text-slate-600 text-xs mb-2">
            d<sub>sm</sub> = 1.34 Ã— (D<sub>b</sub>Â² / K<sub>sf</sub>)^(1/3)
          </p>
          <table className="w-full text-xs border-collapse mb-3">
            <tbody>
              <TRow
                label="Net waterway (deducting piers)"
                sym=""
                val={`${r.effectiveWaterway} âˆ’ (${i.numPiers} Ã— ${i.pierWidth}) = ${n2(r.effectiveWaterway - i.numPiers * i.pierWidth)} m`}
              />
              <TRow
                label="Discharge per metre width"
                sym="Db"
                val={`${n2(r.discharge)} / ${n2(r.effectiveWaterway - i.numPiers * i.pierWidth)} = ${n2(r.dischargePerMetre)} Cumecs/m`}
              />
              <TRow label="Silt Factor" sym="Ksf" val={`${i.siltFactor}`} />
            </tbody>
          </table>
          <FormulaBlock>
            d_sm = 1.34 Ã— ({n2(r.dischargePerMetre)}Â² / {i.siltFactor})^(1/3)
            {"\n"} = <strong>{n2(r.meanScourDepth)} m</strong>
          </FormulaBlock>
          <p className="text-xs text-slate-500 italic">
            As per Cl. 703-2-3-1 IRC:78-1983 â€” Scour at pier = 2 Ã— dsm below
            HFL. Hard rock available; foundation anchored in rock per IRC
            guidelines.
          </p>
        </Section>

        {/* â”€â”€ Section 4: Afflux â”€â”€ */}
        <Section
          title="4. Afflux Calculation"
          ref_code="IS:7784 (Part-I) 1975 â€” Molesworth Formula"
        >
          <p className="text-xs text-slate-600 mb-3">
            h = (VÂ²/17.85 + 0.0152) Ã— (AÂ²/aÂ² âˆ’ 1)
          </p>

          <SubSection title="Area obstructed by Deck Slab">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <TRow label="HFL" sym="" val={`${n3(i.hfl)} m`} />
                <TRow
                  label="Top Level of Deck Slab"
                  sym=""
                  val={`${n3(i.topOfDeck)} m`}
                />
                <TRow
                  label="Thickness (Slab + Wearing Coat)"
                  sym=""
                  val={`${n3(i.deckThickness)} m`}
                />
                <TRow
                  label="Length of Slab"
                  sym=""
                  val={`${n2(r.effectiveWaterway)} m`}
                />
              </tbody>
            </table>
            <ResultLine
              label="Area obstructed by Deck Slab"
              value={`${n2(r.effectiveWaterway)} Ã— ${n3(i.deckThickness)} = ${n2(r.areaObstrSlab)} mÂ²`}
            />
          </SubSection>

          <SubSection title="Area obstructed by Piers">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <TRow label="HFL" sym="" val={`${n3(i.hfl)} m`} />
                <TRow
                  label="Average River Bed Level"
                  sym=""
                  val={`${n3(i.avgRiverBedLevel)} m`}
                />
                <TRow
                  label="Height of obstruction"
                  sym=""
                  val={`${n3(i.hfl)} âˆ’ ${n3(i.avgRiverBedLevel)} = ${n3(i.hfl - i.avgRiverBedLevel)} m`}
                />
                <TRow label="Number of Piers" sym="" val={`${i.numPiers}`} />
                <TRow
                  label="Area per pier"
                  sym=""
                  val={`${n2(i.pierWidth)} Ã— ${n3(i.hfl - i.avgRiverBedLevel)} = ${n2(i.pierWidth * (i.hfl - i.avgRiverBedLevel))} mÂ²`}
                />
              </tbody>
            </table>
            <ResultLine
              label={`Area obstructed by ${i.numPiers} Piers`}
              value={`${n2(r.areaObstrPiers)} mÂ²`}
            />
          </SubSection>

          <SubSection title="Area obstructed by Abutments">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <TRow
                  label="Height of obstruction"
                  sym=""
                  val={`${n3(i.hfl)} âˆ’ ${n3(i.avgRiverBedLevel)} = ${n3(i.hfl - i.avgRiverBedLevel)} m`}
                />
                <TRow
                  label="Area per Abutment (trapezoidal)"
                  sym=""
                  val={`(${n2(i.abutTopWidth)}+${n2(i.abutBottomWidth)})/2 Ã— ${n3(i.hfl - i.avgRiverBedLevel)} = ${n2(((i.abutTopWidth + i.abutBottomWidth) / 2) * (i.hfl - i.avgRiverBedLevel))} mÂ²`}
                />
              </tbody>
            </table>
            <ResultLine
              label={`Area obstructed by ${i.numAbutments} Abutments`}
              value={`${n2(r.areaObstrAbutments)} mÂ²`}
            />
          </SubSection>

          <div className="mt-3 rounded-md bg-slate-50 border border-slate-200 p-3">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <TRow
                  label="Aâ‚€ â€” Deck slab obstruction"
                  sym=""
                  val={`${n2(r.areaObstrSlab)} mÂ²`}
                />
                <TRow
                  label="Aâ‚ â€” Pier obstruction"
                  sym=""
                  val={`${n2(r.areaObstrPiers)} mÂ²`}
                />
                <TRow
                  label="Aâ‚‚ â€” Abutment obstruction"
                  sym=""
                  val={`${n2(r.areaObstrAbutments)} mÂ²`}
                />
                <TRow
                  label="Total Obstruction (Aâ‚€+Aâ‚+Aâ‚‚)"
                  sym=""
                  val={`${n2(r.totalObstruction)} mÂ²`}
                  bold
                />
                <TRow
                  label="Unobstructed Area of flow"
                  sym="A"
                  val={`${n2(i.crossSectionalArea ?? 0)} mÂ²`}
                />
                <TRow
                  label="Actual Area of flow  a = A âˆ’ Total obs."
                  sym=""
                  val={`${n2(i.crossSectionalArea ?? 0)} âˆ’ ${n2(r.totalObstruction)} = ${n2(r.actualFlowArea)} mÂ²`}
                  bold
                />
              </tbody>
            </table>
          </div>

          <FormulaBlock>
            h = (VÂ²/17.85 + 0.0152) Ã— (AÂ²/aÂ² âˆ’ 1)
            {"\n"} = (
            {n4(
              (r.inputs.crossSectionalArea ?? 0) > 0
                ? (r.velocityManning * r.velocityManning) / 17.85 + 0.0152
                : 0,
            )}
            ) Ã— (
            {n4(
              ((i.crossSectionalArea ?? 0) * (i.crossSectionalArea ?? 0)) /
                (r.actualFlowArea * r.actualFlowArea),
            )}{" "}
            âˆ’ 1)
            {"\n"} = <strong>{n2(r.afflux)} m</strong>
          </FormulaBlock>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <KVCard label="Afflux h" value={`${n3(r.afflux)} m`} />
            <KVCard
              label="Afflux Flood Level"
              value={`${n3(r.affluxFloodLevel)} m`}
            />
            <KVCard label="Top of Deck Slab" value={`${n3(i.topOfDeck)} m`} />
            <KVCard
              label="Obstructed Velocity"
              value={`${n2(r.obstructedVelocity)} m/s`}
            />
          </div>
        </Section>

        {/* â”€â”€ Final Status â”€â”€ */}
        <Section title="5. Result">
          <div
            className={`rounded-lg border-2 px-5 py-4 ${r.status === "OK" ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"}`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl font-bold ${r.status === "OK" ? "text-green-700" : "text-red-700"}`}
              >
                {r.status === "OK" ? "âœ“  PASS" : "âœ—  FAIL"}
              </span>
            </div>
            <table className="mt-3 text-xs w-full">
              <tbody>
                <TRow
                  label="Afflux Flood Level"
                  sym=""
                  val={`${n3(r.affluxFloodLevel)} m`}
                />
                <TRow
                  label="Top of Deck Slab"
                  sym=""
                  val={`${n3(i.topOfDeck)} m`}
                />
                <TRow
                  label="Clearance (Deck âˆ’ Afflux Level)"
                  sym=""
                  val={`${n3(r.deckClearance)} m  ${r.status === "OK" ? "âœ“ Above afflux flood level" : "âœ— Below afflux flood level"}`}
                  bold
                />
              </tbody>
            </table>
            {r.status === "OK" && (
              <p className="text-xs text-green-700 mt-2 italic">
                Top of deck slab is above the afflux flood level. Though not a
                high-level bridge, there shall be no hindrance to traffic during
                high floods. <strong>Hence OK.</strong>
              </p>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  ref_code,
  children,
}: {
  title: string;
  ref_code?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="print-section">
      <div className="flex items-baseline gap-3 mb-3 pb-1 border-b border-slate-200">
        <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
        {ref_code && (
          <span className="text-[10px] text-slate-400 italic">
            [{ref_code}]
          </span>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold text-slate-600 mb-2 uppercase tracking-wide">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TRow({
  label,
  sym,
  val,
  bold,
}: {
  label: string;
  sym: string;
  val: string;
  bold?: boolean;
}) {
  return (
    <tr className="border-b border-slate-100">
      <td
        className={`py-1 pr-4 ${bold ? "font-bold" : "text-slate-600"} w-1/2`}
      >
        {label}
      </td>
      <td className="py-1 pr-2 text-slate-500 w-8 font-medium">{sym}</td>
      <td
        className={`py-1 ${bold ? "font-bold text-slate-900" : "text-slate-800"} font-mono`}
      >
        =&nbsp;&nbsp;{val}
      </td>
    </tr>
  );
}

function FormulaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs">
      <span className="text-slate-500">{label}: </span>
      <span className="text-slate-800 font-semibold">{value}</span>
    </div>
  );
}

function FormulaBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-xs font-mono text-slate-800 whitespace-pre-wrap overflow-x-auto">
      {children}
    </pre>
  );
}

function ResultLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-md px-3 py-2 mt-2">
      <span className="text-xs text-blue-700 font-medium">{label}</span>
      <span className="text-xs font-bold text-blue-900 font-mono">{value}</span>
    </div>
  );
}

function KVCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md px-4 py-2">
      <div className="text-[10px] text-slate-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="font-bold text-slate-800 font-mono mt-0.5">{value}</div>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-slate-100 my-1" />;
}

