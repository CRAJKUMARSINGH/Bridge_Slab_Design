#!/usr/bin/env python3
"""A4: Mine narrative candidate sentences from normalized workbook summaries."""
import json, re, sys
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[2]
NORM_DIR = WORKSPACE / 'evidence' / 'assimilation' / 'normalized'
OUT_DIR = WORKSPACE / 'evidence' / 'assimilation' / 'narrative'

NARRATIVE_RE = re.compile(r'.{15,}')  # 15+ chars

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = list(NORM_DIR.glob('*.json'))
    for f in files:
        data = json.loads(f.read_text(encoding='utf-8'))
        if data.get('status') in ('lfs-stub', 'missing', 'error', 'skipped-non-excel'):
            (OUT_DIR / f.name).write_text(json.dumps({'id': data.get('id'), 'status': 'skipped', 'reason': data.get('status')}), encoding='utf-8')
            continue
        # Gather all string values from column headers
        candidates = set()
        for sheet, headers in data.get('column_headers', {}).items():
            for h in headers:
                if h and isinstance(h, str) and NARRATIVE_RE.match(h) and ' ' in h:
                    candidates.add(h.strip())
        out = {'id': data.get('id'), 'status': 'ok', 'candidate_sentences': sorted(candidates)}
        (OUT_DIR / f.name).write_text(json.dumps(out, indent=2), encoding='utf-8')
    print(f'A4 narrative: scanned {len(files)} normalized files')
    sys.exit(0)

if __name__ == '__main__':
    main()
