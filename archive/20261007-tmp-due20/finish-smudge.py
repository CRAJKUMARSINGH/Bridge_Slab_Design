"""Materialise the 29 assets that `git lfs pull --include` silently skipped.

Why this exists: the include list needed escaped brackets for 28 paths, and even bracket-free
siblings in the same directories were skipped by pull/checkout (both exit 0 and print nothing --
the silent-success failure mode §V warns about). `git lfs smudge` is per-path and needs no globbing,
so it is used as the mechanism; the object is checked against the pointer's own sha256 BEFORE any
file is replaced, so a wrong or truncated object can never land in the worktree.
"""
import hashlib
import io
import os
import subprocess
import sys

paths = [l.rstrip('\n') for l in io.open('archive/20261007-tmp-due20/tmp-due22-paths.txt', encoding='utf-8') if l.strip()]

todo = []
for p in paths:
    if os.path.exists(p) and io.open(p, 'rb').read(30).startswith(b'version https://git-lfs'):
        todo.append(p)

done = []
failed = []
for p in todo:
    head = io.open(p, encoding='utf-8', errors='replace').read(400)
    oid = size = None
    for line in head.splitlines():
        if line.startswith('oid '):
            oid = line.split(':', 1)[1].strip()
        elif line.startswith('size '):
            size = int(line.split()[1])
    if not oid:
        failed.append((p, 'no oid in pointer'))
        continue
    try:
        with io.open(p, 'rb') as stdin, io.open(p + '.smudging', 'wb') as out:
            r = subprocess.run(['git', 'lfs', 'smudge'], stdin=stdin, stdout=out,
                               stderr=subprocess.PIPE, timeout=180)
        if r.returncode != 0:
            os.remove(p + '.smudging')
            failed.append((p, 'smudge exit %d: %s' % (r.returncode, r.stderr.decode('utf-8', 'replace')[:120])))
            continue
        data = io.open(p + '.smudging', 'rb').read()
        got = hashlib.sha256(data).hexdigest()
        if got != oid or len(data) != size:
            os.remove(p + '.smudging')
            failed.append((p, 'digest mismatch: got %s (%d B), pointer wants %s (%d B)' % (got[:12], len(data), oid[:12], size)))
            continue
        os.replace(p + '.smudging', p)
        done.append((p, len(data)))
    except Exception as e:
        if os.path.exists(p + '.smudging'):
            os.remove(p + '.smudging')
        failed.append((p, 'exception %s' % e))

lines = ['attempted: %d' % len(todo),
         'materialised: %d' % len(done),
         'refused: %d' % len(failed), '']
for p, n in done:
    lines.append('  OK   %10d B  %s' % (n, p))
for p, why in failed:
    lines.append('  FAIL  %s  <- %s' % (why[:80], p))
io.open('archive/20261007-tmp-due20/tmp-due22-smudge.txt', 'w', encoding='utf-8', newline='').write('\n'.join(lines) + '\n')
print('attempted %d, materialised %d, refused %d' % (len(todo), len(done), len(failed)))
sys.exit(0)
