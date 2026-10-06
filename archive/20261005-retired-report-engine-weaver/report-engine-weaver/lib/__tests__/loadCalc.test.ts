/**
 * Load Calculation Tests — ported from SECONDARY app
 * Covers 16 IRC vehicle types from ASTRA LL.TXT
 */
import { describe, it, expect } from "vitest";
import {
  VEHICLE_GEOMETRIES,
  calcLiveLoad,
  type VehicleType,
} from "../loadCalc";

describe("Vehicle geometries — IRC LL.TXT", () => {
  it("Class A axle loads and total match IRC:6-2016 Fig. 1", () => {
    const g = VEHICLE_GEOMETRIES.ClassA;
    expect(g.axleLoads).toEqual([27, 27, 114, 114, 68, 68, 68, 68]);
    expect(g.spacings).toEqual([1.10, 3.20, 1.20, 4.30, 3.00, 3.00, 3.00]);
    expect(g.totalLoad).toBe(554);
  });

  it("70R Track — 10 axles, trackWidth 2.9m, total 700 kN", () => {
    const g = VEHICLE_GEOMETRIES["70RTrack"];
    expect(g.axleLoads.length).toBe(10);
    expect(g.trackWidth).toBe(2.9);
    expect(g.totalLoad).toBe(700);
  });

  it("70R Wheel axle loads and total match IRC:6-2016 Annex A", () => {
    const g = VEHICLE_GEOMETRIES["70RWheel"];
    expect(g.axleLoads).toEqual([170, 170, 170, 170, 120, 120, 80]);
    expect(g.totalLoad).toBe(700);
  });

  it("all 16 vehicle types are defined with axle loads and total load", () => {
    const vehicleTypes: VehicleType[] = [
      "ClassA", "ClassB", "70RTrack", "70RWheel", "ClassAATrack",
      "24RTrack", "LRFD_HTL57", "LRFD_HL93_HS20", "LRFD_HL93_H20",
      "BG_Rail_1", "BG_Rail_2", "MG_Rail_1", "MG_Rail_2",
      "70RW40TBM", "70RW40TBL", "40RWheel",
    ];

    for (const type of vehicleTypes) {
      const g = VEHICLE_GEOMETRIES[type];
      expect(g, `${type} should be defined`).toBeDefined();
      expect(g.axleLoads.length, `${type} should have axle loads`).toBeGreaterThan(0);
      expect(g.totalLoad, `${type} totalLoad should be > 0`).toBeGreaterThan(0);
    }
  });
});

describe("Live load calculation", () => {
  it("Class A design moment > 0", () => {
    const r = calcLiveLoad({
      workName: "Test",
      spanLength: 8.0,
      slabWidth: 7.5,
      vehicleType: "ClassA",
      numLanes: 2,
    });
    expect(r.axleLoads).toEqual(VEHICLE_GEOMETRIES.ClassA.axleLoads);
    expect(r.designMoment).toBeGreaterThan(0);
    expect(r.designShear).toBeGreaterThan(0);
  });

  it("70R Wheel design moment > 0", () => {
    const r = calcLiveLoad({
      workName: "Test",
      spanLength: 8.0,
      slabWidth: 7.5,
      vehicleType: "70RWheel",
      numLanes: 2,
    });
    expect(r.axleLoads).toEqual(VEHICLE_GEOMETRIES["70RWheel"].axleLoads);
    expect(r.designMoment).toBeGreaterThan(0);
  });

  it("impact factor ≥ 1.0 for all spans", () => {
    for (const span of [2, 5, 10, 20, 50]) {
      const r = calcLiveLoad({
        workName: "Test",
        spanLength: span,
        slabWidth: 7.5,
        vehicleType: "ClassA",
        numLanes: 1,
      });
      expect(r.impactFactor).toBeGreaterThanOrEqual(1.0);
    }
  });

  it("design moment > max moment (impact applied)", () => {
    const r = calcLiveLoad({
      workName: "Test",
      spanLength: 8.0,
      slabWidth: 7.5,
      vehicleType: "ClassA",
      numLanes: 2,
    });
    expect(r.designMoment).toBeGreaterThan(r.maxMoment);
  });
});
