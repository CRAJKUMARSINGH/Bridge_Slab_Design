"""Coverage proof: every line the authority's own BEDACH estimate bills, against our BOQ.

Reference layout: an item's long description sits on the row that carries its S.No., while the
rate/unit/amount sit on the following 'Total' row. So the description is inherited downward.

Each reference line is classified by what our regenerated workbook actually prices:
  BILLED        the same rate is priced by one of our Abstract lines
  NOT-BILLED    we price no such rate — then reported against the Abstract's own
                exclusion note, which must name the family or the line is a gap.
"""
import os
import re

import xlrd
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))

REF = os.path.join(ROOT, 'Attached_Assets', 'plus Detailed ESTIMATE HL Bridge BEDACH.xls')
OURS = os.path.join(ROOT, 'test-output', 'design-workbook.xlsx')


def ref_items():
    ws = xlrd.open_workbook(REF).sheet_by_name('Abstract')
    items = []
    desc = ''
    for r in range(4, ws.nrows):
        a = str(ws.cell_value(r, 0)).strip()
        b = re.sub(r'\s+', ' ', str(ws.cell_value(r, 1))).strip()
        if a:
            desc = b or desc
        rate = ws.cell_value(r, 4)
        amt = ws.cell_value(r, 6)
        if isinstance(rate, float) and rate > 0 and isinstance(amt, float) and amt > 0:
            items.append({'sno': a, 'desc': desc[:95], 'rate': round(rate, 2),
                          'unit': str(ws.cell_value(r, 5)).strip(), 'amount': round(amt, 2)})
    return items


def our_lines():
    ws = openpyxl.load_workbook(OURS, data_only=True)['Abstract']
    out = []
    for r in range(4, ws.max_row + 1):
        rate = ws.cell(r, 5).value
        amt = ws.cell(r, 6).value
        if not isinstance(rate, (int, float)) or not isinstance(amt, (int, float)):
            continue
        out.append({'item': str(ws.cell(r, 1).value),
                    'desc': re.sub(r'\s+', ' ', str(ws.cell(r, 2).value))[:95],
                    'rate': round(float(rate), 2), 'unit': str(ws.cell(r, 3).value)})
    return out


def our_exclusion_note():
    ws = openpyxl.load_workbook(OURS, data_only=True)['Abstract']
    for r in range(1, ws.max_row + 1):
        v = ws.cell(r, 2).value
        if isinstance(v, str) and v.startswith('NOT BILLED HERE'):
            return v
    return ''


def main():
    ref = ref_items()
    ours = our_lines()
    priced = {o['rate'] for o in ours}
    note = our_exclusion_note()

    out = []
    out.append('reference billed lines : %d  (Rs %.2f)' % (len(ref), sum(r['amount'] for r in ref)))
    out.append('our billed lines       : %d' % len(ours))
    out.append('our priced rates       : %d distinct' % len(priced))
    out.append('')
    out.append('%-11s | %-9s | %10s | %-12s | %s' % ('STATUS', 'UNIT', 'RATE', 'RS', 'REFERENCE ITEM'))
    out.append('-' * 118)
    billed = notbilled = 0
    billed_money = notbilled_money = 0.0
    missing = []
    for r in ref:
        if r['rate'] in priced:
            status = 'BILLED'
            billed += 1
            billed_money += r['amount']
        else:
            status = 'NOT-BILLED'
            notbilled += 1
            notbilled_money += r['amount']
            missing.append(r)
        out.append('%-11s | %-9s | %10s | %12.2f | %s' % (
            status, r['unit'][:9], r['rate'], r['amount'], r['desc'][:78]))

    out.append('')
    out.append('TOTALS  billed %d lines / Rs %.2f   not-billed %d lines / Rs %.2f  (share of reference cost not billed: %.1f %%)' % (
        billed, billed_money, notbilled, notbilled_money,
        100.0 * notbilled_money / (billed_money + notbilled_money)))
    out.append('')
    out.append('Is every not-billed family named in our Abstract exclusion note?')
    for r in missing:
        words = [w for w in re.findall(r"[a-z]{5,}", r['desc'].lower()) if w not in ('providing', 'laying', 'complete')]
        hit = next((w for w in words if w.replace('pipe', 'pipe') in note.lower() or w in note.lower()), None)
        out.append('  rate %-8s %-24s -> note word found: %s' % (r['rate'], r['desc'][:24], hit or 'NONE'))

    txt = '\n'.join(out) + '\n'
    open(os.path.join(HERE, 'tmp-due23-coverage.txt'), 'w', encoding='utf-8').write(txt)
    print('wrote tmp-due23-coverage.txt: %d lines' % len(out))


if __name__ == '__main__':
    main()
