import re
import zipfile

for path in ('test-output/design-workbook.xlsx',):
    with zipfile.ZipFile(path) as z:
        wb = z.read('xl/workbook.xml').decode('utf-8')
    names = re.findall(r"<sheet[^>]*name=.(.*?).[^>]*>", wb)
    print(path, 'sheets:', len(names))
    for i, n in enumerate(names, 1):
        print(f'  {i:2d} {n}')
