"""Full dump of our generated design-workbook.xlsx: sheet list + per-sheet shape.

Prints sheet index/name/orientation/dimensions and, for the estimation family of sheets,
the row labels so the reference BEDACH estimate can be matched line by line.
Output is a UTF-8 file (console here is cp1252).
"""
import json, os
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
WB = os.path.join(ROOT, 'test-output', 'design-workbook.xlsx')

out = []
wb = openpyxl.load_workbook(WB, data_only=False)
out.append('generated workbook: %s' % WB)
out.append('sheets: %d' % len(wb.worksheets))
out.append('')
for i, ws in enumerate(wb.worksheets, 1):
    out.append('%2d  %-46s dims=%-12s rows=%4d cols=%3d orient=%s' % (
        i, ws.title[:46], ws.dimensions, ws.max_row, ws.max_column,
        getattr(ws.page_setup, 'orientation', '?')))
txt = '\n'.join(out) + '\n'
open(os.path.join(HERE, 'tmp-due23-our-sheets.txt'), 'w', encoding='utf-8').write(txt)
print(txt)
