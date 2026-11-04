#!/usr/bin/env python3
"""A2: Normalize asset files — extract sheet names, cell counts, column headers.

For each asset in asset-register.json:
- If file is an LFS pointer stub (first 47 bytes = 'version https://git-lfs.github.com/spec/v1'), write {status: 'lfs-stub'} and skip.
- For .xls/.xlsx/.xlsm files, open with openpyxl (read_only=True), extract:
  - sheet_names: list of sheet names
  - non_empty_cell_count: count of cells with values
  - column_headers: {sheet_name: [first row values]}
- Write normalized JSON to evidence/assimilation/normalized/<asset_id>.json
"""
import json, os, sys
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[2]  # repo root
REGISTER = WORKSPACE / 'asset-register.json'
OUT_DIR = WORKSPACE / 'evidence' / 'assimilation' / 'normalized'

LFS_MAGIC = b'version https://git-lfs.github.com/spec/v1'

def is_lfs_stub(path: Path) -> bool:
    try:
        with open(path, 'rb') as f:
            return f.read(len(LFS_MAGIC)) == LFS_MAGIC
    except Exception:
        return False

def normalize_excel(path: Path) -> dict:
    import openpyxl
    ext = path.suffix.lower()
    # .xls (legacy BIFF) files must use xlrd; openpyxl only handles .xlsx/.xlsm
    if ext == '.xls':
        try:
            import xlrd
            wb = xlrd.open_workbook(str(path))
            result = {'sheet_names': wb.sheet_names(), 'column_headers': {}, 'non_empty_cell_count': 0}
            for ws in wb.sheets():
                headers = []
                count = 0
                for r in range(ws.nrows):
                    row_vals = [ws.cell_value(r, c) for c in range(ws.ncols)]
                    if r == 0:
                        headers = [str(v) if v != '' else '' for v in row_vals]
                    count += sum(1 for v in row_vals if v != '')
                result['column_headers'][ws.name] = headers
                result['non_empty_cell_count'] += count
            return result
        except ImportError:
            pass  # fall through to openpyxl which will give a clear error
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    result = {'sheet_names': wb.sheetnames, 'column_headers': {}, 'non_empty_cell_count': 0}
    for ws in wb.worksheets:
        headers = []
        count = 0
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i == 0:
                headers = [str(c) if c is not None else '' for c in row]
            count += sum(1 for c in row if c is not None)
        result['column_headers'][ws.title] = headers
        result['non_empty_cell_count'] += count
    wb.close()
    return result

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    register = json.loads(REGISTER.read_text(encoding='utf-8'))
    # asset-register.json uses 'files' array with 'relativePath' and 'fileName'
    assets = register.get('files', register if isinstance(register, list) else register.get('assets', []))
    skipped, processed, errors = 0, 0, 0
    for idx, asset in enumerate(assets):
        # Support both schema styles
        asset_id = asset.get('sha256', asset.get('id', asset.get('name', f'asset_{idx:04d}')))
        # Use a filesystem-safe short id: first 12 chars of sha256 + sanitized fileName
        file_name = asset.get('fileName', asset.get('name', ''))
        safe_name = file_name.replace(' ', '_').replace('[', '').replace(']', '').replace('/', '_')
        short_id = (asset.get('sha256', '')[:12] + '_' + safe_name) if asset.get('sha256') else safe_name or f'asset_{idx:04d}'

        rel_path = asset.get('relativePath', asset.get('path', asset.get('file', '')))
        if not rel_path:
            continue
        full_path = WORKSPACE / rel_path
        out_file = OUT_DIR / f'{short_id}.json'
        if not full_path.exists():
            out_file.write_text(json.dumps({'id': short_id, 'status': 'missing', 'path': str(rel_path)}), encoding='utf-8')
            continue
        if is_lfs_stub(full_path):
            out_file.write_text(json.dumps({'id': short_id, 'status': 'lfs-stub', 'path': str(rel_path)}), encoding='utf-8')
            skipped += 1
            continue
        ext = full_path.suffix.lower()
        if ext in ('.xlsx', '.xlsm', '.xls'):
            try:
                data = normalize_excel(full_path)
                data.update({'id': short_id, 'status': 'ok', 'path': str(rel_path)})
                out_file.write_text(json.dumps(data, indent=2), encoding='utf-8')
                processed += 1
            except Exception as e:
                out_file.write_text(json.dumps({'id': short_id, 'status': 'error', 'error': str(e), 'path': str(rel_path)}), encoding='utf-8')
                errors += 1
        else:
            out_file.write_text(json.dumps({'id': short_id, 'status': 'skipped-non-excel', 'path': str(rel_path)}), encoding='utf-8')
    print(f'A2 normalize: processed={processed}, lfs-stub={skipped}, errors={errors}')
    sys.exit(0)

if __name__ == '__main__':
    main()
