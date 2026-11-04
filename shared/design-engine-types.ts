/**
 * SHARED DESIGN ENGINE TYPES & PURE FUNCTIONS
 *
 * Pure constants, types, and calculation functions that are shared between:
 *   - bridge-excel-generator  (data-transform library)
 *   - server/remote-app-adapter (HTTP boundary)
 *   - scripts (CLI utilities)
 *
 * Nothing in this file may import from `server/` or depend on HTTP/Express.
 */

import type {
  ProjectInput,
  CompleteDesignResult,
  BOQItem,
  EstimationMeasurement,
  EstimationResult,
  MeasurementBasis,
} from '../bridge-excel-generator/types';
import {
  CONCRETE_RATES,
  EARTHWORK_RATES,
  ITEM_RATES,
  ROCK_HEAD_DEPTH_BELOW_BED_M,
  STEEL_RATES,
  STEEL_UNIT_WEIGHT_KG_PER_M3,
  STEEL_VOLUME_PERCENT,
  WEARING_COAT_THICKNESS_M,
  concreteRateOf,
  gradeForLocation,
} from '../bridge-excel-generator/material-rates';
import { deckSlabThicknessOf } from '../bridge-excel-generator/input-contract';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Bearings booked per pier (owner decision 2026-10-04: six per pier).
export const BEARINGS_PER_PIER = 6;

/**
 * PWD overhead ladder, transcribed from the sanctioned BEDACH detailed estimate:
 * subtotal → +1 % Quality Control → +3 % contingency provision (booked nil) →
 * +1.5 % contingencies → G.Total → +13 % prorata overheads & profit.
 * There is no GST line: a PWD SOR estimate prices overheads, not tax.
 */
export const OVERHEAD_RATES = {
  qualityControl: 0.01,
  contingencyProvision: 0.03,
  contingencies: 0.015,
  prorataOverheads: 0.13,
};

// ── Quantity assumptions ───────────────────────────────────────────────────
// Every number below is a modelling convention, not survey data. They are
// printed on the Abstract so a reviewer can change the rule instead of
// reverse-engineering a quantity.
export const ABUTMENT_BAND_LENGTH_M = 10;
export const ABUTMENT_FOOTING_EXTRA_WIDTH_M = 1.5;
export const PIER_FOOTING_THICKNESS_M = 1.0;
export const BLINDING_THICKNESS_M = 0.1;
/** Trench over-dig allowance added to (bed − foundation) depth. */
export const EXCAVATION_OVERDIG_M = 1.0;
/** Ordinary/soft rock is billed for the first metre of the rock zone; deeper is blasted hard rock. */
export const SOFT_ROCK_BAND_THICKNESS_M = 1.0;
export const WEEP_HOLE_SPACING_M = 1.5;
export const RETURN_WALL_THICKNESS_M = 0.3;
export const WALL_BACKFILL_WIDTH_M = 1.5;
export const WALL_FILTER_THICKNESS_M = 0.6;
export const APPROACH_SLAB_LENGTH_M = 6;
export const APPROACH_SLAB_THICKNESS_M = 0.3;
export const APPROACH_LEVELLING_THICKNESS_M = 0.15;
export const MARKING_LINES = 3;
export const MARKING_LINE_WIDTH_M = 0.15;
export const CATS_EYE_SPACING_M = 3;
export const INFO_BOARDS = 2;
export const NAME_BOARDS = 2;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DetailedEstimationResult {
  quantities: EstimationResult['quantities'];
  /** Quantity build-up behind every BOQ line; sheet 46 renders these rows. */
  measurements: EstimationMeasurement[];
  costs: {
    items: number;
    qualityControl: number;
    contingencyProvision: number;
    contingencies: number;
    gTotal: number;
    prorataOverheads: number;
    total: number;
    totalInLacs: number;
  };
  boqItems: BOQItem[];
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * The PWD overhead ladder, in the order the sanctioned estimate applies it.
 * The 3 % contingency provision is a band the engineer may draw on; it is
 * carried at nil so the Abstract shows the same rows the authority's own
 * estimate shows.
 */
export function buildOverheadLadder(items: number) {
  const qualityControl = items * OVERHEAD_RATES.qualityControl;
  const contingencyProvision = 0;
  const contingencies = items * OVERHEAD_RATES.contingencies;
  const gTotal = items + qualityControl + contingencyProvision + contingencies;
  const prorataOverheads = gTotal * OVERHEAD_RATES.prorataOverheads;
  const total = gTotal + prorataOverheads;
  return {
    items,
    qualityControl,
    contingencyProvision,
    contingencies,
    gTotal,
    prorataOverheads,
    total,
    totalInLacs: Math.round((total / 100000) * 100) / 100,
  };
}

/**
 * Calculate detailed estimation with all BOQ items.
 */
export function calculateDetailedEstimation(
  input: ProjectInput,
  designResults: Partial<CompleteDesignResult>,
): DetailedEstimationResult {
  const deckThk = deckSlabThicknessOf(input);
  const bandLen = ABUTMENT_BAND_LENGTH_M;
  const abutFootingWidth = input.abutmentWidth + ABUTMENT_FOOTING_EXTRA_WIDTH_M;

  // ── Structural concrete volumes, grouped by the clause that bills them ────
  const pierFootingVol =
    input.numberOfPiers *
    input.pierBaseWidth *
    input.pierBaseLength *
    PIER_FOOTING_THICKNESS_M;
  const abutmentFootingVol = 2 * bandLen * abutFootingWidth * input.abutmentDepth;
  const foundationRcc = pierFootingVol + abutmentFootingVol;

  const pierBodyVol =
    input.numberOfPiers * input.pierLength * input.pierWidth * input.pierDepth;
  const abutmentBodyVol = 2 * bandLen * input.abutmentWidth * input.abutmentHeight;
  const substructureRcc = pierBodyVol + abutmentBodyVol;

  const deckPlan = input.totalLength * input.carriageWidth;
  const deckVol = deckPlan * deckThk;

  // Formwork is priced inside the structural concrete rates now; the area is
  // still reported so the quantity can be checked against the drawings.
  const formwork =
    input.numberOfPiers *
      2 *
      (input.pierWidth + input.pierLength) *
      input.pierDepth +
    2 * 2 * (input.abutmentWidth + input.abutmentHeight) * bandLen;

  // ── Excavation: depth band and material decide the rate ──────────────────
  const excavationDepth = Math.max(
    0,
    input.bedLevel - input.foundationLevel + EXCAVATION_OVERDIG_M,
  );
  const soilDepth = input.hardRockAvailable
    ? Math.min(excavationDepth, ROCK_HEAD_DEPTH_BELOW_BED_M)
    : excavationDepth;
  const rockDepth = Math.max(0, excavationDepth - soilDepth);
  const softRockDepth = Math.min(rockDepth, SOFT_ROCK_BAND_THICKNESS_M);
  const hardRockDepth = Math.max(0, rockDepth - softRockDepth);

  const digPlan = [
    {
      desc: 'Pier',
      nos: input.numberOfPiers,
      l: input.pierBaseWidth,
      b: input.pierBaseLength,
    },
    { desc: 'Abutment', nos: 2, l: bandLen, b: abutFootingWidth },
  ];
  const soilBand1 = Math.min(soilDepth, 3);
  const soilBand2 = Math.max(0, soilDepth - 3);

  // ── Wall protection, drainage and furniture ──────────────────────────────
  const wallHeight = input.dirtWallHeight;
  const holesPerAbutment =
    Math.ceil(bandLen / WEEP_HOLE_SPACING_M) *
    Math.ceil(input.abutmentHeight / WEEP_HOLE_SPACING_M);
  const holesPerReturn =
    Math.ceil(input.returnWallLength / WEEP_HOLE_SPACING_M) *
    Math.ceil(wallHeight / WEEP_HOLE_SPACING_M);
  const markedLength = input.totalLength + 2 * APPROACH_SLAB_LENGTH_M;
  const catsEyes = 2 * Math.ceil(markedLength / CATS_EYE_SPACING_M);
  const jointDepth = deckThk + WEARING_COAT_THICKNESS_M;

  // ── Grades and register lookups ──────────────────────────────────────────
  const foundationRate = concreteRateOf(
    'foundation',
    gradeForLocation(input, 'foundation'),
  );
  const pierRate = concreteRateOf('substructure', gradeForLocation(input, 'pier'));
  const abutmentRate = concreteRateOf(
    'substructure',
    gradeForLocation(input, 'abutment'),
  );
  const deckRate = concreteRateOf('superstructure', gradeForLocation(input, 'deck'));

  const SECTION = {
    foundation: 'FOUNDATION WORK',
    substructure: 'SUB STRUCTURE WORK',
    superstructure: 'SUPERSTRUCTURE',
    approaches: 'APPROACHES & ROAD FURNITURE',
  } as const;

  interface Part {
    desc: string;
    basis: MeasurementBasis;
    nos: number;
    l: number;
    b: number;
    h: number;
    unit: string;
  }
  interface LineSpec {
    section: string;
    bsrCode: string;
    description: string;
    unit: string;
    rate: number;
    parts: Part[];
  }

  const round3 = (value: number) => Math.round(value * 1000) / 1000;

  const productOf = (
    basis: MeasurementBasis,
    nos: number,
    l: number,
    b: number,
    h: number,
  ): number => {
    if (basis === 'count') return nos;
    if (basis === 'plan') return nos * l * b;
    if (basis === 'steel') return (nos * l * b * h) / 100 / 1000;
    return nos * l * b * h;
  };

  const gradeCaveat = (
    match: ReturnType<typeof concreteRateOf>,
    element: string,
  ) =>
    match.exact
      ? ''
      : ` (no BSR ${element} rate for the project grade; billed at the M${match.gradeUsed.replace(/\D/g, '')} rate — SSR extension required)`;

  const gradeNo = (grade: string) => grade.replace(/\D/g, '');

  const steelPart = (
    location: 'foundation' | 'substructure' | 'superstructure',
    rccVolume: number,
  ): Part => ({
    desc: `${STEEL_VOLUME_PERCENT[location].toFixed(2)} % of RCC volume × ${STEEL_UNIT_WEIGHT_KG_PER_M3} kg/m³`,
    basis: 'steel',
    nos: 1,
    l: STEEL_VOLUME_PERCENT[location],
    b: round3(rccVolume),
    h: STEEL_UNIT_WEIGHT_KG_PER_M3,
    unit: 'MT',
  });

  const lines: LineSpec[] = [];
  const add = (
    section: string,
    bsrCode: string,
    description: string,
    unit: string,
    rate: number,
    parts: Part[],
  ) => {
    lines.push({ section, bsrCode, description, unit, rate, parts });
  };

  add(
    SECTION.foundation,
    'B-1/1.1.4',
    'Earthwork in excavation for foundation of structure in ordinary soil by mechanical means, depth up to 3 m, including setting out, shoring, dewatering, refilling in layers and disposal within 1000 m lead',
    'm³',
    EARTHWORK_RATES.soilUpto3m,
    digPlan.map((d) => ({
      desc: d.desc,
      basis: 'volume' as MeasurementBasis,
      nos: d.nos,
      l: d.l,
      b: d.b,
      h: soilBand1,
      unit: 'm³',
    })),
  );

  add(
    SECTION.foundation,
    'B-1/1.1.5',
    'Earthwork in excavation for foundation of structure in ordinary soil by mechanical means, depth above 3 m (deeper lifts are billed in this band)',
    'm³',
    EARTHWORK_RATES.soil3to6m,
    digPlan.map((d) => ({
      desc: d.desc,
      basis: 'volume' as MeasurementBasis,
      nos: d.nos,
      l: d.l,
      b: d.b,
      h: soilBand2,
      unit: 'm³',
    })),
  );

  add(
    SECTION.foundation,
    'B-1/1.3.2',
    `Earthwork in excavation in ordinary/soft rock not requiring blasting, by mechanical means (first ${SOFT_ROCK_BAND_THICKNESS_M} m of the rock zone)`,
    'm³',
    EARTHWORK_RATES.softRockNoBlasting,
    digPlan.map((d) => ({
      desc: d.desc,
      basis: 'volume' as MeasurementBasis,
      nos: d.nos,
      l: d.l,
      b: d.b,
      h: softRockDepth,
      unit: 'm³',
    })),
  );

  add(
    SECTION.foundation,
    'B-1/1.4.1',
    'Earthwork in excavation in hard rock requiring blasting, complete with all lifts and disposal',
    'm³',
    EARTHWORK_RATES.hardRockBlasting,
    digPlan.map((d) => ({
      desc: d.desc,
      basis: 'volume' as MeasurementBasis,
      nos: d.nos,
      l: d.l,
      b: d.b,
      h: hardRockDepth,
      unit: 'm³',
    })),
  );

  add(
    SECTION.foundation,
    'B-2/6.3',
    `PCC M-15 grade blinding concrete in open foundations with 20 mm aggregate (${Math.round(BLINDING_THICKNESS_M * 1000)} mm thick)`,
    'm³',
    ITEM_RATES.pccBlindingM15,
    digPlan.map((d) => ({
      desc: d.desc,
      basis: 'volume' as MeasurementBasis,
      nos: d.nos,
      l: d.l,
      b: d.b,
      h: BLINDING_THICKNESS_M,
      unit: 'm³',
    })),
  );

  add(SECTION.foundation, 'B-2/6.6', `RCC M-${gradeNo(foundationRate.gradeUsed)} in open foundations including formwork${gradeCaveat(foundationRate, 'open foundation')}`, 'm³', foundationRate.rate, [
    {
      desc: 'Pier footing',
      basis: 'volume',
      nos: input.numberOfPiers,
      l: input.pierBaseWidth,
      b: input.pierBaseLength,
      h: PIER_FOOTING_THICKNESS_M,
      unit: 'm³',
    },
    {
      desc: 'Abutment footing',
      basis: 'volume',
      nos: 2,
      l: bandLen,
      b: abutFootingWidth,
      h: input.abutmentDepth,
      unit: 'm³',
    },
  ]);

  add(
    SECTION.foundation,
    'B-2/13.3',
    `TMT steel reinforcement in foundations at ${STEEL_VOLUME_PERCENT.foundation.toFixed(2)} % of RCC volume`,
    'MT',
    STEEL_RATES.foundation,
    [steelPart('foundation', foundationRcc)],
  );

  const subParts: Part[] = [
    {
      desc: 'Pier body',
      basis: 'volume',
      nos: input.numberOfPiers,
      l: input.pierLength,
      b: input.pierWidth,
      h: input.pierDepth,
      unit: 'm³',
    },
    {
      desc: 'Abutment body and dirt wall',
      basis: 'volume',
      nos: 2,
      l: bandLen,
      b: input.abutmentWidth,
      h: input.abutmentHeight,
      unit: 'm³',
    },
  ];
  if (pierRate.rate === abutmentRate.rate) {
    add(
      SECTION.substructure,
      'B-3/5.2.1.1',
      `Design mix RCC M-${gradeNo(pierRate.gradeUsed)} for substructure up to 5 m height including formwork${gradeCaveat(pierRate, 'substructure')}`,
      'm³',
      pierRate.rate,
      subParts,
    );
  } else {
    add(
      SECTION.substructure,
      'B-3/5.2.1.1',
      `Design mix RCC M-${gradeNo(pierRate.gradeUsed)} in piers including formwork${gradeCaveat(pierRate, 'substructure')}`,
      'm³',
      pierRate.rate,
      [subParts[0]],
    );
    add(
      SECTION.substructure,
      'B-3/5.2.1.1',
      `Design mix RCC M-${gradeNo(abutmentRate.gradeUsed)} in abutments including formwork${gradeCaveat(abutmentRate, 'substructure')}`,
      'm³',
      abutmentRate.rate,
      [subParts[1]],
    );
  }

  add(
    SECTION.substructure,
    'B-3/9.3',
    `TMT steel reinforcement in substructure at ${STEEL_VOLUME_PERCENT.substructure.toFixed(2)} % of RCC volume`,
    'MT',
    STEEL_RATES.substructure,
    [steelPart('substructure', substructureRcc)],
  );

  add(SECTION.substructure, 'B-1/3.1', `Back filling behind abutment, wing wall and return wall in 150 mm layers with mechanical compaction, gravelly material (${WALL_BACKFILL_WIDTH_M} m wide behind the walls up to ${wallHeight} m high)`, 'm³', ITEM_RATES.backfillGravelly, [
    {
      desc: 'Behind abutment',
      basis: 'volume',
      nos: 2,
      l: bandLen,
      b: WALL_BACKFILL_WIDTH_M,
      h: wallHeight,
      unit: 'm³',
    },
    {
      desc: 'Behind returns',
      basis: 'volume',
      nos: 4,
      l: input.returnWallLength,
      b: WALL_BACKFILL_WIDTH_M,
      h: wallHeight,
      unit: 'm³',
    },
  ]);

  add(SECTION.substructure, 'B-1/4', `Graded stone aggregate filter medium behind abutment, wing wall and return wall (${WALL_FILTER_THICKNESS_M} m thick up to ${wallHeight} m high)`, 'm³', ITEM_RATES.filterMedia, [
    {
      desc: 'Behind abutment',
      basis: 'volume',
      nos: 2,
      l: bandLen,
      b: WALL_FILTER_THICKNESS_M,
      h: wallHeight,
      unit: 'm³',
    },
    {
      desc: 'Behind returns',
      basis: 'volume',
      nos: 4,
      l: input.returnWallLength,
      b: WALL_FILTER_THICKNESS_M,
      h: wallHeight,
      unit: 'm³',
    },
  ]);

  add(SECTION.substructure, 'B-3/15', `150 mm dia A.C. pipe weep holes in abutment, wing wall and return wall at ${WEEP_HOLE_SPACING_M} m c/c`, 'Rmt', ITEM_RATES.weepHolePerMetre, [
    {
      desc: 'Abutments',
      basis: 'plan',
      nos: 2,
      l: holesPerAbutment,
      b: input.abutmentWidth,
      h: 0,
      unit: 'Rmt',
    },
    {
      desc: 'Returns',
      basis: 'plan',
      nos: 4,
      l: holesPerReturn,
      b: RETURN_WALL_THICKNESS_M,
      h: 0,
      unit: 'Rmt',
    },
  ]);

  add(
    SECTION.superstructure,
    'B-4/1.1.3',
    `Design mix RCC M-${gradeNo(deckRate.gradeUsed)} deck slab including steel formwork and scaffolding${gradeCaveat(deckRate, 'superstructure')}`,
    'm³',
    deckRate.rate,
    [
      {
        desc: 'Deck slab',
        basis: 'volume',
        nos: 1,
        l: input.totalLength,
        b: input.carriageWidth,
        h: deckThk,
        unit: 'm³',
      },
    ],
  );

  add(
    SECTION.superstructure,
    'B-4/3',
    `TMT steel reinforcement in superstructure at ${STEEL_VOLUME_PERCENT.superstructure.toFixed(2)} % of RCC volume`,
    'MT',
    STEEL_RATES.superstructure,
    [steelPart('superstructure', deckVol)],
  );

  add(
    SECTION.superstructure,
    'B-4/5',
    `RCC M-30 wearing coat ${Math.round(WEARING_COAT_THICKNESS_M * 1000)} mm thick average, including formwork and reinforcement`,
    'm³',
    ITEM_RATES.wearingCoatRccM30,
    [
      {
        desc: 'Wearing coat',
        basis: 'volume',
        nos: 1,
        l: input.totalLength,
        b: input.carriageWidth,
        h: WEARING_COAT_THICKNESS_M,
        unit: 'm³',
      },
    ],
  );

  add(SECTION.superstructure, 'B-4/7', '12 mm thick bitumen mastic wearing coat / damp-proof course to pier and abutment faces, including tack coat', 'm²', ITEM_RATES.bitumenMasticCoat, [
    {
      desc: 'Pier faces',
      basis: 'plan',
      nos: input.numberOfPiers,
      l: 2 * (input.pierWidth + input.pierLength),
      b: input.pierDepth,
      h: 0,
      unit: 'm²',
    },
    {
      desc: 'Abutment faces',
      basis: 'plan',
      nos: 2,
      l: bandLen,
      b: 2 * input.abutmentHeight,
      h: 0,
      unit: 'm²',
    },
  ]);

  add(SECTION.superstructure, 'B-4/11.2', `20 mm thick compressible fibre board in expansion joint, ${Math.round(jointDepth * 1000)} mm deep (deck slab plus wearing coat)`, 'm²', ITEM_RATES.expansionJointCfb, [
    {
      desc: 'At abutments',
      basis: 'plan',
      nos: 2,
      l: input.carriageWidth,
      b: jointDepth,
      h: 0,
      unit: 'm²',
    },
  ]);

  add(
    SECTION.superstructure,
    'R-16',
    `Elastomeric bearing pad at piers (${BEARINGS_PER_PIER} per pier)`,
    'Nos',
    ITEM_RATES.bearing,
    [
      {
        desc: 'Bearings',
        basis: 'count',
        nos: input.numberOfPiers * BEARINGS_PER_PIER,
        l: 0,
        b: 0,
        h: 0,
        unit: 'Nos',
      },
    ],
  );

  add(SECTION.approaches, 'B-4/16', `PCC M-15 levelling course below approach slab (${Math.round(APPROACH_LEVELLING_THICKNESS_M * 1000)} mm thick, ${APPROACH_SLAB_LENGTH_M} m long at each end)`, 'm³', ITEM_RATES.pccLevellingM15, [
    {
      desc: 'Approach slabs',
      basis: 'volume',
      nos: 2,
      l: APPROACH_SLAB_LENGTH_M,
      b: input.carriageWidth,
      h: APPROACH_LEVELLING_THICKNESS_M,
      unit: 'm³',
    },
  ]);

  add(SECTION.approaches, 'B-4/17', `RCC M-30 approach slab including reinforcement and formwork (${Math.round(APPROACH_SLAB_THICKNESS_M * 1000)} mm thick, ${APPROACH_SLAB_LENGTH_M} m long at each end)`, 'm³', ITEM_RATES.approachSlabRcc, [
    {
      desc: 'Approach slabs',
      basis: 'volume',
      nos: 2,
      l: APPROACH_SLAB_LENGTH_M,
      b: input.carriageWidth,
      h: APPROACH_SLAB_THICKNESS_M,
      unit: 'm³',
    },
  ]);

  add(SECTION.approaches, '500-29', 'Road marking with hot-applied thermoplastic compound 2.5 mm thick with reflectorising glass beads, on deck and approach slabs', 'm²', ITEM_RATES.roadMarking, [
    {
      desc: 'Centre and edge lines',
      basis: 'plan',
      nos: MARKING_LINES,
      l: round3(markedLength),
      b: MARKING_LINE_WIDTH_M,
      h: 0,
      unit: 'm²',
    },
  ]);

  add(
    SECTION.approaches,
    '500-30',
    `Raised pavement markers (cats eyes) along both edge lines at ${CATS_EYE_SPACING_M} m spacing`,
    'Nos',
    ITEM_RATES.catsEye,
    [
      {
        desc: 'Cats eyes',
        basis: 'count',
        nos: catsEyes,
        l: 0,
        b: 0,
        h: 0,
        unit: 'Nos',
      },
    ],
  );

  add(
    SECTION.approaches,
    '500-31',
    'Citizens information board, one at each end of the bridge',
    'Nos',
    ITEM_RATES.infoBoard,
    [
      {
        desc: 'Information boards',
        basis: 'count',
        nos: INFO_BOARDS,
        l: 0,
        b: 0,
        h: 0,
        unit: 'Nos',
      },
    ],
  );

  add(
    SECTION.approaches,
    '500-32',
    'Village name board, one at each end of the bridge',
    'Nos',
    ITEM_RATES.villageNameBoard,
    [
      {
        desc: 'Name boards',
        basis: 'count',
        nos: NAME_BOARDS,
        l: 0,
        b: 0,
        h: 0,
        unit: 'Nos',
      },
    ],
  );

  // ── Flatten: BOQ lines and the measurement rows that build them ────────────
  const boqItems: BOQItem[] = [];
  const measurements: EstimationMeasurement[] = [];
  const concreteByGrade: Record<string, number> = {
    M15: 0,
    M20: 0,
    M25: 0,
    M30: 0,
    M35: 0,
  };

  for (const line of lines) {
    const rows: EstimationMeasurement[] = [];
    let quantity = 0;
    for (const part of line.parts) {
      const nos = round3(part.nos);
      const length = round3(part.l);
      const breadth = round3(part.b);
      const height = round3(part.h);
      const raw = productOf(part.basis, nos, length, breadth, height);
      if (raw <= 1e-9) continue;
      const qty = round3(raw);
      quantity += qty;
      rows.push({
        item: '',
        section: line.section,
        bsrCode: line.bsrCode,
        description: part.desc,
        basis: part.basis,
        nos,
        length,
        breadth,
        height,
        unit: part.unit,
        quantity: qty,
      });
    }
    if (rows.length === 0) continue;

    const itemNo = `${boqItems.length + 1}`;
    rows.forEach((row) => {
      row.item = itemNo;
    });
    measurements.push(...rows);
    quantity = round3(quantity);
    boqItems.push({
      itemNo,
      description: line.description,
      unit: line.unit,
      quantity,
      rate: line.rate,
      amount: quantity * line.rate,
    });

    if (line.unit === 'm³' && /PCC|RCC/i.test(line.description)) {
      const grade = `M${gradeNo(line.description.match(/M-(\d+)/)?.[1] ?? '')}`;
      if (concreteByGrade[grade] !== undefined) concreteByGrade[grade] += quantity;
    }
  }

  const steelTotalMt = round3(
    boqItems
      .filter((b) => /TMT steel/.test(b.description))
      .reduce((sum, b) => sum + b.quantity, 0),
  );

  const sumBand = (bsrCode: string) =>
    round3(
      measurements
        .filter((m) => m.bsrCode === bsrCode)
        .reduce((sum, m) => sum + m.quantity, 0),
    );

  const costs = buildOverheadLadder(
    boqItems.reduce((sum, item) => sum + item.amount, 0),
  );

  return {
    quantities: {
      concrete: {
        m15: round3(concreteByGrade.M15),
        m20: round3(concreteByGrade.M20),
        m25: round3(concreteByGrade.M25),
        m30: round3(concreteByGrade.M30),
        m35: round3(concreteByGrade.M35),
        total: round3(
          Object.values(concreteByGrade).reduce((a, b) => a + b, 0),
        ),
      },
      steel: {
        fe415: input.steelGrade === 'Fe415' ? steelTotalMt : 0,
        fe500: input.steelGrade === 'Fe500' ? steelTotalMt : 0,
        total: steelTotalMt,
      },
      formwork: round3(formwork),
      excavation: {
        soilUpto3m: sumBand('B-1/1.1.4'),
        soil3to6m: sumBand('B-1/1.1.5'),
        softRock: sumBand('B-1/1.3.2'),
        hardRock: sumBand('B-1/1.4.1'),
        total: round3(
          sumBand('B-1/1.1.4') +
            sumBand('B-1/1.1.5') +
            sumBand('B-1/1.3.2') +
            sumBand('B-1/1.4.1'),
        ),
      },
      backfill: sumBand('B-1/3.1'),
    },
    measurements,
    costs,
    boqItems,
  };
}
