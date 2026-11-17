import sys

import pymupdf

doc = pymupdf.open('test-output/sheet-book.pdf')
for p in [int(x) for x in sys.argv[1:]] or [2, 6, 7]:
    print('=== page', p, '===')
    print(repr(doc[p - 1].get_text(sort=True))[:2600])
    print()
