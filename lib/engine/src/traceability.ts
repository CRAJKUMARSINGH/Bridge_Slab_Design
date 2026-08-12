/**
 * Traceability types, assumption register, review checklist — Week 7
 */
import type { CalculationResult } from "./types.js";

export type ReviewState = "draft" | "owner-review" | "licensed-engineer-review" | "accepted" | "superseded";

export interface TraceRecord {
  resultKey: string; label: string; value: number; unit: string;
  formula: string; sourceCells: string[]; inputs: string[]; coefficients: string[]; status?: string;
}

export interface ReviewChecklistItem {
  id: string; category: string; question: string;
  status: "pending"|"pass"|"fail"|"na"; notes?: string;
}

export const STANDARD_REVIEW_CHECKLIST: ReviewChecklistItem[] = [
  { id: "R-001", category: "inputs",       question: "All required inputs present and within engineering ranges",              status: "pending" },
  { id: "R-002", category: "inputs",       question: "Units consistent throughout (m/kN system confirmed)",                    status: "pending" },
  { id: "R-003", category: "coefficients", question: "γG, γQ, γM match applicable design code",                               status: "pending" },
  { id: "R-004", category: "coefficients", question: "alpha and correctionK3 defaults reviewed and approved for this project", status: "pending" },
  { id: "R-005", category: "formulas",     question: "Dead load UDL includes all relevant components",                         status: "pending" },
  { id: "R-006", category: "formulas",     question: "Deflection limit formula appropriate for bridge type and code",          status: "pending" },
  { id: "R-007", category: "formulas",     question: "Shear area assumption confirmed for this cross-section",                 status: "pending" },
  { id: "R-008", category: "constraints",  question: "All FAIL checks visible in report and understood by reviewer",           status: "pending" },
  { id: "R-009", category: "constraints",  question: "Governing utilisation consistent with most critical check",              status: "pending" },
  { id: "R-010", category: "assumptions",  question: "Simply-supported beam model appropriate for this span",                  status: "pending" },
  { id: "R-011", category: "assumptions",  question: "AMB-001 deflection limit denominator resolved for this project",         status: "pending" },
  { id: "R-012", category: "report",       question: "Input fingerprint matches source input file",                            status: "pending" },
  { id: "R-013", category: "report",       question: "Engine version matches parity-tested version",                           status: "pending" },
  { id: "R-014", category: "report",       question: "Licensed engineer has reviewed and accepted this calculation",           status: "pending" },
];

export const STANDARD_ASSUMPTIONS = [
  { id: "A-001", statement: "Simply-supported beam model. No continuity or moment redistribution.", reviewRequired: true },
  { id: "A-002", statement: "Dead load = concrete unit weight × deck thickness only.", reviewRequired: true },
  { id: "A-003", statement: "Live-load deflection uses unit-width strip in N/mm system.", reviewRequired: true },
  { id: "A-004", statement: "Deflection limit = L/correctionK3 (workbook-parity AMB-001).", reviewRequired: true },
  { id: "A-005", statement: "Shear area = girderCount × girderSpacing_mm × deckThickness_mm.", reviewRequired: true },
];

export const STANDARD_LIMITATIONS = [
  { id: "L-001", statement: "Parity against canonical Kherwara/Kharka workbook not established.", impact: "HIGH" },
  { id: "L-002", statement: "No punching shear, fatigue, bearing, seismic, or thermal checks.", impact: "HIGH" },
  { id: "L-003", statement: "No multi-span or continuous beam model.", impact: "MEDIUM" },
  { id: "L-004", statement: "Licensed-engineer review not yet recorded.", impact: "HIGH" },
];

export function buildTraceRecords(result: CalculationResult): TraceRecord[] {
  const out: TraceRecord[] = [];
  const ints: Array<[string, string, keyof CalculationResult]> = [
    ["designUDL","Design UDL","designUDL"],["maximumMoment","Max moment","maximumMoment"],
    ["maximumShear","Max shear","maximumShear"],["bendingStress","Bending stress","bendingStress"],
    ["liveLoadDeflection","Deflection","liveLoadDeflection"],["deflectionLimit","Deflection limit","deflectionLimit"],
    ["shearStress","Shear stress","shearStress"],
  ];
  for (const [k, lbl, f] of ints) {
    const item = result[f] as { value:number; unit:string; trace:{formula:string; sourceCells:string[]; inputs:string[]; coefficients:string[]} };
    out.push({ resultKey:k, label:lbl, value:item.value, unit:item.unit, formula:item.trace.formula, sourceCells:item.trace.sourceCells, inputs:item.trace.inputs, coefficients:item.trace.coefficients });
  }
  for (const [k, lbl, f] of [
    ["bendingUtilisation","Bending utilisation","bendingUtilisation"],
    ["deflectionCheck","Deflection check","deflectionCheck"],
    ["shearCheck","Shear check","shearCheck"],
    ["governingUtilisation","Governing util","governingUtilisation"],
    ["adjustedGoverningUtilisation","Adjusted util","adjustedGoverningUtilisation"],
  ] as Array<[string, string, keyof CalculationResult]>) {
    const item = result[f] as { value:number; unit:string; status:string; trace:{formula:string; sourceCells:string[]; inputs:string[]; coefficients:string[]} };
    out.push({ resultKey:k, label:lbl, value:item.value, unit:item.unit, formula:item.trace.formula, sourceCells:item.trace.sourceCells, inputs:item.trace.inputs, coefficients:item.trace.coefficients, status:item.status });
  }
  return out;
}
