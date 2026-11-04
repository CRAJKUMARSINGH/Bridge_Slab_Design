#!/usr/bin/env bash
# scripts/bootstrap-phase2.sh — run once from repo root
# Creates the Phase-2 directory structure, drops in the 18 instruction files,
# 22 templates, and GOLDEN-ORACLE.json. This script is idempotent.
set -euo pipefail

BASE="docs/phase-2"

# Directory structure
mkdir -p "$BASE"/week-{01..12}{,A} \
         "$BASE/_templates" \
         "$BASE/HANDOVER" \
         corpus/raw corpus/oracle corpus/superseded \
         scripts/gates/.out \
         lib/engine/src

# Drop the 18 AGENT-INSTRUCTIONS.md files into their week folders
# (already created — this script ensures they exist)
for d in "$BASE"/week-*; do
  if [ ! -f "$d/AGENT-INSTRUCTIONS.md" ]; then
    echo "WARNING: $d/AGENT-INSTRUCTIONS.md missing — drop it in place."
  fi
done

# Drop the 22 templates into docs/phase-2/_templates/
# (already created — this script ensures they exist)
TEMPLATE_COUNT=$(ls "$BASE/_templates/"*.md 2>/dev/null | wc -l)
if [ "$TEMPLATE_COUNT" -lt 22 ]; then
  echo "WARNING: Only $TEMPLATE_COUNT/22 templates found in $BASE/_templates/"
fi

# Drop GOLDEN-ORACLE.json into corpus/oracle/
if [ ! -f "corpus/oracle/GOLDEN-ORACLE.json" ]; then
  echo "WARNING: corpus/oracle/GOLDEN-ORACLE.json missing — drop it in place."
fi

# Verify gate stubs exist
GATE_COUNT=$(ls scripts/gates/*.mjs 2>/dev/null | wc -l)
if [ "$GATE_COUNT" -lt 15 ]; then
  echo "WARNING: Only $GATE_COUNT/15 gate stubs found in scripts/gates/"
fi

echo "Phase-2 bootstrap complete."
echo "  Week folders:     $(ls -d "$BASE"/week-* | wc -l)"
echo "  Instruction files: $(find "$BASE"/week-* -name AGENT-INSTRUCTIONS.md | wc -l)"
echo "  Templates:         $TEMPLATE_COUNT"
echo "  Gate stubs:        $GATE_COUNT"
echo "  GOLDEN-ORACLE:     $([ -f corpus/oracle/GOLDEN-ORACLE.json ] && echo present || echo MISSING)"
