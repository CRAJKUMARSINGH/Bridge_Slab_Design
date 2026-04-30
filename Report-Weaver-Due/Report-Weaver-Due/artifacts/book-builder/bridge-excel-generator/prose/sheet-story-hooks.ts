/**
 * One sheet, one storyline: each registry sheet opens with its governing phenomenon.
 * Do not paste footing stress (P = V/A ± Mx/Zxx ± My/Zyy) into hydraulic, traffic, or serviceability sheets.
 * @see NARRATE A DREAM.MD
 */

export const SHEET_STORY_LEAD: Record<string, string> = {
  'hydraulic-discharge':
    'STORY — Discharge is the opening chapter: we fix how much water passes the bridge at the design flood before any opening, scour, or deck level is argued. Governing idea: continuity and channel conveyance (IRC SP-13), not member stress.',
  'hydraulic-waterway':
    'STORY — Linear waterway is about whether the bridge opening “fits the river”: regime width versus the waterway we actually provide. Governing idea: hydraulic adequacy and contraction risk, not concrete flexure.',
  'hydraulic-scour':
    'STORY — Scour asks where the bed will erode around piers and abutments so foundations are not undermined. Governing idea: sediment transport and design scour depth (IRC:78 family), not slab shear.',
  'hydraulic-afflux':
    'STORY — Afflux is the backup head from the bridge obstruction; it sets the true flood level at the deck. Governing idea: backwater / Molesworth-style afflux (IS:7784), not bearing pressure on soil.',
  'hydraulic-summary':
    'STORY — The hydraulic summary locks one consistent set of levels (HFL, afflux, velocities) for the whole job. Governing idea: cross-check that every downstream sheet reads the same hydraulic basis.',
  'load-deadload':
    'STORY — Dead load is the permanent weight story: deck, surfacing, kerbs, and substructure self-weight that never leave the structure. Governing idea: mass and static equilibrium, before live traffic.',
  'load-liveload-classA':
    'STORY — Class A is the standard highway train story: axle groups, lane placement, and patch dispersion through the deck. Governing idea: IRC:6 traffic modelling and influence of load position on M and V.',
  'load-liveload-70R':
    'STORY — 70R wheeled is the heavy special vehicle story, often governing short spans or local effects. Governing idea: compare and envelope with Class A per IRC:6 Cl.204.',
  'load-impact':
    'STORY — Impact is the dynamic bump that moving traffic adds to static axle loads. Governing idea: IRC:6 Cl.208 fraction versus span, tied to the same strip model as the deck.',
  'load-braking':
    'STORY — Braking and tractive force is the longitudinal “push–pull” at bearings from accelerating or decelerating traffic. Governing idea: IRC:6 Cl.214 horizontal at deck level, resisted by piers/abutments and sliding capacity—not the same as water drag.',
  'load-wind':
    'STORY — Wind is the lateral environmental load on exposed pier, parapet, and superstructure area above water. Governing idea: IS:875 pressure × projected area × lever arm; combined with flood cases only where the code requires.',
  'load-seismic':
    'STORY — Seismic is the inertia story: equivalent lateral forces from ground motion on deck and pier mass, plus dynamic earth pressure on abutments. Governing idea: IS:1893 spectrum and IRC:6 Cl.219 combinations—not a substitute for hydraulic discharge.',
  'load-watercurrent':
    'STORY — Water current is drag and hydrostatic push on submerged pier faces during flood. Governing idea: IRC:6 Cl.213 fluid pressure and velocity head—not braking from vehicles.',
  'slab-transverse':
    'STORY — Transverse deck design is the bending story across the carriageway: IRC strip effective width, dead and live moments, and main steel. Governing idea: flexure and permissible stresses in bending, IRC 21 / IS 456.',
  'slab-longitudinal':
    'STORY — Longitudinal deck behaviour covers continuity, temperature, shrinkage, and tie forces between spans. Governing idea: minimum steel and detailing—not repeating transverse moment unless a longitudinal beam governs.',
  'slab-shear':
    'STORY — Shear near supports asks whether concrete can carry diagonal tension without web reinforcement. Governing idea: IS 456 Cl.40 nominal shear versus ?c, for the strip width that carries wheel paths.',
  'slab-deflection':
    'STORY — Deflection is the stiffness story for rider comfort and clearance: span-to-depth and long-term effects. Governing idea: IS 456 Cl.23.2 serviceability limits, not ultimate bearing on soil.',
  'slab-wearingcoat':
    'STORY — Wearing course is the sacrificial protection and extra dead load on the deck. Governing idea: thickness, unit weight, and dispersion of wheel patches through the surfacing.',
  'slab-approach':
    'STORY — Approach slab is the transition from embankment to abutment bearing: settlement differential and surcharge. Governing idea: one-way slab on elastic support / fill reaction—not pier footing stress.',
  'pier-cap':
    'STORY — Pier cap is the transfer girder that spreads bearing reactions into the pier shaft. Governing idea: deep beam or corbel shear–tie paths, punching if applicable, IS 456—not river afflux.',
  'pier-stem-gravity':
    'STORY — Gravity stem check is axial compression under self-weight before lateral loads dominate. Governing idea: average stress in pier concrete versus permissible compression—still not the full P/A ± M/Z footing diagram.',
  'pier-stem-long':
    'STORY — Longitudinal actions combine deck braking, temperature, and continuity thrust with vertical load on the pier. Governing idea: axial–flexural interaction on the pier section (P/A ± M/Z style on the *stem* where appropriate)—only here because longitudinal bending is the subject.',
  'pier-stem-wind':
    'STORY — Wind on pier is lateral pressure on the pier exposed height. Governing idea: wind resultant × lever arm to foundation for overturning couple with other lateral cases.',
  'pier-stem-seismic':
    'STORY — Seismic pier check is lateral inertia of pier mass plus deck reactions with appropriate load factors. Governing idea: ductile detailing assumptions and combination rules—not hydraulic Froude number.',
  'pier-stem-wcurrent':
    'STORY — Current on pier combines drag on the pier nose and hydrostatic distribution over submerged depth. Governing idea: flood velocity and water level from hydraulics, Cl.213-type resultants.',
  'pier-foundation':
    'STORY — Pier foundation is where superstructure loads enter the ground: footing shear, punching, and flexure. Governing idea: spread footing or pile cap per IS 456 / IS 2911—not afflux formula.',
  'pier-buoyancy':
    'STORY — Buoyancy is the uplift story when the pier is submerged: water pressure on footing and displaced volume. Governing idea: net downward load after uplift versus flotation safety.',
  'abut-cap':
    'STORY — Abutment cap spreads girder reactions and resists local burst from bearings. Governing idea: beam shear–flexure like pier cap, with earth-pressure–induced moments at the stem junction.',
  'abut-stem-ep':
    'STORY — Earth pressure is the soil push on the abutment backwall. Governing idea: Rankine or equivalent active coefficient, thrust height, and overturning about the toe.',
  'abut-stem-surcharge':
    'STORY — Live-load surcharge adds equivalent soil height behind the wall from traffic on the approach. Governing idea: IRC:6 surcharge rules added to static earth pressure.',
  'abut-stem-dl':
    'STORY — Abutment dead load is the weight story of stem, footing, and dirt wall providing restoring moment against earth pressure. Governing idea: vertical load path and centroid—not wind on pier.',
  'abut-stem-seismic':
    'STORY — Seismic abutment adds dynamic increment to earth pressure (Mononobe–Okabe class). Governing idea: horizontal seismic coefficient with soil–structure interaction approximations.',
  'abut-foundation':
    'STORY — Abutment footing spreads vertical and moment reactions into the founding stratum. Governing idea: eccentricity, punching, and two-way shear—not Class A wheel patch dispersion.',
  'abut-stability-ot':
    'STORY — Overturning is the tipping story: restoring weight versus overturning from earth and live loads about the toe. Governing idea: factor of safety against rotation (IRC:78 style limits).',
  'abut-stability-sl':
    'STORY — Sliding is the friction story: horizontal driving force versus ?N at the base. Governing idea: FOS against sliding along the foundation interface.',
  'ww-left':
    'STORY — Left wing wall retains fill at the abutment side with a cantilever stem. Governing idea: lateral earth pressure and cantilever moment like a retaining wall slice.',
  'ww-right':
    'STORY — Right wing wall is the mirror retainment story for the opposite approach geometry. Governing idea: same mechanics as the left wing with independent reinforcement schedule.',
  'rw-return':
    'STORY — Return wall ties the wing to the embankment and resists longitudinal fill pressure. Governing idea: three-sided retaining action and construction joints at abutment corners.',
  'rw-toe':
    'STORY — Toe protection resists local scour and erosion at the abutment toe. Governing idea: hydraulic scour depth versus buried protection level—not elastomer shear strain.',
  'stab-pier-ot':
    'STORY — Pier overturning stability compares restoring moment from weight to overturning from lateral loads about the footing edge. Governing idea: global equilibrium FOSot.',
  'stab-pier-sl':
    'STORY — Pier sliding stability compares horizontal drive to frictional resistance at the footing base. Governing idea: FOSsl with credible ? and vertical reaction.',
  'stab-pier-bearing':
    'STORY — Pier bearing on soil compares contact pressure to allowable SBC with eccentricity. Governing idea: P = V/A ± Mx/Zxx ± My/Zyy (or Meyerhof-type limits) **where foundation contact stress is the actual subject**.',
  'stab-abut-bearing':
    'STORY — Abutment bearing compares average and edge pressures to SBC including eccentricity and tilt. Governing idea: footing contact stress envelope from all load cases.',
  'stab-settlement':
    'STORY — Settlement estimates service movement of the foundation under net bearing pressure. Governing idea: elastic or consolidation settlement (IS:8009 style)—not slab punching perimeter.',
  'check-crackwidth':
    'STORY — Crack width is the durability story under service steel stress and bond. Governing idea: IS 456 Annex F spacing and stress limits—not overturning FOS.',
  'check-shear-deck':
    'STORY — Consolidated deck shear check re-states support shear versus concrete ?c for audit sign-off. Governing idea: same strip as Sheets 14–16, explicit ?v versus ?c.',
  'check-punching':
    'STORY — Punching is localized two-way shear around a concentrated wheel patch. Governing idea: IS 456 Cl.31.6 perimeter and stress cap—not regime waterway width.',
  'check-deflection':
    'STORY — Deflection summary re-states service span/depth for the whole deck strip audit trail. Governing idea: user comfort and clearance, Cl.23.2.',
  'bearing-pad':
    'STORY — Elastomeric bearing is the thin interface that carries reaction, rotation, and movement. Governing idea: average compression and shape factor per IRC:83 Part II—not earth pressure Ka.',
  'expansion-joint':
    'STORY — Expansion joint reserves gap for thermal, shrinkage, and creep movement of the deck system. Governing idea: cumulative movement from length and coefficients—not shear stress in concrete.',
};

export function withSheetStory(sheetId: string, body: string): string {
  const lead =
    SHEET_STORY_LEAD[sheetId] ??
    `STORY — Sheet “${sheetId}”: follow the workbook title and code reference on the index; governing checks are specific to that topic—do not assume footing stress is the narrative unless the sheet is foundation or stability.`;
  return `${lead}\n\n${body.trim()}`;
}
