/**
 * MATERIAL RATES FROM ABSTRACT SHEET
 * Auto-extracted from FINAL_RESULT.xls
 * DO NOT EDIT - These are standard rates from the template
 */

export interface MaterialRate {
  itemNo: string;
  description: string;
  unit: string;
  rate: number;
}

export const MATERIAL_RATES: MaterialRate[] = [];

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
