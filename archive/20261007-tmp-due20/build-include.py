import io
import json
import glob

paths = []
for f in sorted(glob.glob('evidence/assimilation/normalized/*.json')):
    d = json.load(io.open(f, encoding='utf-8'))
    p = (d.get('path') or '').replace('\\', '/')
    if p and d.get('status') in ('lfs-stub', 'error'):
        paths.append(p)

commas = [p for p in paths if ',' in p]
brackets = [p for p in paths if '[' in p or ']' in p]
star_or_question = [p for p in paths if '*' in p or '?' in p]

escaped = []
for p in paths:
    q = p.replace('[', '\\[').replace(']', '\\]').replace('*', '\\*').replace('?', '\\?')
    escaped.append(q)

arg = ','.join(escaped)
io.open('archive/20261007-tmp-due20/tmp-due22-include.txt', 'w', encoding='utf-8', newline='').write(arg + '\n')
io.open('archive/20261007-tmp-due20/tmp-due22-paths.txt', 'w', encoding='utf-8', newline='').write('\n'.join(paths) + '\n')

print('paths to materialise: %d' % len(paths))
print('containing commas: %d' % len(commas))
print('containing brackets: %d' % len(brackets))
print('containing * or ?: %d' % len(star_or_question))
print('include arg length: %d chars' % len(arg))
