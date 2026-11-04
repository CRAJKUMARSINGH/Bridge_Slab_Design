"""Inventory of our generated design-workbook.xlsx: sheet index, name, dimensions, orientation."""
import os
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
WB = os.path.join(ROOT, 'test-output', 'design-workbook.xlsx')

out = ['generated workbook: %s' % WB]
wb = openpyxl.load_workbook(WB, data_only=False)
out.append('sheets: %d' % len(wb.worksheets))
out.append('')
for i, ws in enumerate(wb.worksheets, 1):
    out.append('%2d  %-46s dims=%-12s rows=%4d cols=%3d orient=%s' % (
        i, ws.title[:46], ws.dimensions, ws.max_row, ws.max_column,
        getattr(ws.page_setup, 'orientation', '?')))
txt = '\n'.join(out) + '\n'
open(os.path.join(HERE, 'tmp-due23-our-sheets.txt'), 'w', encoding='utf-8').write(txt)
print(txt)
