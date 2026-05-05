/**
 * T-Girder Bridge Analysis — ASTRA 15 Methodology
 *
 * Derived from ASTRA 15 Tutorial data files:
 *   • E_DRIVE_BRIDGE_DESIGN/11 bridge design astra/ASTRA_Data_Input.txt
 *   • E_DRIVE_BRIDGE_DESIGN/11 bridge design astra/DESIGN OF PIER WITH PILES/ASTRA_Data_Input.txt
 *   • GitHub: CRAJKUMARSINGH/Bridge_Slab_Design → Attached_Assets/ASTRA 15 TUTORIALS
 *
 * Covers:
 *   1. Composite T-section properties (Ixx, Iyy, Izz, Ax, NA) — inner / outer / cross girder
 *   2. Dead-load UDL computation on inner & outer girder members (ASTRA model numbering)
 *   3. Cross-girder joint loads
 *   4. Live-load impact factor (Cl. 211.2, IRC:6)
 *   5. All 16 ASTRA/IRC vehicle load types
 *   6. ASTRA input data summary (copy-paste ready)
 */
import { useState, useMemo } from 'react';
import { AstraContextPanel } from '@/components/AstraContextPanel';
import {
  GitBranch, ChevronDown, ChevronUp, Info, Copy, Check,
  BookOpen, Layers, Calculator, Zap, Truck,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TGirderInputs {
  // Geometry
  L: number;       // effective span (m)
  B: number;       // total width (m)
  NMG: number;     // number of main longitudinal girders
  NCG: number;     // number of cross girders
  CL: number;      // left kerb / cantilever (m)
  CR: number;      // right kerb / cantilever (m)
  // Cross-section (mm)
  Ds: number;      // deck slab thickness (mm)
  D: number;       // total girder depth incl. slab (mm)
  Bw: number;      // web width (mm)
  Bb: number;      // bottom flange width (mm)
  Db: number;      // bottom flange depth (mm)
  Bc: number;      // cantilever breadth — outer girder only (mm)
  // Parapet & footpath (mm / m)
  Hp: number;      // parapet height (m)
  Wp: number;      // parapet width (m)
  Bs: number;      // sidewalk width (m)
  Hs: number;      // sidewalk slab depth (m)
  Hps: number;     // sidewalk parapet height (m)
  Wps: number;     // sidewalk parapet width (m)
  // Cross girder (mm)
  DCG: number;     // cross-girder depth (mm)
  BCG: number;     // cross-girder width (mm)
  // Wearing coat
  Dw: number;      // wearing coat depth (mm)
  // Unit weights (kN/m³)
  gammaC: number;  // concrete
  gammaW: number;  // wearing coat
  // Load factor
  swf: number;     // self-weight factor (1.0 = unfactored, 1.4 = factored)
  // Live load
  loadType: string;
  impactFactor: number;
}

const DEFAULTS: TGirderInputs = {
  L: 19.2, B: 12.1, NMG: 4, NCG: 3, CL: 2.075, CR: 2.075,
  Ds: 250, D: 1800, Bw: 300, Bb: 650, Db: 650, Bc: 2075,
  Hp: 1.2, Wp: 0.5, Bs: 1.0, Hs: 0.25, Hps: 1.0, Wps: 0.5,
  DCG: 1400, BCG: 250,
  Dw: 80,
  gammaC: 24, gammaW: 22,
  swf: 1.4,
  loadType: 'IRC Class A',
  impactFactor: 1.179,
};

// ─── IRC / ASTRA Load Types (from ASTRA_Data_Input.txt) ─────────────────────
const LOAD_TYPES = [
  { id: 1,  code: 'IRCCLASSA',      label: 'IRC Class A',              std: 'IRC:6 Cl.204',   desc: 'Standard train of vehicles; max axle 114 kN. Most common for highway bridges.', max_axle: 114, lanes: 'Single/double' },
  { id: 2,  code: 'IRCCLASSB',      label: 'IRC Class B',              std: 'IRC:6 Cl.204',   desc: 'Lighter loading (half of Class A); used for temporary / timber bridges.', max_axle: 68, lanes: 'Single' },
  { id: 3,  code: 'LRFD_HTL57',     label: 'AASHTO LRFD Truck HL57',  std: 'AASHTO LRFD',    desc: 'AASHTO tandem + lane load. HL57 = 57 kN/axle tandem.', max_axle: 57, lanes: 'Per lane' },
  { id: 4,  code: 'LRFD_HL93_HS20', label: 'AASHTO HL-93 HS20',       std: 'AASHTO LRFD',    desc: 'HL-93 design truck (HS20 = 320 kN gross) + lane load 9.3 kN/m.', max_axle: 142, lanes: 'Per lane' },
  { id: 5,  code: 'LRFD_HL93_H20',  label: 'AASHTO HL-93 H20',        std: 'AASHTO LRFD',    desc: 'HL-93 with H20 truck (tandem only). Lighter than HS20.', max_axle: 111, lanes: 'Per lane' },
  { id: 6,  code: 'IRC70RTRACK',    label: 'IRC 70R Tracked',          std: 'IRC:6 Cl.204',   desc: '700 kN tracked vehicle (Cl.204 Table 2). Contact length 4.57 m; width 0.84 m.', max_axle: 700, lanes: 'Single' },
  { id: 7,  code: 'IRC70RWHEEL',    label: 'IRC 70R Wheeled',          std: 'IRC:6 Cl.204',   desc: '700 kN wheeled; 12 axles, 0.41 m tyre contact. Governs longer spans.', max_axle: 700, lanes: 'Single' },
  { id: 8,  code: 'IRCCLASSAATRACK',label: 'IRC Class AA Tracked',     std: 'IRC:6 Cl.204',   desc: '350 kN tracked (older heavy standard pre-70R). 3.6 m contact length.', max_axle: 350, lanes: 'Single' },
  { id: 9,  code: 'IRC24RTRACK',    label: 'IRC 24R Tracked',          std: 'IRC:6 Cl.204',   desc: '240 kN tracked vehicle. Used for rural / semi-urban light bridges.', max_axle: 240, lanes: 'Single' },
  { id: 10, code: 'BG_RAIL_1',      label: 'BG Rail — Heavy (DFC)',    std: 'IRS-B1',         desc: 'Broad Gauge rail axle load 250 kN (DFC loading). Railway over-bridges.', max_axle: 250, lanes: 'Per track' },
  { id: 11, code: 'BG_RAIL_2',      label: 'BG Rail — Standard',       std: 'IRS-B1',         desc: 'Broad Gauge standard axle load 225 kN. RDSO classification EUDL.', max_axle: 225, lanes: 'Per track' },
  { id: 12, code: 'MG_RAIL_1',      label: 'MG Rail — Heavy',          std: 'IRS-B1',         desc: 'Metre Gauge heavy axle 165 kN. Applies to MG ROBs / RUBs.', max_axle: 165, lanes: 'Per track' },
  { id: 13, code: 'MG_RAIL_2',      label: 'MG Rail — Standard',       std: 'IRS-B1',         desc: 'Metre Gauge standard axle 130 kN. Used for MG branch lines.', max_axle: 130, lanes: 'Per track' },
  { id: 14, code: 'IRC70RW40TBM',   label: 'IRC 70R 40T Bogie (Multi)',std: 'IRC:6 Cl.204',   desc: '40-tonne bogie wheeled, multiple vehicle convoy. Governs wide bridges.', max_axle: 400, lanes: 'Multi' },
  { id: 15, code: 'IRC70RW40TBL',   label: 'IRC 70R 40T Bogie (Single)',std:'IRC:6 Cl.204',   desc: '40-tonne bogie wheeled, single unit. Impact factor 1.25 for short spans.', max_axle: 400, lanes: 'Single' },
  { id: 16, code: 'IRC40RWHEEL',    label: 'IRC 40R Wheeled',          std: 'IRC:6 Cl.204',   desc: '400 kN wheeled. Intermediate between Class A and 70R for state highways.', max_axle: 400, lanes: 'Single' },
];

// ─── Section-property helpers (mm → m⁴) ─────────────────────────────────────
function sectionProps(
  Ds: number, D: number, Bw: number, Bb: number, Db: number, Bf: number,
) {
  const Dw = D - Ds - Db; // web height (mm)
  // Areas (mm²)
  const A_slab = Ds * Bf;
  const A_web  = Dw * Bw;
  const A_bot  = Db * Bb;
  const Ax     = A_slab + A_web + A_bot; // total area mm²

  // Centroid from top (mm)
  const n_num = A_slab * (Ds / 2) + A_web * (Ds + Dw / 2) + A_bot * (Ds + Dw + Db / 2);
  const n = n_num / Ax;

  // Ixx (mm⁴) via parallel-axis theorem
  const Ixx_slab = (Bf * Math.pow(Ds, 3)) / 12 + A_slab * Math.pow(n - Ds / 2, 2);
  const Ixx_web  = (Bw * Math.pow(Dw, 3)) / 12 + A_web  * Math.pow(n - Ds - Dw / 2, 2);
  const Ixx_bot  = (Bb * Math.pow(Db, 3)) / 12 + A_bot  * Math.pow(n - Ds - Dw - Db / 2, 2);
  const Ixx      = Ixx_slab + Ixx_web + Ixx_bot; // mm⁴

  // Iyy (mm⁴)
  const Iyy = (Ds * Math.pow(Bf, 3)) / 12
            + (Dw * Math.pow(Bw, 3)) / 12
            + (Db * Math.pow(Bb, 3)) / 12;

  const Izz = Ixx + Iyy;

  // Convert to m⁴ (÷ 10¹²) for display; Ax to m²
  return {
    Dw,
    Ax:  Ax  / 1e6,    // m²
    n,                  // mm from top
    Ixx: Ixx / 1e12,   // m⁴  (ASTRA calls these "sq.sq.m")
    Iyy: Iyy / 1e12,
    Izz: Izz / 1e12,
  };
}

// ─── Load computation (mirrors ASTRA methodology exactly) ───────────────────
function computeLoads(inp: TGirderInputs) {
  const { L, B, NMG, NCG, CL, CR, Ds, D, Bw, Bb, Db, Bc, Dw, gammaC, gammaW } = inp;
  const { Hp, Wp, Bs, Hs, Hps, Wps, DCG, BCG, swf } = inp;

  const SMG = (B - CL - CR) / (NMG - 1);   // girder spacing (m)
  const SCG = L / (NCG - 1);               // cross-girder spacing (m)
  const Dw_m = Dw / 1000;                  // wearing coat (m)
  const Ds_m = Ds / 1000;                  // slab (m)

  // ── Inner girder DL ───────────────────────────────────────────────────────
  const wi1 = SMG * SCG * (Ds_m * gammaC + Dw_m * gammaW);  // deck slab load (kN)
  const wi2 = SCG * (Bw / 1000) * (D / 1000) * gammaC;      // girder self-weight (kN)
  const wi3 = wi1 + wi2;
  const wi4 = wi3 / SCG;                                      // UDL (kN/m)

  // ASTRA model constants (4-girder TBEAM)
  const NIG = NMG * (NCG - 1);  // inner member segments
  const NIM = 70;               // ASTRA constant
  const wiu_raw = wi4 * NIG / NIM;
  const wiu = wiu_raw * swf;     // factored UDL (kN/m) → ASTRA input ÷ 9.81 for Ton/m

  // ── Outer girder DL ──────────────────────────────────────────────────────
  const Bf_outer = SMG / 2 + (Bc / 1000);  // effective flange (m)
  const wo1 = (SMG / 2 + CL) * SCG * (Ds_m * gammaC + Dw_m * gammaW);
  const wo2 = SCG * (Bw / 1000) * (D / 1000) * gammaC;
  const wo3 = SCG * Hp * Wp * gammaC;      // parapet
  const wo4 = SCG * Bs * Hs * gammaC;      // footpath slab
  const wo5 = SCG * Hps * Wps * gammaC;    // footpath parapet
  const wo6 = wo1 + wo2 + wo3 + wo4 + wo5;
  const wo7 = wo6 / SCG;                   // UDL (kN/m)

  const NOG = 2 * (NCG - 1);  // outer member segments
  const NOM = 20;              // ASTRA constant
  const wou_raw = wo7 * NOG / NOM;
  const wou = wou_raw * swf;

  // ── Cross-girder joint loads ──────────────────────────────────────────────
  const wc1 = SMG * (DCG / 1000) * (BCG / 1000) * gammaC;  // per joint (kN)
  const NIGJ = NMG * NCG;
  const NIMJ = 81;  // ASTRA constant
  const wjl_raw = wc1 * NIGJ / NIMJ;
  const wjl = wjl_raw * swf;

  return {
    SMG, SCG,
    wi1, wi2, wi3, wi4, NIG, NIM, wiu_raw, wiu,
    wo1, wo2, wo3, wo4, wo5, wo6, wo7, NOG, NOM, wou_raw, wou,
    wc1, NIGJ, NIMJ, wjl_raw, wjl,
    Bf_outer,
  };
}

// ─── Tiny helpers ────────────────────────────────────────────────────────────
function N(x: number, d = 3) { return x.toFixed(d); }
function Lbl({ t }: { t: string }) {
  return <span className="text-[10px] text-app-muted">{t}</span>;
}
function Val({ v, unit }: { v: string | number; unit?: string }) {
  return (
    <span className="font-mono text-[12px] font-bold text-app-accent">
      {typeof v === 'number' ? N(v, 4) : v}
      {unit && <span className="ml-0.5 text-[10px] font-normal text-app-muted">{unit}</span>}
    </span>
  );
}
function Card({ label, value, unit, note }: { label: string; value: number | string; unit?: string; note?: string }) {
  return (
    <div className="rounded-lg border border-[var(--app-glass-border)] bg-app-card/40 p-3">
      <p className="text-[10px] text-app-muted">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-bold text-app-accent">
        {typeof value === 'number' ? value.toFixed(4) : value}
        {unit && <span className="ml-1 text-[10px] font-normal text-app-muted">{unit}</span>}
      </p>
      {note && <p className="mt-0.5 text-[9px] text-app-muted">{note}</p>}
    </div>
  );
}

function NumInput({ label, val, unit, step = 0.1, onChange }: {
  label: string; val: number; unit?: string; step?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-app-muted">{label}{unit && <span className="ml-1 text-app-muted/60">({unit})</span>}</label>
      <input
        type="number"
        value={val}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full rounded border border-[var(--app-glass-border)] bg-app-card/60 px-2 py-1 text-xs font-mono text-app-fg focus:border-app-accent focus:outline-none"
      />
    </div>
  );
}

// ─── Section card ────────────────────────────────────────────────────────────
function SectionBlock({ title, Bf, props }: { title: string; Bf: number; props: ReturnType<typeof sectionProps> }) {
  return (
    <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/30 p-4">
      <p className="mb-3 text-xs font-bold text-app-accent uppercase tracking-wide">{title}</p>
      <div className="mb-2 text-[10px] text-app-muted space-y-0.5">
        <p>Bf (effective flange) = {N(Bf, 0)} mm   &nbsp; Dw (web) = {N(props.Dw, 0)} mm</p>
        <p>Neutral axis from top = <strong className="text-emerald-400">{N(props.n, 2)} mm</strong></p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card label="Ax (area)" value={props.Ax} unit="m²" note="(Ds×Bf + Dw×Bw + Db×Bb)" />
        <Card label="Ixx (flex)" value={props.Ixx} unit="m⁴" note="about strong axis (NA)" />
        <Card label="Iyy (lat)" value={props.Iyy} unit="m⁴" note="about weak axis" />
        <Card label="Izz (polar)" value={props.Izz} unit="m⁴" note="Ixx + Iyy" />
      </div>
    </div>
  );
}

// ─── ASTRA snippet ───────────────────────────────────────────────────────────
function AstraSnippet({ loads, inp }: { loads: ReturnType<typeof computeLoads>; inp: TGirderInputs }) {
  const [copied, setCopied] = useState(false);
  const { wiu, wou, wjl, NIG, NIM, NOG, NOM, NIGJ, NIMJ } = loads;

  const snippet = `ASTRA LOAD COMPUTATION — T-GIRDER BRIDGE
Span L = ${inp.L} m  |  Width B = ${inp.B} m  |  NMG = ${inp.NMG}  |  NCG = ${inp.NCG}
SMG = ${N(loads.SMG, 3)} m  |  SCG = ${N(loads.SCG, 3)} m
swf = ${inp.swf}  |  Load type = ${inp.loadType}  |  IF = ${inp.impactFactor}

────────────────────────────────────
INNER GIRDER MEMBERS (131 TO 200)
────────────────────────────────────
Deck slab DL          wi1 = ${N(loads.wi1, 3)} kN
Girder self-weight    wi2 = ${N(loads.wi2, 3)} kN
Total per panel       wi3 = ${N(loads.wi3, 3)} kN
UDL (unfactored)      wi4 = ${N(loads.wi4, 3)} kN/m
NIG segments = ${NIG}  |  NIM (model) = ${NIM}
Factored UDL (model)  wiu = ${N(wiu / 9.81, 4)} Ton/m

>> 131 TO 200 UNI GY -${N(wiu / 9.81, 4)}

────────────────────────────────────
OUTER GIRDER MEMBERS (121 TO 130, 201 TO 210)
────────────────────────────────────
Deck + WC + parapet   wo6 = ${N(loads.wo6, 3)} kN
UDL (unfactored)      wo7 = ${N(loads.wo7, 3)} kN/m
NOG segments = ${NOG}  |  NOM (model) = ${NOM}
Factored UDL (model)  wou = ${N(wou / 9.81, 4)} Ton/m

>> 121 TO 130 UNI GY -${N(wou / 9.81, 4)}
>> 201 TO 210 UNI GY -${N(wou / 9.81, 4)}

────────────────────────────────────
CROSS-GIRDER JOINT LOADS (13–109)
────────────────────────────────────
Per-joint cross girder DL  wc1 = ${N(loads.wc1, 3)} kN
NIGJ = ${NIGJ}  |  NIMJ (model) = ${NIMJ}
Factored joint load        wjl = ${N(wjl / 9.81, 4)} Ton

>> JOINT LOAD
>> 13 TO 21 FZ -${N(wjl / 9.81, 4)}
>> 24 TO 32 FZ -${N(wjl / 9.81, 4)}
>> 35 TO 43 FZ -${N(wjl / 9.81, 4)}
>> 46 TO 54 FZ -${N(wjl / 9.81, 4)}
>> 57 TO 65 FZ -${N(wjl / 9.81, 4)}
>> 68 TO 76 FZ -${N(wjl / 9.81, 4)}
>> 79 TO 87 FZ -${N(wjl / 9.81, 4)}
>> 90 TO 98 FZ -${N(wjl / 9.81, 4)}
>> 101 TO 109 FZ -${N(wjl / 9.81, 4)}`;

  const copy = () => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-xl border border-[var(--app-glass-border)] bg-[#0d1117] p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">ASTRA-Format Input Data</p>
        <button onClick={copy}
          className="flex items-center gap-1.5 rounded border border-[var(--app-glass-border)] px-2 py-1 text-[10px] text-app-muted hover:text-app-fg transition">
          {copied ? <><Check className="h-3 w-3 text-emerald-400" />Copied!</> : <><Copy className="h-3 w-3" />Copy</>}
        </button>
      </div>
      <pre className="overflow-x-auto text-[10px] leading-relaxed text-emerald-300 whitespace-pre">{snippet}</pre>
    </div>
  );
}

// ─── Load Types Table ────────────────────────────────────────────────────────
function LoadTypesPanel({ selected, onSelect }: { selected: string; onSelect: (l: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5">
      <button className="flex w-full items-center gap-2 text-left" onClick={() => setOpen(o => !o)}>
        <Truck className="h-4 w-4 text-app-accent" />
        <h3 className="text-base font-semibold text-app-fg">IRC / ASTRA Vehicle Load Types</h3>
        <span className="rounded-full border border-[var(--app-glass-border)] bg-app-card/70 px-2 py-0.5 text-[10px] text-app-muted">16 types</span>
        <span className="ml-auto text-app-muted">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
      </button>

      {open && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--app-glass-border)]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--app-glass-border)] bg-app-card/70">
                {['#', 'ASTRA Code', 'Description', 'Standard', 'Max Axle (kN)', 'Lanes', ''].map(h => (
                  <th key={h} className="px-3 py-2 text-[10px] font-bold text-app-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LOAD_TYPES.map(lt => (
                <tr key={lt.id}
                  onClick={() => onSelect(lt.label)}
                  className={`border-b border-[var(--app-glass-border)]/40 cursor-pointer transition hover:bg-app-card/40 ${selected === lt.label ? 'bg-app-accent/10' : ''}`}>
                  <td className="px-3 py-2 font-mono text-[11px] text-app-muted">{lt.id}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-emerald-400 whitespace-nowrap">{lt.code}</td>
                  <td className="px-3 py-2 text-[11px] text-app-fg max-w-[200px]">{lt.label}</td>
                  <td className="px-3 py-2 text-[10px] text-app-muted whitespace-nowrap">{lt.std}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-amber-400 text-right">{lt.max_axle}</td>
                  <td className="px-3 py-2 text-[10px] text-app-muted">{lt.lanes}</td>
                  <td className="px-3 py-2">
                    {selected === lt.label && <span className="rounded-full bg-app-accent/20 px-2 py-0.5 text-[9px] font-bold text-app-accent">ACTIVE</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-1 text-[9px] text-app-muted border-t border-[var(--app-glass-border)]/40">
            Source: ASTRA_Data_Input.txt — E_DRIVE_BRIDGE_DESIGN/11 bridge design astra. Click a row to select as active load type.
            IRC:6-2016 Cl.204 governs vehicle loads; IS:1893 for seismic.
          </p>
        </div>
      )}

      {!open && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {LOAD_TYPES.map(lt => (
            <button key={lt.id}
              onClick={() => onSelect(lt.label)}
              className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
                selected === lt.label
                  ? 'border-app-accent bg-app-accent/15 font-bold text-app-accent'
                  : 'border-[var(--app-glass-border)] text-app-muted hover:text-app-fg'
              }`}>
              {lt.id}. {lt.label}
            </button>
          ))}
        </div>
      )}

      {/* detail card for selected */}
      {(() => {
        const lt = LOAD_TYPES.find(l => l.label === selected);
        return lt ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-app-accent/20 bg-app-accent/5 px-3 py-2 text-[11px]">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-app-accent" />
            <span><strong className="text-app-fg">{lt.label} ({lt.code}):</strong> {lt.desc}
              Max axle load = <strong className="text-amber-400">{lt.max_axle} kN</strong>.
              Standard: {lt.std}. Applicable lanes: {lt.lanes}.
            </span>
          </div>
        ) : null;
      })()}
    </section>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function TGirder() {
  const [inp, setInp] = useState<TGirderInputs>(DEFAULTS);

  const set = (key: keyof TGirderInputs, val: number | string) =>
    setInp(p => ({ ...p, [key]: val }));

  const LD = useMemo(() => computeLoads(inp), [inp]);

  // Section properties
  const innerBf = inp.NMG > 1
    ? ((inp.B - inp.CL - inp.CR) / (inp.NMG - 1)) * 1000  // mm
    : inp.B * 1000;
  const outerBf = (innerBf / 2) + inp.Bc;  // mm  (Gs/2 + Bc)
  const crossBf = inp.BCG;                  // mm (= web, no flange)

  const innerProps = useMemo(() => sectionProps(inp.Ds, inp.D, inp.Bw, inp.Bb, inp.Db, innerBf), [inp, innerBf]);
  const outerProps = useMemo(() => sectionProps(inp.Ds, inp.D, inp.Bw, inp.Bb, inp.Db, outerBf), [inp, outerBf]);
  const crossProps  = useMemo(() => sectionProps(0,     inp.DCG, inp.BCG, inp.BCG, 0,   inp.BCG), [inp]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 space-y-6">

      {/* ── PAGE HEADER ── */}
      <div className="text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <GitBranch className="h-6 w-6 text-app-accent" />
          <h1 className="text-2xl font-bold text-app-fg">T-Girder Bridge Analysis</h1>
        </div>
        <p className="text-sm text-app-muted max-w-2xl mx-auto">
          Section properties, dead-load UDL computation, and IRC live-load reference — all following
          <strong className="text-app-fg"> ASTRA 15 methodology</strong>.
          Outputs match ASTRA input data file format for direct copy-paste into the software.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] text-app-muted">
          {['IRC:6-2016 Cl.204', 'IRC:21', 'IS:456-2000', 'ASTRA 15 Tutorials', 'T-Beam Worksheet 1 & 2'].map(s => (
            <span key={s} className="rounded-full border border-[var(--app-glass-border)] px-2 py-0.5">{s}</span>
          ))}
        </div>
      </div>

      {/* ── INPUTS ── */}
      <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-app-accent" />
          <h2 className="text-base font-semibold text-app-fg">Bridge Geometry & Cross-Section</h2>
          <button
            onClick={() => setInp(DEFAULTS)}
            className="ml-auto rounded border border-[var(--app-glass-border)] px-2 py-0.5 text-[10px] text-app-muted hover:text-app-fg transition">
            Reset to ASTRA Example
          </button>
        </div>

        {/* Geometry */}
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-app-muted">Bridge layout</p>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <NumInput label="Effective span L" val={inp.L} unit="m" step={0.1} onChange={v => set('L', v)} />
          <NumInput label="Total width B" val={inp.B} unit="m" step={0.1} onChange={v => set('B', v)} />
          <NumInput label="No. main girders NMG" val={inp.NMG} unit="" step={1} onChange={v => set('NMG', v)} />
          <NumInput label="No. cross girders NCG" val={inp.NCG} unit="" step={1} onChange={v => set('NCG', v)} />
          <NumInput label="Left cantilever CL" val={inp.CL} unit="m" step={0.05} onChange={v => set('CL', v)} />
          <NumInput label="Right cantilever CR" val={inp.CR} unit="m" step={0.05} onChange={v => set('CR', v)} />
        </div>

        {/* Cross-section */}
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-app-muted">Girder cross-section (mm)</p>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <NumInput label="Deck slab Ds" val={inp.Ds} unit="mm" step={10} onChange={v => set('Ds', v)} />
          <NumInput label="Total depth D" val={inp.D} unit="mm" step={50} onChange={v => set('D', v)} />
          <NumInput label="Web width Bw" val={inp.Bw} unit="mm" step={25} onChange={v => set('Bw', v)} />
          <NumInput label="Bot flange Bb" val={inp.Bb} unit="mm" step={25} onChange={v => set('Bb', v)} />
          <NumInput label="Bot flange Db" val={inp.Db} unit="mm" step={25} onChange={v => set('Db', v)} />
          <NumInput label="Outer cantilever Bc" val={inp.Bc} unit="mm" step={50} onChange={v => set('Bc', v)} />
        </div>

        {/* Cross girder */}
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-app-muted">Cross girder (mm)</p>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <NumInput label="Depth DCG" val={inp.DCG} unit="mm" step={50} onChange={v => set('DCG', v)} />
          <NumInput label="Width BCG" val={inp.BCG} unit="mm" step={25} onChange={v => set('BCG', v)} />
          <NumInput label="Wearing coat Dw" val={inp.Dw} unit="mm" step={5} onChange={v => set('Dw', v)} />
        </div>

        {/* Parapet & footpath */}
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-app-muted">Parapet & footpath</p>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <NumInput label="Parapet height Hp" val={inp.Hp} unit="m" step={0.1} onChange={v => set('Hp', v)} />
          <NumInput label="Parapet width Wp" val={inp.Wp} unit="m" step={0.05} onChange={v => set('Wp', v)} />
          <NumInput label="Footpath width Bs" val={inp.Bs} unit="m" step={0.1} onChange={v => set('Bs', v)} />
          <NumInput label="Footpath depth Hs" val={inp.Hs} unit="m" step={0.05} onChange={v => set('Hs', v)} />
          <NumInput label="FP parapet Hps" val={inp.Hps} unit="m" step={0.1} onChange={v => set('Hps', v)} />
          <NumInput label="FP parapet Wps" val={inp.Wps} unit="m" step={0.05} onChange={v => set('Wps', v)} />
        </div>

        {/* Load factors */}
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-app-muted">Loading</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumInput label="γ concrete" val={inp.gammaC} unit="kN/m³" step={0.5} onChange={v => set('gammaC', v)} />
          <NumInput label="γ wearing coat" val={inp.gammaW} unit="kN/m³" step={0.5} onChange={v => set('gammaW', v)} />
          <NumInput label="Self-weight factor swf" val={inp.swf} unit="" step={0.1} onChange={v => set('swf', v)} />
          <NumInput label="Impact factor IF" val={inp.impactFactor} unit="" step={0.001} onChange={v => set('impactFactor', v)} />
        </div>
      </section>

      {/* ── SECTION PROPERTIES ── */}
      <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="h-4 w-4 text-app-accent" />
          <h2 className="text-base font-semibold text-app-fg">Section Properties</h2>
          <span className="rounded-full border border-[var(--app-glass-border)] bg-app-card/70 px-2 py-0.5 text-[10px] text-app-muted">
            Parallel-axis theorem (parallel flange + web + bot flange)
          </span>
        </div>

        {/* Derived dimensions row */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 mb-4">
          {[
            { l: 'SMG (girder spacing)', v: LD.SMG, u: 'm' },
            { l: 'SCG (x-girder spacing)', v: LD.SCG, u: 'm' },
            { l: 'Inner Bf (flange)', v: innerBf / 1000, u: 'm' },
            { l: 'Outer Bf (flange)', v: outerBf / 1000, u: 'm' },
            { l: 'Web height Dw', v: (inp.D - inp.Ds - inp.Db) / 1000, u: 'm' },
            { l: 'Dw/D ratio', v: (inp.D - inp.Ds - inp.Db) / inp.D, u: '' },
          ].map(p => (
            <div key={p.l} className="rounded-lg border border-[var(--app-glass-border)] bg-app-card/30 p-2">
              <p className="text-[9px] text-app-muted">{p.l}</p>
              <p className="font-mono text-xs font-bold text-app-fg">{p.v.toFixed(4)} <span className="text-[9px] text-app-muted">{p.u}</span></p>
            </div>
          ))}
        </div>

        <SectionBlock title="Inner Main Longitudinal Girder" Bf={innerBf} props={innerProps} />
        <SectionBlock title={`Outer Main Longitudinal Girder (Bc = ${inp.Bc} mm)`} Bf={outerBf} props={outerProps} />

        {/* Cross girder — simplified (no top/bot flange) */}
        <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/30 p-4">
          <p className="mb-3 text-xs font-bold text-app-accent uppercase tracking-wide">Cross Girder (rectangular section)</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(() => {
              const b = inp.BCG / 1000, h = inp.DCG / 1000;
              const Ixx = b * Math.pow(h, 3) / 12;
              const Iyy = h * Math.pow(b, 3) / 12;
              return [
                { label: 'Ax (area)', value: b * h, unit: 'm²', note: 'b × D' },
                { label: 'Ixx (flex)', value: Ixx, unit: 'm⁴', note: 'b×D³/12' },
                { label: 'Iyy (lat)', value: Iyy, unit: 'm⁴', note: 'D×b³/12' },
                { label: 'Izz (polar)', value: Ixx + Iyy, unit: 'm⁴', note: 'Ixx + Iyy' },
              ].map(p => <Card key={p.label} {...p} />);
            })()}
          </div>
        </div>
      </section>

      {/* ── LOAD COMPUTATION ── */}
      <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-app-accent" />
          <h2 className="text-base font-semibold text-app-fg">Dead Load Computation (ASTRA Methodology)</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Inner girder */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/30 p-4 space-y-1.5">
            <p className="text-[11px] font-bold text-emerald-400 uppercase mb-2">Inner Girder (131–200)</p>
            {[
              ['Deck slab DL  wi1', LD.wi1, 'kN'],
              ['Girder self-wt wi2', LD.wi2, 'kN'],
              ['Panel total wi3', LD.wi3, 'kN'],
              ['Unfactored UDL wi4', LD.wi4, 'kN/m'],
              [`NIG = ${LD.NIG}  NIM = ${LD.NIM}`, ''],
              ['Factored UDL wiu', LD.wiu, 'kN/m'],
              ['ASTRA input (Ton/m)', LD.wiu / 9.81, 'T/m'],
            ].map(([l, v, u]) => (
              <div key={String(l)} className="flex items-center justify-between text-[11px]">
                <Lbl t={String(l)} />
                {v !== '' && <Val v={Number(v)} unit={String(u)} />}
              </div>
            ))}
            <div className="mt-2 rounded bg-emerald-500/10 border border-emerald-500/20 p-2 font-mono text-[10px] text-emerald-400">
              131 TO 200 UNI GY -{N(LD.wiu / 9.81, 4)}
            </div>
          </div>

          {/* Outer girder */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/30 p-4 space-y-1.5">
            <p className="text-[11px] font-bold text-blue-400 uppercase mb-2">Outer Girder (121–130, 201–210)</p>
            {[
              ['Deck slab + WC  wo1', LD.wo1, 'kN'],
              ['Girder self-wt wo2', LD.wo2, 'kN'],
              ['Parapet wo3', LD.wo3, 'kN'],
              ['Footpath slab wo4', LD.wo4, 'kN'],
              ['FP parapet wo5', LD.wo5, 'kN'],
              ['Panel total wo6', LD.wo6, 'kN'],
              ['Unfactored UDL wo7', LD.wo7, 'kN/m'],
              [`NOG = ${LD.NOG}  NOM = ${LD.NOM}`, ''],
              ['Factored UDL wou', LD.wou, 'kN/m'],
              ['ASTRA input (Ton/m)', LD.wou / 9.81, 'T/m'],
            ].map(([l, v, u]) => (
              <div key={String(l)} className="flex items-center justify-between text-[11px]">
                <Lbl t={String(l)} />
                {v !== '' && <Val v={Number(v)} unit={String(u)} />}
              </div>
            ))}
            <div className="mt-2 rounded bg-blue-500/10 border border-blue-500/20 p-2 font-mono text-[10px] text-blue-400">
              121 TO 130 UNI GY -{N(LD.wou / 9.81, 4)}{'\n'}
              201 TO 210 UNI GY -{N(LD.wou / 9.81, 4)}
            </div>
          </div>

          {/* Cross girder joint loads */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/30 p-4 space-y-1.5">
            <p className="text-[11px] font-bold text-amber-400 uppercase mb-2">Cross-Girder Joints (13–109)</p>
            {[
              ['Per joint DL  wc1', LD.wc1, 'kN'],
              [`NIGJ = ${LD.NIGJ}  NIMJ = ${LD.NIMJ}`, ''],
              ['Unfactored joint load', LD.wjl_raw, 'kN'],
              ['Factored wjl', LD.wjl, 'kN'],
              ['ASTRA input (Ton)', LD.wjl / 9.81, 'Ton'],
            ].map(([l, v, u]) => (
              <div key={String(l)} className="flex items-center justify-between text-[11px]">
                <Lbl t={String(l)} />
                {v !== '' && <Val v={Number(v)} unit={String(u)} />}
              </div>
            ))}
            <div className="mt-2 rounded bg-amber-500/10 border border-amber-500/20 p-2 font-mono text-[10px] text-amber-400">
              JOINT LOAD{'\n'}
              13 TO 21 FZ -{N(LD.wjl / 9.81, 4)}{'\n'}
              24 TO 32 FZ -{N(LD.wjl / 9.81, 4)}{'\n'}
              ... (all node groups)
            </div>

            {/* Impact factor note */}
            <div className="mt-3 rounded border border-[var(--app-glass-border)]/40 bg-app-card/20 p-2">
              <p className="text-[9px] text-app-muted">
                <strong className="text-app-fg">Live load impact factor</strong> = {inp.impactFactor} (IRC:6 Cl.211.2).
                For {inp.loadType} at span {inp.L} m. Applied in ASTRA via txt_Load_Impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ASTRA SNIPPET ── */}
      <AstraSnippet loads={LD} inp={inp} />

      {/* ── LOAD TYPES ── */}
      <LoadTypesPanel selected={inp.loadType} onSelect={v => set('loadType', v)} />

      {/* ── REFERENCE NOTES ── */}
      <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-app-accent" />
          <h2 className="text-base font-semibold text-app-fg">ASTRA 15 Tutorial Reference Notes</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-[11px] text-app-muted">
          {[
            {
              title: 'T-Girder Benchmark (ASTRA data file)',
              body: 'Project: frm_RCC_T_Girder_WS — IndianStandard. Span L = 19.2 m, B = 12.1 m, NMG = 4, NCG = 3. ' +
                'SMG = 2.650 m, SCG = 9.600 m. Ds = 250 mm, D = 1800 mm, Bw = 300 mm, Bb = 650 mm, Db = 650 mm. ' +
                'Ixx inner = 25.7603 m⁴, Ixx outer = 25.7603 m⁴, Ax = 1.355 m². ' +
                'Inner UDL = 0.5364 T/m (swf=1.4). Outer UDL = 2.0088 T/m. Joint load = 0.4617 Ton.',
            },
            {
              title: 'Pier with Piles Benchmark (ASTRA seismic data file)',
              body: 'Project: frmPier_Design_with_Piles — IndianStandard. Zone III (Z = 0.24), I = 1.50, Sa/g = 2.50. ' +
                'Pile dia = 1.2 m, 6 piles per pier. DL = 479.01 kN, LL max long = 92.00 kN, LL max trans = 46.78 kN. ' +
                'Pier cap = 111.24 kN, Pier shaft = 168.58 kN. CF = 0.05. Pedestal levels: 297, 393, 395 m.',
            },
            {
              title: 'ASTRA Member Numbering (T-Girder model)',
              body: 'Inner main girder members: 131 TO 200 (NIM = 70 constant). ' +
                'Outer main girder members: 121 TO 130 (left) and 201 TO 210 (right). NOM = 20 constant. ' +
                'Cross-girder joints: 13, 24, 35, 46, 57, 68, 79, 90, 101 (each group of 9 joints). NIMJ = 81.',
            },
            {
              title: 'ASTRA TUTORIALS Folder Structure (GitHub)',
              body: 'ASTRA Pro Analysis Examples (4 types) | DESIGN (Abutment, Bearing, Composite, ' +
                'Continuous PSC Box Girder, Foundation, Geotechnics, LSM, Material Properties, PSC Box Girder, ' +
                'Pier, Pre-Stressed, Section Properties, Seismic Coefficient, Steel Truss, TBEAM Bridge) | ' +
                'HYDRAULIC CALCULATIONS | Interaction Diagrams | Design of Box Culvert | ' +
                'Design of Multi Cell Box Culvert | Worksheet_Design | Under Pass Drawings | TABLES.',
            },
            {
              title: 'IRC:6-2016 Load Combination (ASTRA support)',
              body: 'ASTRA supports: DL, SIDL, LL (all 16 types), WL (wind), EQ (seismic Cl.219), ' +
                'CF (centrifugal), BRK (braking), EP (earth pressure), HY (hydrodynamic). ' +
                'Load cases: 1=DL only, 2=DL+LL, 3=DL+LL+WL, 4=DL+LL+EQ (seismic governs for Zone III+).',
            },
            {
              title: 'Impact Factor (IRC:6-2016 Cl.211.2)',
              body: 'IF = 4.5 / (6 + L) for IRC Class A & B on spans ≤ 45 m (max 0.5). ' +
                'For 70R Tracked: IF = 10% (max). For 70R Wheeled: IF = 25% for L ≤ 23 m. ' +
                'Railway bridges: 0.5+1.46/(L+1.6) for BG. ASTRA applies via txt_Load_Impact field.',
            },
          ].map(n => (
            <div key={n.title} className="rounded-lg border border-[var(--app-glass-border)]/40 bg-app-card/20 p-3">
              <p className="mb-1 font-semibold text-app-fg">{n.title}</p>
              <p>{n.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ASTRA 15 Inline Reference ──────────────────────────────────── */}
      <AstraContextPanel
        pageKey="tgirder"
        title="T-Beam Worksheets 1 & 2, Section Properties, Material Properties"
        defaultOpen={true}
      />

    </div>
  );
}
