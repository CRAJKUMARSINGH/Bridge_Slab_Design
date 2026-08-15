/**
 * AstraContextPanel — Embeddable ASTRA 15 reference widget
 * Drop into any calculator page to show contextually relevant module formulas,
 * benchmarks, and IRC/IS standards inline.
 * Source: CRAJKUMARSINGH/Bridge_Slab_Design → Attached_Assets/ASTRA 15 TUTORIALS
 */
import { useState } from 'react';
import { Link } from 'wouter';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, CheckCircle2 } from 'lucide-react';

export type AstraPageKey =
  | 'tgirder'
  | 'hydraulics'
  | 'design'
  | 'pier'
  | 'abutment'
  | 'drawing'
  | 'estimate'
  | 'interactionDiagram';

interface ModuleRef {
  title: string;
  folder: string;
  standards: string[];
  accentColor: string;           // tailwind text-* color
  borderColor: string;           // tailwind border-* color
  bgColor: string;               // tailwind bg-* color
  formulas: string[];            // shown in monospace block
  benchmark?: string;
  appPage?: string;
  appPageLabel?: string;
}

// ─── Module data bundles by page ─────────────────────────────────────────────

const BUNDLES: Record<AstraPageKey, ModuleRef[]> = {

  tgirder: [
    {
      title: 'T-Beam Bridge — Worksheet 1',
      folder: 'DESIGN/TBEAM Bridge/TBEAM Worksheet Design 1',
      standards: ['IRC:21', 'IRC:6-2016', 'IS:456-2000'],
      accentColor: 'text-blue-400', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/8',
      formulas: [
        'SMG = (B − CL − CR) / (NMG − 1)',
        'wi_inner = SMG × SCG × (Ds×γc + Dw×γw)',
        'SCG = L / (NCG + 1)  [panel length]',
        'Joint load = wi_inner × SCG  [at cross-girder]',
      ],
      benchmark: 'ASTRA frm_RCC_T_Girder_WS: L=19.2m, NMG=4. Inner UDL=0.5364 T/m, Outer UDL=2.0088 T/m, Joint=0.4617 T',
      appPage: '/t-girder', appPageLabel: 'T-Girder Calculator',
    },
    {
      title: 'T-Beam Bridge — Worksheet 2 (Courbon)',
      folder: 'DESIGN/TBEAM Bridge/TBEAM Worksheet Design 2',
      standards: ['IRC:21', 'IRC:6-2016'],
      accentColor: 'text-violet-400', borderColor: 'border-violet-500/30', bgColor: 'bg-violet-500/8',
      formulas: [
        'Courbon reaction = P/n × (1 + n·e·x / Σx²)',
        'e = eccentricity of live load from bridge CL',
        'Ld = σs×φ / (4×τbd)  [development length IS:456]',
        'Mu_lim = 0.138×fck×b×d²  [IS:456 Cl.G-1.1(c)]',
      ],
    },
    {
      title: 'Section Properties',
      folder: 'DESIGN/Section Properties',
      standards: ['IS:456-2000', 'IRC:21'],
      accentColor: 'text-emerald-400', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/8',
      formulas: [
        'ȳ = ΣAi·yi / ΣAi  [centroid NA]',
        'Ixx = Σ[bi·hi³/12 + Ai·(yi−ȳ)²]  [parallel-axis]',
        'Sx = Ixx / ȳ  [elastic section modulus]',
        'rxx = √(Ixx / A)  [radius of gyration]',
      ],
      benchmark: 'Inner T: Ixx=25.7603 m⁴, Ax=1.355 m², ȳ=0.732 m from bottom (ASTRA)',
      appPage: '/t-girder', appPageLabel: 'Section Properties (T-Girder)',
    },
    {
      title: 'Material Properties',
      folder: 'DESIGN/Material Properties',
      standards: ['IS:456-2000', 'IS:1786-2008'],
      accentColor: 'text-amber-400', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/8',
      formulas: [
        'Ec = 5000√fck  [MPa, IS:456 Cl.6.2.3.1]',
        'm = 280/(3×σcbc)  [modular ratio, WSM]',
        'γc = 24 kN/m³ (RCC),  γs = 78.5 kN/m³ (steel)',
        'γm_c = 1.5,  γm_s = 1.15  [IS:456 LSM partial factors]',
      ],
    },
  ],

  hydraulics: [
    {
      title: 'Hydraulic Calculations',
      folder: 'HYDRAULIC CALCULATIONS',
      standards: ['IS:6966', 'IRC SP-13', 'IS:7784'],
      accentColor: 'text-cyan-400', borderColor: 'border-cyan-500/30', bgColor: 'bg-cyan-500/8',
      formulas: [
        'Q = (1/n)×A×R^(2/3)×S0^(1/2)  [Manning]',
        'L = 4.8√Q  [Lacey regime waterway]',
        'dsm = 1.34×(q²/f)^(1/3)  [Lacey scour depth]',
        'dE/dx = (S0−Sf) / (1−Fr²)  [backwater ODE]',
        'Fr = V / √(g×y)  [Froude number]',
        'y_c = (q²/g)^(1/3)  [critical depth]',
      ],
      benchmark: 'IRC SP-13: freeboard = 0.9 m for Q ≥ 300 m³/s. Afflux ≤ 0.3 m (Molesworth)',
      appPage: '/hydraulics', appPageLabel: 'Hydraulics Calculator',
    },
    {
      title: 'Hydrology — Synthetic Unit Hydrograph',
      folder: 'ASTRA Pro Analysis Examples/04 Analysis for Hydrology',
      standards: ['IS:11223', 'CWC SUH Method'],
      accentColor: 'text-blue-400', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/8',
      formulas: [
        'Qp = 0.278×C×i×A  [Rational method, m³/s]',
        'tp = 0.5×tr + tlag  [time to peak, hr]',
        'Qp_SUH = 2.778×A/tp  [CWC synthetic peak]',
        'tc = 0.0195×L^0.77×S^(−0.385)  [Kirpich, min]',
      ],
      benchmark: 'CWC SUH: for A=100 km², tlag=0.6tc → Qp ≈ 150–250 m³/s (medium soil)',
      appPage: '/hydraulics', appPageLabel: 'Hydraulics (hydrology inputs)',
    },
  ],

  design: [
    {
      title: 'Seismic Coefficient',
      folder: 'DESIGN/Seismic Coefficient',
      standards: ['IRC:6-2016 Cl.219', 'IS:1893-2016'],
      accentColor: 'text-orange-400', borderColor: 'border-orange-500/30', bgColor: 'bg-orange-500/8',
      formulas: [
        'Ah = Z/2 × Sa/g × I/R',
        'Zone II=0.10, III=0.24, IV=0.36, V=0.36 [Z values]',
        'I = 1.5 (highway bridges, IRC:6)',
        'R = 2.5 (WSM), 3.0 (LSM)',
        'Sa/g: rock=2.5/T, medium=1.5/T, soft=1.5/T',
        'T = 2π√(M/K)  [pier stiffness, Rayleigh]',
      ],
      benchmark: 'Zone III pier: Z=0.24, I=1.5, Sa/g=2.50 → Ah=0.09 (frmPier_Design_with_Piles)',
      appPage: '/design', appPageLabel: 'Design (Seismic panel)',
    },
    {
      title: 'Material Properties',
      folder: 'DESIGN/Material Properties',
      standards: ['IS:456-2000', 'IRC:21'],
      accentColor: 'text-emerald-400', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/8',
      formulas: [
        'Ec = 5000√fck  [IS:456 Cl.6.2.3.1]',
        'σcbc (M25) = 8.5 MPa  [IS:456 Table 21]',
        'σst (Fe415) = 230 MPa  [IS:456 Table 22]',
        'm = 280/(3×σcbc)  [modular ratio WSM]',
      ],
    },
    {
      title: 'Bearing Design',
      folder: 'DESIGN/Bearing Design',
      standards: ['IRC:83 Pt.I', 'IRC:83 Pt.III'],
      accentColor: 'text-blue-400', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/8',
      formulas: [
        'S = A_b / (2×t_e × perimeter)  [shape factor]',
        'σm = P/A ≤ G×S²  [compressive stress]',
        'γ_shear = δ_h / Σt_e ≤ 0.5  [shear strain]',
        'γ_total = γc + γs + γα ≤ 0.7  [combined strain]',
      ],
    },
    {
      title: 'Limit State Method',
      folder: 'DESIGN/Limit State Method',
      standards: ['IS:456-2000', 'IRC:112-2011'],
      accentColor: 'text-violet-400', borderColor: 'border-violet-500/30', bgColor: 'bg-violet-500/8',
      formulas: [
        'Factored: DL×1.5 + LL×1.5  [IS:456 Table 18]',
        'Xu_lim/d: Fe415=0.48, Fe500=0.46  [IS:456 Cl.38.1]',
        'Pt_min = 0.85/fy×100%  [IS:456 Cl.26.5.1.1]',
        'Crack width w = 3×acr×εm  [IS:456 Annex F]',
      ],
    },
  ],

  pier: [
    {
      title: 'Pier Worksheet Design 1',
      folder: 'DESIGN/Pier/Pier Worksheet Design 1',
      standards: ['IRC:6-2016', 'IRC:78', 'IS:456-2000'],
      accentColor: 'text-amber-400', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/8',
      formulas: [
        'HF_braking = 0.2×W_LL  [IRC:6 Cl.214, single lane]',
        'F_wind = p_z × C_d × A  [IRC:6 Cl.212]',
        'P_bearing = ΣW/A ± M_x/Z_x ± M_y/Z_y',
        'FOS_sliding = μ·ΣW / ΣH ≥ 1.50',
        'FOS_overturning = ΣM_restoring / ΣM_overturn ≥ 2.0',
      ],
      benchmark: 'BEDACH River pier: W_DL=479 kN, W_LL=92 kN → SBC check = 7.8 kg/cm² (ASTRA)',
      appPage: '/pier-stability', appPageLabel: 'Pier Stability',
    },
    {
      title: 'Pier with Pile Foundation',
      folder: 'DESIGN/Pier (ASTRA_Data_Input.txt)',
      standards: ['IRC:6-2016 Cl.219', 'IS:2911', 'IS:456'],
      accentColor: 'text-orange-400', borderColor: 'border-orange-500/30', bgColor: 'bg-orange-500/8',
      formulas: [
        'P_pile = ΣW/n ± M_long·x_i / Σx_i²',
        'Qlateral = 0.68×E·I×kh  [Broms lateral capacity]',
        'Group efficiency η = 1 − θ(n_row×(m−1)+n_col×(n−1)) / 90mn',
        'Ah = Z/2 × Sa/g × I/R  [seismic, IRC:6 Cl.219]',
      ],
      benchmark: 'frmPier_Piles: Zone III, Z=0.24, pile dia=1.2m, DL=479.01 kN, LL_long=92 kN',
      appPage: '/design', appPageLabel: 'Design (Seismic panel)',
    },
    {
      title: 'Pier — Circular Design',
      folder: 'DESIGN/Pier/Pier Circular Design',
      standards: ['IRC:6', 'IRC:78', 'IS:456'],
      accentColor: 'text-blue-400', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/8',
      formulas: [
        'Kern = D/8  [no-tension kern for circle]',
        'Asc_spiral = 0.36×(Ag/Ac − 1)×fck/fy  [IS:456 Cl.39.4]',
        'P-M envelope via strain compatibility (ε_cu=0.0035)',
        'Biaxial: (Mux/Mux1)^α + (Muy/Muy1)^α ≤ 1.0',
      ],
      appPage: '/interaction-diagram', appPageLabel: 'P-M Interaction Diagram',
    },
  ],

  abutment: [
    {
      title: 'Abutment — Worksheet 1 (Coulomb)',
      folder: 'DESIGN/Abutment/Abutment Worksheet Design 1',
      standards: ['IRC:6', 'IRC:78', 'IS:456-2000'],
      accentColor: 'text-amber-400', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/8',
      formulas: [
        'Ka = sin²(α+φ) / [sin²α · sin(α−δ) · (1+√(A/B))²]',
        'Pa = 0.5 × γ_s × H² × Ka',
        'Pa_h = Pa·cos(δ),  Pa_v = Pa·sin(δ)',
        'FOS_slide = (μ·ΣW + Pp) / Pa_h ≥ 1.50  [IRC:78]',
        'e = |B/2 − x̄|,  limit e ≤ B/6  [no tension]',
      ],
      benchmark: 'Typical bridge H=6m, φ=30°, δ=2φ/3: Ka=0.297, Pa=81 kN/m (horizontal backfill)',
      appPage: '/abutment-stability', appPageLabel: 'Abutment Stability',
    },
    {
      title: 'Abutment — Worksheet 2 (Mononobe-Okabe)',
      folder: 'DESIGN/Abutment/Abutment Worksheet Design 2',
      standards: ['IRC:6-2016 Cl.219', 'IS:1893-2016'],
      accentColor: 'text-orange-400', borderColor: 'border-orange-500/30', bgColor: 'bg-orange-500/8',
      formulas: [
        'θ = arctan(kh / (1−kv))',
        'KAE via Mononobe-Okabe (replaces Ka during seismic)',
        'ΔPa_seismic = 0.5·γ·H²·(KAE − Ka)',
        'ΔPa acts at 0.6H from base (IS:1893)',
      ],
      appPage: '/abutment-stability', appPageLabel: 'Abutment (seismic ON)',
    },
    {
      title: 'Foundation — Well',
      folder: 'DESIGN/Foundation/Well Foundation',
      standards: ['IRC:78-2014', 'IS:3955'],
      accentColor: 'text-emerald-400', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/8',
      formulas: [
        't_steining ≥ H/20 + 0.5 m  [IRC:78 Cl.710 min.]',
        'Grip length ≥ max(1.5×scour, 1/3 H_well)',
        'Lateral: Mbase = Hf·(L+b) + V·b  [IRC:78 App.A]',
        'Well tilt limit ≤ 1/100 of diameter',
      ],
    },
  ],

  drawing: [
    {
      title: 'ASTRA Drawing File (DXF)',
      folder: 'ASTRA Pro Analysis Examples/02 Analysis with Drawing File',
      standards: ['AutoCAD DXF', 'ASTRA 15'],
      accentColor: 'text-blue-400', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/8',
      formulas: [
        'Layer → member type mapping (ASTRA convention)',
        'Polyline closed → section boundary → mesh',
        'Point entities → joint coordinates',
        'DXF R12 format recommended for ASTRA import',
      ],
    },
    {
      title: 'GAD — General Arrangement Drawing',
      folder: 'Worksheet_Design',
      standards: ['IRC SP-13', 'IRC:5', 'IS:1786'],
      accentColor: 'text-cyan-400', borderColor: 'border-cyan-500/30', bgColor: 'bg-cyan-500/8',
      formulas: [
        'Scale: 1:50 (cross-section), 1:100 (elevation)',
        'Min freeboard (IRC SP-13): 0.6m (Q<300), 0.9m (Q≥300)',
        'Bearing seat width ≥ (100+1.5L) mm  [IRC:112 Cl.2.14]',
        'Skew angle correction for abutment wing width',
      ],
      benchmark: 'Standard T-beam bridge GAD: 3 sheets — Longitudinal section, Cross-section at pier/abutment, Plan',
      appPage: '/drawing', appPageLabel: 'CAD Drawings',
    },
    {
      title: 'Under Pass / Culvert Drawings',
      folder: 'Under Pass Drawings',
      standards: ['IRC:54', 'IRC SP-20', 'NHAI'],
      accentColor: 'text-emerald-400', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/8',
      formulas: [
        'Min headroom: 4.5m vehicular, 2.4m pedestrian',
        'HFL ≥ soffit by 0.6 m (non-vent) / 0.3 m (vent)',
        'Box culvert frame: M_top ≈ wL²/10 (approx)',
        'Anti-flotation check: W_box / (γ_w×V) ≥ 1.2',
      ],
    },
  ],

  estimate: [
    {
      title: 'T-Beam BOQ — Worksheet 1 (ASTRA)',
      folder: 'DESIGN/TBEAM Bridge/TBEAM Worksheet Design 1',
      standards: ['MoRTH SOR', 'CPWD DSR', 'IRC:6'],
      accentColor: 'text-blue-400', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/8',
      formulas: [
        'Vol_slab   = B × Ds × L  [m³]',
        'Vol_girder = (Bw×(D−Ds) + Bb×Db) × NMG × L',
        'Vol_pier   = π/4×d²×H × NP  [circular pier]',
        'Vol_abut   = (B_toe+t+B_heel) × D_f × 2 abutments',
        'MoRTH item 1502: M25 concrete @₹6,500–₹8,000/m³',
      ],
      appPage: '/estimate', appPageLabel: 'Cost Estimate',
    },
    {
      title: 'Abutment BOQ — Worksheet (ASTRA)',
      folder: 'Worksheet_Design',
      standards: ['MoRTH SOR', 'IRC:78'],
      accentColor: 'text-amber-400', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/8',
      formulas: [
        'Vol_stem   = t_s × H_stem × 1 m width',
        'Vol_footing = B × D_f × 1 m width',
        'Vol_fill    = B_heel × H_stem (imported fill)',
        'MoRTH item 305: Earthwork in foundation @₹120/m³',
      ],
      appPage: '/abutment-stability', appPageLabel: 'Abutment Stability',
    },
  ],

  interactionDiagram: [
    {
      title: 'Interaction Diagrams (SP:16)',
      folder: 'Interaction Diagrams',
      standards: ['IS:456-2000 Cl.39', 'SP:16'],
      accentColor: 'text-violet-400', borderColor: 'border-violet-500/30', bgColor: 'bg-violet-500/8',
      formulas: [
        'Pu0 = 0.4·fck·Ac + 0.67·fy·Asc  [pure axial]',
        'Cc = 0.36·fck·b·xu  [IS:456 rectangular block]',
        'εsi = εcu·(xu−di)/xu  [strain compatibility]',
        'Mu_bal = 0.36·fck·b·xu_bal·(d−0.42·xu_bal)',
      ],
      benchmark: 'SP:16 Chart 27–62: d\'/D=0.10 → read Pu/(fck·b·D) vs Mu/(fck·b·D²)',
      appPage: '/interaction-diagram', appPageLabel: 'P-M Interaction Diagram',
    },
    {
      title: 'Biaxial Bending (IS:456 Annex B)',
      folder: 'Interaction Diagrams',
      standards: ['IS:456-2000 Annex B', 'SP:16'],
      accentColor: 'text-blue-400', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/8',
      formulas: [
        '(Mux/Mux1)^α + (Muy/Muy1)^α ≤ 1.0  [Bresler]',
        'α = 1 + (Pu/Pu0 − 0.2)/0.6  [linear, 0.2 → 0.8]',
        'α = 1.0 if Pu/Pu0 ≤ 0.2,  α = 2.0 if ≥ 0.8',
        'Mux1, Muy1 = uniaxial capacity at that Pu',
      ],
    },
    {
      title: 'Pier Circular Column (ASTRA)',
      folder: 'DESIGN/Pier/Pier Circular Design',
      standards: ['IRC:78', 'IS:456', 'IRC:6'],
      accentColor: 'text-amber-400', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/8',
      formulas: [
        'Kern D/8 → no tension for e ≤ D/8',
        'Helix ρ_s = 0.36(Ag/Ac−1)×fck/fy  [IS:456 Cl.39.4]',
        'Cover: 40 mm min. (IS:456 Cl.26.4.2)',
        'Max Asc: 4% gross area (IS:456 Cl.26.5.3)',
      ],
      appPage: '/pier-stability', appPageLabel: 'Pier Stability',
    },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  pageKey: AstraPageKey;
  title?: string;
  defaultOpen?: boolean;
  compact?: boolean;  // compact = single row, scrollable
}

export function AstraContextPanel({ pageKey, title, defaultOpen = true, compact = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const modules = BUNDLES[pageKey] ?? [];

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-amber-500/8 transition">
        <BookOpen className="h-4 w-4 shrink-0 text-amber-400" />
        <div className="flex-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">
            ASTRA 15 Reference
          </span>
          {title && <span className="ml-2 text-[11px] text-app-muted">— {title}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-400">
            {modules.length} modules
          </span>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-amber-400" /> : <ChevronDown className="h-3.5 w-3.5 text-amber-400" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className={`border-t border-amber-500/15 p-4 ${
          compact
            ? 'flex gap-3 overflow-x-auto pb-4'
            : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {modules.map(m => (
            <div key={m.title}
              className={`shrink-0 rounded-lg border p-3 ${m.borderColor} ${m.bgColor} ${
                compact ? 'min-w-[260px] max-w-[300px]' : ''
              }`}>
              {/* Module title + standards */}
              <div className="mb-2 flex flex-wrap items-start justify-between gap-1">
                <p className={`text-[11px] font-bold leading-tight ${m.accentColor}`}>{m.title}</p>
                <div className="flex flex-wrap gap-1">
                  {m.standards.slice(0, 2).map(s => (
                    <span key={s} className="rounded-full border border-[var(--app-glass-border)] px-1.5 py-0.5 text-[8px] text-app-muted">{s}</span>
                  ))}
                </div>
              </div>

              {/* Folder path */}
              <p className="mb-2 font-mono text-[8px] text-app-muted/60 truncate" title={`ASTRA 15 TUTORIALS/${m.folder}`}>
                📁 {m.folder.split('/').slice(-1)[0]}
              </p>

              {/* Formulas */}
              <div className="rounded-md border border-[var(--app-glass-border)] bg-[#0d1117] px-2 py-1.5 mb-2">
                {m.formulas.map(f => (
                  <p key={f} className="font-mono text-[9px] leading-[1.6] text-emerald-400 truncate" title={f}>{f}</p>
                ))}
              </div>

              {/* Benchmark */}
              {m.benchmark && (
                <p className="mb-2 rounded-md border border-amber-500/20 bg-amber-500/8 px-2 py-1 text-[9px] text-amber-300 leading-snug">
                  <strong className="text-amber-400">Benchmark: </strong>{m.benchmark}
                </p>
              )}

              {/* App link */}
              {m.appPage && (
                <Link href={m.appPage}>
                  <a className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-semibold transition hover:opacity-80 ${m.borderColor} ${m.accentColor}`}>
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {m.appPageLabel} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </Link>
              )}
            </div>
          ))}

          {/* "Open full library" link */}
          <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-amber-500/20 p-3 text-center ${
            compact ? 'min-w-[140px]' : ''
          }`}>
            <BookOpen className="h-5 w-5 text-amber-400/60 mb-1" />
            <p className="text-[9px] text-app-muted mb-2">All 32 ASTRA modules</p>
            <Link href="/astra-library">
              <a className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[9px] font-bold text-amber-400 hover:bg-amber-500/20 transition">
                Full Library →
              </a>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
