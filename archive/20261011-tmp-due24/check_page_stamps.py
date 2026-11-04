import re
import sys

import pymupdf

PDF = sys.argv[1] if len(sys.argv) > 1 else 'test-output/comprehensive-report.pdf'

doc = pymupdf.open(PDF)
n = doc.page_count
print(f'{PDF}: {n} pages')

bad_total = []
no_stamp = []
for i, page in enumerate(doc, 1):
    text = page.get_text()
    hits = re.findall(r'Page\s+(\d+)\s+of\s+(\d+)', text)
    if not hits:
        no_stamp.append(i)
        continue
    for printed_no, printed_total in hits:
        if int(printed_total) != n:
            bad_total.append((i, printed_no, printed_total))
        if int(printed_no) != i:
            bad_total.append((i, f'wrong-page-no:{printed_no}', printed_total))

print('pages with no Page n of N stamp:', no_stamp)
print('stamps that disagree with the real length:', bad_total[:20], 'count', len(bad_total))

print('\n--- page 1 ---')
print(doc[0].get_text())
print('--- page 2 ---')
print(doc[1].get_text()[:900])
print(f'--- page {n} ---')
print(doc[n - 1].get_text())
