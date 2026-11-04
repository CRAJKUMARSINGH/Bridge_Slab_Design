<!-- docs/phase-2/INPUT-DICTIONARY.md (filled from _templates/INPUT-DICTIONARY.md, W01 T1.2) -->
# INPUT DICTIONARY

## Which contract this describes

There are **two** input contracts in the tree, and they are not the same object.
Conflating them is the defect this document exists to prevent.

| Contract | File | Fields | Status |
| --- | --- | --- | --- |
| **Runtime contract (live)** | `bridge-excel-generator/input-contract.ts` → `ProjectInputSchema` (Zod) | ~40 top-level + 3 nested objects | The one the CLI, API and `pipeline/run.ts` validate against. **This is the authority.** |
| Week-0 demo contract | `inputs/schema.json` (`bridge-input.v1`) | 13 variables | Attached demo workbook contract. Superseded by the runtime contract; kept for provenance. |

`inputs/schema.json` uses ids that **do not exist** in `ProjectInputSchema`
(`deckWidth`, `girderSpacing`, `numberOfGirders`, `concreteStrength`,
`deckThickness`, `liveLoadUdl`, `liveLoadPoint`, `secondMoment`,
`sectionModulus`, `alpha`, `correctionK3`). A field named in one and not the
other is not an alias — it is a different contract.

## Field table — runtime contract (`ProjectInputSchema`)

Legend for **Req**: R = required, O = optional. **Source cell** is `—` where the
TypeScript contract does not carry one; source cells for workbook-derived inputs
live in `docs/week-0/variables.json` and `inputs/variables.json`.

### Identity / metadata

| Field | Type | Unit | Range / rule | Source cell | IRC/IS ref | JSDoc | Req |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `projectName` | string | — | trimmed, min length 1 | — | — | no | R |
| `location` | string | — | trimmed, min length 1 | — | — | no | R |
| `riverName` | string | — | trimmed, min length 1 | — | — | no | R |
| `bridgeType` | string | — | trimmed | — | — | no | O |
| `jobNumber` | string | — | trimmed | — | — | no | O |
| `issuingAuthority` | string | — | trimmed | — | — | no | O |
| `hardRockAvailable` | boolean | — | true/false | — | — | no | O |

### Geometry

| Field | Type | Unit | Range / rule | Source cell | IRC/IS ref | JSDoc | Req |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `spanLength` | number | m | finite, > 0 | `Inputs!B3` (Span length L) | — | no | R |
| `numberOfSpans` | integer | — | > 0 | — | — | no | R |
| `numberOfLanes` | integer | — | > 0 | — | — | no | O |
| `carriageWidth` | number | m | finite, > 0 | — | — | no | R |
| `totalLength` | number | m | finite, > 0 **and** cross-field rule CF-1/CF-2 | — | — | no | R |
| `bridgeLength` | number | m | finite, > 0 | — | — | no | O |
| `bridgeWidth` | number | m | finite, > 0 | — | — | no | O |
| `skew` | number | deg | finite, `[0, 60)` (CF-10) | — | — | no | O |
| `deckSlabThickness` | number | m | finite, > 0; default `DEFAULT_DECK_SLAB_THICKNESS_M = 0.25` | — | — | yes (constant + `deckSlabThicknessOf`) | O |
| `deckSoffitLevel` | number | m | finite | — | — | no | O |
| `freeboardAboveHfl` | number | m | finite, ≥ 0 | — | — | no | O |

### `pierDesign` (optional object)

| Field | Type | Unit | Range / rule | Source cell | IRC/IS ref | JSDoc | Req |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `effectiveSpan` | number | m | finite, > 0 | — | — | no | O |
| `spanCC` | number | m | finite, > 0 | — | — | no | O |

### Water levels and hydraulics (top level)

| Field | Type | Unit | Range / rule | Source cell | IRC/IS ref | JSDoc | Req |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `hfl` | number | m | finite; must exceed `bedLevel` (CF-5) | — | — | no | R |
| `bedLevel` | number | m | finite | — | — | no | R |
| `foundationLevel` | number | m | finite; must be **below** `bedLevel` (CF-6) | — | — | no | R |
| `discharge` | number | m³/s | finite, ≥ 0 | — | — | no | R |
| `manningN` | number | — | finite, > 0 | — | — | no | R |
| `bedSlope` | number | 1-in-N | finite, `[1, 100000]` — the **denominator** of S = 1/N, not the gradient | — | — | yes (see below) | R |
| `laceysSiltFactor` | number | — | finite, > 0 | — | — | no | R |
| `crossSectionData` | array | — | min 2 of `{chainage: number, gl: number}`; chainages strictly increasing (CF-3) | — | — | no | R |
| `rtl` | number | m | finite; must exceed `agl` (CF-9) | — | — | no | R |
| `agl` | number | m | finite | — | — | no | R |
| `nbl` | number | m | finite; must be below `ofl` (CF-8) | — | — | no | R |
| `ofl` | number | m | finite; must not exceed `hfl` (CF-7) | — | — | no | R |
| `dwl` | number | m | finite | — | — | no | R |

**`bedSlope` JSDoc (verbatim intent):** N = 1500 means a fall of 1 m per 1500 m.
N < 1 would be steeper than 100 %; N > 100 000 is flatter than any surveyed
natural watercourse this tool is used on. Both are typos for the gradient form
(0.000667) rather than the 1-in-N form, and Manning would then return a velocity
~sqrt(1500) times out of scale.

### `hydraulics` (optional, `.partial()` — every field optional)

| Field | Type | Unit | Range / rule | Source cell | IRC/IS ref | JSDoc | Req |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `crossSectionalArea` | number | m² | finite, ≥ 0 | — | — | no | O |
| `wettedPerimeter` | number | m | finite, ≥ 0 | — | — | no | O |
| `hydraulicRadius` | number | m | finite, ≥ 0 | — | — | no | O |
| `velocity` | number | m/s | finite, ≥ 0 | — | — | no | O |
| `discharge` | number | m³/s | finite, ≥ 0 | — | — | no | O |
| `regimeWidth` | number | m | finite, ≥ 0 | — | — | no | O |
| `effectiveWaterway` | number | m | finite, ≥ 0 | — | — | no | O |
| `scourDepth` | number | m | finite, ≥ 0 | — | — | no | O |
| `designScourDepth` | number | m | finite, ≥ 0 | — | — | no | O |
| `afflux` | number | m | finite, ≥ 0 | — | — | no | O |
| `designWaterLevel` | number | m | finite | — | — | no | O |
| `hfl` | number | m | finite | — | — | no | O |
| `froudeNumber` | number | — | finite, ≥ 0 | — | — | no | O |
| `flowType` | string | — | free text | — | — | no | O |
| `foundationDepth` | number | m | finite, ≥ 0 | — | — | no | O |
| `foundationLevel` | number | m | finite | — | — | no | O |
| `soffitLevel` | number | m | finite | — | — | no | O |
| `freeboard` | number | m | finite, **signed — negative is valid** (see below) | — | — | yes | O |
| `freeboardAboveHfl` | number | m | finite | — | — | no | O |
| `ircMinimumFreeboardAboveHfl` | number | m | finite, ≥ 0 | — | IRC minimum freeboard (value not carried here) | no | O |
| `requiredFreeboardAboveHfl` | number | m | finite, ≥ 0 | — | — | no | O |
| `isFreeboardSafe` | boolean | — | true/false; the adequacy carrier | — | — | no | O |

**`freeboard` is deliberately signed.** Freeboard is measured upward from a water
level to the soffit, so a submersible crossing whose design water level rises
above the deck soffit is a designed-for-overtopping case, not bad data (the
small-bridge case: soffit 283.25 m against DWL 284.01 m). Adequacy is carried by
`isFreeboardSafe`, not by the sign.

### Sub-structure geometry

| Field | Type | Unit | Range / rule | Source cell | IRC/IS ref | JSDoc | Req |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `pierWidth` | number | m | finite, > 0 | — | — | no | R |
| `pierLength` | number | m | finite, > 0 | — | — | no | R |
| `pierDepth` | number | m | finite, > 0 | — | — | no | R |
| `numberOfPiers` | integer | — | ≥ 0; if > 0 must be < `numberOfSpans` (CF-4) | — | — | no | R |
| `pierBaseWidth` | number | m | finite, > 0 | — | — | no | R |
| `pierBaseLength` | number | m | finite, > 0 | — | — | no | R |
| `abutmentHeight` | number | m | finite, > 0 | — | — | no | R |
| `abutmentWidth` | number | m | finite, > 0 | — | — | no | R |
| `abutmentDepth` | number | m | finite, > 0 | — | — | no | R |
| `dirtWallHeight` | number | m | finite, ≥ 0 | — | — | no | R |
| `returnWallLength` | number | m | finite, ≥ 0 | — | — | no | R |

### Materials and soil

| Field | Type | Unit | Range / rule | Source cell | IRC/IS ref | JSDoc | Req |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `concreteGrade` | string | — | trimmed, min length 1 | — | — | no | R |
| `fck` | number | MPa | finite, > 0 | `Inputs!B7` (Concrete strength fck) | — | no | R |
| `steelGrade` | string | — | trimmed, min length 1; `FE415`/`FE500` trigger CF-11 | — | — | no | R |
| `fy` | number | MPa | finite, > 0; consistent with `steelGrade` (CF-11) | `Inputs!B8` (Steel grade fy) | — | no | R |
| `sbc` | number | kN/m² | finite, > 0 | — | — | no | R |
| `phi` | number | deg | finite, `[0, 50]` | — | — | no | R |
| `gamma` | number | kN/m³ | finite, > 0 | — | — | no | R |
| `concreteGradeFoundation` | string | — | trimmed | — | — | no | O |
| `concreteGradePier` | string | — | trimmed | — | — | no | O |
| `concreteGradeAbutment` | string | — | trimmed | — | — | no | O |
| `concreteGradeDeck` | string | — | trimmed | — | — | no | O |
| `concreteGradeWearing` | string | — | trimmed | — | — | no | O |

## Cross-field rules (`superRefine`, CF-1 … CF-11)

| Id | Rule | On violation |
| --- | --- | --- |
| CF-1 | `totalLength` ≥ `spanLength × numberOfSpans × 0.95` | issue on `totalLength`: "materially shorter than spanLength × numberOfSpans" |
| CF-2 | `totalLength` ≤ `spanLength × numberOfSpans × 1.10` | issue on `totalLength`: exceeds by more than 10 % |
| CF-3 | `crossSectionData` chainages strictly increasing | issue per offending index |
| CF-4 | `numberOfPiers` < `numberOfSpans` when `numberOfPiers` > 0 | issue on `numberOfPiers` |
| CF-5 | `hfl` > `bedLevel` | issue on `hfl` |
| CF-6 | `foundationLevel` < `bedLevel` | issue on `foundationLevel` |
| CF-7 | `ofl` ≤ `hfl` | issue on `ofl`. OFL **may equal** HFL (submersible crossing) |
| CF-8 | `nbl` < `ofl` | issue on `nbl` |
| CF-9 | `rtl` > `agl` | issue on `rtl` |
| CF-10 | `skew` ∈ `[0, 60)` deg | issue on `skew`: ≥ 60° needs non-standard analysis |
| CF-11 | `steelGrade` FE415 ⇒ \|`fy` − 415\| ≤ 1; FE500 ⇒ \|`fy` − 500\| ≤ 1 | issue on `fy` |

## IRC / IS references

The runtime input contract carries **no IRC/IS clause references on its fields** —
there is no `codeRef` on any input. Clause references live one layer up, on the
*results*: `CheckResult.codeRef` in `lib/engine/src/contracts.ts` (examples in that
file's comments: `"IRC:6-2017 cl.214.3"`), enforced by `verify:clauses`, which
fails if any `codeRef` is unregistered. Any input-level code citation in a
downstream document must trace to that registry, not to this table.

## JSDoc status

Of the fields above, only two carry explanatory JSDoc in
`input-contract.ts`: `deckSlabThickness` (via `DEFAULT_DECK_SLAB_THICKNESS_M` and
`deckSlabThicknessOf`) and `bedSlope` (via `bedSlopeDenominator`), plus the
signed-`freeboard` rationale inside the `hydraulics` block. The remaining ~60
fields have **no** JSDoc. Recording that gap is the point of the column: it is a
burn-down list, not a claim of completeness.

## Validation entry points

- `ProjectInputSchema.safeParse` — used by `pipeline/run.ts --input=…`
- `validateProjectInput(value)` — throws on invalid, returns `ProjectInput`
- `assertValidProjectInput(value)` — assertion signature
