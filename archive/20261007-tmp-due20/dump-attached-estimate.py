"""Dump the owner's attached 'plus Detailed ESTIMATE HL Bridge BEDACH.xls' for comparison.

Reports: sha256 vs the copy already indexed under Attached_Assets/, per-sheet dimensions,
whether any cell carries a formula (BIFF exposes none through xlrd, so the check records
the cell type instead: number/text vs formula), the full row-by-row content of small
sheets, and the header/first-data rows of larger ones.

Output goes to a UTF-8 file (console here is cp1252 and mangles Devanagari/symbols).
"""
import hashlib, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))

ATTACH = r'C:\Users\Rajkumar.DESKTOP-4ISBKM0\Downloads\plus Detailed ESTIMATE HL Bridge BEDACH.xls'
IN_REPO = os.path.join(ROOT, 'Attached_Assets', 'plus Detailed ESTIMATE HL Bridge BEDACH.xls')

import xlrd


def sha(p):
    if not os.path.exists(p):
        return 'MISSING'
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def dump(path, tag, out):
    out.append('===== %s: %s =====' % (tag, path))
    out.append('exists=%s size=%d sha256=%s' % (
        os.path.exists(path), os.path.getsize(path) if os.path.exists(path) else -1, sha(path)))
    if not os.path.exists(path):
        return None
    wb = xlrd.open_workbook(path, formatting_info=False)
    out.append('sheets: %d  %r' % (len(wb.sheets()), wb.sheet_names()))
    for ws in wb.sheets():
        types = {}
        nonempty = 0
        for r in range(ws.nrows):
            for c in range(ws.ncols):
                cell = ws.cell(r, c)
                if cell.ctype != xlrd.XL_CELL_EMPTY and str(cell.value) != '':
                    nonempty += 1
                    types[cell.ctype] = types.get(cell.ctype, 0) + 1
        out.append('')
        out.append('-- sheet %r  rows=%d cols=%d nonempty=%d  ctype tally=%s' % (
            ws.name, ws.nrows, ws.ncols, nonempty, types))
        limit = 60 if ws.nrows <= 70 else 25
        for r in range(min(ws.nrows, limit)):
            vals = []
            for c in range(ws.ncols):
                v = ws.cell_value(r, c)
                if v == '':
                    continue
                if isinstance(v, float) and v == int(v) and abs(v) < 1e15:
                    v = int(v)
                vals.append('%s:%s' % (xlrd.colname(c), v))
            if vals:
                out.append('   r%-3d %s' % (r, ' | '.join(str(x) for x in vals)))
        if ws.nrows > limit:
            out.append('   ... (%d more rows not dumped)' % (ws.nrows - limit))
    return wb


def main():
    out = []
    a = sha(ATTACH)
    b = sha(IN_REPO)
    out.append('sha256 Downloads == repo copy? %s' % (a == b and a != 'MISSING'))
    out.append('')
    dump(ATTACH, 'ATTACHMENT (Downloads)', out)
    out.append('')
    dump(IN_REPO, 'REPO INDEXED COPY (Attached_Assets)', out)
    txt = '\n'.join(out) + '\n'
    dest = os.path.join(HERE, 'tmp-due23-attached-dump.txt')
    open(dest, 'w', encoding='utf-8').write(txt)
    print('wrote %s (%d lines)' % (dest, txt.count(chr(10))))


if __name__ == '__main__':
    main()
