import re
import sys

import pymupdf

PDF = sys.argv[1] if len(sys.argv) > 1 else 'test-output/comprehensive-report.pdf'

doc = pymupdf.open(PDF)
out = []
for i, page in enumerate(doc, 1):
    lines = [l.strip() for l in page.get_text().splitlines() if l.strip()]
    head = lines[0] if lines else '(blank)'
    stamp = re.findall(r'Page\s+(\d+)\s+of\s+(\d+)', page.get_text())
    stamp_txt = f'{stamp[0][0]}/{stamp[0][1]}' if stamp else 'NONE'
    out.append(f'{i:3d}  stamp={stamp_txt:10s}  {head[:70]}')

with open('archive/20261011-tmp-due24/real-page-map.txt', 'w', encoding='utf-8') as fh:
    fh.write('\n'.join(out) + '\n')
print('\n'.join(out[:60]))
