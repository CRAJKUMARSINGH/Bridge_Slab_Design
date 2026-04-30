/**
 * Cross-section A, P, R, V, Q aligned with HYDRAULICS sheet Excel formulas.
 * Segment average depth matches column E: =IF(C>0,(C+C_next)/2,0) on each data row.
 */

import type { ProjectInput } from './types';

export function computeHydraulicsSheetTotals(
  input: Pick<ProjectInput, 'crossSectionData' | 'hfl' | 'manningN' | 'bedSlope'>
): {
  crossSectionalArea: number;
  wettedPerimeter: number;
  hydraulicRadius: number;
  velocity: number;
  discharge: number;
} {
  const { crossSectionData, hfl, manningN, bedSlope } = input;
  let totalArea = 0;
  let totalPerimeter = 0;

  for (let i = 0; i < crossSectionData.length - 1; i++) {
    const p1 = crossSectionData[i];
    const p2 = crossSectionData[i + 1];
    const depth1 = Math.max(0, hfl - p1.gl);
    const depth2 = Math.max(0, hfl - p2.gl);
    const length = p2.chainage - p1.chainage;
    const avgDepth = depth1 > 0 ? (depth1 + depth2) / 2 : 0;
    totalArea += avgDepth * length;
    const glDiff = p2.gl - p1.gl;
    totalPerimeter += Math.sqrt(length * length + glDiff * glDiff);
  }

  const hydraulicRadius = totalArea / totalPerimeter;
  const velocity =
    (1 / manningN) * Math.pow(hydraulicRadius, 2 / 3) * Math.sqrt(1 / bedSlope);
  const discharge = totalArea * velocity;

  return {
    crossSectionalArea: totalArea,
    wettedPerimeter: totalPerimeter,
    hydraulicRadius,
    velocity,
    discharge,
  };
}
