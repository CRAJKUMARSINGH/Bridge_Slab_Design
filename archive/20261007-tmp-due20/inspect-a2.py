import io
import json
import glob
import collections
import os

c = collections.Counter()
rows = []
for f in sorted(glob.glob('evidence/assimilation/normalized/*.json')):
    d = json.load(io.open(f, encoding='utf-8'))
    st = d.get('status', '?')
    c[st] += 1
    if st in ('ok', 'error'):
        rows.append((os.path.basename(f), st, d.get('path'), d.get('sheet_names'),
                     d.get('non_empty_cell_count'), d.get('error')))

out = ['status tally: %s' % json.dumps(dict(c), sort_keys=True), '']
for name, st, path, sheets, cells, err in rows:
    out.append('%s | %s | cells=%s | sheets=%s' % (st.upper(), name[:70], cells, (sheets or [])[:5]))
    out.append('    path: %s' % path)
    if err:
        out.append('    error: %s' % err)
io.open('archive/20261007-tmp-due20/tmp-due22-a2.txt', 'w', encoding='utf-8', newline='').write('\n'.join(out) + '\n')
print('\n'.join(out))
