import io
import os

paths = [l.rstrip('\n') for l in io.open('archive/20261007-tmp-due20/tmp-due22-paths.txt', encoding='utf-8') if l.strip()]
have = []
missing = []
total = 0
for p in paths:
    if not os.path.exists(p):
        missing.append((p, 'worktree path absent'))
        continue
    head = io.open(p, encoding='utf-8', errors='replace').read(400)
    if 'version https://git-lfs' not in head:
        have.append((p, 'already real'))
        continue
    oid = None
    size = 0
    for line in head.splitlines():
        if line.startswith('oid '):
            oid = line.split(':', 1)[1].strip()
        elif line.startswith('size '):
            size = int(line.split()[1])
    obj = os.path.join('.git', 'lfs', 'objects', oid[:2], oid[2:4], oid)
    if os.path.exists(obj):
        have.append((p, 'object local'))
        total += size
    else:
        missing.append((p, 'object NOT local'))

lines = ['paths: %d' % len(paths),
         'objects available: %d' % len(have),
         'objects still missing: %d' % len(missing),
         'bytes now local: %d (%.2f MB)' % (total, total / 1048576.0)]
if missing:
    lines.append('')
    lines.append('MISSING:')
    for p, why in missing[:20]:
        lines.append('  %s  (%s)' % (p, why))
io.open('archive/20261007-tmp-due20/tmp-due22-fetch-verify.txt', 'w', encoding='utf-8', newline='').write('\n'.join(lines) + '\n')
print('\n'.join(lines[:4]))
