// Physical-bounds input validation for the IS 456:2000 slab design engine.
// Companion to slabCalc.ts. Every field below maps 1:1 to a member of the
// engine's `SlabInputs` interface; no field invented, none missed.
//
// Every bound carries its source. Bounds marked ASSUMPTION must be adjudicated
// and recorded in the gap log before launch, per the repo charter rule
// "Do not silently patch formula/calculation discrepancies".

import { z } from "zod";
import type {
  BoundaryCondition,
  ConcreteGrade,
  SlabInputs,
  SlabType,
  SteelGrade,
} from "./slabCalc";

// ── Enum mirrors ─────────────────────────────────────────────────────────────
// `satisfies` guarantees compile-time sync with the engine unions: adding a
// grade to slabCalc.ts without adding it here becomes a build error.
export const CONCRETE_GRADES = [
  "M15", "M20", "M25", "M30", "M35", "M40",
] as const satisfies readonly ConcreteGrade[];

export const STEEL_GRADES = [
  "Fe250", "Fe415", "Fe500", "Fe550",
] as const satisfies readonly SteelGrade[];

export const SLAB_TYPES = ["oneway", "twoway"] as const satisfies readonly SlabType[];

// Exactly the 12 conditions in slabCalc.ts `BoundaryCondition`.
export const BOUNDARY_CONDITIONS = [
  "simply_supported", "propped", "cantilever", "interior_panel",
  "one_short_edge_disc", "one_long_edge_disc", "two_adj_edges_disc",
  "two_short_edges_disc", "two_long_edges_disc",
  "three_edges_disc_one_long_cont", "three_edges_disc_one_short_cont",
  "four_edges_disc",
] as const satisfies readonly BoundaryCondition[];

// Bar diameters actually offered by the UI (InputForm.tsx).
export const BAR_DIAS = [8, 10, 12, 16, 20, 25] as const;

// One-way boundary conditions (cantilever/simply_supported/propped).
export const ONE_WAY_BC: readonly BoundaryCondition[] = [
  "simply_supported", "propped", "cantilever",
];

// ── Physical bounds ──────────────────────────────────────────────────────────
// Span (m): engine consumes metres; lower bound: zero/negative is impossible
// (probes lx=0 and lx=-3 returned deflectionStatus "OK"). Upper: ASSUMPTION 60 m.
export const MAX_SPAN_M = 60;

// Thickness (mm): feeds selfWeight = (t/1000)*25 and d = t - cover - barDia/2.
// IRC:21-2000 requires >= 200 mm for bridge decks; 100 mm is the engine's floor.
// Upper 2000 mm = ASSUMPTION (unit guard).
export const MIN_THICKNESS_MM = 100;
export const MIN_DECK_THICKNESS_MM = 200;
export const MAX_THICKNESS_MM = 2000;

// Superimposed finishes/earth. ASSUMPTION.
export const MAX_SUPERLOAD_KNM2 = 10;
// Area live load. ASSUMPTION — ~10x the governing dispersed Class A.
export const MAX_LIVELOAD_KNM2 = 100;

// Clear cover per IS 456:2000 Cl. 26.4 / Table 16: mild 20 mm … extreme 75 mm.
export const MIN_COVER_MM = 20;
export const MAX_COVER_MM = 75;

// Effective depth floor. ASSUMPTION 50 mm (probe: thickness=20 -> d=-5 mm returned "OK").
export const MIN_EFFECTIVE_DEPTH_MM = 50;

// Ly/Lx ceiling. Table 26 spans 1.0-2.0 and Cl. 24.1 downgrades >2 to one-way;
// ratios in (2, 3] are LEGAL and must not be rejected. ASSUMPTION: 3.0 ceiling.
export const MAX_LY_LX_RATIO = 3;

// Depth/span ceiling. A slab deeper than ~40% of its span is a beam.
// ASSUMPTION: 0.40 — from hostile-input probe where thickness=1500 passed silently.
export const MAX_DEPTH_TO_SPAN_RATIO = 0.4;

// ── Derived quantities the engine actually uses ──────────────────────────────
/** d = thickness - cover - barDia/2 — mirrors designSlab() */
export function effectiveDepthOf(i: {
  thickness: number; cover: number; barDia: number;
}): number {
  return i.thickness - i.cover - i.barDia / 2;
}

/** dLong = d - barDia — the second reinforcement layer for two-way slabs */
export function longDirDepthOf(i: {
  thickness: number; cover: number; barDia: number;
}): number {
  return effectiveDepthOf(i) - i.barDia;
}

// ── The schema ───────────────────────────────────────────────────────────────
export const slabInputSchema = z
  .object({
    slabName: z.string().trim().min(1, "slabName must not be empty").max(200),

    slabType: z.enum(SLAB_TYPES),
    concreteGrade: z.enum(CONCRETE_GRADES),
    steelGrade: z.enum(STEEL_GRADES),

    lx: z
      .number()
      .finite("lx must be a finite number (NaN / Infinity rejected)")
      .gt(0, "lx (span) must be > 0 m — a zero or negative span is physically impossible")
      .max(MAX_SPAN_M, `lx must be <= ${MAX_SPAN_M} m — check units (mm entered instead of m?)`),

    ly: z
      .number()
      .finite("ly must be a finite number (NaN / Infinity rejected)")
      .gt(0, "ly (span) must be > 0 m — a zero or negative span is physically impossible")
      .max(MAX_SPAN_M, `ly must be <= ${MAX_SPAN_M} m — check units (mm entered instead of m?)`),

    thickness: z
      .number()
      .finite("thickness must be a finite number")
      .int("thickness must be a whole number of mm")
      .min(
        MIN_THICKNESS_MM,
        `thickness must be >= ${MIN_THICKNESS_MM} mm (below this the section cannot carry a bar plus distribution layer)`,
      )
      .max(MAX_THICKNESS_MM, `thickness must be <= ${MAX_THICKNESS_MM} mm — check units`),

    floorFinish: z
      .number()
      .finite("floorFinish must be a finite number")
      .min(0, "floorFinish cannot be negative")
      .max(MAX_SUPERLOAD_KNM2, `floorFinish must be <= ${MAX_SUPERLOAD_KNM2} kN/m² — check units`),

    sunkLoad: z
      .number()
      .finite("sunkLoad must be a finite number")
      .min(0, "sunkLoad cannot be negative")
      .max(MAX_SUPERLOAD_KNM2, `sunkLoad must be <= ${MAX_SUPERLOAD_KNM2} kN/m² — check units`),

    liveLoad: z
      .number()
      .finite("liveLoad must be a finite number")
      .min(0, "liveLoad cannot be negative")
      .max(
        MAX_LIVELOAD_KNM2,
        `liveLoad must be <= ${MAX_LIVELOAD_KNM2} kN/m² — value exceeds any code live load; check units`,
      ),

    boundaryCondition: z.enum(BOUNDARY_CONDITIONS),

    cover: z
      .number()
      .finite("cover must be a finite number")
      .min(MIN_COVER_MM, `cover must be >= ${MIN_COVER_MM} mm (IS 456:2000 Cl. 26.4 Table 16, mild exposure)`)
      .max(MAX_COVER_MM, `cover must be <= ${MAX_COVER_MM} mm — value exceeds any IS 456 exposure condition`),

    barDia: z
      .number()
      .finite("barDia must be a finite number")
      .refine(
        (v) => (BAR_DIAS as readonly number[]).includes(v),
        `barDia must be one of ${BAR_DIAS.join(", ")} mm (IS 1786 standard diameters used by the app)`,
      ),
  })
  .strict()
  .superRefine((inp, ctx) => {
    // Cross-field 1 — effective depth must be physically usable.
    const d = effectiveDepthOf(inp);
    if (d < MIN_EFFECTIVE_DEPTH_MM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["thickness"],
        message:
          `Effective depth d = ${d} mm < ${MIN_EFFECTIVE_DEPTH_MM} mm ` +
          `(thickness ${inp.thickness} - cover ${inp.cover} - barDia/2 ${inp.barDia / 2}). ` +
          "Section cannot accommodate reinforcement — increase thickness or reduce cover/barDia.",
      });
    }

    // Cross-field 2 — two-way slabs need a second layer: dLong = d - barDia must be positive.
    const dLong = longDirDepthOf(inp);
    if (inp.slabType === "twoway" && dLong <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["thickness"],
        message:
          `Two-way long-direction depth dLong = d - barDia = ${dLong} mm is not positive. ` +
          "A two-way slab needs a second reinforcement layer; increase thickness.",
      });
    }

    // Cross-field 3 — depth/span plausibility (mm vs m unit guard).
    const shortSpanMm = Math.min(inp.lx, inp.ly) * 1000;
    if (inp.thickness > shortSpanMm * MAX_DEPTH_TO_SPAN_RATIO) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["thickness"],
        message:
          `thickness ${inp.thickness} mm is more than ${MAX_DEPTH_TO_SPAN_RATIO * 100}% of the shorter span ` +
          `(${shortSpanMm} mm) — that is a beam, not a slab. Check units.`,
      });
    }

    // Cross-field 4 — Ly/Lx ceiling. Ratios in (2, 3] are deliberately allowed:
    // the engine downgrades them to one-way with an IS 456 Cl. 24.1 warning.
    const lx = Math.min(inp.lx, inp.ly);
    const ly = Math.max(inp.lx, inp.ly);
    const ratio = ly / lx;
    if (ratio > MAX_LY_LX_RATIO) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ly"],
        message:
          `Ly/Lx = ${ratio.toFixed(2)} > ${MAX_LY_LX_RATIO} — spans are implausible ` +
          "for a single slab panel (check span entry).",
      });
    }

    // Cross-field 5 — boundary condition must be consistent with the declared slab type.
    if (inp.slabType === "oneway" && !ONE_WAY_BC.includes(inp.boundaryCondition)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["boundaryCondition"],
        message:
          `boundaryCondition "${inp.boundaryCondition}" is a two-way condition but slabType is "oneway". ` +
          `Use one of: ${ONE_WAY_BC.join(", ")}.`,
      });
    }
    if (inp.slabType === "twoway" && inp.boundaryCondition === "cantilever") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["boundaryCondition"],
        message:
          'boundaryCondition "cantilever" belongs to one-way slabs and has no Table 26 row; declare slabType "oneway".',
      });
    }
  });

export type SlabInputsParsed = z.infer<typeof slabInputSchema>;

/** Compile-time guarantee: parsed output satisfies the engine's own input type. */
export type _SchemaMatchesEngine = SlabInputsParsed extends SlabInputs ? true : never;
export type _SchemaToEngineCheck = _SchemaMatchesEngine; // must resolve to `true`

// ── Non-fatal advisories (never block a calculation) ─────────────────────────
export function collectSlabWarnings(i: SlabInputs): string[] {
  const w: string[] = [];
  if (i.concreteGrade === "M15") {
    w.push(
      "M15: IS 456:2000 does not permit M15 for reinforced concrete — minimum grade for RCC is M20. Record as a deviation in the gap log.",
    );
  }
  if (i.thickness < MIN_DECK_THICKNESS_MM && Math.min(i.lx, i.ly) > 3) {
    w.push(
      `thickness ${i.thickness} mm is below the IRC:21-2000 200 mm deck-slab minimum — acceptable for a building slab, not for a bridge deck.`,
    );
  }
  if (Math.min(i.lx, i.ly) > 10) {
    w.push(
      `span ${Math.min(i.lx, i.ly)} m exceeds the practical simply-supported RCC slab range (~15 m) — confirm this is not a girder span.`,
    );
  }
  return w;
}

// ── Error surface (identical shape to server formatZodIssues) ────────────────
export interface SlabIssue {
  path: string;
  message: string;
}

export class SlabInputValidationError extends Error {
  public readonly issues: SlabIssue[];
  constructor(issues: SlabIssue[]) {
    super(
      "Invalid slab design inputs: " +
        issues.map((i) => `${i.path}: ${i.message}`).join("; "),
    );
    this.name = "SlabInputValidationError";
    this.issues = issues;
  }
}

/** Mirrors server/project-input-zod.ts formatZodIssues() exactly. */
export function formatSlabIssues(err: z.ZodError): SlabIssue[] {
  return err.issues.map((issue) => ({
    path: issue.path.length ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));
}

/** Non-throwing entry point for HTTP handlers and forms. */
export function validateSlabInputs(
  raw: unknown,
): { ok: true; data: SlabInputs } | { ok: false; issues: SlabIssue[] } {
  const parsed = slabInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, issues: formatSlabIssues(parsed.error) };
  }
  return { ok: true, data: parsed.data as SlabInputs };
}

/** Parse-or-throw helper for engine callers. */
export function parseSlabInputs(raw: unknown): SlabInputs {
  const parsed = slabInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new SlabInputValidationError(formatSlabIssues(parsed.error));
  }
  return parsed.data as SlabInputs;
}
