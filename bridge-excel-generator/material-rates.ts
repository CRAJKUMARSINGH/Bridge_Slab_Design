/**
 * MATERIAL RATES FROM ABSTRACT SHEET
 * Auto-extracted from FINAL_RESULT.xls
 * Provisional rates from the prototype template. Review against the current
 * authority SSR/DSR before issuing a cost estimate.
 */

export interface MaterialRate {
  itemNo: string;
  description: string;
  unit: string;
  rate: number;
  source: string;
}

export const MATERIAL_RATES: MaterialRate[] = [
  { itemNo: 'R-01', description: 'Concrete M20', unit: 'm³', rate: 5000, source: 'prototype assumption - SSR/DSR review required' },
  { itemNo: 'R-02', description: 'Concrete M25', unit: 'm³', rate: 5500, source: 'prototype assumption - SSR/DSR review required' },
  { itemNo: 'R-03', description: 'Concrete M30', unit: 'm³', rate: 6000, source: 'prototype assumption - SSR/DSR review required' },
  { itemNo: 'R-04', description: 'Concrete M35', unit: 'm³', rate: 6500, source: 'prototype assumption - SSR/DSR review required' },
  { itemNo: 'R-05', description: 'Steel Fe415', unit: 'MT', rate: 65000, source: 'prototype assumption - SSR/DSR review required' },
  { itemNo: 'R-06', description: 'Steel Fe500', unit: 'MT', rate: 70000, source: 'prototype assumption - SSR/DSR review required' },
  { itemNo: 'R-07', description: 'Formwork', unit: 'm²', rate: 350, source: 'prototype assumption - SSR/DSR review required' },
  { itemNo: 'R-08', description: 'Excavation ordinary soil', unit: 'm³', rate: 250, source: 'prototype assumption - SSR/DSR review required' },
  { itemNo: 'R-09', description: 'Excavation hard rock', unit: 'm³', rate: 800, source: 'prototype assumption - SSR/DSR review required' },
  { itemNo: 'R-10', description: 'Backfill', unit: 'm³', rate: 150, source: 'prototype assumption - SSR/DSR review required' },
];

// Quick lookup by description keywords
export const RATE_LOOKUP = {
  // Concrete rates
  concreteM20: 5000,
  concreteM25: 5500,
  concreteM30: 6000,
  concreteM35: 6500,
  
  // Steel rates
  steelFe415: 65000,
  steelFe500: 70000,
  
  // Formwork
  formwork: 350,
  
  // Excavation
  excavationOrdinary: 250,
  excavationRock: 800,
  
  // Backfill
  backfill: 150,
  expansionJoint: 5000,
  bearing: 25000,
};

// Helper function to get rate by description
export function getRateByDescription(description: string): number | undefined {
  const rate = MATERIAL_RATES.find(r => 
    r.description.toLowerCase().includes(description.toLowerCase())
  );
  return rate?.rate;
}

// Helper function to get rate by item number
export function getRateByItemNo(itemNo: string): number | undefined {
  const rate = MATERIAL_RATES.find(r => r.itemNo === itemNo);
  return rate?.rate;
}
