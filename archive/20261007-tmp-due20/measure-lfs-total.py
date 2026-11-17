import io
import os


def pointer_size(path):
    try:
        head = io.open(path, encoding='utf-8', errors='replace').read(512)
    except Exception:
        return None
    if 'version https://git-lfs' not in head:
        return None
    for line in head.splitlines():
        if line.startswith('size '):
            return int(line.split()[1])
    return None


out = []
grand = 0
for r in ['Attached_Assets', 'assets', 'project', 'docs']:
    if not os.path.isdir(r):
        out.append('%s/ : (absent)' % r)
        continue
    stubs = real = 0
    total = 0
    for dp, dn, fn in os.walk(r):
        for name in fn:
            s = pointer_size(os.path.join(dp, name))
            if s is None:
                real += 1
            else:
                stubs += 1
                total += s
    grand += total
    out.append('%s/ : pointers=%d non-pointer=%d payload=%.2f MB' % (r, stubs, real, total / 1048576.0))

att = brack = 0
for dp, dn, fn in os.walk('Attached_Assets'):
    for name in fn:
        p = os.path.join(dp, name).replace('\\', '/')
        if pointer_size(p) is not None:
            att += 1
            if '[' in p or ']' in p:
                brack += 1
out.append('Attached_Assets pointers=%d, bracket-containing=%d' % (att, brack))
out.append('TOTAL payload across scanned roots=%.2f MB' % (grand / 1048576.0))
io.open('archive/20261007-tmp-due20/tmp-due22-lfs-total.txt', 'w', encoding='utf-8', newline='').write('\n'.join(out) + '\n')
print('\n'.join(out))
