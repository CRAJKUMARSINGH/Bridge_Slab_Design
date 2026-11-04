#!/usr/bin/env python3
"""A5: Map DXF drawing assets — count entity types per file."""
import json, sys
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[2]
REGISTER = WORKSPACE / 'asset-register.json'
OUT_DIR = WORKSPACE / 'evidence' / 'assimilation' / 'drawings'

LFS_MAGIC = b'version https://git-lfs.github.com/spec/v1'

def is_lfs_stub(path: Path) -> bool:
    try:
        with open(path, 'rb') as f:
            return f.read(len(LFS_MAGIC)) == LFS_MAGIC
    except Exception:
        return False

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    register = json.loads(REGISTER.read_text(encoding='utf-8'))
    # asset-register.json uses 'files' array with 'relativePath', 'kind', and 'fileName'
    all_assets = register.get('files', register if isinstance(register, list) else register.get('assets', []))
    dxf_assets = [
        a for a in all_assets
        if a.get('kind') == 'drawing-cad'
        or str(a.get('relativePath', a.get('path', ''))).lower().endswith('.dxf')
    ]
    processed, skipped = 0, 0
    for idx, asset in enumerate(dxf_assets):
        file_name = asset.get('fileName', asset.get('name', ''))
        safe_name = file_name.replace(' ', '_').replace('[', '').replace(']', '').replace('/', '_')
        asset_id = (asset.get('sha256', '')[:12] + '_' + safe_name) if asset.get('sha256') else safe_name or f'asset_{idx:04d}'

        rel_path = asset.get('relativePath', asset.get('path', asset.get('file', '')))
        full_path = WORKSPACE / rel_path if rel_path else None
        out_file = OUT_DIR / f'{asset_id}.json'
        if not full_path or not full_path.exists():
            out_file.write_text(json.dumps({'id': asset_id, 'status': 'missing'}), encoding='utf-8')
            continue
        if is_lfs_stub(full_path):
            out_file.write_text(json.dumps({'id': asset_id, 'status': 'lfs-stub', 'path': str(rel_path)}), encoding='utf-8')
            skipped += 1
            continue
        try:
            import ezdxf
            doc = ezdxf.readfile(str(full_path))
            msp = doc.modelspace()
            counts = {}
            for e in msp:
                t = e.dxftype()
                counts[t] = counts.get(t, 0) + 1
            out_file.write_text(json.dumps({'id': asset_id, 'status': 'ok', 'path': str(rel_path), 'entity_counts': counts}), encoding='utf-8')
            processed += 1
        except Exception as ex:
            out_file.write_text(json.dumps({'id': asset_id, 'status': 'error', 'error': str(ex), 'path': str(rel_path)}), encoding='utf-8')
    print(f'A5 drawings: processed={processed}, lfs-stub={skipped}, total-dxf={len(dxf_assets)}')
    sys.exit(0)

if __name__ == '__main__':
    main()
