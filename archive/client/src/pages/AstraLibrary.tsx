/**
 * ASTRA Tutorial Library
 * Searchable, categorised reference for all ASTRA 15 tutorial modules.
 * Derived from: GitHub CRAJKUMARSINGH/Bridge_Slab_Design → Attached_Assets/ASTRA 15 TUTORIALS
 * Local source: E_DRIVE_BRIDGE_DESIGN/11 bridge design astra/ASTRA_Data_Input.txt
 */
import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import {
  BookOpen, Search, ExternalLink, ChevronRight,
  Layers, Waves, Ruler, Building2, FlaskConical,
  BarChart3, GitBranch, Box, Triangle, Zap, FileText,
  CheckCircle2, Clock, X,
} from 'lucide-react';

// ─── Module data ─────────────────────────────────────────────────────────────

type Category = 'analysis' | 'superstructure' | 'substructure' | 'hydraulics' | 'culvert' | 'reference';

interface AstraModule {
  id: string;
  title: string;
  folder: string;          // GitHub folder path
  category: Category;
  icon: React.ElementType;
  standards: string[];
  description: string;
  coverage: string[];
  keyFormulas?: string[];
  appPage?: string;        // internal link if implemented
  appPageLabel?: string;
  implemented: boolean;    // whether it's live in the app
  benchmark?: string;      // known benchmark values
}

const MODULES: AstraModule[] = [
  // ── STRUCTURAL ANALYSIS ──────────────────────────────────────────────────
  {
    id: 'analysis-text',
    title: 'Analysis — Text Data File',
    folder: 'ASTRA Pro Analysis Examples/01 Analysis with Text Data File',
    category: 'analysis',
    icon: FileText,
    standards: ['STAAD.Pro', 'ASTRA 15'],
    description: 'Direct structural analysis using ASTRA text-format input data. Defines nodes, members, section properties, releases, supports, and load cases in a plain-text file.',
    coverage: ['Node coordinates', 'Member incidences', 'Section property assignment', 'Support conditions (pinned/fixed)', 'Load case definitions (DL, LL, WL, EQ)', 'ASTRA solver output parsing'],
    keyFormulas: ['K·δ = F (stiffness method)', 'Member forces: P, Vy, Mz at each station', 'Deflections at loaded joints'],
    appPage: '/t-girder',
    appPageLabel: 'T-Girder (ASTRA data format)',
    implemented: true,
    benchmark: 'frm_RCC_T_Girder_WS: Inner UDL = 0.5364 T/m, Outer UDL = 2.0088 T/m, Joint load = 0.4617 Ton',
  },
  {
    id: 'analysis-drawing',
    title: 'Analysis — Drawing File',
    folder: 'ASTRA Pro Analysis Examples/02 Analysis with Drawing File',
    category: 'analysis',
    icon: Ruler,
    standards: ['AutoCAD DXF', 'ASTRA 15'],
    description: 'Import structural geometry directly from AutoCAD DXF drawing files. ASTRA automatically generates nodes and members from the drawing entities.',
    coverage: ['DXF layer mapping to structural members', 'Auto-meshing from polylines', 'Section assignment by layer name', 'Load area mapping from closed polylines'],
    implemented: false,
  },
  {
    id: 'analysis-sap',
    title: 'Analysis — SAP2000 Data File',
    folder: 'ASTRA Pro Analysis Examples/03 Analysis with SAP Data File',
    category: 'analysis',
    icon: BarChart3,
    standards: ['SAP2000', 'ASTRA 15'],
    description: 'Import SAP2000 .s2k or .e2k format models into ASTRA for Indian-code design. Bridges the gap between international FEM software and IRC/IS design.',
    coverage: ['SAP2000 model import', 'Load combination mapping', 'Cross-section property translation', 'Design force extraction'],
    implemented: false,
  },
  {
    id: 'analysis-hydrology',
    title: 'Analysis — Hydrology (SUH)',
    folder: 'ASTRA Pro Analysis Examples/04 Analysis for Hydrology',
    category: 'hydraulics',
    icon: Waves,
    standards: ['IS:11223', 'CWC SUH', 'IRC SP-13'],
    description: 'Synthetic Unit Hydrograph method for computing design flood discharge from catchment characteristics. Required for small catchments without stream gauge data.',
    coverage: ['Catchment area delineation', 'Time of concentration (Kirpich/Khosla)', 'Synthetic Unit Hydrograph (SUH)', 'Design storm frequency selection', 'Peak discharge estimation', 'Rational method cross-check'],
    keyFormulas: [
      'Qp = 0.278 × C × i × A  (Rational method)',
      'tp = 0.5 × tr + tlag  (time to peak)',
      'Qp_SUH = 2.778 × A / tp  (synthetic)',
    ],
    appPage: '/hydraulics',
    appPageLabel: 'Hydraulics',
    implemented: true,
    benchmark: 'For 100 km² catchment, SUH peak ≈ 150–250 m³/s depending on soil type',
  },

  // ── SUPERSTRUCTURE ───────────────────────────────────────────────────────
  {
    id: 'tbeam-1',
    title: 'T-Beam Bridge — Worksheet 1',
    folder: 'DESIGN/TBEAM Bridge/TBEAM Worksheet Design 1',
    category: 'superstructure',
    icon: GitBranch,
    standards: ['IRC:21', 'IRC:6-2016', 'IS:456-2000'],
    description: 'Complete working stress method design of RCC T-beam (T-girder) bridges. Covers section properties, dead load, live load distribution, and flexural reinforcement.',
    coverage: ['Composite T-section properties (Ixx, Iyy, NA)', 'Dead-load UDL to inner/outer girders', 'Cross-girder joint loads', 'IRC Class A / 70R live load positioning', 'Bending moment & shear envelopes', 'Main reinforcement (tension/compression)', 'Shear design (stirrups, bent-up bars)', 'Distribution reinforcement'],
    keyFormulas: [
      'SMG = (B − CL − CR) / (NMG − 1)',
      'wi_inner = SMG × SCG × (Ds×γc + Dw×γw)',
      'Ixx = Σ[bh³/12 + A·ȳ²]  (parallel-axis)',
      'As = M / (σst × j × d)',
    ],
    appPage: '/t-girder',
    appPageLabel: 'T-Girder Analysis',
    implemented: true,
    benchmark: 'L=19.2m, B=12.1m, NMG=4: Ixx inner = 25.76 m⁴, Outer UDL = 2.0088 T/m',
  },
  {
    id: 'tbeam-2',
    title: 'T-Beam Bridge — Worksheet 2',
    folder: 'DESIGN/TBEAM Bridge/TBEAM Worksheet Design 2',
    category: 'superstructure',
    icon: GitBranch,
    standards: ['IRC:21', 'IRC:6-2016', 'IS:456-2000'],
    description: 'Advanced T-beam worksheet with two-lane loading, continuity effects, and detailed reinforcement schedule including development lengths and curtailment.',
    coverage: ['Two-lane IRC Class A positioning', 'Courbon\'s theory for lateral load distribution', 'Continuous span negative moment', 'Development length checks (IS:456 Cl.26.2)', 'Reinforcement curtailment diagram', 'Bar-bending schedule'],
    keyFormulas: [
      'Courbon reaction = P/n × (1 + n·e·x / Σx²)',
      'Ld = σs × φ / (4 × τbd)',
      'Mu_limit = 0.138 × fck × b × d²  (IS:456)',
    ],
    implemented: false,
  },
  {
    id: 'psc-box',
    title: 'PSC Box Girder',
    folder: 'DESIGN/PSC Box Girder',
    category: 'superstructure',
    icon: Box,
    standards: ['IRC:18-2000', 'IRC:6-2016', 'IS:1343-2012'],
    description: 'Prestressed concrete box girder design — single-cell or multi-cell. Covers prestress losses, stress checks at transfer and service, and ultimate moment capacity.',
    coverage: ['Section properties (composite box)', 'Prestress force and eccentricity', 'Losses (elastic shortening, creep, shrinkage, relaxation, friction, draw-in)', 'Stress envelopes (top/bottom fibre)', 'Tendon profile (parabolic/harped)', 'Ultimate moment (IS:1343 Cl.22)'],
    keyFormulas: [
      'Pe = P0 × e^(−μα − kx)',
      'σ = P/A ± P·e/Z ± M/Z',
      'Mu = 0.4 × fck × b × xu × (d − 0.4xu)',
    ],
    implemented: false,
  },
  {
    id: 'continuous-psc',
    title: 'Continuous PSC Box Girder',
    folder: 'DESIGN/Continuous PSC Box Girder',
    category: 'superstructure',
    icon: Box,
    standards: ['IRC:18-2000', 'IRC:112-2011', 'IS:1343-2012'],
    description: 'Multi-span continuous prestressed box girder. Covers secondary prestress moments, redistribution, construction stage analysis, and time-dependent effects.',
    coverage: ['Continuity moment from secondary prestress', 'Construction stages (span-by-span / balanced cantilever)', 'Time-dependent creep redistribution', 'LSM flexure + shear checks (IRC:112)', 'Limit state of serviceability'],
    implemented: false,
  },
  {
    id: 'prestressed',
    title: 'Pre-Stressed Slab/Beam',
    folder: 'DESIGN/Pre Stressed',
    category: 'superstructure',
    icon: Layers,
    standards: ['IS:1343-2012', 'IRC:18'],
    description: 'Pretensioned or post-tensioned slab and I-beam design. Covers strands, wires, and bar tendons with full loss computation and stress checks.',
    coverage: ['Pretensioned strand design', 'Post-tension duct layout', 'Transfer and service stress checks', 'Shear and torsion (IS:1343)'],
    implemented: false,
  },
  {
    id: 'composite',
    title: 'Composite Steel-Concrete',
    folder: 'DESIGN/Composite',
    category: 'superstructure',
    icon: Layers,
    standards: ['IS:11384', 'IRC:22', 'IRC:6'],
    description: 'Composite girder bridge — steel I-section with RCC deck slab acting compositely via shear connectors. Covers elastic section properties and connector design.',
    coverage: ['Transformed section properties (modular ratio m)', 'Shear connector spacing (stud/channel)', 'Fatigue check for connectors', 'Deflection under DL+LL'],
    keyFormulas: ['m = Es / Ec  (modular ratio)', 'Ieff = Is + Ac·m·ȳ²  (transformed)'],
    implemented: false,
  },
  {
    id: 'section-props',
    title: 'Section Properties',
    folder: 'DESIGN/Section Properties',
    category: 'superstructure',
    icon: Ruler,
    standards: ['IS:456-2000', 'IRC:21'],
    description: 'General section property calculator for any compound or built-up cross-section. NA, Ixx, Iyy, Sx, Sy, plastic modulus, core dimensions.',
    coverage: ['Centroid (NA)', 'Second moment of area Ixx, Iyy', 'Elastic section moduli Sx, Sy', 'Plastic modulus Zpx, Zpy', 'Radius of gyration rxx, ryy', 'Core (kern) for no-tension section'],
    appPage: '/t-girder',
    appPageLabel: 'T-Girder (section properties)',
    implemented: true,
  },

  // ── SUBSTRUCTURE ─────────────────────────────────────────────────────────
  {
    id: 'pier-ws1',
    title: 'Pier Worksheet Design 1',
    folder: 'DESIGN/Pier/Pier Worksheet Design 1',
    category: 'substructure',
    icon: Building2,
    standards: ['IRC:6-2016', 'IRC:78', 'IS:456-2000'],
    description: 'RCC solid/hollow rectangular pier design — working stress method. Covers loads from superstructure, braking, wind, seismic, and hydrodynamic force.',
    coverage: ['Superstructure dead + live reaction', 'Braking force (IRC:6 Cl.214)', 'Wind load (Cl.212)', 'Seismic force (Cl.219)', 'Hydrodynamic force (Cl.215)', 'Sliding, overturning, bearing capacity checks', 'Longitudinal + transverse eccentricity'],
    keyFormulas: [
      'HF_braking = 0.2 × W_LL  (single lane)',
      'Ah = Z/2 × Sa/g × I/R',
      'P_bearing = (W + W_pier) / A ± M/Z',
      'FOS_sliding = μ·W / H ≥ 1.50',
    ],
    appPage: '/pier-stability',
    appPageLabel: 'Pier Stability',
    implemented: true,
    benchmark: 'BEDACH River pier: W_DL=479 kN, W_LL=92 kN, Pier=280 kN → P_bearing=7.8 kg/cm²',
  },
  {
    id: 'pier-ws2',
    title: 'Pier Worksheet Design 2',
    folder: 'DESIGN/Pier/Pier Worksheet Design 2',
    category: 'substructure',
    icon: Building2,
    standards: ['IRC:6-2016', 'IRC:78', 'IS:456-2000'],
    description: 'Advanced pier worksheet with two-span loading, stream current pressure, and detailed column interaction under biaxial bending.',
    coverage: ['Two-span load combinations', 'Stream current pressure (IRC:6 Cl.213)', 'Biaxial bending (P-Mx-My interaction)', 'Reinforcement design for combined loading', 'Foundation bearing for eccentric load'],
    implemented: false,
  },
  {
    id: 'pier-circular',
    title: 'Pier — Circular Design',
    folder: 'DESIGN/Pier/Pier Circular Design',
    category: 'substructure',
    icon: Building2,
    standards: ['IRC:6', 'IRC:78', 'IS:456'],
    description: 'Circular RCC pier column design with spiral/helical reinforcement. Includes P-M interaction diagram and confinement factor for ductility.',
    coverage: ['Circular column P-M interaction', 'Spiral reinforcement (IS:456 Cl.39.4)', 'Kern for no-tension (r/2)', 'Effective length (IRC:78 Cl.706)'],
    appPage: '/astra-library',
    appPageLabel: 'Interaction Diagrams →',
    implemented: false,
  },
  {
    id: 'pier-well',
    title: 'Pier with Well Foundation',
    folder: 'DESIGN/Pier/Pier with Well Foundation',
    category: 'substructure',
    icon: Building2,
    standards: ['IRC:6', 'IRC:78', 'IS:456'],
    description: 'Integrated pier + well foundation design. Computes well steining thickness, top/bottom plug, and lateral stability of the well under horizontal loads.',
    coverage: ['Well steining design (IRC:78)', 'Top plug concrete (2× scour depth)', 'Bottom plug uplift check', 'Well tilt and shift limits', 'Passive resistance mobilization'],
    implemented: false,
  },
  {
    id: 'pier-pile',
    title: 'Pier with Pile Foundation',
    folder: 'DESIGN/Pier (ASTRA_Data_Input.txt)',
    category: 'substructure',
    icon: Building2,
    standards: ['IRC:6-2016 Cl.219', 'IS:2911', 'IS:456'],
    description: 'Full pier + pile group design including seismic Zone III computation, group efficiency, lateral load on piles, and pile cap design.',
    coverage: ['Pile group layout (4×2, 3×2, etc.)', 'Group efficiency (Converse-Labarre)', 'Pile axial capacity (IS:2911)', 'Lateral load on piles (Brom\'s method)', 'Seismic: Z=0.24, I=1.5, Sa/g=2.5 (Zone III)', 'Pile cap flexure and punching shear'],
    keyFormulas: [
      'P_pile = (ΣW + Wpilecap) / n ± M·x / Σx²',
      'Qlateral = 0.68 × E·I × kh  (Broms)',
      'Ah = Z/2 × Sa/g × I/R  (IRC:6 Cl.219)',
    ],
    appPage: '/design',
    appPageLabel: 'Design (Seismic panel)',
    implemented: true,
    benchmark: 'frmPier_Design_with_Piles: Z=0.24, I=1.5, Sa/g=2.5, pile dia=1.2m, P_DL=479.01 kN',
  },
  {
    id: 'abutment-ws1',
    title: 'Abutment — Worksheet 1',
    folder: 'DESIGN/Abutment/Abutment Worksheet Design 1',
    category: 'substructure',
    icon: Triangle,
    standards: ['IRC:6', 'IRC:78', 'IS:456-2000'],
    description: 'Gravity / cantilever RCC abutment design — stability and structural design of breast wall, back wall, footing, and wing walls.',
    coverage: ['Abutment geometry (breast wall, back wall)', 'Backfill earth pressure (Coulomb/Rankine)', 'Superstructure DL + LL reaction', 'Sliding/overturning/bearing stability', 'Footing flexure and shear', 'Approach slab design'],
    keyFormulas: [
      'Ka = sin²(α+φ) / [sin²α × sin(α−δ) × (1+√(...))²]  (Coulomb)',
      'Pa = 0.5 × γ × H² × Ka',
      'FOS_sliding = (W×μ + Pa·sinδ) / (Pa·cosδ) ≥ 1.5',
    ],
    appPage: '/pier-stability',
    appPageLabel: 'Pier Stability (abutment)',
    implemented: true,
  },
  {
    id: 'abutment-ws2',
    title: 'Abutment — Worksheet 2',
    folder: 'DESIGN/Abutment/Abutment Worksheet Design 2',
    category: 'substructure',
    icon: Triangle,
    standards: ['IRC:6', 'IRC:78', 'IS:456'],
    description: 'Advanced abutment with skew correction, passive earth pressure, and seismic increment of earth pressure (Mononobe-Okabe).',
    coverage: ['Skew abutment corrections', 'Mononobe-Okabe seismic EP increment', 'Surcharge effect (IRC:6 Cl.214)', 'Passive resistance of footing key', 'Reinforcement interaction diagram'],
    implemented: false,
  },
  {
    id: 'foundation-well',
    title: 'Foundation — Well',
    folder: 'DESIGN/Foundation/Well Foundation',
    category: 'substructure',
    icon: Building2,
    standards: ['IRC:78', 'IS:3955'],
    description: 'Open caisson (well foundation) design and sinking analysis. Covers curb, steining, top plug, bottom plug and stability under service loads.',
    coverage: ['Well curb dimensions', 'Steining thickness (IRC:78 Cl.710)', 'Sinking effort', 'Lateral stability (IRC:78 Appendix A)', 'Grip length below scour'],
    implemented: false,
  },
  {
    id: 'foundation-sheet',
    title: 'Foundation — Sheet Pile',
    folder: 'DESIGN/Foundation/Sheet Pile',
    category: 'substructure',
    icon: Building2,
    standards: ['IS:2911 Pt.3', 'IRC:78'],
    description: 'Sheet pile wall design for cofferdams and abutments. Active/passive pressure diagram, free/fixed-earth support method, and design moments.',
    coverage: ['Free-earth and fixed-earth methods', 'Passive resistance mobilization factor', 'Section modulus required', 'Toe depth determination'],
    implemented: false,
  },

  // ── HYDRAULICS ───────────────────────────────────────────────────────────
  {
    id: 'hydraulics',
    title: 'Hydraulic Calculations',
    folder: 'HYDRAULIC CALCULATIONS',
    category: 'hydraulics',
    icon: Waves,
    standards: ['IS:6966', 'IRC SP-13', 'IS:7784'],
    description: 'Complete hydraulic design for bridge waterway: Manning\'s discharge, Lacey\'s waterway, scour depth, afflux, backwater curve, freeboard, and hydrograph routing.',
    coverage: ['Manning\'s Q equation', 'Lacey\'s regime width (L = 4.8√Q)', 'Normal/critical depth bisection solve', 'Scour depth (Lacey/IS:6966)', 'Afflux (Molesworth equation)', 'Backwater curve (Direct Step Method)', 'Freeboard (IRC SP-13 Cl.5)', 'Unit hydrograph (SUH method)'],
    keyFormulas: [
      'Q = (1/n) × A × R^(2/3) × S0^(0.5)  (Manning)',
      'L = 4.8√Q  (Lacey regime width)',
      'dsm = 1.34 × (q²/f)^(1/3)  (Lacey scour)',
      'dE/dx = S0 − Sf / (1 − Fr²)  (backwater)',
    ],
    appPage: '/hydraulics',
    appPageLabel: 'Hydraulics',
    implemented: true,
    benchmark: 'ASTRA_Data_Input.txt (HYDRAULIC CALCULATIONS folder) — full report with HYDROGRAPH.VDML',
  },

  // ── CULVERT & UNDERPASSES ─────────────────────────────────────────────────
  {
    id: 'rcc-culvert',
    title: 'RCC Box Culvert (IRC)',
    folder: 'DESIGN OF RCC CULVERT [IRC]',
    category: 'culvert',
    icon: Box,
    standards: ['IRC:6-2016', 'IS:456-2000', 'IRC SP-20'],
    description: 'Single-cell RCC box culvert design per IRC standards. Covers frame analysis, slab/wall flexure, soil pressure, and IRC Class A loading.',
    coverage: ['Box frame moment distribution', 'IRC Class A on culvert slab', 'Soil pressure on walls', 'Top slab, bottom slab, side wall design', 'Shear key at construction joints', 'Anti-flotation check (buoyancy)'],
    keyFormulas: [
      'M_top = wL²/10  (two-way frame approx)',
      'P_soil = Ka × γ_soil × h',
      'Anti-flotation: W_culvert / (γ_w × V) ≥ 1.2',
    ],
    implemented: false,
  },
  {
    id: 'box-culvert',
    title: 'Box Culvert Design',
    folder: 'Design of Box Culvert',
    category: 'culvert',
    icon: Box,
    standards: ['IRC:6', 'IS:456', 'IRC SP-13'],
    description: 'Detailed single-box culvert design including waterway check, vent sizing, headwall, wingwall, and approach embankment.',
    coverage: ['Vent size (Manning\'s Q)', 'Headwall and wingwall geometry', 'IRC live load on culvert', 'Slab and wall reinforcement', 'Apron and toe wall scour protection'],
    implemented: false,
  },
  {
    id: 'multi-box',
    title: 'Multi-Cell Box Culvert',
    folder: 'Design of Multi Cell Box Culvert',
    category: 'culvert',
    icon: Box,
    standards: ['IRC:6', 'IS:456', 'IRC SP-13'],
    description: 'Multi-cell (2 to 4 vent) RCC box culvert. Frame analysis with shared interior walls, differential earth pressure, and IRC 70R loading.',
    coverage: ['Multi-cell frame analysis (Hardy Cross)', 'Shared interior wall design', 'IRC 70R wheel/track load on multi-cell', 'Fill depth effect on live load dispersal'],
    implemented: false,
  },
  {
    id: 'underpass',
    title: 'Underpass Drawings',
    folder: 'Under Pass Drawings',
    category: 'culvert',
    icon: Box,
    standards: ['IRC:54', 'NHAI guidelines'],
    description: 'Standard underpass (vehicular / pedestrian) drawing set — portal frame, headroom, drainage channel, and approach road geometry.',
    coverage: ['Vehicular underpass (min 4.5 m clear height)', 'Pedestrian underpass (min 2.4 m)', 'Portal frame analysis', 'Drainage channel inside underpass', 'Illumination requirements'],
    implemented: false,
  },

  // ── REFERENCE ─────────────────────────────────────────────────────────────
  {
    id: 'interaction',
    title: 'Interaction Diagrams',
    folder: 'Interaction Diagrams',
    category: 'reference',
    icon: BarChart3,
    standards: ['IS:456-2000 Cl.39', 'SP:16'],
    description: 'P-M (axial load vs bending moment) interaction envelopes for circular and rectangular RCC columns. Based on IS:456 stress block and SP:16 non-dimensional charts.',
    coverage: ['Rectangular column P-M envelope (IS:456 Cl.39.7)', 'Circular column spiral reinforcement', 'Biaxial bending (Bresler contour method)', 'Non-dimensional P/(fck×b×D) vs M/(fck×b×D²)', 'Point-by-point envelope generation', 'Reinforcement ratio ρ from chart reading'],
    keyFormulas: [
      'Pu = 0.4·fck·Ac + 0.67·fy·Asc  (pure axial)',
      'Mu_bal = 0.36·fck·b·xu_max·(d−0.42·xu_max)',
      'Mux/Mux1^α + Muy/Muy1^α ≤ 1  (biaxial)',
    ],
    implemented: false,
  },
  {
    id: 'seismic-coeff',
    title: 'Seismic Coefficient',
    folder: 'DESIGN/Seismic Coefficient',
    category: 'reference',
    icon: Zap,
    standards: ['IRC:6-2016 Cl.219', 'IS:1893-2016'],
    description: 'Seismic zone coefficient tables and horizontal seismic acceleration computation for all IRC zones. T-period for bridge piers by Rayleigh method.',
    coverage: ['Zone I–V: Z = 0.10, 0.16, 0.24, 0.36, 0.36', 'Importance factor I (IRC bridges = 1.5)', 'Response reduction R (WSD=2.5, LSM=3.0)', 'Sa/g spectrum (rock, medium, soft soil)', 'Pier T-period (cantilever formula)', 'Seismic horizontal force Ah × W'],
    keyFormulas: [
      'Ah = Z/2 × Sa/g × I/R',
      'T = 2π√(M/K)  (Rayleigh for pier)',
      'F_eq = Ah × W  (horizontal seismic force)',
    ],
    appPage: '/design',
    appPageLabel: 'Design (Seismic Zone panel)',
    implemented: true,
    benchmark: 'Zone III: Z=0.24, I=1.5, Sa/g=2.50 (medium soil), Ah=0.09→ΔF per 100kN dead load = 9 kN',
  },
  {
    id: 'bearing',
    title: 'Bearing Design',
    folder: 'DESIGN/Bearing Design',
    category: 'reference',
    icon: Layers,
    standards: ['IRC:83 Pt.1 (elastomeric)', 'IRC:83 Pt.3 (POT/PTFE)'],
    description: 'Elastomeric bearing design for highway bridges — plan size, laminate thickness, steel plate thickness, shape factor, and rotation capacity.',
    coverage: ['Vertical load capacity (IRC:83 Cl.916)', 'Shear strain check (horizontal movement)', 'Shape factor S = Ab / (2t_e × perimeter)', 'Compressive stress σm ≤ 10 MPa', 'Shear strain γc + γs + γα ≤ 0.7', 'Steel plate thickness (von Mises)'],
    keyFormulas: [
      'S = A / (2t_e × perimeter)',
      'σm = P / A ≤ G × S²',
      'γ_shear = δ_h / Σt_e ≤ 0.5',
    ],
    implemented: false,
  },
  {
    id: 'lsm',
    title: 'Limit State Method',
    folder: 'DESIGN/Limit State Method',
    category: 'reference',
    icon: BarChart3,
    standards: ['IS:456-2000', 'IRC:112-2011'],
    description: 'LSM design module for flexure, shear, torsion, deflection, and crack width per IS:456-2000 and IRC:112-2011 (Euro-code based).',
    coverage: ['Factored load combinations (DL 1.5, LL 1.5, WL 1.5/0.9)', 'Xu/d limit for different grades', 'Minimum / maximum steel ratios', 'Shear design Vu check (IS:456 Cl.40)', 'Crack width limit 0.3 mm (IS:456 Cl.35.3.2)', 'Deflection limit L/250 (IS:456 Cl.23)'],
    implemented: false,
  },
  {
    id: 'material',
    title: 'Material Properties',
    folder: 'DESIGN/Material Properties',
    category: 'reference',
    icon: FlaskConical,
    standards: ['IS:456-2000', 'IS:1786-2008', 'IS:2062'],
    description: 'Reference material property database used across ASTRA modules — concrete grades M15–M60, steel Fe415/Fe500, and structural steel.',
    coverage: ['Concrete: fck, Ec, σcbc (WSM), fcd (LSM)', 'Steel: fy, Es, σst (WSM), fyd (LSM)', 'Unit weights (γc=24, γs=78.5 kN/m³)', 'Modular ratio m = 280/(3×σcbc)', 'Partial safety factors (γm_c=1.5, γm_s=1.15)'],
    keyFormulas: [
      'Ec = 5000√fck  (IS:456)',
      'm = 280 / (3×σcbc)  (IS:456 WSM)',
      'γm_c = 1.5,  γm_s = 1.15  (IS:456 LSM)',
    ],
    appPage: '/design',
    appPageLabel: 'Design (grade inputs)',
    implemented: true,
  },
  {
    id: 'geotechnics',
    title: 'Geotechnics',
    folder: 'DESIGN/Geotechnics',
    category: 'reference',
    icon: Layers,
    standards: ['IS:1888', 'IS:6403', 'IS:2950'],
    description: 'Soil parameter inputs and foundation capacity calculations — Terzaghi bearing capacity, settlement, and pile capacity (IS:2911).',
    coverage: ['Terzaghi bearing capacity formula', 'Safe bearing capacity with FOS=3.0', 'Pile load capacity (static formula)', 'Group settlement (elastic theory)', 'Consolidation settlement (Terzaghi 1-D)', 'SPT N-value corrections'],
    keyFormulas: [
      'qu = c·Nc + q·Nq + 0.5·γ·B·Nγ  (Terzaghi)',
      'SBC = qu / FOS  (FOS=3 for strip, 2.5 for raft)',
      'Q_pile = (c×As×α) + (q×Nq×Atip)',
    ],
    implemented: false,
  },
  {
    id: 'tables',
    title: 'Design Tables',
    folder: 'TABLES',
    category: 'reference',
    icon: FileText,
    standards: ['SP:16', 'IS:456-2000', 'IRC:6-2016'],
    description: 'Quick-reference tables from ASTRA: IRC vehicle axle loads, IS:456 reinforcement ratios, SP:16 design aids, and IRC:6 load factors.',
    coverage: ['IRC Class A axle load schedule (55+114 kN)', 'IRC 70R axle positions and loads', 'IS:456 Table 1 (concrete properties)', 'IS:456 Table 2 (steel stress limits)', 'IS:456 Table 5 (minimum cover)', 'IRC:6 Table 1 (load combination factors)', 'SP:16 Table (Mu/bd² vs pt charts)'],
    implemented: true,
    appPage: '/t-girder',
    appPageLabel: 'T-Girder (load types)',
  },
];

// ─── Category meta ────────────────────────────────────────────────────────────
const CATEGORIES: { id: Category | 'all'; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'all',             label: 'All Modules',    icon: BookOpen,   color: 'text-app-accent' },
  { id: 'analysis',        label: 'Analysis',       icon: BarChart3,  color: 'text-violet-400' },
  { id: 'superstructure',  label: 'Superstructure', icon: GitBranch,  color: 'text-blue-400' },
  { id: 'substructure',    label: 'Substructure',   icon: Building2,  color: 'text-amber-400' },
  { id: 'hydraulics',      label: 'Hydraulics',     icon: Waves,      color: 'text-cyan-400' },
  { id: 'culvert',         label: 'Culvert & Underpass', icon: Box,   color: 'text-orange-400' },
  { id: 'reference',       label: 'Reference',      icon: FlaskConical, color: 'text-emerald-400' },
];

const CAT_COLOR: Record<Category, string> = {
  analysis:       'bg-violet-500/15 text-violet-400 border-violet-500/30',
  superstructure: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  substructure:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  hydraulics:     'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  culvert:        'bg-orange-500/15 text-orange-400 border-orange-500/30',
  reference:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

// ─── Module detail panel ──────────────────────────────────────────────────────
function ModuleDetail({ m, onClose }: { m: AstraModule; onClose: () => void }) {
  const Icon = m.icon;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--app-glass-border)] bg-app-card shadow-2xl p-6">
        <button onClick={onClose}
          className="absolute top-4 right-4 rounded-lg border border-[var(--app-glass-border)] p-1.5 text-app-muted hover:text-app-fg transition">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/50 p-2.5">
            <Icon className="h-5 w-5 text-app-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-app-fg">{m.title}</h2>
            <p className="text-[10px] text-app-muted font-mono">📁 ASTRA 15 TUTORIALS/{m.folder}</p>
          </div>
          <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${CAT_COLOR[m.category]}`}>
            {CATEGORIES.find(c => c.id === m.category)?.label}
          </span>
        </div>

        <p className="mb-4 text-sm text-app-muted">{m.description}</p>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {m.standards.map(s => (
            <span key={s} className="rounded-full border border-[var(--app-glass-border)] px-2 py-0.5 text-[10px] text-app-muted">{s}</span>
          ))}
        </div>

        <div className="mb-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-app-muted">Coverage</p>
          <ul className="space-y-1">
            {m.coverage.map(c => (
              <li key={c} className="flex items-start gap-2 text-[11px] text-app-fg">
                <ChevronRight className="h-3 w-3 shrink-0 mt-0.5 text-app-accent" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        {m.keyFormulas && (
          <div className="mb-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-app-muted">Key Formulas</p>
            <div className="rounded-lg border border-[var(--app-glass-border)] bg-[#0d1117] p-3 space-y-1">
              {m.keyFormulas.map(f => (
                <p key={f} className="font-mono text-[11px] text-emerald-400">{f}</p>
              ))}
            </div>
          </div>
        )}

        {m.benchmark && (
          <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300">
            <strong className="text-amber-400">ASTRA Benchmark: </strong>{m.benchmark}
          </div>
        )}

        <div className="flex items-center gap-2">
          {m.implemented ? (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Live in app
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-[var(--app-glass-border)] px-3 py-1 text-[11px] text-app-muted">
              <Clock className="h-3.5 w-3.5" /> Available in ASTRA software
            </span>
          )}
          {m.appPage && (
            <Link href={m.appPage}>
              <button className="ml-auto flex items-center gap-1.5 rounded-lg border border-app-accent/30 bg-app-accent/10 px-3 py-1.5 text-[11px] font-semibold text-app-accent hover:bg-app-accent/20 transition">
                {m.appPageLabel ?? 'Open in App'} <ExternalLink className="h-3 w-3" />
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Module card ──────────────────────────────────────────────────────────────
function ModuleCard({ m, onClick }: { m: AstraModule; onClick: () => void }) {
  const Icon = m.icon;
  return (
    <button onClick={onClick}
      className="w-full text-left rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4 hover:border-app-accent/40 hover:bg-app-card/70 transition-all duration-150">
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 p-2 shrink-0">
          <Icon className="h-4 w-4 text-app-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-app-fg leading-tight">{m.title}</h3>
            {m.implemented && (
              <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">LIVE</span>
            )}
          </div>
          <p className="text-[10px] text-app-muted line-clamp-2 mb-2">{m.description}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${CAT_COLOR[m.category]}`}>
              {CATEGORIES.find(c => c.id === m.category)?.label}
            </span>
            {m.standards.slice(0, 2).map(s => (
              <span key={s} className="rounded-full border border-[var(--app-glass-border)] px-1.5 py-0.5 text-[9px] text-app-muted">{s}</span>
            ))}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-app-muted mt-1" />
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AstraLibrary() {
  const [query,    setQuery]    = useState('');
  const [cat,      setCat]      = useState<Category | 'all'>('all');
  const [selected, setSelected] = useState<AstraModule | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return MODULES.filter(m => {
      const matchCat = cat === 'all' || m.category === cat;
      const matchQ   = !q || [m.title, m.description, ...m.coverage, ...m.standards]
        .join(' ').toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, cat]);

  const implemented   = MODULES.filter(m => m.implemented).length;
  const total         = MODULES.length;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">

      {/* ── HEADER ── */}
      <div className="mb-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <BookOpen className="h-6 w-6 text-app-accent" />
          <h1 className="text-2xl font-bold text-app-fg">ASTRA Tutorial Library</h1>
        </div>
        <p className="mx-auto max-w-2xl text-sm text-app-muted">
          Searchable reference for all <strong className="text-app-fg">ASTRA 15</strong> tutorial modules —
          mapped to IRC/IS standards and wired to live calculators.
          Source: <span className="font-mono text-[11px]">CRAJKUMARSINGH/Bridge_Slab_Design → Attached_Assets/ASTRA 15 TUTORIALS</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" /> {implemented} of {total} modules live
          </span>
          {CATEGORIES.filter(c => c.id !== 'all').map(c => {
            const Icon = c.icon;
            const n = MODULES.filter(m => m.category === c.id).length;
            return (
              <span key={c.id} className={`flex items-center gap-1 text-app-muted`}>
                <Icon className={`h-3 w-3 ${c.color}`} /> {n} {c.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── SEARCH & FILTER ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
          <input
            type="text"
            placeholder="Search by topic, formula, standard, or keyword…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--app-glass-border)] bg-app-card/60 py-2.5 pl-9 pr-4 text-sm text-app-fg placeholder:text-app-muted focus:border-app-accent focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-fg">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => {
            const CIcon = c.icon;
            return (
              <button key={c.id} onClick={() => setCat(c.id as Category | 'all')}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold transition ${
                  cat === c.id
                    ? 'border-app-accent/50 bg-app-accent/10 text-app-accent'
                    : 'border-[var(--app-glass-border)] text-app-muted hover:text-app-fg'
                }`}>
                <CIcon className={`h-3.5 w-3.5 ${cat === c.id ? 'text-app-accent' : c.color}`} />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RESULTS COUNT ── */}
      <p className="mb-3 text-[11px] text-app-muted">
        Showing <strong className="text-app-fg">{filtered.length}</strong> of {total} modules
        {query && <> matching "<strong className="text-app-fg">{query}</strong>"</>}
        {cat !== 'all' && <> in <strong className="text-app-fg">{CATEGORIES.find(c => c.id === cat)?.label}</strong></>}
      </p>

      {/* ── GRID ── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--app-glass-border)] py-16 text-center text-app-muted">
          No modules found. Try a different search term.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(m => (
            <ModuleCard key={m.id} m={m} onClick={() => setSelected(m)} />
          ))}
        </div>
      )}

      {/* ── QUICK STATS ROW ── */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total tutorial modules', value: total, color: 'text-app-accent' },
          { label: 'Live in this app',        value: implemented, color: 'text-emerald-400' },
          { label: 'IRC/IS codes referenced', value: 22, color: 'text-blue-400' },
          { label: 'ASTRA tutorial folders',  value: 12, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-[10px] text-app-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── DETAIL PANEL ── */}
      {selected && <ModuleDetail m={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
