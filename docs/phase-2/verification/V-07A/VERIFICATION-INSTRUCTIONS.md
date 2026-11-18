<!-- V-07A/VERIFICATION-INSTRUCTIONS.md -->
# V-07A — VERIFY DESIGN PARITY
Re-run: gate:oracle, check, test.
Falsify: F-14, plus: set buoyancy fraction to 0 and 1 and confirm gamma_eff goes
24 -> 14 monotonically; set the dislodged-span flag and confirm superstructure DL halves.
Then:
  - print all 9 base-pressure cases; confirm 9 distinct Pmax values
  - confirm partial AND full buoyancy branches both appear with printed derivation
  - hand-verify 0.5 * 18 * 6.15^2 * Ka == 168.83 kN with the engine's Ka
  - confirm Ka == 0.496 and that D-15 is registered, not silently changed
  - confirm the vehicle registry rejects an unregistered load (D-07)
  - confirm every FS matches the oracle: 8.77 / 5.09 / 3.69 and 3.10 / 2.44 / 1.76
Fail if: any case duplicates another, or a buoyancy ratio is a magic number, or
Ka was "corrected" to 0.271 without a written decision.
