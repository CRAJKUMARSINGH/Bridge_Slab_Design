// All 50 design sheets definition

export interface SheetDef {
  id: string;
  sheetNo: number;
  title: string;
  subtitle: string;
  category: string;
  ref: string;
}

export const CATEGORIES = [
  "A. Hydraulic Design",
  "B. Load Calculations",
  "C. Deck Slab Design",
  "D. Pier Design",
  "E. Abutment Design",
  "F. Wing Wall & Return Wall",
  "G. Stability Checks",
  "H. Structural Checks",
  "I. Bearings & Joints",
];

export const SHEETS: SheetDef[] = [
  // ── A. Hydraulic Design ─────────────────────────────
  {
    id: "hydraulic-discharge",
    sheetNo: 1,
    title: "Discharge Calculation",
    subtitle: "Area-Velocity Method",
    category: "A. Hydraulic Design",
    ref: "IRC SP-13, Art. 5",
  },
  {
    id: "hydraulic-waterway",
    sheetNo: 2,
    title: "Linear Waterway",
    subtitle: "Regime Width & Span Arrangement",
    category: "A. Hydraulic Design",
    ref: "IRC SP-13",
  },
  {
    id: "hydraulic-scour",
    sheetNo: 3,
    title: "Scour Depth",
    subtitle: "Normal & Design Scour",
    category: "A. Hydraulic Design",
    ref: "IRC:78-1983, Cl.703.2.2.1",
  },
  {
    id: "hydraulic-afflux",
    sheetNo: 4,
    title: "Afflux Calculation",
    subtitle: "Molesworth Formula",
    category: "A. Hydraulic Design",
    ref: "IS:7784 Part-I 1975",
  },
  {
    id: "hydraulic-summary",
    sheetNo: 5,
    title: "Hydraulic Design Summary",
    subtitle: "HFL, Design Levels & Clearance",
    category: "A. Hydraulic Design",
    ref: "IRC SP-13",
  },

  // ── B. Load Calculations ────────────────────────────
  {
    id: "load-deadload",
    sheetNo: 6,
    title: "Dead Load Calculation",
    subtitle: "Self Weight of Components",
    category: "B. Load Calculations",
    ref: "IS 456:2000",
  },
  {
    id: "load-liveload-classA",
    sheetNo: 7,
    title: "Live Load — IRC Class A",
    subtitle: "Wheel Load Distribution",
    category: "B. Load Calculations",
    ref: "IRC:6-2014, Cl.204",
  },
  {
    id: "load-liveload-70R",
    sheetNo: 8,
    title: "Live Load — IRC 70R Wheeled",
    subtitle: "70R Wheeled Load Distribution",
    category: "B. Load Calculations",
    ref: "IRC:6-2014, Cl.204",
  },
  {
    id: "load-impact",
    sheetNo: 9,
    title: "Impact Factor",
    subtitle: "Dynamic Augment Factor",
    category: "B. Load Calculations",
    ref: "IRC:6-2014, Cl.208",
  },
  {
    id: "load-braking",
    sheetNo: 10,
    title: "Braking / Tractive Force",
    subtitle: "Longitudinal Force",
    category: "B. Load Calculations",
    ref: "IRC:6-2014, Cl.214",
  },
  {
    id: "load-wind",
    sheetNo: 11,
    title: "Wind Load Calculation",
    subtitle: "Wind Pressure on Structure",
    category: "B. Load Calculations",
    ref: "IS:875 Part-3 / IRC:6",
  },
  {
    id: "load-seismic",
    sheetNo: 12,
    title: "Seismic Force",
    subtitle: "Seismic Coefficient Method",
    category: "B. Load Calculations",
    ref: "IS:1893 / IRC:6 Cl.219",
  },
  {
    id: "load-watercurrent",
    sheetNo: 13,
    title: "Water Current Force",
    subtitle: "Force on Piers & Foundations",
    category: "B. Load Calculations",
    ref: "IRC:6-2014, Cl.213",
  },

  // ── C. Deck Slab Design ─────────────────────────────
  {
    id: "slab-transverse",
    sheetNo: 14,
    title: "Deck Slab — Transverse Design",
    subtitle: "Bending & Reinforcement",
    category: "C. Deck Slab Design",
    ref: "IS 456:2000, IRC:21",
  },
  {
    id: "slab-longitudinal",
    sheetNo: 15,
    title: "Deck Slab — Longitudinal",
    subtitle: "Longitudinal Bending Check",
    category: "C. Deck Slab Design",
    ref: "IS 456:2000",
  },
  {
    id: "slab-shear",
    sheetNo: 16,
    title: "Deck Slab — Shear Check",
    subtitle: "Shear Stress & Stirrups",
    category: "C. Deck Slab Design",
    ref: "IS 456:2000, Cl.40",
  },
  {
    id: "slab-deflection",
    sheetNo: 17,
    title: "Deck Slab — Deflection",
    subtitle: "Span/Depth Ratio Check",
    category: "C. Deck Slab Design",
    ref: "IS 456:2000, Cl.23.2",
  },
  {
    id: "slab-wearingcoat",
    sheetNo: 18,
    title: "Wearing Coat Design",
    subtitle: "Bituminous / Concrete WC",
    category: "C. Deck Slab Design",
    ref: "IRC:SP-13",
  },
  {
    id: "slab-approach",
    sheetNo: 19,
    title: "Approach Slab Design",
    subtitle: "Reinforced Approach Slab",
    category: "C. Deck Slab Design",
    ref: "IRC:SP-13, IRC:78",
  },

  // ── D. Pier Design ──────────────────────────────────
  {
    id: "pier-cap",
    sheetNo: 20,
    title: "Pier Cap Design",
    subtitle: "Pier Cap as Beam (Bending & Shear)",
    category: "D. Pier Design",
    ref: "IS 456:2000",
  },
  {
    id: "pier-stem-gravity",
    sheetNo: 21,
    title: "Pier Stem — Gravity Loading",
    subtitle: "Axial Load & Direct Stress",
    category: "D. Pier Design",
    ref: "IS 456:2000",
  },
  {
    id: "pier-stem-long",
    sheetNo: 22,
    title: "Pier Stem — Longitudinal Force",
    subtitle: "Braking & Temperature",
    category: "D. Pier Design",
    ref: "IRC:6 Cl.214, Cl.218",
  },
  {
    id: "pier-stem-wind",
    sheetNo: 23,
    title: "Pier Stem — Wind Load",
    subtitle: "Wind Moment on Pier Stem",
    category: "D. Pier Design",
    ref: "IRC:6 Cl.209",
  },
  {
    id: "pier-stem-seismic",
    sheetNo: 24,
    title: "Pier Stem — Seismic",
    subtitle: "Seismic Moment on Pier Stem",
    category: "D. Pier Design",
    ref: "IRC:6 Cl.219",
  },
  {
    id: "pier-stem-wcurrent",
    sheetNo: 25,
    title: "Pier Stem — Water Current",
    subtitle: "Water Pressure on Pier Stem",
    category: "D. Pier Design",
    ref: "IRC:6 Cl.213",
  },
  {
    id: "pier-foundation",
    sheetNo: 26,
    title: "Pier Foundation Design",
    subtitle: "Spread Footing / Pile Design",
    category: "D. Pier Design",
    ref: "IS 456:2000, IS:2950",
  },
  {
    id: "pier-buoyancy",
    sheetNo: 27,
    title: "Pier Buoyancy Check",
    subtitle: "Uplift Pressure on Foundation",
    category: "D. Pier Design",
    ref: "IRC:6 Cl.213.7",
  },

  // ── E. Abutment Design ──────────────────────────────
  {
    id: "abut-cap",
    sheetNo: 28,
    title: "Abutment Cap Design",
    subtitle: "Abutment Cap Reinforcement",
    category: "E. Abutment Design",
    ref: "IS 456:2000",
  },
  {
    id: "abut-stem-ep",
    sheetNo: 29,
    title: "Abutment Stem — Earth Pressure",
    subtitle: "Active Earth Pressure (Rankine)",
    category: "E. Abutment Design",
    ref: "IS:1904 / IRC:78",
  },
  {
    id: "abut-stem-surcharge",
    sheetNo: 30,
    title: "Abutment — Live Load Surcharge",
    subtitle: "Equivalent Surcharge Height",
    category: "E. Abutment Design",
    ref: "IRC:6 Cl.214.4",
  },
  {
    id: "abut-stem-dl",
    sheetNo: 31,
    title: "Abutment Stem — Dead Load",
    subtitle: "Self Weight & Deck Load",
    category: "E. Abutment Design",
    ref: "IS 456:2000",
  },
  {
    id: "abut-stem-seismic",
    sheetNo: 32,
    title: "Abutment Stem — Seismic",
    subtitle: "Seismic Earth Pressure (Mononobe-Okabe)",
    category: "E. Abutment Design",
    ref: "IRC:6 Cl.219",
  },
  {
    id: "abut-foundation",
    sheetNo: 33,
    title: "Abutment Foundation Design",
    subtitle: "Spread Footing Reinforcement",
    category: "E. Abutment Design",
    ref: "IS 456:2000",
  },
  {
    id: "abut-stability-ot",
    sheetNo: 34,
    title: "Abutment — Overturning Check",
    subtitle: "Factor of Safety Against Overturning",
    category: "E. Abutment Design",
    ref: "IRC:78-1983",
  },
  {
    id: "abut-stability-sl",
    sheetNo: 35,
    title: "Abutment — Sliding Check",
    subtitle: "Factor of Safety Against Sliding",
    category: "E. Abutment Design",
    ref: "IRC:78-1983",
  },

  // ── F. Wing Wall & Return Wall ───────────────────────
  {
    id: "ww-left",
    sheetNo: 36,
    title: "Wing Wall Design (Left)",
    subtitle: "Cantilever Retaining Wall",
    category: "F. Wing Wall & Return Wall",
    ref: "IS 456:2000, IS:1904",
  },
  {
    id: "ww-right",
    sheetNo: 37,
    title: "Wing Wall Design (Right)",
    subtitle: "Cantilever Retaining Wall",
    category: "F. Wing Wall & Return Wall",
    ref: "IS 456:2000, IS:1904",
  },
  {
    id: "rw-return",
    sheetNo: 38,
    title: "Return Wall Design",
    subtitle: "Return Wall Reinforcement",
    category: "F. Wing Wall & Return Wall",
    ref: "IS 456:2000",
  },
  {
    id: "rw-toe",
    sheetNo: 39,
    title: "Toe Wall Design",
    subtitle: "Toe Wall Reinforcement",
    category: "F. Wing Wall & Return Wall",
    ref: "IS 456:2000",
  },

  // ── G. Stability Checks ─────────────────────────────
  {
    id: "stab-pier-ot",
    sheetNo: 40,
    title: "Pier Stability — Overturning",
    subtitle: "FOS Against Overturning",
    category: "G. Stability Checks",
    ref: "IRC:78-1983",
  },
  {
    id: "stab-pier-sl",
    sheetNo: 41,
    title: "Pier Stability — Sliding",
    subtitle: "FOS Against Sliding",
    category: "G. Stability Checks",
    ref: "IRC:78-1983",
  },
  {
    id: "stab-pier-bearing",
    sheetNo: 42,
    title: "Soil Bearing — Pier Foundation",
    subtitle: "Bearing Capacity of Soil",
    category: "G. Stability Checks",
    ref: "IS:1904, IS:6403",
  },
  {
    id: "stab-abut-bearing",
    sheetNo: 43,
    title: "Soil Bearing — Abutment Fdn",
    subtitle: "Bearing Capacity of Soil",
    category: "G. Stability Checks",
    ref: "IS:1904, IS:6403",
  },
  {
    id: "stab-settlement",
    sheetNo: 44,
    title: "Foundation Settlement Check",
    subtitle: "Elastic Settlement Estimation",
    category: "G. Stability Checks",
    ref: "IS:8009 Part-I",
  },

  // ── H. Structural Checks ────────────────────────────
  {
    id: "check-crackwidth",
    sheetNo: 45,
    title: "Crack Width Check",
    subtitle: "IS 456 Annex F Method",
    category: "H. Structural Checks",
    ref: "IS 456:2000, Annex F",
  },
  {
    id: "check-shear-deck",
    sheetNo: 46,
    title: "Shear Check — Deck Slab",
    subtitle: "Nominal Shear Stress",
    category: "H. Structural Checks",
    ref: "IS 456:2000, Cl.40",
  },
  {
    id: "check-punching",
    sheetNo: 47,
    title: "Punching Shear Check",
    subtitle: "Punching at Wheel Load",
    category: "H. Structural Checks",
    ref: "IS 456:2000, Cl.31.6",
  },
  {
    id: "check-deflection",
    sheetNo: 48,
    title: "Deflection Summary",
    subtitle: "Long-Term Deflection Check",
    category: "H. Structural Checks",
    ref: "IS 456:2000, Cl.23.2",
  },

  // ── I. Bearings & Joints ─────────────────────────────
  {
    id: "bearing-pad",
    sheetNo: 49,
    title: "Elastomeric Bearing Pad Design",
    subtitle: "Pad Size, Layers & Fixity",
    category: "I. Bearings & Joints",
    ref: "IRC:83 Part-II",
  },
  {
    id: "expansion-joint",
    sheetNo: 50,
    title: "Expansion Joint Specification",
    subtitle: "Joint Gap & Filler Design",
    category: "I. Bearings & Joints",
    ref: "IRC:6, IRC:83",
  },
];

export function sheetsByCategory(): Record<string, SheetDef[]> {
  const out: Record<string, SheetDef[]> = {};
  for (const cat of CATEGORIES) out[cat] = [];
  for (const s of SHEETS) {
    if (!out[s.category]) out[s.category] = [];
    out[s.category].push(s);
  }
  return out;
}
