/**
 * Source-defect validation tests — the implementing tests for W03 T3.10 / T3.11.
 *
 * Each W03-owned defect from `docs/phase-2/week-02A/SOURCE-DEFECT-REGISTER.md` gets a
 * test that proves the app behaves as the register requires: D-02 warns, D-06 flags
 * REVIEW, D-07 rejects, D-11 carries both criteria and names the governing one, and
 * D-12 emits REVIEW that blocks a REVIEWED transition.
 *
 * These tests assert the *verdict*, not a numeric design result — that is what the
 * register's "Required app behaviour" column promises. A validation that returned OK
 * on a defect case would be a silent pass and would fail here.
 *
 * Import is extension-qualified so this file runs under plain Node (type-stripping)
 * as well as under tsx.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateReusedConstant,
  validateNonZeroAreaZeroForce,
  validateVehicleLoad,
  permissibleStressCriteria,
  validateCodeBasisEdition,
  reviewTransition,
  statusForSeverity,
  LIVE_LOAD_VEHICLE_REGISTRY,
  FOUNDATION_PERMISSIBLE_STRESS,
  CURRENT_CODE_EDITION,
} from '../../lib/engine/src/validations/source-defects.ts';

// ── D-02: warn when a reused constant is inconsistent with the local section ──

test('D-02: a constant reused across incompatible sections warns (never silent)', () => {
  // The D-03/D-02 signature: a waterway base of 94.8 m pasted onto a section whose
  // own waterway is 88 m.
  const v = validateReusedConstant({
    name: 'waterway base width',
    localValue: 88,
    reusedValue: 94.8,
    sourceSection: 'SOM-KHW cross-section',
    localSection: 'Larathi cross-section',
  });
  assert.equal(v.defect, 'D-02');
  assert.equal(v.severity, 'WARN');
  assert.equal(v.status, 'REVIEW');
  assert.match(v.message, /inconsistent/);
});

test('D-02: a consistent reuse is not reported', () => {
  const v = validateReusedConstant({
    name: 'waterway base width',
    localValue: 94.8,
    reusedValue: 94.8,
    sourceSection: 'SOM-KHW cross-section',
    localSection: 'SOM-KHW cross-section',
  });
  assert.equal(v.severity, 'OK');
  assert.equal(v.status, 'PASS');
});

// ── D-06: flag when a non-zero area yields a zero force ──────────────────────

test('D-06: a non-zero area with a zero force is REVIEW', () => {
  const v = validateNonZeroAreaZeroForce(490.3, 0, 'afflux section area');
  assert.equal(v.defect, 'D-06');
  assert.equal(v.severity, 'REVIEW');
  assert.equal(v.status, 'REVIEW');
});

test('D-06: a non-zero area with a non-zero force is not reported', () => {
  assert.equal(validateNonZeroAreaZeroForce(490.3, 12.7, 'afflux').severity, 'OK');
  assert.equal(validateNonZeroAreaZeroForce(0, 0, 'empty cell').severity, 'OK');
});

// ── D-07: reject a vehicle load absent from the registry ─────────────────────

test('D-07: the source load 82.5 T matches no registry entry and is REJECTED', () => {
  const v = validateVehicleLoad('LLOAD pier case', 82.5);
  assert.equal(v.defect, 'D-07');
  assert.equal(v.severity, 'REJECT');
  assert.equal(v.status, 'FAIL');
  assert.match(v.message, /matches no vehicle/);
});

test('D-07: registry loads are accepted; the unreconciled Class A is flagged REVIEW', () => {
  assert.equal(validateVehicleLoad('70R wheeled', 100).severity, 'OK');
  assert.equal(validateVehicleLoad('70R tracked', 70).severity, 'OK');
  assert.equal(validateVehicleLoad('AA tracked', 70).severity, 'OK');
  assert.equal(validateVehicleLoad('AA wheeled', 40).severity, 'OK');

  const classA = validateVehicleLoad('Class A train', 55.4);
  assert.equal(classA.severity, 'REVIEW');
  assert.match(classA.message, /D-16/);
});

test('D-07: the registry carries the five vehicles the register names', () => {
  assert.deepEqual(
    LIVE_LOAD_VEHICLE_REGISTRY.map((v) => v.code).sort(),
    ['70R(T)', '70R(W)', 'AA(T)', 'AA(W)', 'ClassA'].sort(),
  );
});

// ── D-11: carry both permissible-stress criteria and state which governs ─────

test('D-11: both soil and rock criteria are carried for either founding stratum', () => {
  for (const stratum of ['SOIL', 'ROCK'] as const) {
    const r = permissibleStressCriteria(stratum);
    assert.deepEqual(
      r.carried.map((c) => c.medium).sort(),
      ['ROCK', 'SOIL'],
      'both criteria must always be carried',
    );
    assert.equal(r.governing, stratum);
  }
});

test('D-11: the governing values match the register (soil 250; rock 8000 / -3600)', () => {
  const soil = permissibleStressCriteria('SOIL');
  assert.equal(soil.governingBearingKNPerM2, 250);
  assert.equal(soil.governingTensionKNPerM2, 0);

  const rock = permissibleStressCriteria('ROCK');
  assert.equal(rock.governingBearingKNPerM2, 8000);
  assert.equal(rock.governingTensionKNPerM2, -3600);

  assert.equal(FOUNDATION_PERMISSIBLE_STRESS.SOIL.bearingKNPerM2, 250);
  assert.equal(FOUNDATION_PERMISSIBLE_STRESS.ROCK.tensionKNPerM2, -3600);
});

// ── D-12: a superseded code basis is REVIEW ─────────────────────────────────

test('D-12: a code basis predating the current IRC:6 edition is REVIEW', () => {
  const v = validateCodeBasisEdition('seismic branch', '2016', CURRENT_CODE_EDITION);
  assert.equal(v.defect, 'D-12');
  assert.equal(v.severity, 'REVIEW');
  assert.equal(v.status, 'REVIEW');
  assert.match(v.message, /predates/);
});

test('D-12: a current code basis is not flagged', () => {
  assert.equal(validateCodeBasisEdition('wind branch', '2017').severity, 'OK');
});

// ── T3.11: REVIEW blocks a REVIEWED transition ──────────────────────────────

test('T3.11: a REVIEW check blocks the transition to REVIEWED', () => {
  const checks = [
    { id: 'ABUT-OT-FS', status: 'PASS' as const },
    { id: 'PIER-SEISMIC', status: 'REVIEW' as const },
  ];
  const d = reviewTransition(checks, 'REVIEWED');
  assert.equal(d.allowed, false);
  assert.deepEqual(d.blockingCheckIds, ['PIER-SEISMIC']);
});

test('T3.11: with no REVIEW checks the transition to REVIEWED is allowed', () => {
  const d = reviewTransition(
    [
      { id: 'ABUT-OT-FS', status: 'PASS' as const },
      { id: 'DECK-FLEX', status: 'FAIL' as const },
    ],
    'REVIEWED',
  );
  assert.equal(d.allowed, true);
  assert.deepEqual(d.blockingCheckIds, []);
});

test('T3.11: non-REVIEWED targets are not gated by REVIEW items', () => {
  const checks = [{ id: 'PIER-SEISMIC', status: 'REVIEW' as const }];
  assert.equal(reviewTransition(checks, 'UNDER_REVIEW').allowed, true);
  assert.equal(reviewTransition(checks, 'DRAFT').allowed, true);
});

// ── status mapping ──────────────────────────────────────────────────────────

test('severity maps onto the CheckStatus contract', () => {
  assert.equal(statusForSeverity('OK'), 'PASS');
  assert.equal(statusForSeverity('WARN'), 'REVIEW');
  assert.equal(statusForSeverity('REVIEW'), 'REVIEW');
  assert.equal(statusForSeverity('REJECT'), 'FAIL');
});
