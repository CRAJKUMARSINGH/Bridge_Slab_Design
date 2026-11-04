import unicodedata

FILES = [
    'server/comprehensive-pdf-export.ts',
    'server/pdf-export.ts',
    'server/landscape-pdf-export.ts',
    'server/fiftysix-sheet-book-pdf.ts',
    'server/pdf-input-template-sheets.ts',
]
for f in FILES:
    s = open(f, encoding='utf-8').read()
    bad = {}
    for i, ch in enumerate(s):
        try:
            ch.encode('cp1252')
        except UnicodeEncodeError:
            if ch in '\n\r\t':
                continue
            bad.setdefault(ch, [0, []])
            bad[ch][0] += 1
            line = s.count('\n', 0, i) + 1
            if len(bad[ch][1]) < 6:
                bad[ch][1].append(line)
    print(f)
    for ch, (count, lines) in sorted(bad.items(), key=lambda kv: -kv[1][0]):
        name = unicodedata.name(ch, '?')
        print(f'   U+{ord(ch):04X} {name} x{count} at lines {lines}')
