"""Materialise the last indexed asset that is still an LFS pointer stub.

Discovered by the gate itself (`pnpm run assimilate` prints "1 of 97"), not guessed: the directory
holds two look-alike names -- `BOX 1CWEC RED [7 OF 16].DXF` (pulled in the scoped batch) and
`BOX 1CWEC RED 7 OF 16].DXF` (a genuinely different filename whose missing opening bracket kept it
out of the path list). Same verified mechanism as finish-smudge.py: the fetched object is checked
against the pointer's own oid and size BEFORE the file is replaced.
"""
import hashlib
import io
import os
import subprocess
import sys

PATH = 'Attached_Assets/ASTRA 15 TUTORIALS/DRAWINGS/Box_Culvert_Single_Cell/BOX 1CWEC RED 7 OF 16].DXF'

head = io.open(PATH, encoding='utf-8', errors='replace').read(400)
if not head.startswith('version https://git-lfs'):
    print('already materialised:', os.path.getsize(PATH), 'bytes')
    sys.exit(0)

oid = size = None
for line in head.splitlines():
    if line.startswith('oid '):
        oid = line.split(':', 1)[1].strip()
    elif line.startswith('size '):
        size = int(line.split()[1])

tmp = PATH + '.smudging'
with io.open(PATH, 'rb') as stdin, io.open(tmp, 'wb') as out:
    r = subprocess.run(['git', 'lfs', 'smudge'], stdin=stdin, stdout=out,
                       stderr=subprocess.PIPE, timeout=300)
if r.returncode != 0:
    os.remove(tmp)
    sys.exit('smudge exit %d: %s' % (r.returncode, r.stderr.decode('utf-8', 'replace')[:200]))

data = io.open(tmp, 'rb').read()
got = hashlib.sha256(data).hexdigest()
if got != oid or len(data) != size:
    os.remove(tmp)
    sys.exit('digest mismatch: got %s (%d B), pointer wants %s (%d B)' % (got[:12], len(data), oid[:12], size))

os.replace(tmp, PATH)
print('materialised %d bytes, sha256 %s' % (len(data), got))
