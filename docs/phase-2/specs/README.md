# docs/phase-2/specs/

Week specifications: the per-week statement of what is being built, what it is
verified against, and what would make it wrong.

A specification here is tier 1 (AUTHORITATIVE) in
`containment/ARTIFACT-TIERS.json`, which means two things:

- a gate **may** read it, because it is a contract rather than a description;
- therefore it may contain no placeholders and no unfalsifiable claims.
  `pnpm run gate:docs:strict` fails on a doubled-brace placeholder token, on a
  stub shorter than 200 bytes, or on a heading with nothing under it.

This directory is **no longer empty.** The twelve engineering specs E-01..E-12 were
placed here by the W00 enrichment pass, and each is owned by exactly one week — the
week whose method-parity work it describes — recorded in
[PATH-MANIFEST.json](../../../PATH-MANIFEST.json). Ownership, not authorship, is the
claim being made: the file exists now, and the week named beside it is the week that
closes against it.

| Spec | Method it fixes | Owning week |
| --- | --- | --- |
| [E-01-hydraulics.md](E-01-hydraulics.md) | cross-section, Manning, bed slope, regime width | W06A |
| [E-02-afflux.md](E-02-afflux.md) | Molesworth, obstruction build-up, AFL | W06A |
| [E-03-scour.md](E-03-scour.md) | scour and foundation depth | W06A |
| [E-04-deck-anchorage.md](E-04-deck-anchorage.md) | deck anchorage | W07 |
| [E-05-water-current.md](E-05-water-current.md) | water current and skew resolution | W07A |
| [E-06-pier-stability.md](E-06-pier-stability.md) | pier stability, 9 cases | W07 |
| [E-07-abutment-dirt-wall.md](E-07-abutment-dirt-wall.md) | abutment stability and dirt wall | W07A |
| [E-08-footing-vkraina.md](E-08-footing-vkraina.md) | footing pressure redistribution, moment, shear | W07 |
| [E-09-pier-cap-rebar.md](E-09-pier-cap-rebar.md) | pier cap and reinforcement | W07A |
| [E-10-live-load-matrix.md](E-10-live-load-matrix.md) | live load matrix | W07A |
| [E-11-drawing-bbs.md](E-11-drawing-bbs.md) | drawing and bar bending schedule | W08 |
| [E-12-boq-dpr.md](E-12-boq-dpr.md) | BOQ, measurement and DPR | W09A |

An empty directory with an explanation is honest; a directory of stubs that look like
specifications is how twelve weeks of prose happened. These are neither: they are
filled, and they carry the week that has to satisfy them. How they were placed, and
why the placement rule is "keep the guide's own paths", is recorded in
[docs/adr/0011-spec-corpus-placement.md](../../adr/0011-spec-corpus-placement.md).
