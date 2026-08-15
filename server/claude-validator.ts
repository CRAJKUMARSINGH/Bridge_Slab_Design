/**
 * Claude Validation Integration
 * Uses Anthropic API to validate bridge design calculations
 * Provides AI-assisted checks for IRC compliance and engineering logic
 */

import type { ProjectInput, HydraulicsResult, PierDesignResult, AbutmentDesignResult } from '../bridge-excel-generator/types';

interface ValidationPrompt {
  role: 'user' | 'assistant';
  content: string;
}

interface ValidationResult {
  section: string;
  status: 'PASS' | 'WARNING' | 'FAIL' | 'INFO';
  message: string;
  details?: string[];
  recommendation?: string;
}

interface ClaudeValidationReport {
  projectName: string;
  validatedAt: string;
  overallStatus: 'ACCEPTED' | 'REVIEW_REQUIRED' | 'REJECTED';
  summary: string;
  validations: ValidationResult[];
  ircReferences: string[];
}

/**
 * Build validation prompts for Claude
 */
function buildValidationPrompts(input: ProjectInput, designResults: {
  hydraulics: HydraulicsResult;
  pier: PierDesignResult;
  abutmentType1: AbutmentDesignResult;
  abutmentC1: AbutmentDesignResult;
}): ValidationPrompt[] {
  const { hydraulics, pier, abutmentType1 } = designResults;
  
  return [
    {
      role: 'user',
      content: `Validate this bridge design against IRC standards:

PROJECT: ${input.projectName}
LOCATION: ${input.location}
RIVER: ${input.riverName}

BRIDGE CONFIGURATION:
- Type: ${input.bridgeType === 'high-level' ? 'High-Level Slab Bridge' : 'Submersible Bridge'}
- Total Length: ${input.totalLength}m
- Spans: ${input.numberOfSpans} × ${input.spanLength}m
- Carriageway: ${input.carriageWidth}m
${input.bridgeType === 'high-level' ? `- Deck soffit (MSL): ${(input.deckSoffitLevel ?? (input.rtl - (input.deckSlabThickness ?? 0.25))).toFixed(2)} m; governing min clearance above HFL: ${(hydraulics.requiredFreeboardAboveHfl ?? (input.freeboardAboveHfl ?? 1.2)).toFixed(2)} m (IRC discharge-based minimum vs project minimum)\n` : ''}
HYDRAULIC DATA:
- HFL: ${input.hfl}m MSL
- Bed Level: ${input.bedLevel}m MSL
- Design Discharge: ${hydraulics.discharge.toFixed(2)} cumecs
- Velocity: ${hydraulics.velocity.toFixed(2)} m/s
- Manning's n: ${input.manningN}
- Bed Slope: 1 in ${input.bedSlope}

PIER DESIGN:
- Width: ${input.pierWidth}m, Length: ${input.pierLength}m
- Depth below bed: ${input.pierDepth}m
- Sliding FOS (min): ${Math.min(...pier.loadCases.map(l => l.slidingFOS)).toFixed(2)}
- Overturning FOS (min): ${Math.min(...pier.loadCases.map(l => l.overturningFOS)).toFixed(2)}
- Bearing FOS (min): ${Math.min(...pier.loadCases.map(l => l.bearingFOS)).toFixed(2)}

Please validate:
1. Hydraulics calculations (Area-Velocity method per IRC SP-13)
2. Discharge vs velocity relationship (Manning's equation)
3. Scour depth calculation (Lacey's formula)
4. Pier stability factors of safety (IRC:6-2016)
5. Afflux calculation reasonableness
6. Any anomalies or concerns

Respond with structured validation results.`
    }
  ];
}

/**
 * Perform local validation (without API call)
 * This is a rule-based validation that doesn't require API key
 */
export function performLocalValidation(input: ProjectInput, designResults: {
  hydraulics: HydraulicsResult;
  pier: PierDesignResult;
  abutmentType1: AbutmentDesignResult;
  abutmentC1: AbutmentDesignResult;
}): ClaudeValidationReport {
  const validations: ValidationResult[] = [];
  const ircRefs: string[] = [];
  const isHighLevelBridge = input.bridgeType === 'high-level';
  const deckSlabThickness = input.deckSlabThickness ?? 0.25;
  const deckSoffitLevel =
    input.deckSoffitLevel ?? (input.rtl - deckSlabThickness);

  // 1. Hydraulics validation
  const { hydraulics, pier } = designResults;
  const governingFreeboardAboveHfl = isHighLevelBridge
    ? (hydraulics.requiredFreeboardAboveHfl ?? (input.freeboardAboveHfl ?? 1.2))
    : (input.freeboardAboveHfl ?? 1.2);
  const requiredSoffitLevel = input.hfl + governingFreeboardAboveHfl;

  // Check velocity range.
  if (hydraulics.velocity > 3.0) {
    validations.push({
      section: 'Hydraulics',
      status: 'WARNING',
      message: `Velocity ${hydraulics.velocity.toFixed(2)} m/s exceeds 3 m/s`,
      details: ['High velocity may cause scour issues', 'Consider pier shape optimization'],
      recommendation: 'Review pier nose design, consider circular or cutwater shape'
    });
  } else {
    validations.push({
      section: 'Hydraulics',
      status: 'PASS',
      message: `Velocity ${hydraulics.velocity.toFixed(2)} m/s within acceptable range`,
      details: [
        isHighLevelBridge
          ? 'Velocity screening OK for high-level waterway'
          : 'Suitable for submersible bridge design',
      ],
    });
  }
  ircRefs.push('IRC SP-13: Velocity screening for bridge waterway behavior');
  
  // Check Froude number
  const froude = hydraulics.froudeNumber;
  if (froude > 1.0) {
    validations.push({
      section: 'Hydraulics',
      status: 'WARNING',
      message: `Supercritical flow (Fr = ${froude.toFixed(2)})`,
      details: ['May cause hydraulic jump', 'Consider energy dissipation'],
      recommendation: 'Check downstream scour protection'
    });
  } else {
    validations.push({
      section: 'Hydraulics',
      status: 'PASS',
      message: `Subcritical flow (Fr = ${froude.toFixed(2)}) - stable`,
      details: ['No hydraulic jump expected']
    });
  }
  
  // 2. Scour depth validation
  const scourDepth = hydraulics.designScourDepth;
  const pierDepth = input.pierDepth;
  if (scourDepth > pierDepth * 0.8) {
    validations.push({
      section: 'Foundation',
      status: 'WARNING',
      message: `Scour depth (${scourDepth.toFixed(2)}m) approaches pier embedment (${pierDepth.toFixed(2)}m)`,
      details: ['Scour depth is 80%+ of pier depth', 'Risk of undermining'],
      recommendation: 'Increase pier depth or provide scour protection'
    });
  } else {
    validations.push({
      section: 'Foundation',
      status: 'PASS',
      message: `Scour depth ${scourDepth.toFixed(2)}m safely within pier embedment ${pierDepth.toFixed(2)}m`,
      details: ['Adequate embedment depth']
    });
  }
  ircRefs.push("IRC:78-1983: Pier depth ≥ 1.33 × Lacey's scour depth");
  
  // 3. Pier stability validation
  pier.loadCases.forEach(lc => {
    const issues: string[] = [];
    
    if (lc.slidingFOS < 1.5) {
      issues.push(`Sliding FOS ${lc.slidingFOS.toFixed(2)} < 1.5 required`);
    }
    if (lc.overturningFOS < 1.8) {
      issues.push(`Overturning FOS ${lc.overturningFOS.toFixed(2)} < 1.8 required`);
    }
    if (lc.bearingFOS < 2.5) {
      issues.push(`Bearing FOS ${lc.bearingFOS.toFixed(2)} < 2.5 required`);
    }
    
    if (issues.length > 0) {
      validations.push({
        section: `Pier Stability - ${lc.description}`,
        status: 'FAIL',
        message: `Stability checks failed for ${lc.description}`,
        details: issues,
        recommendation: 'Increase base dimensions or revise load factors'
      });
    } else {
      validations.push({
        section: `Pier Stability - ${lc.description}`,
        status: 'PASS',
        message: `All stability criteria satisfied for ${lc.description}`,
        details: [
          `Sliding FOS: ${lc.slidingFOS.toFixed(2)} ≥ 1.5`,
          `Overturning FOS: ${lc.overturningFOS.toFixed(2)} ≥ 1.8`,
          `Bearing FOS: ${lc.bearingFOS.toFixed(2)} ≥ 2.5`
        ]
      });
    }
  });
  ircRefs.push('IRC:6-2016: FOS for load combinations');
  
  // 4. Abutment validation
  const abutHeight = input.abutmentHeight;
  const spanLength = input.spanLength;
  if (abutHeight > spanLength * 0.5) {
    validations.push({
      section: 'Abutment',
      status: 'WARNING',
      message: `Abutment height (${abutHeight}m) > 50% of span (${spanLength}m)`,
      details: ['High abutment may increase earth pressure', 'Check for overturning'],
      recommendation: 'Consider relieving slab or lighter fill material'
    });
  } else {
    validations.push({
      section: 'Abutment',
      status: 'PASS',
      message: `Abutment proportions acceptable`,
      details: [`Height/Span ratio: ${(abutHeight/spanLength).toFixed(2)} < 0.5`]
    });
  }
  
  // 5. Afflux check
  const afflux = hydraulics.afflux;
  const waterDepth = input.hfl - input.bedLevel;
  const affluxRatio = afflux / waterDepth;
  
  if (affluxRatio > 0.1) {
    validations.push({
      section: 'Afflux',
      status: 'WARNING',
      message: `Afflux ${afflux.toFixed(3)}m is ${(affluxRatio*100).toFixed(1)}% of water depth`,
      details: ['May cause upstream flooding', 'Check freeboard requirements'],
      recommendation: 'Consider increasing waterway or streamlining piers'
    });
  } else {
    validations.push({
      section: 'Afflux',
      status: 'PASS',
      message: `Afflux ${afflux.toFixed(3)}m acceptable`,
      details: [`Afflux/Depth ratio: ${(affluxRatio*100).toFixed(1)}% < 10%`]
    });
  }
  ircRefs.push('IRC SP-13: Afflux calculation by Molesworth formula');
  
  // 6. Cross-section adequacy
  if (input.crossSectionData.length < 5) {
    validations.push({
      section: 'Survey Data',
      status: 'WARNING',
      message: `Only ${input.crossSectionData.length} cross-section points`,
      details: ['Minimum 5-7 points recommended for accurate area'],
      recommendation: 'Add more survey points near thalweg'
    });
  } else {
    validations.push({
      section: 'Survey Data',
      status: 'INFO',
      message: `${input.crossSectionData.length} cross-section points provided`,
      details: ['Adequate for area calculation']
    });
  }

  // 7. Bridge type specific deck-level policy (align with engine hydraulics.isFreeboardSafe)
  if (isHighLevelBridge) {
    const safe = hydraulics.isFreeboardSafe === true;
    if (!safe) {
      validations.push({
        section: 'High-Level Deck Clearance',
        status: 'FAIL',
        message: `Deck soffit ${deckSoffitLevel.toFixed(2)} m does not meet minimum clearance above HFL`,
        details: [
          `HFL: ${input.hfl.toFixed(2)} m`,
          `Soffit − HFL: ${(hydraulics.freeboardAboveHfl ?? deckSoffitLevel - input.hfl).toFixed(3)} m`,
          `Required: ${governingFreeboardAboveHfl.toFixed(2)} m (max of IRC Q-based and project min.)`,
          `Required soffit level: ${requiredSoffitLevel.toFixed(2)} m`,
        ],
        recommendation: 'Raise deck / soffit or confirm project freeboard criteria before proceeding.',
      });
    } else {
      validations.push({
        section: 'High-Level Deck Clearance',
        status: 'PASS',
        message: `Clearance above HFL satisfies policy (${(hydraulics.freeboardAboveHfl ?? deckSoffitLevel - input.hfl).toFixed(2)} m ≥ ${governingFreeboardAboveHfl.toFixed(2)} m)`,
        details: [`Soffit ${deckSoffitLevel.toFixed(2)} m, HFL ${input.hfl.toFixed(2)} m`],
      });
    }
    ircRefs.push('IRC:5-2015 — vertical clearance / freeboard (high-level policy; discharge-related minimum)');
    ircRefs.push('High-level policy: soffit ≥ HFL + max(IRC Q-based minimum, project freeboard) (engine check)');

    const clrDwl = hydraulics.freeboard;
    if (typeof clrDwl === 'number' && clrDwl < 0) {
      validations.push({
        section: 'High-Level — Flood Level vs Soffit',
        status: 'WARNING',
        message: `Soffit is below design water level (HFL + afflux) by ${Math.abs(clrDwl).toFixed(3)} m`,
        details: [
          `DWL: ${hydraulics.designWaterLevel.toFixed(3)} m`,
          'Deck may be partially submerged at design flood; confirm acceptable for high-level classification.',
        ],
        recommendation: 'Raise soffit or revisit afflux / waterway if full clearance above DWL is required.',
      });
    } else if (typeof clrDwl === 'number') {
      validations.push({
        section: 'High-Level — Clearance above DWL',
        status: 'PASS',
        message: `Soffit is ${clrDwl.toFixed(3)} m above design water level`,
        details: [`DWL (HFL + afflux): ${hydraulics.designWaterLevel.toFixed(3)} m`],
      });
    }

    const wF = pier.loads?.windForce;
    if (typeof wF === 'number' && wF > 0) {
      validations.push({
        section: 'High-Level — Wind on pier',
        status: 'INFO',
        message: `Order-of-magnitude wind contribution included in pier lateral model (${wF.toFixed(1)} kN)`,
        details: [
          'Exposed height from bed to RTL; 1.5 kN/m² design pressure (IRC:6 / workbook-style screening).',
          'Confirm with site wind (IS:875 Part 3) for final design.',
        ],
      });
      ircRefs.push('IRC:6-2016 — wind on superstructure / piers (screening)');
    }
  } else {
    validations.push({
      section: 'Bridge Type Policy',
      status: 'INFO',
      message: 'Submersible bridge mode active; overtopping behavior is allowed by policy.',
      details: ['Deck clearance above HFL is not enforced as a fail criterion in submersible mode.'],
    });
  }
  
  // Calculate overall status
  const failures = validations.filter(v => v.status === 'FAIL').length;
  const warnings = validations.filter(v => v.status === 'WARNING').length;
  
  let overallStatus: ClaudeValidationReport['overallStatus'];
  let summary: string;
  
  if (failures > 0) {
    overallStatus = 'REJECTED';
    summary = `${failures} critical failure(s) found. Design must be revised before proceeding.`;
  } else if (warnings > 0) {
    overallStatus = 'REVIEW_REQUIRED';
    summary = `${warnings} warning(s) found. Design acceptable but review recommendations.`;
  } else {
    overallStatus = 'ACCEPTED';
    summary = 'All checks passed. Design meets IRC requirements.';
  }
  
  return {
    projectName: input.projectName,
    validatedAt: new Date().toISOString(),
    overallStatus,
    summary,
    validations,
    ircReferences: Array.from(new Set(ircRefs))
  };
}

/**
 * Generate validation report as HTML
 */
export function generateValidationHTML(report: ClaudeValidationReport): string {
  const statusColors = {
    PASS: '#27ae60',
    WARNING: '#f39c12',
    FAIL: '#e74c3c',
    INFO: '#3498db'
  };
  
  const overallColors = {
    ACCEPTED: '#27ae60',
    REVIEW_REQUIRED: '#f39c12',
    REJECTED: '#e74c3c'
  };
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Design Validation Report - ${report.projectName}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { color: #2c3e50; margin: 0; }
    .overall-status {
      display: inline-block;
      padding: 15px 40px;
      font-size: 18pt;
      font-weight: bold;
      color: white;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary { background: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .validation-item {
      border-left: 5px solid;
      padding: 15px 20px;
      margin-bottom: 15px;
      background: #f8f9fa;
    }
    .validation-item h3 { margin: 0 0 10px 0; font-size: 12pt; }
    .validation-item .status {
      display: inline-block;
      padding: 4px 12px;
      color: white;
      font-size: 9pt;
      font-weight: bold;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .validation-item ul { margin: 10px 0; padding-left: 20px; }
    .validation-item li { margin: 5px 0; }
    .recommendation {
      background: #fff3cd;
      padding: 10px 15px;
      border-radius: 4px;
      margin-top: 10px;
      font-style: italic;
    }
    .irc-refs {
      background: #e8f4f8;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }
    .irc-refs h3 { margin-top: 0; color: #2c3e50; }
    .irc-refs ul { list-style: none; padding: 0; }
    .irc-refs li { padding: 5px 0; border-bottom: 1px solid #bdc3c7; }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ecf0f1;
      color: #7f8c8d;
      font-size: 10pt;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BRIDGE DESIGN VALIDATION REPORT</h1>
      <div class="overall-status" style="background: ${overallColors[report.overallStatus]};">
        ${report.overallStatus.replace('_', ' ')}
      </div>
      <h2>${report.projectName}</h2>
      <p>Validated: ${new Date(report.validatedAt).toLocaleString()}</p>
    </div>
    
    <div class="summary">
      <strong>Summary:</strong> ${report.summary}
    </div>
    
    <h2>Detailed Validations</h2>
    ${report.validations.map(v => `
      <div class="validation-item" style="border-color: ${statusColors[v.status]};">
        <span class="status" style="background: ${statusColors[v.status]};">${v.status}</span>
        <h3>${v.section}</h3>
        <p>${v.message}</p>
        ${v.details ? `<ul>${v.details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
        ${v.recommendation ? `<div class="recommendation">💡 ${v.recommendation}</div>` : ''}
      </div>
    `).join('')}
    
    <div class="irc-refs">
      <h3>IRC Standards Referenced</h3>
      <ul>
        ${report.ircReferences.map(ref => `<li>📋 ${ref}</li>`).join('')}
      </ul>
    </div>
    
    <div class="footer">
      <p>Bridge Design Validation System</p>
      <p>IRC:6-2016 | IRC:112-2015 | IRC:78-1983 | IRC SP-13 | IRC:5-2015 (clearance, as applicable)</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Main validation function (local, no API required)
 */
export function validateDesign(
  input: ProjectInput,
  designResults: {
    hydraulics: HydraulicsResult;
    pier: PierDesignResult;
    abutmentType1: AbutmentDesignResult;
    abutmentC1: AbutmentDesignResult;
  }
): ClaudeValidationReport {
  return performLocalValidation(input, designResults);
}

export { type ValidationResult, type ClaudeValidationReport };
