import re

import pymupdf

doc = pymupdf.open('test-output/sheet-book.pdf')
print('pages', doc.page_count)

real = []
for i, page in enumerate(doc):
    lines = [l.strip() for l in page.get_text().split('\n') if l.strip()]
    if not lines:
        continue
    m = re.match(r'^SHEET:\s+(.+)$', lines[0])
    if m:
        real.append((i + 1, m.group(1).strip()))

print('sheet pages found:', len(real))
for pg, name in real[:8]:
    print('   ', pg, name)

claims = []
for i in range(min(4, doc.page_count)):
    lines = [l.strip() for l in doc[i].get_text().split('\n') if l.strip()]
    for j, ln in enumerate(lines):
        m = re.fullmatch(r'Page\s+(\d+)', ln)
        if m and j > 0:
            claims.append((lines[j - 1].lstrip('\u2022 '), int(m.group(1))))

by_name = {n.upper(): pg for pg, n in real}
bad = 0
for name, cited in claims:
    key = name.upper()
    actual = by_name.get(key)
    if actual is None:
        cand = [v for k, v in by_name.items() if k.startswith(key[:12])]
        actual = cand[0] if len(cand) == 1 else None
    if actual != cited:
        bad += 1
        print(f'MISMATCH  {name!r} cited {cited}, real {actual}')
print('claims', len(claims), 'mismatches', bad)
