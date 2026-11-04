import re

import pymupdf

doc = pymupdf.open('test-output/comprehensive-report.pdf')

MARKERS = [
    ('IN1-3', 'INPUT-HYDRAULICS'),
    ('01', 'SHEET 01: INDEX'),
    ('02', 'SHEET 02:'),
    ('03', 'SHEET 03:'),
    ('04', 'SHEET 04:'),
    ('05-08', 'SHEET 05:'),
    ('09-18', 'SHEET 09: STABILITY CHECK FOR PIER'),
    ('19-28', 'TYPE1 ABUTMENT - COVER'),
    ('29', 'SHEET 29: TECHNOTE'),
    ('30-41', 'C1 ABUTMENT - COVER'),
    ('42-46', 'SHEET 42:'),
    ('ANNEX', 'D-04 HYDRAULIC PROFILE'),
    ('APPX', 'WORKBOOK GRID:'),
]

real = {}
for i, page in enumerate(doc, 1):
    lines = [l.strip() for l in page.get_text().splitlines() if l.strip()]
    head = lines[0] if lines else ''
    for key, marker in MARKERS:
        if key not in real and head.startswith(marker):
            real[key] = i
    if i == doc.page_count:
        real['SUM'] = i
        summary_head = head

toc_text = doc[5].get_text()
cited = {}
current = None
for line in toc_text.splitlines():
    line = line.strip()
    m = re.match(r'^(Sheets?|Annexures|Appendix|Summary)\s*(.*)$', line)
    if m:
        current = m.group(2).strip() or ('ANNEX' if m.group(1) == 'Annexures' else 'APPX' if m.group(1) == 'Appendix' else 'SUM')
    p = re.match(r'^Page (\d+)$', line)
    if p and current and current not in cited:
        cited[current] = int(p.group(1))

print(f'{"section":8s} {"cited":>6s} {"real":>6s}  match')
keys = [k for k, _ in MARKERS] + ['SUM']
ok = True
for k in keys:
    c = cited.get(k)
    r = real.get(k)
    good = c is not None and c == r
    ok = ok and good
    print(f'{k:8s} {str(c):>6s} {str(r):>6s}  {"OK" if good else "MISMATCH"}')
print(f'\nall TOC entries land on their real first page: {ok}')
print(f'last page ({doc.page_count}) header: {summary_head}')
print('\n--- TOC raw ---')
print(toc_text)
