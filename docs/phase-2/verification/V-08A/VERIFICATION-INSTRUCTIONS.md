<!-- V-08A/VERIFICATION-INSTRUCTIONS.md -->
# V-08A — VERIFY DRAWINGS
Re-run: verify:dxf.
Falsify: F-19 (inject an undeclared layer), plus: delete a dimension entity and
confirm the gate goes red.
Then OPEN the artifacts, not just validate them:
  - open 3 DXFs in a real viewer and confirm they are legible and correctly scaled
  - confirm every case has a stress diagram, for both pier and abutment
  - confirm TYPABUT-01 dimensions are present and consistent with the geometry
  - confirm BBS weight equals BOQ steel weight to the kg
  - confirm the skew GAD exists for BED-HL and shows the 1200 mm cap deviation
Fail if: any sheet is unopenable, unlabelled, missing a title/revision block, or if
any geometry is hardcoded rather than derived.
