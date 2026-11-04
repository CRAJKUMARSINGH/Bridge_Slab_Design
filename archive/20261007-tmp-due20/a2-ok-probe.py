"""Read back the A2 'ok' records and prove they are real workbooks, not 4-cell ghosts.

Also grep xlrd's own source for the text that produces 'Workbook is encrypted' so the
error class can be described from the library's rule rather than guessed.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
NORM = os.path.join(ROOT, 'evidence', 'assimilation', 'normalized')

out = []
ok = []
stub = []
for f in sorted(os.listdir(NORM)):
    if not f.endswith('.json'):
        continue
    d = json.load(open(os.path.join(NORM, f), encoding='utf-8'))
    if d.get('status') == 'ok':
        ok.append((d.get('non_empty_cell_count', 0), len(d.get('sheet_names', [])), d['path']))
    if d.get('status') == 'lfs-stub':
        stub.append(d['path'])

out.append('A2 ok records: %d   (lfs-stub left: %d)' % (len(ok), len(stub)))
out.append('cell-count distribution of ok records:')
for c, s, p in sorted(ok, reverse=True):
    flag = '   <-- GHOST SHAPE' if c <= 6 else ''
    out.append('  %8d cells %3d sheets  %s%s' % (c, s, p, flag))
ghosts = [o for o in ok if o[0] <= 6]
out.append('ok records with <=6 non-empty cells: %d' % len(ghosts))
out.append('')

import xlrd
d = os.path.dirname(xlrd.__file__)
out.append('xlrd %s at %s' % (getattr(xlrd, '__version__', '?'), d))
for root, _, fs in os.walk(d):
    for fn in fs:
        if not fn.endswith('.py'):
            continue
        p = os.path.join(root, fn)
        t = open(p, encoding='utf-8', errors='replace').read()
        for m in re.finditer(r'encrypted', t):
            a = max(0, m.start() - 200)
            snippet = t[a:m.start() + 80].replace('\n', ' | ')
            out.append('  %s::%d  ...%s' % (fn, t[:m.start()].count('\n') + 1, snippet[-230:]))

txt = '\n'.join(out) + '\n'
open(os.path.join(HERE, 'tmp-due22-a2-ok.txt'), 'w', encoding='utf-8').write(txt)
print(txt[:2500])
