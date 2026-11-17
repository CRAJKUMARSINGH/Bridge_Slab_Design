import re
import sys

import pymupdf

path = sys.argv[1] if len(sys.argv) > 1 else 'test-output/sheet-book.pdf'
doc = pymupdf.open(path)
print('pages', doc.page_count)

# The head band and its page stamp share a baseline, so text extraction returns one line.
BAND = re.compile(
    r'^(SHEET: (.+?)(?: \(CONT\.\))?|FILE TOPIC INDEX(?: \(CONT\.\))?|SECTION DIVIDER)'
    r'\s+Page (\d+)(?: of (\d+))?$'
)
ITEM = re.compile(r'^(\S.*?)\s{2,}(?:Starts )?Page (\d+)$')

bands = {}
dividers = []
index_pages = []
unstamped = []
bad_stamp = []
for i, page in enumerate(doc):
    lines = [l.strip() for l in page.get_text(sort=True).split('\n') if l.strip()]
    band = next((BAND.match(l) for l in lines if BAND.match(l)), None)
    if band is None:
        unstamped.append(i + 1)
        continue
    label, name, stamped, total = band.groups()
    if int(stamped) != i + 1:
        bad_stamp.append((i + 1, f'stamp says {stamped}'))
    elif total and int(total) != doc.page_count:
        bad_stamp.append((i + 1, f'total says {total} vs real {doc.page_count}'))
    elif name:
        bands.setdefault(name, []).append(i + 1)
    elif label == 'SECTION DIVIDER':
        dividers.append(i + 1)
    else:
        index_pages.append(i + 1)

print('sheet pages banded:', sum(len(p) for p in bands.values()), 'distinct sheets:', len(bands))
print('index pages:', index_pages, 'divider pages:', dividers)
print('unstamped (cover excluded):', [p for p in unstamped if p != 1])
print('stamps that disagree:', bad_stamp)

claims = []
for page in index_pages:
    lines = [l.strip() for l in doc[page - 1].get_text(sort=True).split('\n') if l.strip()]
    for ln in lines:
        m = ITEM.match(ln)
        if m and not ln.startswith(('FILE TOPIC', 'SHEET:')):
            claims.append((m.group(1).lstrip('- ').strip(), int(m.group(2)), 'Starts' in ln))

real_first = {name: pages[0] for name, pages in bands.items()}
bad = 0
for name, cited, is_section in claims:
    if is_section:
        actual = cited if cited in dividers else 'not-a-divider'
    else:
        actual = real_first.get(name.upper())
    if actual != cited:
        bad += 1
        print(f'MISMATCH  {name!r} cited {cited}, real {actual}')
print('index claims', len(claims), 'mismatches', bad)

uncited = [n for n in real_first if n.upper() not in {c[0].upper() for c in claims}]
print('sheets banded but absent from index:', uncited)

multi = {n: p for n, p in bands.items() if len(p) > 1}
print('multi-page sheets', len(multi))
for n, p in list(multi.items())[:12]:
    print('   ', n, p)
