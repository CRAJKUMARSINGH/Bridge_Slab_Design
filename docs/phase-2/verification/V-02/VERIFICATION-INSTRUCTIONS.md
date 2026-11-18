<!-- V-02/VERIFICATION-INSTRUCTIONS.md -->
# V-02 — VERIFY ENGINE & SERVER CONSOLIDATION
Re-run: check, test, build, build:netlify, gate:parity, gate:docs.
Falsify: F-01 (tamper an input -> parity red). Then:
  - grep -rn "as any" server/ lib/ and confirm zero hits
  - count mounted routers in app-factory.ts and confirm exactly one
  - confirm only one report-engine directory remains; diff the archived one against
    the surviving one and check nothing unique was lost
  - confirm lib/engine has zero imports from client/ or server/
  - confirm PARITY-AFTER equals PARITY-BEFORE byte-for-byte, not just "green"
Inspect: archive manifest — every retired path has a replacement named.
Fail if: parity was re-baselined, or a retired path has no replacement, or the
"no calculation math outside lib/engine" claim is untrue.
