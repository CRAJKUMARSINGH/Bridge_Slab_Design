import io
import json
import glob
import subprocess

recs = []
for f in sorted(glob.glob('evidence/assimilation/normalized/*.json')):
    try:
        recs.append(json.load(io.open(f, encoding='utf-8')))
    except Exception as e:
        recs.append({'parseError': str(e), 'file': f})

by_root = {}
by_status = {}
paths = []
for r in recs:
    p = (r.get('path') or '').replace('\\', '/')
    root = p.split('/')[0] if p else '(no path)'
    by_root[root] = by_root.get(root, 0) + 1
    st = r.get('status', r.get('parseError') and 'parse-error' or '(unknown)')
    by_status[st] = by_status.get(st, 0) + 1
    if p:
        paths.append(p)

# Which of those paths are currently deleted in the working tree?
porcelain = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True, encoding='utf-8', errors='replace').stdout
deleted = set()
for line in porcelain.splitlines():
    xy, rest = line[:2], line[3:]
    if 'D' in xy[0] or 'D' in xy[1]:
        deleted.add(rest.replace('\\', '/'))

hit = [p for p in paths if p in deleted]
lfs_tracked = subprocess.run(['git', 'lfs', 'ls-files', '--name-only'], capture_output=True, text=True, encoding='utf-8', errors='replace').stdout
tracked = set(x.replace('\\', '/') for x in lfs_tracked.splitlines() if x)
tracked_hit = [p for p in paths if p in tracked]

lines = []
lines.append('normalized records: %d' % len(recs))
lines.append('by status: ' + json.dumps(by_status, sort_keys=True))
lines.append('by top-level root: ' + json.dumps(by_root, sort_keys=True))
lines.append('record paths that are LFS-tracked: %d of %d' % (len(tracked_hit), len(paths)))
lines.append('record paths currently DELETED in the working tree: %d' % len(hit))
lines.append('  examples: ' + ' | '.join(hit[:6]))
lines.append('total paths deleted in worktree (any kind): %d' % len(deleted))
lines.append('of those, under Attached_Assets/: %d' % sum(1 for d in deleted if d.startswith('Attached_Assets/')))
lines.append('of those, under assets/: %d' % sum(1 for d in deleted if d.startswith('assets/')))
io.open('archive/20261007-tmp-due20/tmp-due21-lfs-pilot.txt', 'w', encoding='utf-8', newline='').write('\n'.join(lines) + '\n')
print('\n'.join(lines[:6]))
