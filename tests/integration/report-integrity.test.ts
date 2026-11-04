import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateHTMLDesignReport } from '../../server/design-report.ts';

/**
 * Complete valid input matching the full ProjectInputSchema contract.
 * Includes all required fields for assertValidProjectInput() to pass.
 */
const VALID_INPUT = {
  projectName: "HTML Report Integrity Test Bridge",
  location: "Rajasthan, India",
  riverName: "Test River",
  spanLength: 8,
  numberOfSpans: 1,
  carriageWidth: 7.5,
  numberOfLanes: 2,
  totalLength: 8,
  bedLevel: 95,
  hfl: 100,
  foundationLevel: 90,
  discharge: 150,
  manningN: 0.035,
  bedSlope: 500,
  laceysSiltFactor: 1.1,
  crossSectionData: [
    { chainage: 0, gl: 100 },
    { chainage: 20, gl: 95 },
    { chainage: 40, gl: 100 }
  ],
  pierWidth: 1.2,
  pierLength: 8.5,
  pierDepth: 5,
  numberOfPiers: 0,
  pierBaseWidth: 4.5,
  pierBaseLength: 10.5,
  abutmentHeight: 6.5,
  abutmentWidth: 10.5,
  abutmentDepth: 4.5,
  dirtWallHeight: 2.5,
  returnWallLength: 6,
  concreteGrade: "M30",
  fck: 30,
  steelGrade: "Fe500",
  fy: 500,
  sbc: 250,
  phi: 30,
  gamma: 18,
  rtl: 103,
  agl: 95,
  nbl: 95,
  ofl: 100,
  dwl: 100.5,
};

describe('Narrative & HTML Report Integrity', () => {
  it('renders design report and checks structural completeness', async () => {
    const html = await generateHTMLDesignReport(VALID_INPUT);
    
    // N-001: HTML tags validation
    assert.ok(html.includes('<html') || html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('</body>') || html.includes('</html>'));

    // N-002: Metadata validation
    assert.ok(html.includes('HTML Report Integrity Test Bridge'));
    
    // N-005: Absence of placeholders
    assert.equal(html.includes('[TODO]'), false, 'Should not contain [TODO] placeholders');
    assert.equal(html.includes('[PLACEHOLDER]'), false, 'Should not contain [PLACEHOLDER]');
    assert.equal(html.includes('NaN'), false, 'Should not contain raw NaN values');
    // Note: 'undefined' may appear in CSS properties like 'undefined', so check only for isolated instances
    const undefinedMatches = html.match(/\bundefined\b/g);
    const allowedUndefined = 0;
    assert.ok(
      !undefinedMatches || undefinedMatches.length <= allowedUndefined,
      `Should not contain raw undefined text, found ${undefinedMatches?.length ?? 0} instances`
    );
  });
});
