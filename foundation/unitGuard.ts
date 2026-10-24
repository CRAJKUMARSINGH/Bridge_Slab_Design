/**
 * F4b — Plausibility ranges. Catches mm/m and kPa/MPa slips, which currently pass
 * silently because nothing bounds-checks engine inputs.
 */
export const UNIT_RANGES: Record<string, [number, number]> = {
  spanLength_m: [1, 300],
  slabThickness_mm: [80, 3000],
  deckWidth_m: [1, 60],
  carriageWidth_m: [2, 30],
  concreteGrade_fck_MPa: [15, 80],
  steelGrade_fy_MPa: [200, 700],
  sbc_kPa: [20, 3000],
  discharge_cumecs: [0.01, 200000],
  manningN: [0.008, 0.2],
  lx_m: [0.5, 100],
  ly_m: [0.5, 100],
  cover_mm: [10, 100],
  barDia_mm: [6, 40],
  liveLoad_kNm2: [0.5, 100],
  floorFinish_kNm2: [0, 20],
};

export function assertUnit(name: keyof typeof UNIT_RANGES | string, value: number): void {
  const r = UNIT_RANGES[name as keyof typeof UNIT_RANGES];
  if (!r) return;
  if (!Number.isFinite(value) || value < r[0] || value > r[1]) {
    throw new Error(
      `[units] ${name} = ${value} outside plausible [${r[0]}, ${r[1]}] — probable unit slip`
    );
  }
}
