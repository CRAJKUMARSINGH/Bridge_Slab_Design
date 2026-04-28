/**
 * ESTIMATION & BOQ MODULE
 * Generates Bill of Quantities and Cost Estimates
 */

import { z } from 'zod';

export const EstimationInputSchema = z.object({
  quantities: z.object({
    // Concrete quantities
    concrete: z.object({
      m25: z.number().default(0), // m³
      m30: z.number().default(0),
      m35: z.number().default(0),
    }),
    // Steel quantities
    steel: z.object({
      fe415: z.number().default(0), // MT (metric tons)
      fe500: z.number().default(0),
    }),
    // Other quantities
    formwork: z.number().default(0), // m²
    excavation: z.object({
      ordinary: z.number().default(0), // m³
      hardRock: z.number().default(0),
    }),
    backfill: z.number().default(0), // m³
    pccBlinding: z.number().default(0), // m³
    wearingCoat: z.number().default(0), // m³
    expansionJoints: z.number().default(0), // m
    bearings: z.number().default(0), // nos
  }),
  rates: z.object({
    // Concrete rates (₹ per m³)
    m25: z.number().default(6500),
    m30: z.number().default(7000),
    m35: z.number().default(7500),
    // Steel rates (₹ per MT)
    fe415: z.number().default(65000),
    fe500: z.number().default(70000),
    // Other rates
    formwork: z.number().default(350), // ₹ per m²
    excavationOrdinary: z.number().default(250), // ₹ per m³
    excavationHardRock: z.number().default(800),
    backfill: z.number().default(180),
    pccBlinding: z.number().default(5000),
    wearingCoat: z.number().default(8000),
    expansionJoint: z.number().default(5000), // ₹ per m
    bearing: z.number().default(25000), // ₹ per nos
  }),
  projectDetails: z.object({
    name: z.string(),
    location: z.string(),
    bridgeLength: z.number(),
    bridgeWidth: z.number(),
  }),
});

export type EstimationInput = z.infer<typeof EstimationInputSchema>;

export interface BOQItem {
  itemNo: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface EstimationResult {
  // Bill of Quantities
  boq: BOQItem[];
  
  // Summary by category
  summary: {
    substructure: number; // ₹
    superstructure: number;
    earthwork: number;
    miscellaneous: number;
    subtotal: number;
    gst: number; // 18%
    total: number;
  };
  
  // Cost per meter
  costAnalysis: {
    costPerMeter: number; // ₹ per m
    costPerSquareMeter: number; // ₹ per m²
  };
  
  // Quantity summary
  quantitySummary: {
    totalConcrete: number; // m³
    totalSteel: number; // MT
    totalExcavation: number; // m³
    concretePerMeter: number; // m³/m
    steelPerMeter: number; // MT/m
  };
}

/**
 * Generate Estimation and BOQ
 */
export function generateEstimation(input: EstimationInput): EstimationResult {
  const boq: BOQItem[] = [];
  let itemCounter = 1;
  
  // EARTHWORK ITEMS
  if (input.quantities.excavation.ordinary > 0) {
    boq.push({
      itemNo: `${itemCounter++}`,
      description: 'Excavation in ordinary soil upto 3m depth',
      unit: 'm³',
      quantity: input.quantities.excavation.ordinary,
      rate: input.rates.excavationOrdinary,
      amount: input.quantities.excavation.ordinary * input.rates.excavationOrdinary,
    });
  }
  
  if (input.quantities.excavation.hardRock > 0) {
    boq.push({
      itemNo: `${itemCounter++}`,
      description: 'Excavation in hard rock not requiring blasting',
      unit: 'm³',
      quantity: input.quantities.excavation.hardRock,
      rate: input.rates.excavationHardRock,
      amount: input.quantities.excavation.hardRock * input.rates.excavationHardRock,
    });
  }
  
  if (input.quantities.backfill > 0) {
    boq.push({
      itemNo: `${itemCounter++}`,
      description: 'Backfilling with approved material',
      unit: 'm³',
      quantity: input.quantities.backfill,
      rate: input.rates.backfill,
      amount: input.quantities.backfill * input.rates.backfill,
    });
  }
  
  // PCC BLINDING
  if (input.quantities.pccBlinding > 0) {
    boq.push({
      itemNo: `${itemCounter++}`,
      description: 'PCC M15 grade for blinding',
      unit: 'm³',
      quantity: input.quantities.pccBlinding,
      rate: input.rates.pccBlinding,
      amount: input.quantities.pccBlinding * input.rates.pccBlinding,
    });
  }
  
  // CONCRETE ITEMS
  if (input.quantities.concrete.m25 > 0) {
    boq.push({
      itemNo: `${itemCounter++}`,
      description: 'RCC M25 grade concrete including formwork and curing',
      unit: 'm³',
      quantity: input.quantities.concrete.m25,
      rate: input.rates.m25,
      amount: input.quantities.concrete.m25 * input.rates.m25,
    });
  }
  
  if (input.quantities.concrete.m30 > 0) {
    boq.push({
      itemNo: `${itemCounter++}`,
      description: 'RCC M30 grade concrete including formwork and curing',
      unit: 'm³',
      quantity: input.quantities.concrete.m30,
      rate: input.rates.m30,
      amount: input.quantities.concrete.m30 * input.rates.m30,
    });
  }
  
  if (input.quantities.concrete.m35 > 0) {
    boq.push({
      itemNo: `${itemCounter++}`,
      description: 'RCC M35 grade concrete including formwork and curing',
      unit: 'm³',
      quantity: input.quantities.concrete.m35,
      rate: input.rates.m35,
      amount: input.quantities.concrete.m35 * input.rates.m35,
    });
  }
  
  // STEEL ITEMS
  if (input.quantities.steel.fe415 > 0) {
    boq.push({
      itemNo: `${itemCounter++}`,
      description: 'TMT Fe415 grade steel reinforcement including cutting, bending, binding',
      unit: 'MT',
      quantity: input.quantities.steel.fe415,
      rate: input.rates.fe415,
      amount: input.quantities.steel.fe415 * input.rates.fe415,
    });
  }
  
  if (input.quantities.steel.fe500 > 0) {
    boq.push({
      itemNo: `${itemCounter++}`,
      description: 'TMT Fe500 grade steel reinforcement including cutting, bending, binding',
      unit: 'MT',
      quantity: input.quantities.steel.fe500,
      rate: input.rates.fe500,
      amount: input.quantities.steel.fe500 * input.rates.fe500,
    });
  }
  
  // FORMWORK
  if (input.quantities.formwork > 0) {
    boq.push({
      itemNo: `${itemCounter++}`,
      description: 'Centering and shuttering for RCC work',
      unit: 'm²',
      quantity: input.quantities.formwork,
      rate: input.rates.formwork,
      amount: input.quantities.formwork * input.rates.formwork,
    });
  }
  
  // WEARING COAT
  if (input.quantities.wearingCoat > 0) {
    boq.push({
      itemNo: `${itemCounter++}`,
      description: 'Wearing coat M40 grade concrete 75mm thick',
      unit: 'm³',
      quantity: input.quantities.wearingCoat,
      rate: input.rates.wearingCoat,
      amount: input.quantities.wearingCoat * input.rates.wearingCoat,
    });
  }
  
  // EXPANSION JOINTS
  if (input.quantities.expansionJoints > 0) {
    boq.push({
      itemNo: `${itemCounter++}`,
      description: 'Expansion joints with approved material',
      unit: 'm',
      quantity: input.quantities.expansionJoints,
      rate: input.rates.expansionJoint,
      amount: input.quantities.expansionJoints * input.rates.expansionJoint,
    });
  }
  
  // BEARINGS
  if (input.quantities.bearings > 0) {
    boq.push({
      itemNo: `${itemCounter++}`,
      description: 'Elastomeric bearings as per IRC specifications',
      unit: 'nos',
      quantity: input.quantities.bearings,
      rate: input.rates.bearing,
      amount: input.quantities.bearings * input.rates.bearing,
    });
  }
  
  // CALCULATE SUMMARY
  let earthworkTotal = 0;
  let substructureTotal = 0;
  let superstructureTotal = 0;
  let miscTotal = 0;
  
  boq.forEach(item => {
    if (item.description.includes('Excavation') || item.description.includes('Backfilling')) {
      earthworkTotal += item.amount;
    } else if (item.description.includes('PCC') || item.description.includes('Footing') || 
               item.description.includes('Abutment') || item.description.includes('Pier')) {
      substructureTotal += item.amount;
    } else if (item.description.includes('Deck') || item.description.includes('Wearing coat')) {
      superstructureTotal += item.amount;
    } else {
      miscTotal += item.amount;
    }
  });
  
  const subtotal = boq.reduce((sum, item) => sum + item.amount, 0);
  const gst = subtotal * 0.18; // 18% GST
  const total = subtotal + gst;
  
  // COST ANALYSIS
  const bridgeArea = input.projectDetails.bridgeLength * input.projectDetails.bridgeWidth;
  const costPerMeter = total / input.projectDetails.bridgeLength;
  const costPerSquareMeter = total / bridgeArea;
  
  // QUANTITY SUMMARY
  const totalConcrete = input.quantities.concrete.m25 + input.quantities.concrete.m30 + input.quantities.concrete.m35;
  const totalSteel = input.quantities.steel.fe415 + input.quantities.steel.fe500;
  const totalExcavation = input.quantities.excavation.ordinary + input.quantities.excavation.hardRock;
  
  return {
    boq,
    summary: {
      substructure: substructureTotal,
      superstructure: superstructureTotal,
      earthwork: earthworkTotal,
      miscellaneous: miscTotal,
      subtotal,
      gst,
      total,
    },
    costAnalysis: {
      costPerMeter,
      costPerSquareMeter,
    },
    quantitySummary: {
      totalConcrete,
      totalSteel,
      totalExcavation,
      concretePerMeter: totalConcrete / input.projectDetails.bridgeLength,
      steelPerMeter: totalSteel / input.projectDetails.bridgeLength,
    },
  };
}
