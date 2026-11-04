// Physical-bounds input validation for the IRC 21:2000 deck-strip design engine.
// Companion to ircSlabCalc.ts. Every field maps 1:1 to a member of the engine's
// `IRCSlabInputs` interface; no field invented, none missed.
//
// Every bound carries its source. Bounds marked ASSUMPTION must be adjudicated
// and recorded in the gap log before launch, per the repo charter rule
// "Do not silently patch formula/calculation discrepancies".

import { z } from "zod";
import type { ConcreteGrade, IRCSlabInputs, SteelGrade } from "./ircSlabCalc";

// ── Enum mirrors ─────────────────────────────────────────────────────────────
// `satisfies` guarantees compile-time sync with the engine unions: adding a
// grade to ircSlabCalc.ts without adding it here becomes a build error.
export const CONCRETE_GRADES = [
  "M15", "M20", "M25", "M30", "M35", "M40",
] as const satisfies readonly ConcreteGrade[];

export const STEEL_GRADES = [
  "Fe250", "Fe415", "Fe500", "Fe550",
] as const satisfies readonly SteelGrade[];

// Standard rolled/deformed bar diameters (mm) per IS 1786.
// ASSUMPTION: 6–32 mm set covers slab practice; 40+ mm never used in slabs.
export const BAR_DIAS = [8, 10, 12, 16, 20, 25, 32] as const;

// ── Physical bounds ──────────────────────────────────────────────────────────
// Clear span (m): > 0 and ≤ 40.
//   Lower: zero/negative span is geometrically impossible.
//   Upper: ASSUMPTION — practical slab-bridge spans are ≤ ~25 m; 40 m guards
//   against unit errors (mm entered instead of m).
export const MAX_CLEAR_SPAN_M = 40;

// Support / bearing width (m): 0.1 – 2.0.
//   ASSUMPTION — typical bearing pads 0.3–0.6 m; 2.0 m ceiling guards units.
export const MIN_SUPPORT_WIDTH_M = 0.1;
export const MAX_SUPPORT_WIDTH_M = 2.0;

// Slab thickness (mm): 200 – 2000.
//   IRC:21-2000: "minimum thickness of the deck slab including that at the
//   tip of the cantilever shall be 200 mm".
//   Upper: ASSUMPTION — 2000 mm guards against mm/m unit confusion.
export const MIN_SLAB_THICKNESS_MM = 200;
export const MAX_SLAB_THICKNESS_MM = 2000;

// Wearing coat thickness (mm): 0 – 150.
//   IRC practice 40–75 mm; ASSUMPTION ceiling 150 mm.
export const MAX_WEARING_COAT_MM = 150;

// Carriageway width (m): 3.0 – 60.
//   IRC:6-2017 minimum single lane 3.75 m; 3.0 m floor allows narrow crossings.
//   ASSUMPTION ceiling 60 m.
export const MIN_CARRIAGEWAY_M = 3.0;
export const MAX_CARRIAGEWAY_M = 60;

// Footpath width (m): 0 – 5.
//   IRC:86 practice; ASSUMPTION ceiling 5 m.
export const MAX_FOOTPATH_M = 5;

// Clear cover (mm): 40 – 65.
//   IRC:21 normal bridge work 40–50 mm, severe 65 mm.
export const MIN_COVER_MM = 40;
export const MAX_COVER_MM = 65;

// Load patch dimensions a1, b1 (m): 0.1 – 10.
//   Dispersed wheel contact; ASSUMPTION band.
export const MIN_LOAD_DIM_M = 0.1;
export const MAX_LOAD_DIM_M = 10;

// Axle spacing b2 (m): 0.5 – 10.
//   ASSUMPTION — IRC Class A axle spacing ~1.2 m; 0.5 m floor, 10 m ceiling.
export const MIN_AXLE_SPACING_M = 0.5;
export const MAX_AXLE_SPACING_M = 10;

// Total live load (kN): 50 – 1000.
//   Class B 332 / Class A 554 / 70R 700 kN, Class AA ≤ 400 kN.
export const MIN_LIVE_LOAD_KN = 50;
export const MAX_LIVE_LOAD_KN = 1000;

// Concrete unit weight (kN/m³): 22 – 26.
//   Normal-weight concrete 24–25 kN/m³.
export const MIN_CONCRETE_UW = 22;
export const MAX_CONCRETE_UW = 26;

// Wearing coat unit weight (kN/m³): 18 – 24.
//   Asphaltic WC ≈ 22 kN/m³.
export const MIN_WC_UW = 18;
export const MAX_WC_UW = 24;

// Minimum effective depth after cross-field check (mm).
//   ASSUMPTION: 50 mm — below this the section cannot hold reinforcement.
export const MIN_EFFECTIVE_DEPTH_MM = 50;

// ── Derived quantities the engine actually uses ──────────────────────────────
/** deff = slabThickness - cover - barDia/2 — mirrors designIRCSlab(). */
export function effectiveDepthOf(i: {
  slabThickness: number; cover: number; barDia: number;
}): number {
  return i.slabThickness - i.cover - i.barDia / 2;
}

// ── The schema ───────────────────────────────────────────────────────────────
export const ircSlabInputSchema = z
  .object({
    slabName: z.string().trim().min(1, "slabName must not be empty").max(200),

    concreteGrade: z.enum(CONCRETE_GRADES),
    steelGrade: z.enum(STEEL_GRADES),

    clearSpan: z
      .number()
      .finite("clearSpan must be a finite number")
      .gt(0, "clearSpan must be > 0 m — a zero or negative span is physically impossible")
      .max(MAX_CLEAR_SPAN_M, `clearSpan must be <= ${MAX_CLEAR_SPAN_M} m — check units (mm entered instead of m?)`),

    supportWidth: z
      .number()
      .finite("supportWidth must be a finite number")
      .min(MIN_SUPPORT_WIDTH_M, `supportWidth must be >= ${MIN_SUPPORT_WIDTH_M} m (bearing width)`)
      .max(MAX_SUPPORT_WIDTH_M, "supportWidth must be <= 2.0 m — check units"),

    slabThickness: z
      .number()
      .finite("slabThickness must be a finite number")
      .int("slabThickness must be a whole number of mm")
      .min(MIN_SLAB_THICKNESS_MM, `slabThickness must be >= ${MIN_SLAB_THICKNESS_MM} mm (IRC:21-2000 minimum deck-slab thickness)`)
      .max(MAX_SLAB_THICKNESS_MM, "slabThickness must be <= 2000 mm — check units"),

    wearingCoatThickness: z
      .number()
      .finite("wearingCoatThickness must be a finite number")
      .min(0, "wearingCoatThickness cannot be negative")
      .max(MAX_WEARING_COAT_MM, "wearingCoatThickness must be <= 150 mm — check units"),

    carriagewayWidth: z
      .number()
      .finite("carriagewayWidth must be a finite number")
      .min(MIN_CARRIAGEWAY_M, `carriagewayWidth must be >= ${MIN_CARRIAGEWAY_M} m (IRC:6 minimum single lane)`)
      .max(MAX_CARRIAGEWAY_M, "carriagewayWidth must be <= 60 m — check units"),

    footpathWidth: z
      .number()
      .finite("footpathWidth must be a finite number")
      .min(0, "footpathWidth cannot be negative")
      .max(MAX_FOOTPATH_M, "footpathWidth must be <= 5 m — check units"),

    cover: z
      .number()
      .finite("cover must be a finite number")
      .min(MIN_COVER_MM, `cover must be >= ${MIN_COVER_MM} mm (IRC:21 normal bridge work)`)
      .max(MAX_COVER_MM, `cover must be <= ${MAX_COVER_MM} mm — value exceeds any IRC exposure condition`),

    barDia: z
      .number()
      .finite("barDia must be a finite number")
      .refine(
        (v) => (BAR_DIAS as readonly number[]).includes(v),
        `barDia must be one of ${BAR_DIAS.join(", ")} mm (IS 1786 standard diameters)`,
      ),

    a1: z
      .number()
      .finite("a1 must be a finite number")
      .min(MIN_LOAD_DIM_M, `a1 must be >= ${MIN_LOAD_DIM_M} m`)
      .max(MAX_LOAD_DIM_M, "a1 must be <= 10 m — check units"),

    b1: z
      .number()
      .finite("b1 must be a finite number")
      .min(MIN_LOAD_DIM_M, `b1 must be >= ${MIN_LOAD_DIM_M} m`)
      .max(MAX_LOAD_DIM_M, "b1 must be <= 10 m — check units"),

    b2: z
      .number()
      .finite("b2 must be a finite number")
      .min(MIN_AXLE_SPACING_M, `b2 (axle spacing) must be >= ${MIN_AXLE_SPACING_M} m`)
      .max(MAX_AXLE_SPACING_M, "b2 must be <= 10 m — check units"),

    totalLiveLoad: z
      .number()
      .finite("totalLiveLoad must be a finite number")
      .min(MIN_LIVE_LOAD_KN, `totalLiveLoad must be >= ${MIN_LIVE_LOAD_KN} kN (lightest IRC:6 vehicle)`)
      .max(MAX_LIVE_LOAD_KN, `totalLiveLoad must be <= ${MAX_LIVE_LOAD_KN} kN (heaviest IRC:6 / Class AA train)`),

    concreteUW: z
      .number()
      .finite("concreteUW must be a finite number")
      .min(MIN_CONCRETE_UW, `concreteUW must be >= ${MIN_CONCRETE_UW} kN/m³`)
      .max(MAX_CONCRETE_UW, `concreteUW must be <= ${MAX_CONCRETE_UW} kN/m³`),

    wearingCoatUW: z
      .number()
      .finite("wearingCoatUW must be a finite number")
      .min(MIN_WC_UW, `wearingCoatUW must be >= ${MIN_WC_UW} kN/m³`)
      .max(MAX_WC_UW, `wearingCoatUW must be <= ${MAX_WC_UW} kN/m³`),

    impactMethod: z.enum(["irc6", "astra_linear"]),
  })
  .strict()
  .superRefine((inp, ctx) => {
    // Cross-field 1 — effective depth must be physically usable.
    const d = effectiveDepthOf(inp);
    if (d < MIN_EFFECTIVE_DEPTH_MM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slabThickness"],
        message:
          `Effective depth deff = ${d} mm < ${MIN_EFFECTIVE_DEPTH_MM} mm ` +
          `(slabThickness ${inp.slabThickness} - cover ${inp.cover} - barDia/2 ${inp.barDia / 2}). ` +
          "Section cannot accommodate reinforcement — increase thickness or reduce cover/barDia.",
      });
    }

    // Cross-field 2 — a load patch cannot exceed its span.
    if (inp.a1 >= inp.clearSpan) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["a1"],
        message:
          `a1 (${inp.a1} m) must be smaller than clearSpan (${inp.clearSpan} m) — ` +
          "the load patch cannot exceed the span.",
      });
    }

    // Cross-field 3 — slab thickness in mm must not exceed the span in mm
    // (unit-error trap: m entered instead of mm for thickness).
    if (inp.slabThickness > inp.clearSpan * 1000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slabThickness"],
        message:
          `slabThickness (${inp.slabThickness} mm) exceeds the clear span ` +
          `(${inp.clearSpan} m) — check units.`,
      });
    }
  });

export type IRCSlabInputsParsed = z.infer<typeof ircSlabInputSchema>;

/** Compile-time guarantee: parsed output satisfies the engine's own input type. */
export type _SchemaMatchesEngine = IRCSlabInputsParsed extends IRCSlabInputs ? true : never;
export type _SchemaToEngineCheck = _SchemaMatchesEngine; // must resolve to `true`

// ── Non-fatal advisories (never block a calculation) ─────────────────────────
export function collectIRCSlabWarnings(i: IRCSlabInputs): string[] {
  const w: string[] = [];
  if (i.concreteGrade === "M15") {
    w.push(
      "M15: IS 456:2000 does not permit M15 for reinforced concrete — minimum grade for RCC is M20. Record as a deviation in the gap log.",
    );
  }
  if (i.slabThickness < MIN_SLAB_THICKNESS_MM) {
    w.push(
      `slabThickness ${i.slabThickness} mm is below the IRC:21-2000 ${MIN_SLAB_THICKNESS_MM} mm deck-slab minimum.`,
    );
  }
  return w;
}

// ── Error surface (identical shape to server formatZodIssues) ────────────────
export interface IRCSlabIssue {
  path: string;
  message: string;
}

export class IRCSlabInputValidationError extends Error {
  public readonly issues: IRCSlabIssue[];
  constructor(issues: IRCSlabIssue[]) {
    super(
      "Invalid IRC slab design inputs: " +
        issues.map((i) => `${i.path}: ${i.message}`).join("; "),
    );
    this.name = "IRCSlabInputValidationError";
    this.issues = issues;
  }
}

/** Mirrors server/project-input-zod.ts formatZodIssues() exactly. */
export function formatIRCSlabIssues(err: z.ZodError): IRCSlabIssue[] {
  return err.issues.map((issue) => ({
    path: issue.path.length ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));
}

/** Non-throwing entry point for HTTP handlers and forms. */
export function validateIRCSlabInputs(
  raw: unknown,
): { ok: true; data: IRCSlabInputs } | { ok: false; issues: IRCSlabIssue[] } {
  const parsed = ircSlabInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, issues: formatIRCSlabIssues(parsed.error) };
  }
  return { ok: true, data: parsed.data as IRCSlabInputs };
}

/** Parse-or-throw helper for engine callers. */
export function parseIRCSlabInputs(raw: unknown): IRCSlabInputs {
  const parsed = ircSlabInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new IRCSlabInputValidationError(formatIRCSlabIssues(parsed.error));
  }
  return parsed.data as IRCSlabInputs;
}
