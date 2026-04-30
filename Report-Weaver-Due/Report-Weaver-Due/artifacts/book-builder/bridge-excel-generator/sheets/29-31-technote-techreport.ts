/**
 * Sheets 29 & 31: TechNote (instruction narrative / preamble) & Tech Report.
 * Section order and merge-heavy layout follow milestone W12; full verbatim office prose
 * awaits reference merge map (see docs/milestones/artifacts/W12-technote-techreport.md).
 */

import ExcelJS from 'exceljs';
import { EnhancedProjectInput } from '../types';
import { setColumnWidths, setCellValue, mergeCells } from '../utils';

const TECH_COL_LAST = 9;

function gradeOr(
  input: EnhancedProjectInput,
  key: keyof Pick<
    EnhancedProjectInput,
    | 'concreteGradeFoundation'
    | 'concreteGradePier'
    | 'concreteGradeAbutment'
    | 'concreteGradeDeck'
    | 'concreteGradeWearing'
  >
): string {
  const g = input[key];
  return typeof g === 'string' && g.trim() ? g.trim() : input.concreteGrade;
}

function mergedHeading(ws: ExcelJS.Worksheet, row: number, text: string): number {
  mergeCells(ws, row, 1, row, TECH_COL_LAST);
  const cell = ws.getCell(row, 1);
  cell.value = text;
  cell.font = { bold: true, size: 11 };
  cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  return row + 1;
}

function mergedBody(ws: ExcelJS.Worksheet, row: number, text: string): number {
  mergeCells(ws, row, 1, row, TECH_COL_LAST);
  const cell = ws.getCell(row, 1);
  cell.value = text;
  cell.alignment = { wrapText: true, vertical: 'top' };
  return row + 1;
}

export async function generateTechNoteSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TechNote');
  setColumnWidths(ws, [5, 12, 12, 10, 10, 10, 12, 12, 8]);

  const authority = input.issuingAuthority?.trim() || 'As per employer / department records';
  const jobNo = input.jobNumber?.trim() || '—';
  const hardRock = input.hardRockAvailable === true;
  const hyd = input.hydraulics;
  const isHighLevel = input.bridgeType === 'high-level';
  const bridgeKind = isHighLevel ? 'high-level slab bridge' : 'submersible bridge';
  const deckThk = input.deckSlabThickness ?? 0.25;
  const soffit = input.deckSoffitLevel ?? (input.rtl - deckThk);

  let row = 1;
  mergeCells(ws, row, 1, row, TECH_COL_LAST);
  ws.getCell(row, 1).value = 'TECHNICAL NOTE';
  ws.getCell(row, 1).font = { bold: true, size: 16 };
  ws.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  row += 2;

  row = mergedBody(
    ws,
    row,
    `Project: ${input.projectName}\nLocation: ${input.location}\nRiver: ${input.riverName}\nJob / file no.: ${jobNo}\nIssuing authority: ${authority}`
  );
  row++;

  const sections: [string, string][] = [
    [
      '1. GENERAL',
      `This technical note presents the complete engineering basis adopted for the proposed ${bridgeKind} at the stated site. The narrative is intended to be read together with the calculation workbook so that each design choice is traceable from input assumptions to final check values. Unless specifically qualified, the design approach follows the governing IRC framework listed below.`,
    ],
    [
      '2. APPLICABLE CODES AND STANDARDS',
      'IRC:6-2017 (Loads and stresses), IRC:112-2015 (Concrete bridges), IRC:78-2014 (Foundations), IRC:SP:13 (Hydraulic design of bridges), and relevant Ministry of Road Transport and Highways circulars as applicable to the project.' +
        (isHighLevel ? ' IRC:5-2015 (freeboard / vertical clearance) applies to deck level control for this high-level crossing.' : ''),
    ],
    [
      '3. SITE AND HYDRAULIC DATA',
      `Design discharge Q = ${input.discharge} m³/s; HFL = ${input.hfl} m MSL; bed level (working) = ${input.bedLevel} m MSL; foundation level = ${input.foundationLevel} m MSL. ` +
        (hyd
          ? `From the hydraulic design cycle, computed velocity is approximately ${hyd.velocity.toFixed(3)} m/s, afflux is approximately ${hyd.afflux.toFixed(3)} m, and design scour depth is approximately ${hyd.designScourDepth.toFixed(2)} m. ` +
            (isHighLevel
              ? `As a high-level bridge, vertical clearance above HFL is checked against the governing requirement of ${(hyd.requiredFreeboardAboveHfl ?? (input.freeboardAboveHfl ?? 1.2)).toFixed(2)} m (max of IRC discharge-based minimum ${(hyd.ircMinimumFreeboardAboveHfl ?? 0).toFixed(2)} m and project minimum ${(input.freeboardAboveHfl ?? 0).toFixed(2)} m); deck soffit ${soffit.toFixed(3)} m MSL with approximately ${(hyd.freeboard ?? 0).toFixed(3)} m above design water level (see INSERT- HYDRAULICS and validation).`
              : `The submersible deck is designed for overtopping with appropriate anchorage and drag resistance during flood conditions.`) +
            ` Detailed derivations remain on the HYDRAULICS and afflux calculation sheets.`
          : 'Hydraulic summary to be read from HYDRAULICS and afflux calculation sheets after full run.'),
    ],
    [
      '4. GEOMETRY',
      `Total length ${input.totalLength} m; ${input.numberOfSpans} spans of ${input.spanLength} m c/c; carriageway width ${input.carriageWidth} m; ${input.numberOfPiers} intermediate pier(s). ` +
      (input.bridgeType === 'high-level' ? `Road top level RTL = ${input.rtl} m MSL (High-Level Configuration with vertical clearance).` : `Road top level RTL = ${input.rtl} m MSL (Submersible/Causeway Configuration).`),
    ],
    [
      '5. MATERIALS',
      `Structural concrete: foundation / blinding ${gradeOr(input, 'concreteGradeFoundation')}; piers ${gradeOr(input, 'concreteGradePier')}; abutments and return walls ${gradeOr(input, 'concreteGradeAbutment')}; deck slab ${gradeOr(input, 'concreteGradeDeck')}; wearing coat ${gradeOr(input, 'concreteGradeWearing')}. Reinforcement steel ${input.steelGrade} (fy = ${input.fy} MPa).`,
    ],
    [
      '6. LOADS',
      `Load effects are evaluated using IRC:6-2017 combinations. ` +
      (isHighLevel
        ? `Permanent loads, live-load effects, braking, and hydraulic actions are incorporated. Wind on exposed pier height is included in the pier stability screening model (IRC:6); confirm design wind speed with IS:875 Part 3 for the site.`
        : `Permanent loads, live-load effects, braking, and water current drag/buoyancy effects for the submerged state are incorporated in the corresponding stability sheets.`),
    ],
    [
      '7. FOUNDATION',
      hardRock
        ? 'Foundations are envisaged on hard rock / competent stratum as confirmed by site investigation. Bearing and sliding checks on the stability and footing design sheets are based on the strata parameters adopted for this bridge. Any change in founding level or rock quality shall be referred to the designer.'
        : `Open foundations are designed for safe bearing capacity SBC = ${input.sbc} kPa, soil friction angle φ = ${input.phi}°, unit weight γ = ${input.gamma} kN/m³. Founding level ${input.foundationLevel} m MSL. If field tests indicate weaker strata, revised bearing and stability checks shall be carried out.`,
    ],
    [
      '8. SUBSTRUCTURE',
      'Pier and abutment proportioning, earth-pressure coefficients, and checks against sliding, overturning, and bearing are documented on STABILITY CHECK FOR PIER, TYPE1- / C1-stability, and footing sheets. Reinforcement detailing shown in the steel schedules shall govern execution in conjunction with approved drawings.' +
        (isHighLevel
          ? ' For a high-level deck, abutments and wing walls are checked primarily for earth pressure and live-load surcharge per IRC:6; articulation, joints, and drainage shall reflect that the deck soffit is intended to remain above the design flood level, reducing sustained hydrostatic loading on the superstructure compared with a submersible crossing.'
          : ''),
    ],
    [
      '9. SUPERSTRUCTURE',
      'Deck slab thickness and reinforcement follow slab design and live load analysis sheets. Wearing course and drainage slopes as shown on drawings.',
    ],
    [
      '10. JOINTS AND APPURTENANCES',
      'Expansion joints, approach slab connection, railings / parapets and drainage are to be executed as per approved drawings and relevant IRC clauses.',
    ],
    [
      '11. DURABILITY AND WORKMANSHIP',
      'Exposure class, concrete cover, and crack width criteria as per IRC:112-2015 for the environment at site. Curing and quality control as per MORTH specifications.',
    ],
    [
      '12. DRAWINGS',
      'This workbook supports the design; construction shall follow the issued GFC drawings and revisions approved by the competent authority.',
    ],
    [
      '13. ASSUMPTIONS',
      'Input levels, discharge, soil parameters and material grades are as furnished by the employer or inferred from available data. The contractor shall verify critical dimensions and strata at site before execution.',
    ],
  ];

  for (const [title, body] of sections) {
    row = mergedHeading(ws, row, title);
    row = mergedBody(ws, row, body);
    row++;
  }

  console.log('✓ Sheet 29: TechNote complete');
}

export async function generateTechReportSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('Tech Report');
  setColumnWidths(ws, [4, 36, 14, 14, 10, 10, 10, 8]);

  const authority = input.issuingAuthority?.trim() || 'As per employer / department records';
  const jobNo = input.jobNumber?.trim() || '—';
  const hyd = input.hydraulics;
  const isHighLevel = input.bridgeType === 'high-level';
  const bridgeTypeReport = isHighLevel ? 'High-level slab bridge' : 'Submersible bridge';
  const deckThk = input.deckSlabThickness ?? 0.25;
  const soffit = input.deckSoffitLevel ?? (input.rtl - deckThk);

  let row = 1;
  mergeCells(ws, row, 1, row, 8);
  ws.getCell(row, 1).value = 'TECHNICAL REPORT';
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  ws.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  row += 2;

  row = mergedHeading(ws, row, '1. PROJECT PARTICULARS');
  row = mergedBody(
    ws,
    row,
    `Project name: ${input.projectName}\nLocation: ${input.location}\nRiver: ${input.riverName}\nJob / file no.: ${jobNo}\nIssuing authority: ${authority}\nBridge type: ${bridgeTypeReport}`
  );
  row++;

  row = mergedHeading(ws, row, '2. BRIDGE GEOMETRY');
  row = mergedBody(
    ws,
    row,
    `The proposed bridge configuration consists of a total deck length of ${input.totalLength} m, arranged in ${input.numberOfSpans} span(s) of ${input.spanLength} m each, with carriageway width ${input.carriageWidth} m. The substructure includes ${input.numberOfPiers} intermediate pier(s). Design levels are controlled with RTL ${input.rtl} m MSL and HFL ${input.hfl} m MSL.`
  );
  row++;

  row = mergedHeading(ws, row, '3. HYDRAULIC DESIGN SUMMARY');
  row = mergedBody(
    ws,
    row,
    hyd
      ? `Hydraulic computations establish a design discharge of ${hyd.discharge.toFixed(2)} m³/s with approach velocity ${hyd.velocity.toFixed(3)} m/s. The resulting afflux is ${hyd.afflux.toFixed(3)} m, giving design water level ${hyd.designWaterLevel.toFixed(3)} m MSL. Scour checks indicate mean scour depth ${hyd.scourDepth.toFixed(3)} m and design scour ${hyd.designScourDepth.toFixed(3)} m. Froude number is ${hyd.froudeNumber.toFixed(4)}, corresponding to ${hyd.flowType} flow.` +
          (isHighLevel
            ? ` Deck soffit at ${soffit.toFixed(3)} m MSL; clearance above HFL ${(hyd.freeboardAboveHfl ?? soffit - input.hfl).toFixed(3)} m and above DWL ${(hyd.freeboard ?? 0).toFixed(3)} m (see INSERT- HYDRAULICS).`
            : '')
      : 'Hydraulic results to be read from HYDRAULICS and afflux sheets.'
  );
  row++;

  row = mergedHeading(ws, row, '4. FOUNDATION AND SUBSTRUCTURE');
  row = mergedBody(
    ws,
    row,
    input.hardRockAvailable === true
      ? 'Founding on hard rock / competent stratum as per geotechnical inputs. Pier and abutment footings sized for bearing and stability per calculation sheets.'
      : `Open foundations for SBC ${input.sbc} kPa at ${input.foundationLevel} m MSL; φ = ${input.phi}°, γ = ${input.gamma} kN/m³. Stability and stress checks on pier/abutment footing sheets govern.`
  );
  row++;

  row = mergedHeading(ws, row, '5. SUPERSTRUCTURE AND DECK');
  row = mergedBody(
    ws,
    row,
    `Deck slab in ${gradeOr(input, 'concreteGradeDeck')} with ${input.steelGrade} reinforcement; wearing course ${gradeOr(input, 'concreteGradeWearing')}. Details on slab and estimation sheets.`
  );
  row++;

  row = mergedHeading(ws, row, '6. LOADS AND STABILITY');
  row = mergedBody(
    ws,
    row,
    `Design load combinations are applied in accordance with IRC:6-2017 for ${input.numberOfLanes} traffic lane(s), together with permanent actions and hydraulic influences. Stability performance for pier, abutment, and footing components is demonstrated in their dedicated sheets and controls the final detailing.` +
      (isHighLevel
        ? ' Pier stability screening includes wind on exposed height; abutment checks follow earth-pressure and surcharge models for the high-level deck configuration.'
        : '')
  );
  row++;

  row = mergedHeading(ws, row, '7. SPECIFICATION ITEMS (CHECKLIST)');
  const specItems = [
    '(a) Cement: conforming to IS 8112 / IS 12269 as specified in works contract.',
    '(b) Coarse aggregate: clean, hard, durable; grading per IS 383 and mix design.',
    '(c) Fine aggregate: clean river sand or manufactured sand; IS 383 limits.',
    '(d) Mix design: target strength and workability per IRC:112-2015 and approved trial mixes.',
    `(e) Reinforcement: ${input.steelGrade} as IS 1786; bar bending schedules on steel sheets.`,
    '(f) Formwork: true to line and level; staging designed for construction loads.',
    '(g) Curing: minimum period and method as per IRC:112-2015 / contract.',
    '(h) Joints: expansion / construction joints as per drawings and IRC guidance.',
    '(i) Bearings and appurtenances: as per approved drawing set.',
    '(j) Finishing and drainage: crossfall, weep holes, approach transition as shown.',
    '(k) Tests: cube strength, slump, reinforcement cover checks as per QAP.',
  ];
  row = mergedBody(ws, row, specItems.join('\n'));
  row++;

  if (input.pier) {
    row = mergedHeading(ws, row, 'ANNEX — PIER KEY OUTPUTS');
    const wNote =
      isHighLevel && typeof input.pier.loads.windForce === 'number' && input.pier.loads.windForce > 0
        ? ` Wind screening force ${input.pier.loads.windForce.toFixed(1)} kN (horizontal).`
        : '';
    row = mergedBody(
      ws,
      row,
      `Pier stem ${input.pier.geometry.width} m × ${input.pier.geometry.length} m × ${input.pier.geometry.depth} m; footing ${input.pier.geometry.baseWidth} m × ${input.pier.geometry.baseLength} m; DL ${input.pier.loads.deadLoad.toFixed(1)} kN, LL ${input.pier.loads.liveLoad.toFixed(1)} kN (indicative).${wNote}`
    );
  }

  if (input.abutmentType1) {
    row = mergedHeading(ws, row, 'ANNEX — TYPE-1 ABUTMENT KEY OUTPUTS');
    const a = input.abutmentType1;
    const abutNote = isHighLevel
      ? ' High-level deck: earth pressure and surcharge govern abutment stability; wing walls and joints shall be detailed for the non-submersible soffit condition.'
      : '';
    row = mergedBody(
      ws,
      row,
      `Height ${a.geometry.height} m; Ka = ${a.earthPressure.ka.toFixed(4)}; Pa = ${a.earthPressure.pa.toFixed(2)} kN/m; DL ${a.loads.deadLoad.toFixed(1)} kN (indicative).${abutNote}`
    );
  }

  console.log('✓ Sheet 31: Tech Report complete');
}
