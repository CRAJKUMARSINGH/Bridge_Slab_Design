import sys

import pymupdf

doc = pymupdf.open('test-output/sheet-book.pdf')
out = []
for p in [int(x) for x in sys.argv[1:]] or [2, 6, 7]:
    out.append(f'=== page {p} ===')
    out.append(ascii(doc[p - 1].get_text(sort=True)))
open('archive/20261011-tmp-due24/sheetbook-text.txt', 'w', encoding='utf-8').write('\n'.join(out))
print('ok')
