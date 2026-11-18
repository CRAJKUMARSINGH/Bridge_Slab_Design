<!-- V-02A/VERIFICATION-INSTRUCTIONS.md -->
# V-02A — VERIFY CORPUS & ORACLE
Re-run: gate:oracle.
Falsify: F-02, F-03, F-04, F-06.
Then independently: open two workbooks yourself and hand-check 6 oracle values against
the actual cells. Do not trust the extractor's output.
  - confirm every oracle entry names a file, sheet, and cell/row
  - confirm tolerances are categorised and justified, not uniform
  - confirm SOURCE-DEFECT-REGISTER has a required behaviour for every D-item
  - confirm the superseded fixtures carry a written reason
Fail if: any oracle value cannot be traced to a cell, or the register is a bare list
with no required-behaviour column, or a defect was silently "fixed".
