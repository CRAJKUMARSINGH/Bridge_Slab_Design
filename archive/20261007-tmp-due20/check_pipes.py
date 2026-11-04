import io
import re

lines = io.open('august-due.md', encoding='utf-8', newline='').read().split('\n')
PIPE = re.compile(r'(?<!\\)\|')
out = []
for i, l in enumerate(lines):
    if l.startswith('|') and i > 425:
        out.append('%d: pipes=%d :: %s' % (i + 1, len(PIPE.findall(l)), l[:46]))
io.open('archive/20261007-tmp-due20/tmp-due21-pipes.txt', 'w', encoding='utf-8', newline='').write('\n'.join(out) + '\n')
print('rows scanned:', len(out))
