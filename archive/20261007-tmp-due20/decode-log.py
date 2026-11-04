"""Decode an ANSI-laden pnpm log into plain text so it can be read with the Read tool.

Usage: python archive/20261007-tmp-due20/decode-log.py <in.log> <out.txt>
"""
import re
import sys

raw = open(sys.argv[1], 'rb').read()
txt = re.sub(rb'\x1b\[[0-9;?]*[a-zA-Z]', b'', raw).decode('utf-8', 'replace')
lines = [l for l in txt.splitlines() if l.strip()]
open(sys.argv[2], 'w', encoding='utf-8').write(
    'bytes=%d lines=%d\n' % (len(raw), len(lines)) + '\n'.join(lines) + '\n')
print('ok', len(lines))
