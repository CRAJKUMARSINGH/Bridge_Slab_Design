import os

import pymupdf

OUT = 'archive/20261011-tmp-due24/img2'
os.makedirs(OUT, exist_ok=True)

PAGES = {
    'comprehensive-report.pdf': [1, 6, 10, 15, 57, 61, 62, 63, 67, 225],
    'short-design-report.pdf': [1, 2, 3],
    'sheet-book.pdf': [1, 2, 6, 7, 16, 57, 58],
}

for name, pages in PAGES.items():
    doc = pymupdf.open(f'test-output/{name}')
    stem = name.replace('.pdf', '')
    for p in pages:
        if p > doc.page_count:
            continue
        pix = doc[p - 1].get_pixmap(dpi=110)
        path = f'{OUT}/{stem}_p{p:03d}.png'
        pix.save(path)
        print(path, pix.width, 'x', pix.height)
