import re

src = open('server/comprehensive-pdf-export.ts', encoding='utf-8').read()

CONTENT_WIDTH = 180

# find drawTable( ... [ headers ] ... ) blocks by bracket matching from each call
over = []
for m in re.finditer(r'drawTable\(', src):
    i = src.index('[', m.end())
    depth = 0
    j = i
    while True:
        if src[j] == '[':
            depth += 1
        elif src[j] == ']':
            depth -= 1
            if depth == 0:
                break
        j += 1
    block = src[i:j]
    widths = [int(x) for x in re.findall(r'width:\s*(\d+(?:\.\d+)?)', block)]
    line = src[:m.start()].count('\n') + 1
    if widths:
        total = sum(widths)
        if total > CONTENT_WIDTH + 0.01:
            over.append((line, total, len(widths)))

print(f'drawTable calls with header widths summing over {CONTENT_WIDTH} mm (A4 - 2x15 mm):')
for line, total, cols in over:
    print(f'  line {line:5d}  sum={total:6.1f} mm  cols={cols}  overflow={total - CONTENT_WIDTH:+.1f} mm')
print(f'total offending calls: {len(over)}')
