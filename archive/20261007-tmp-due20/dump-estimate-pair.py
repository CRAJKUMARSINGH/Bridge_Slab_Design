"""Full dump of both estimand families for line-by-line comparison.

Reference: the owner's BEDACH detailed estimate (.xls, values only, no formulas).
Ours:      test-output/design-workbook.xlsx sheets 49-53 (formula-driven).

Writes two UTF-8 files. For our workbook every cell is printed with its formula when the
cell holds one, so 'derived by formula' vs 'typed literal' is visible per row.
"""
import os
import xlrd
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))

REF = os.path.join(ROOT, 'Attached_Assets', 'plus Detailed ESTIMATE HL Bridge BEDACH.xls')
OURS = os.path.join(ROOT, 'test-output', 'design-workbook.xlsx')
OUR_SHEETS = ['Tech Report', 'General Abs.', 'Abstract', 'Bridge measurements']
REF_SHEETS = ['Tech Report', 'General Abs. ', 'Abstract', 'Bridge measurements']


def fmt(v):
    if isinstance(v, float):
        if v == int(v) and abs(v) < 1e15:
            return str(int(v))
        return ('%.4f' % v).rstrip('0').rstrip('.')
    return str(v)


def dump_ref():
    wb = xlrd.open_workbook(REF)
    out = ['# REFERENCE  %s' % os.path.basename(REF)]
    for name in REF_SHEETS:
        ws = wb.sheet_by_name(name)
        out.append('')
        out.append('===== SHEET %r  rows=%d cols=%d =====' % (name, ws.nrows, ws.ncols))
        for r in range(ws.nrows):
            cells = []
            for c in range(ws.ncols):
                v = ws.cell_value(r, c)
                if v == '' or (isinstance(v, float) and v == 0 and ws.cell(r, c).ctype == 1):
                    continue
                s = fmt(v)
                if s == '':
                    continue
                cells.append('%s=%s' % (xlrd.colname(c), s.replace('\n', ' / ')))
            if cells:
                out.append('r%-4d %s' % (r, '  '.join(cells)))
    return '\n'.join(out) + '\n'


def dump_ours():
    wb = openpyxl.load_workbook(OURS, data_only=False)
    wbv = openpyxl.load_workbook(OURS, data_only=True)
    out = ['# OURS  test-output/design-workbook.xlsx (estimate family)']
    for name in OUR_SHEETS:
        ws = wb[name]
        wsv = wbv[name]
        out.append('')
        out.append('===== SHEET %r  rows=%d cols=%d =====' % (name, ws.max_row, ws.max_column))
        for r in range(1, ws.max_row + 1):
            cells = []
            for c in range(1, ws.max_column + 1):
                cell = ws.cell(r, c)
                v = cell.value
                if v is None or (isinstance(v, str) and v.strip() == ''):
                    continue
                col = openpyxl.utils.get_column_letter(c)
                cached = wsv.cell(r, c).value
                if isinstance(v, str) and v.startswith('='):
                    cells.append('%s{%s=>%s}' % (col, v.replace('\n', ' / '), fmt(cached)))
                else:
                    cells.append('%s=%s' % (col, fmt(v).replace('\n', ' / ')))
            if cells:
                out.append('r%-4d %s' % (r, '  '.join(cells)))
    return '\n'.join(out) + '\n'


def main():
    open(os.path.join(HERE, 'tmp-due23-ref-full.txt'), 'w', encoding='utf-8').write(dump_ref())
    open(os.path.join(HERE, 'tmp-due23-ours-full.txt'), 'w', encoding='utf-8').write(dump_ours())
    for f in ('tmp-due23-ref-full.txt', 'tmp-due23-ours-full.txt'):
        p = os.path.join(HERE, f)
        print('%s: %d lines' % (f, open(p, encoding='utf-8').read().count(chr(10))))


if __name__ == '__main__':
    main()
