import io
import json
import glob
import os

recs = []
for f in sorted(glob.glob('evidence/assimilation/normalized/*.json')):
    try:
        recs.append(json.load(io.open(f, encoding='utf-8')))
    except Exception:
        pass

lines = []
total = 0
present = 0
sizes = []
missing_paths = []
for r in recs:
    p = (r.get('path') or '').replace('\\', '/')
    if not p:
        continue
    if not os.path.exists(p):
        missing_paths.append(p)
        continue
    present += 1
    try:
        head = io.open(p, encoding='utf-8', errors='replace').read(512)
    except Exception as e:
        lines.append('read-error %s %s' % (p, e))
        continue
    if 'version https://git-lfs' not in head:
        lines.append('NOT A POINTER %s' % p)
        continue
    size = None
    for line in head.splitlines():
        if line.startswith('size '):
            size = int(line.split()[1])
    if size is None:
        lines.append('NO SIZE FIELD %s' % p)
        continue
    total += size
    sizes.append((size, p))

sizes.sort(reverse=True)
lines.append('normalized records with a path: %d' % (present + len(missing_paths)))
lines.append('paths present on disk: %d, missing: %d' % (present, len(missing_paths)))
lines.append('LFS payload needed to materialise the assimilation corpus: %d bytes = %.2f MB' % (total, total / 1048576.0))
lines.append('largest 5: ' + ' | '.join('%s (%.1f MB)' % (os.path.basename(p), s / 1048576.0) for s, p in sizes[:5]))
lines.append('smallest 3: ' + ' | '.join('%s (%d B)' % (os.path.basename(p), s) for s, p in sizes[-3:]))
lines.append('missing path examples: ' + ' | '.join(missing_paths[:5]))
io.open('archive/20261007-tmp-due20/tmp-due22-lfs-size.txt', 'w', encoding='utf-8', newline='').write('\n'.join(lines) + '\n')
print('\n'.join(l for l in lines if l.startswith(('normalized', 'paths present', 'LFS payload'))))
