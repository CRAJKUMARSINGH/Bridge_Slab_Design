/**
 * RATE REGISTER
 *
 * Primary source: "plus Detailed ESTIMATE HL Bridge BEDACH.xls" — the client's own
 * PWD BSR Road 2022 (Rajasthan) detailed estimate for the HL skew bridge across the
 * Bedach river. Every rate below is transcribed from that sanctioned estimate, so
 * the engine now bills on the same register the client bills on.
 *
 * Register conventions carried over from that source:
 *  - structural concrete rates are LOCATION-specific and already include formwork;
 *  - wearing coat, approach slab, railing and pavement rates are all-inclusive
 *    (formwork and reinforcement inside the rate), so those items have no separate
 *    steel or formwork line;
 *  - structural steel is billed separately as a percentage of the RCC volume,
 *    converted with the 7850 kg/m³ unit weight of steel;
 *  - excavation is billed by depth band / material, not by a single blended rate.
 *
 * Items the BEDACH estimate does not contain (elastomeric bearings) stay provisional.
 */

export type ConcreteLocation = 'foundation' | 'substructure' | 'superstructure';

const BSR: string = 'PWD BSR Road 2022 (Rajasthan), per BEDACH HL bridge detailed estimate';
const PROVISIONAL: string = 'provisional — no BEDACH/BSR equivalent; SSR/DSR review required';

/**
 * Structural concrete, ₹/m³, keyed by location then grade. Formwork is inside these
 * rates, which is why the BOQ has no separate formwork item.
 */
export const CONCRETE_RATES: Record<ConcreteLocation, Record<string, number>> = {
  foundation: { M15: 4508, M20: 4995, M25: 5372 },
  substructure: { M25: 5696 },
  superstructure: { M30: 6272 },
};

/**
 * Reinforcement, ₹/MT of TMT bar, by the location clause that bills it
 * (B-2/13.3 foundation, B-3/9.3 substructure, B-4/3 superstructure).
 */
export const STEEL_RATES: Record<ConcreteLocation, number> = {
  foundation: 88817,
  substructure: 89690,
  superstructure: 90000,
};

/** Steel as a percentage of the RCC volume of the same location. */
export const STEEL_VOLUME_PERCENT: Record<ConcreteLocation, number> = {
  foundation: 1.5,
  substructure: 1.45,
  superstructure: 1.5,
};

/** Unit weight of reinforcement used to turn a steel volume percentage into mass. */
export const STEEL_UNIT_WEIGHT_KG_PER_M3 = 7850;

/**
 * Excavation, ₹/m³, by material and depth band (MoRTH clauses 301–304 as billed in
 * the source estimate). The deepest defined band is used beyond 6 m.
 */
export const EARTHWORK_RATES = {
  soilUpto3m: 51,
  soil3to6m: 57,
  softRockNoBlasting: 63,
  hardRockBlasting: 514,
};

/** Rock head taken this deep below the river bed when the project reports hard rock. */
export const ROCK_HEAD_DEPTH_BELOW_BED_M = 1.5;

/** Rates for everything outside structural concrete and steel. */
export const ITEM_RATES = {
  /** B-2/6.3 PCC M-15 in open foundations (blinding), ₹/m³. */
  pccBlindingM15: 4508,
  /** B-4/16 PCC M-15 levelling course below the approach slab, ₹/m³. */
  pccLevellingM15: 4335,
  /** B-4/5 RCC M-30 wearing coat incl. formwork and steel, ₹/m³. */
  wearingCoatRccM30: 10009,
  /** B-4/17 RCC M-30 approach slab incl. formwork and steel, ₹/m³. */
  approachSlabRcc: 8202,
  /** B-4/11.2 20 mm compressible fibre board expansion joint, ₹/m². */
  expansionJointCfb: 1227,
  /** B-4/7 12 mm bitumen mastic wearing coat on the prepared base, ₹/m². */
  bitumenMasticCoat: 269,
  /** R-7/2.3 RCC M-30 railing billed per running metre, incl. steel and formwork. */
  railingPerMetre: 1747,
  /** B-3/15 150 mm dia AC pipe weep hole, ₹/Rmt. */
  weepHolePerMetre: 128,
  /** B-1/3.1 gravelly backfill behind abutment/wing/return in 150 mm layers, ₹/m³. */
  backfillGravelly: 663,
  /** B-1/4 graded filter medium behind the walls, ₹/m³. */
  filterMedia: 1214,
  /** 500-… thermoplastic road marking with glass beads, ₹/m². */
  roadMarking: 632,
  /** Raised pavement marker (cat's eye), ₹/no. */
  catsEye: 191,
  /** Citizens information board, ₹/no. */
  infoBoard: 7040,
  /** Village name board, ₹/no. */
  villageNameBoard: 3300,
  /** Elastomeric bearing pad — not present in the source estimate. */
  bearing: 25000,
};

/** Wearing-coat thickness the sanctioned estimate bills (75 mm average, M-30 RCC). */
export const WEARING_COAT_THICKNESS_M = 0.075;

export interface ConcreteRateMatch {
  rate: number;
  /** Grade the register actually priced. */
  gradeUsed: string;
  /** True when the project grade was found in the register for this location. */
  exact: boolean;
}

/**
 * Look up a structural concrete rate. A project grade the register does not price
 * falls back to the nearest priced grade in the same location and is reported as
 * inexact, so the BOQ line can be flagged instead of silently inventing a rate.
 */
export function concreteRateOf(location: ConcreteLocation, grade: string): ConcreteRateMatch {
  const wanted = normaliseGrade(grade);
  const priced = CONCRETE_RATES[location];
  if (priced[wanted] !== undefined) {
    return { rate: priced[wanted], gradeUsed: wanted, exact: true };
  }
  const grades = Object.keys(priced);
  if (grades.length === 0) throw new Error(`No concrete rate registered for ${location}`);
  const nearest = grades.reduce((best, g) =>
    Math.abs(gradeNumber(g) - gradeNumber(wanted)) < Math.abs(gradeNumber(best) - gradeNumber(wanted)) ? g : best
  );
  return { rate: priced[nearest], gradeUsed: nearest, exact: false };
}

/**
 * Concrete grade a project intends for one location, honouring the optional
 * per-location grade fields before the project-wide grade.
 */
export function gradeForLocation(
  input: {
    concreteGrade: string;
    concreteGradeFoundation?: string;
    concreteGradePier?: string;
    concreteGradeAbutment?: string;
    concreteGradeDeck?: string;
    concreteGradeWearing?: string;
  },
  location: 'foundation' | 'pier' | 'abutment' | 'deck' | 'wearing'
): string {
  const perLocation = {
    foundation: input.concreteGradeFoundation,
    pier: input.concreteGradePier,
    abutment: input.concreteGradeAbutment,
    deck: input.concreteGradeDeck,
    wearing: input.concreteGradeWearing,
  }[location];
  return perLocation ?? input.concreteGrade;
}

function normaliseGrade(grade: string): string {
  return grade.toUpperCase().replace(/[\s_-]/g, '');
}

function gradeNumber(grade: string): number {
  return Number(grade.replace(/\D/g, '')) || 0;
}

/** Flat list for audit/reporting; the engine uses the typed maps above. */
export interface MaterialRate {
  itemNo: string;
  description: string;
  unit: string;
  rate: number;
  source: string;
}

export const MATERIAL_RATES: MaterialRate[] = [
  { itemNo: 'C-01', description: 'PCC M-15 in open foundations (blinding)', unit: 'm³', rate: CONCRETE_RATES.foundation.M15, source: BSR },
  { itemNo: 'C-02', description: 'RCC M-20 in open foundations (incl. formwork)', unit: 'm³', rate: CONCRETE_RATES.foundation.M20, source: BSR },
  { itemNo: 'C-03', description: 'RCC M-25 in open foundations (incl. formwork)', unit: 'm³', rate: CONCRETE_RATES.foundation.M25, source: BSR },
  { itemNo: 'C-04', description: 'DM RCC M-25 substructure (incl. formwork)', unit: 'm³', rate: CONCRETE_RATES.substructure.M25, source: BSR },
  { itemNo: 'C-05', description: 'DM RCC M-30 superstructure (incl. formwork)', unit: 'm³', rate: CONCRETE_RATES.superstructure.M30, source: BSR },
  { itemNo: 'S-01', description: 'TMT reinforcement in foundations', unit: 'MT', rate: STEEL_RATES.foundation, source: BSR },
  { itemNo: 'S-02', description: 'TMT reinforcement in substructure', unit: 'MT', rate: STEEL_RATES.substructure, source: BSR },
  { itemNo: 'S-03', description: 'TMT reinforcement in superstructure', unit: 'MT', rate: STEEL_RATES.superstructure, source: BSR },
  { itemNo: 'E-01', description: 'Excavation in ordinary soil, depth up to 3 m', unit: 'm³', rate: EARTHWORK_RATES.soilUpto3m, source: BSR },
  { itemNo: 'E-02', description: 'Excavation in ordinary soil, depth 3–6 m', unit: 'm³', rate: EARTHWORK_RATES.soil3to6m, source: BSR },
  { itemNo: 'E-03', description: 'Excavation in ordinary/soft rock, no blasting', unit: 'm³', rate: EARTHWORK_RATES.softRockNoBlasting, source: BSR },
  { itemNo: 'E-04', description: 'Excavation in hard rock, requiring blasting', unit: 'm³', rate: EARTHWORK_RATES.hardRockBlasting, source: BSR },
  { itemNo: 'X-01', description: 'RCC M-30 wearing coat, 75 mm, all-inclusive', unit: 'm³', rate: ITEM_RATES.wearingCoatRccM30, source: BSR },
  { itemNo: 'X-02', description: 'RCC M-30 approach slab incl. levelling course', unit: 'm³', rate: ITEM_RATES.approachSlabRcc, source: BSR },
  { itemNo: 'X-03', description: 'RCC M-30 railing', unit: 'Rmt', rate: ITEM_RATES.railingPerMetre, source: BSR },
  { itemNo: 'X-04', description: '20 mm compressible fibre board expansion joint', unit: 'm²', rate: ITEM_RATES.expansionJointCfb, source: BSR },
  { itemNo: 'X-05', description: '12 mm bitumen mastic wearing coat', unit: 'm²', rate: ITEM_RATES.bitumenMasticCoat, source: BSR },
  { itemNo: 'X-06', description: '150 mm dia AC pipe weep hole', unit: 'Rmt', rate: ITEM_RATES.weepHolePerMetre, source: BSR },
  { itemNo: 'X-07', description: 'Gravelly backfill behind walls, 150 mm layers', unit: 'm³', rate: ITEM_RATES.backfillGravelly, source: BSR },
  { itemNo: 'X-08', description: 'Graded stone aggregate filter medium', unit: 'm³', rate: ITEM_RATES.filterMedia, source: BSR },
  { itemNo: 'X-09', description: 'Hot-applied thermoplastic road marking', unit: 'm²', rate: ITEM_RATES.roadMarking, source: BSR },
  { itemNo: 'X-10', description: 'Raised pavement marker (cat eye)', unit: 'Nos', rate: ITEM_RATES.catsEye, source: BSR },
  { itemNo: 'X-11', description: 'Citizens information board', unit: 'Nos', rate: ITEM_RATES.infoBoard, source: BSR },
  { itemNo: 'X-12', description: 'Village name board', unit: 'Nos', rate: ITEM_RATES.villageNameBoard, source: BSR },
  { itemNo: 'P-01', description: 'Elastomeric bearing pad', unit: 'Nos', rate: ITEM_RATES.bearing, source: PROVISIONAL },
];

export { BSR as RATE_REGISTER_SOURCE, PROVISIONAL as PROVISIONAL_RATE_SOURCE };
