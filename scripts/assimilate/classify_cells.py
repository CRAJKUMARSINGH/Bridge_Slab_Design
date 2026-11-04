#!/usr/bin/env python3
"""A3: Classify cell groups by pattern — engineering-value, label, formula, boilerplate.

Reads normalized JSON files from evidence/assimilation/normalized/ and writes
classified JSON to evidence/assimilation/classified/.

For per-workbook interactive classification (variables, coefficients, constraints,
dependency-graph analysis), see classify_workbook.py in this same directory.
"""
import json, re, sys
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[2]
NORM_DIR = WORKSPACE / 'evidence' / 'assimilation' / 'normalized'
OUT_DIR = WORKSPACE / 'evidence' / 'assimilation' / 'classified'

def classify_headers(headers: list) -> list:
    UNIT_RE = re.compile(r'\b(mm|m|kN|MPa|kPa|t|kg|m2|m3|N|kN\.m|MN|cm|%|°|deg)\b', re.I)
    result = []
    for h in headers:
        if not h or not str(h).strip():
            cat = 'blank'
        elif UNIT_RE.search(str(h)):
            cat = 'engineering-value'
        elif re.match(r'^[\d\. +-]+$', str(h)):
            cat = 'numeric'
        else:
            cat = 'label'
        result.append({'header': h, 'category': cat})
    return result

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = list(NORM_DIR.glob('*.json'))
    processed = 0
    for f in files:
        data = json.loads(f.read_text(encoding='utf-8'))
        if data.get('status') in ('lfs-stub', 'missing', 'error', 'skipped-non-excel'):
            out = {**data, 'classification_status': 'skipped'}
        else:
            headers_by_sheet = data.get('column_headers', {})
            classified = {}
            for sheet, headers in headers_by_sheet.items():
                classified[sheet] = classify_headers(headers)
            out = {**data, 'classified_headers': classified, 'classification_status': 'ok'}
            processed += 1
        (OUT_DIR / f.name).write_text(json.dumps(out, indent=2), encoding='utf-8')
    print(f'A3 classify: processed={processed} of {len(files)}')
    sys.exit(0)

if __name__ == '__main__':
    main()
