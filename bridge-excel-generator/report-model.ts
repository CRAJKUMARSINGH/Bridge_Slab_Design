import type { EnhancedProjectInput } from './types';

export interface ReportModelEntry {
  value: any;
  unit?: string;
  formulaText?: string;
  label?: string;
}

export type ReportCell = ReportModelEntry;
export type ReportModel = Record<string, ReportCell>;

export function buildReportModel(input: EnhancedProjectInput): ReportModel {
  return {
    projectName: { value: input.projectName, label: 'Project Name' },
    location: { value: input.location, label: 'Location' },
    riverName: { value: input.riverName, label: 'River Name' },
    spanLength: { value: input.spanLength, unit: 'm', label: 'Span Length' },
    numberOfSpans: { value: input.numberOfSpans, label: 'Number of Spans' },
    designDischarge: {
      value: input.hydraulics?.discharge ?? input.discharge,
      unit: 'cumecs',
      label: 'Design Discharge',
    },
    velocity: {
      value: input.hydraulics?.velocity,
      unit: 'm/s',
      label: 'Flow Velocity',
    },
    scourDepth: {
      value: input.hydraulics?.designScourDepth ?? input.hydraulics?.scourDepth,
      unit: 'm',
      label: 'Design Scour Depth',
    },
  };
}

