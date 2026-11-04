import io
import os

paths = [l.rstrip('\n') for l in io.open('archive/20261007-tmp-due20/tmp-due22-paths.txt', encoding='utf-8') if l.strip()]
still = []
done = []
for p in paths:
    if not os.path.exists(p):
        still.append((p, 'missing from worktree'))
        continue
    head = io.open(p, 'rb').read(80)
    if head.startswith(b'version https://git-lfs'):
        still.append((p, 'still a pointer (%d B)' % os.path.getsize(p)))
    elif b'\x00' in head or head[:2] in (b'PK', b'\xd0\xcf') or head[:3] == b'<?x' or head[:4] == b'<!DO' or head[:3] == b'ABB' or len(head) > 20:
        done.append((p, os.path.getsize(p), head[:8].hex()))

lines = ['requested: %d' % len(paths),
         'materialised: %d' % len(done),
         'still pointer/missing: %d' % len(still),
         '']
lines.append('STILL STUBS / PROBLEMS:')
for p, why in still[:40]:
    lines.append('  %s  <- %s' % (why, p))
lines.append('')
lines.append('MATERIALISED, first 12 with magic bytes:')
for p, s, hx in done[:12]:
    lines.append('  %10d  %s  %s' % (s, hx, os.path.basename(p)))
io.open('archive/20261007-tmp-due20/tmp-due22-pull-verify.txt', 'w', encoding='utf-8', newline='').write('\n'.join(lines) + '\n')
print('\n'.join(lines[:4]))
