"""Diagnose A2 error records against the real bytes on disk.

For each normalized record with status=error, read the file's first bytes, classify the
container (BIFF/OLE, zip, encrypted-OLE with an EncryptionInfo stream, other), and group
the results by (error class, true container, extension).
"""
import json, os, re, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
NORM = os.path.join(ROOT, 'evidence', 'assimilation', 'normalized')

OLE = b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'
ZIP = b'PK\x03\x04'


def classify(path):
    with open(path, 'rb') as fh:
        head = fh.read(16)
        data = fh.read()
    if head.startswith(ZIP):
        return 'zip(xlsx)', len(data)
    if head.startswith(OLE):
        if b'EncryptionInfo' in data or b'E\x00n\x00c\x00r\x00y\x00p\x00t\x00i\x00o\x00n' in data:
            return 'ole-encrypted', len(data)
        return 'ole-biff(xls)', len(data)
    return 'other:' + re.sub(rb'[^ -~]', b'.', head[:8]).decode('ascii', 'replace'), len(data)


def main():
    rows = []
    for f in sorted(os.listdir(NORM)):
        if not f.endswith('.json'):
            continue
        d = json.load(open(os.path.join(NORM, f), encoding='utf-8'))
        if d.get('status') != 'error':
            continue
        p = os.path.join(ROOT, d['path'])
        ext = os.path.splitext(p)[1].lower()
        try:
            container, size = classify(p)
        except Exception as e:
            container, size = 'unreadable:' + str(e)[:40], -1
        rows.append((d['error'][:40], ext, container, size, d['path']))

    by = collections.Counter((r[0], r[2], r[1]) for r in rows)
    out = ['A2 error diagnosis: %d error records' % len(rows), '']
    for k, c in by.most_common():
        out.append('%3d  err=%-24s container=%-16s ext=%s' % (c, k[0], k[1], k[2]))
    out.append('')
    out.append('total bytes behind the errors: %.2f MB' % (sum(max(r[3], 0) for r in rows) / 1048576))
    out.append('')
    for r in sorted(rows, key=lambda x: (x[0], x[1], x[4])):
        out.append('%-24s | %-6s | %-16s | %10d | %s' % (r[0], r[1], r[2], r[3], r[4]))
    txt = '\n'.join(out) + '\n'
    dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tmp-due22-a2-errors.txt')
    open(dest, 'w', encoding='utf-8').write(txt)
    print(txt[:1400])


if __name__ == '__main__':
    main()
