import type { BridgeCalculationResult, ConstraintResult } from "@workspace/engine";

function format(value: number | string, digits = 2): string {
  if (typeof value === "string") return value;
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: Math.max(digits, 4),
  });
}

function statusLine(constraint: ConstraintResult): string {
  return constraint.status === "PASS"
    ? `${constraint.label} is within the stated limit.`
    : `${constraint.label} is outside the stated limit and remains a review stop-point.`;
}

export type ReportChapter = {
  title: string;
  paragraphs: string[];
};

export function buildNarrative(result: BridgeCalculationResult): ReportChapter[] {
  const i = result.intermediates;
  const failed = result.constraints.filter((constraint) => constraint.status === "FAIL");

  return [
    {
      title: "Project summary",
      paragraphs: [
        `This draft calculation record describes ${result.project.projectName} (${result.project.projectCode}), revision ${result.project.revision}. The report follows the attached report-first direction: the design is read from controlled inputs through the calculation chain to visible checks, rather than presenting an isolated spreadsheet screen.`,
        `The governing utilisation is ${format(i.adjustedGoverningUtilisation, 3)} after the visible alpha and k3 adjustments. The overall software result is ${result.overallStatus}; ${failed.length === 0 ? "no generated constraint is currently failing." : `${failed.length} generated constraint${failed.length === 1 ? " remains" : "s remain"} visible for engineering review.`}`,
      ],
    },
    {
      title: "Design basis and controlled inputs",
      paragraphs: [
        `The adopted span is ${format(result.input.spanLength, 2)} m with a deck width of ${format(result.input.deckWidth, 2)} m, girder spacing of ${format(result.input.girderSpacing, 2)} m, and ${format(result.input.numberOfGirders, 0)} girders. The material inputs are concrete strength ${format(result.input.concreteStrength, 2)} MPa and steel grade ${format(result.input.steelGrade, 2)} MPa, with deck thickness ${format(result.input.deckThickness, 3)} m.`,
        `The live action set contains a UDL of ${format(result.input.liveLoadUdl, 2)} kN/m and a concentrated load of ${format(result.input.liveLoadPoint, 2)} kN. The section properties supplied for the run are I = ${format(result.input.secondMoment, 0)} mm4 and Wc = ${format(result.input.sectionModulus, 0)} mm3.`,
      ],
    },
    {
      title: "Loads and actions",
      paragraphs: [
        `The migrated formula sequence produces a slab dead-load intermediate of ${format(i.deadLoadSlab, 3)} kN/m and asphalt dead-load intermediate of ${format(i.deadLoadAsphalt, 3)} kN/m. The attached demo workbook references a blank Factors!B2 in both source formulas, so those zero results are retained as an explicit parity assumption rather than silently replaced.`,
        `With Gamma_G = ${format(result.coefficients.gammaG, 2)}, the resulting design UDL is ${format(i.designUdl, 3)} kN/m. For the simply supported span, the source formula gives a maximum bending moment of ${format(i.maxBendingMoment, 3)} kN*m and maximum shear of ${format(i.maxShear, 3)} kN.`,
      ],
    },
    {
      title: "Detailed calculation narrative",
      paragraphs: [
        `The bending stress demand is ${format(i.bendingStress, 3)} MPa, obtained from the source moment-to-section-modulus conversion. Compared with the steel resistance expression using Gamma_Q = ${format(result.coefficients.gammaQ, 2)}, the bending utilisation is ${format(i.bendingUtilisation, 4)}.`,
        `The serviceability sequence gives a live-load deflection of ${format(i.deflectionLiveLoad, 3)} mm against a source limit of ${format(i.deflectionLimit, 3)} mm. The shear demand is ${format(i.shearStress, 4)} MPa against the registered capacity of ${format(result.coefficients.shearCapacity, 3)} MPa.`,
      ],
    },
    {
      title: "Governing checks",
      paragraphs: [
        `The governing utilisation is the maximum of bending utilisation and the shear-demand-to-capacity ratio, resulting in ${format(i.governingUtilisation, 4)}. Applying the visible engineer-controlled alpha value ${format(result.input.alpha, 3)} and correction k3 value ${format(result.input.correctionK3, 3)} gives an adjusted governing utilisation of ${format(i.adjustedGoverningUtilisation, 4)}.`,
        ...result.constraints.map(
          (constraint) =>
            `${constraint.label}: ${format(constraint.value, 4)}. ${statusLine(constraint)} Source ${constraint.sourceCell}; formula ${constraint.formula}.`,
        ),
      ],
    },
    {
      title: "Assumptions, limitations, and review status",
      paragraphs: [
        ...result.assumptions,
        `This output is marked ${result.reviewStatus}. A passing software result does not constitute structural approval, and the visible failed check${failed.length === 1 ? "" : "s"} must be resolved or accepted by a qualified engineer before any design reliance.`,
      ],
    },
  ];
}