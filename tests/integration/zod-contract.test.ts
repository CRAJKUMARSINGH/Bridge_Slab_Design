import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { projectInputBodySchema } from '../../server/project-input-zod';

const VALID_INPUT = {
  projectName: "Zod Contract Test Bridge",
  spanLength: 8,
  numberOfSpans: 1,
  carriageWidth: 7.5,
  numberOfLanes: 2,
  bedLevel: 95,
  hfl: 100,
  foundationLevel: 90,
  discharge: 150,
  manningN: 0.035,
  bedSlope: 500,
  laceysSiltFactor: 1.1,
  pierWidth: 1.2,
  pierLength: 8.5,
  pierDepth: 5,
  numberOfPiers: 0,
  pierBaseWidth: 4.5,
  pierBaseLength: 10.5,
  abutmentHeight: 6.5,
  abutmentWidth: 10.5,
  abutmentDepth: 4.5,
  concreteGrade: "M30",
  steelGrade: "Fe500",
  sbc: 250,
  gamma: 18,
  crossSectionData: [
    { chainage: 0, gl: 100 },
    { chainage: 20, gl: 95 },
    { chainage: 40, gl: 100 }
  ]
};

describe('Zod Schema API Contract Enforcement', () => {
  it('passes validation with a fully valid inputs object', () => {
    const parse = projectInputBodySchema.safeParse(VALID_INPUT);
    assert.equal(parse.success, true);
  });

  it('rejects validation when finite constraints are violated (e.g. negative numbers for positive constraints)', () => {
    const invalid = { ...VALID_INPUT, carriageWidth: -2.5 };
    const parse = projectInputBodySchema.safeParse(invalid);
    assert.equal(parse.success, false);
  });

  it('rejects invalid enumeration values', () => {
    const invalid = { ...VALID_INPUT, bridgeType: "invalid-type" };
    const parse = projectInputBodySchema.safeParse(invalid);
    assert.equal(parse.success, false);
  });

  it('strips out unknown properties from request payload', () => {
    const payload = { ...VALID_INPUT, unknownPropertyField: "should-be-removed" };
    const parse = projectInputBodySchema.safeParse(payload);
    assert.equal(parse.success, true);
    if (parse.success) {
      assert.equal(parse.data.hasOwnProperty('unknownPropertyField'), false);
    }
  });
});
