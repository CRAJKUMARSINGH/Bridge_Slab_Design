#!/usr/bin/env python3
"""Inventory uploaded legacy assets without modifying the source corpus.

The attached plans require inventory before trust. This first pass is
intentionally metadata-only and marks every record for review.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

KINDS = {
    ".xls": "workbook-legacy",
    ".xlsx": "workbook",
    ".xlsm": "workbook-macro",
    ".doc": "document-legacy",
    ".docx": "document",
    ".pdf": "pdf",
    ".dwg": "drawing-cad",
    ".dxf": "drawing-cad",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="attached_assets", type=Path)
    parser.add_argument("--out", default="project/asset-catalog/asset-register.json", type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        raise SystemExit(f"Asset root does not exist: {root}")

    files = []
    for path in sorted(item for item in root.rglob("*") if item.is_file()):
        kind = KINDS.get(path.suffix.lower())
        if kind is None:
            continue
        files.append(
            {
                "relativePath": path.relative_to(root.parent).as_posix(),
                "fileName": path.name,
                "extension": path.suffix.lower(),
                "kind": kind,
                "sizeBytes": path.stat().st_size,
                "sha256": sha256(path),
                "role": "unresolved",
                "disposition": "review",
                "reviewStatus": "review",
            }
        )

    registry = {
        "schemaVersion": "asset-register.v1",
        "sourceRoot": root.as_posix(),
        "sourceFilesAreImmutable": True,
        "reviewRequiredBeforeAssimilation": True,
        "files": files,
        "summary": {"fileCount": len(files)},
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(registry, indent=2) + "\n", encoding="utf-8")
    print(f"Indexed {len(files)} supported assets")
    print(f"Register: {args.out}")


if __name__ == "__main__":
    main()