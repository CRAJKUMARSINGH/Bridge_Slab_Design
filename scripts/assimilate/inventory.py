#!/usr/bin/env python3
"""Create a content-addressed register for the legacy Office corpus.

This is deliberately metadata-only: it never edits or deletes source files.
The output is the first step of the controlled assimilation pipeline:

    inventory -> normalize -> extract -> classify -> map

Names are only hints.  Every record remains ``review`` until a human confirms
the project, document role, and disposition.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


OFFICE_EXTENSIONS = {
    ".xls": "workbook-legacy",
    ".xlsx": "workbook",
    ".xlsm": "workbook-macro",
    ".doc": "document-legacy",
    ".docx": "document",
    ".pdf": "pdf",
    ".dwg": "drawing-cad",
    ".dxf": "drawing-cad",
    ".zip": "archive",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def project_hint(name: str) -> str:
    upper = name.upper()
    if "KHERWARA" in upper or "KHARKA" in upper:
        return "kherwara-kharka-review"
    if "LARATHI" in upper or "STABIL" in upper:
        return "larathi-stabil-review"
    if "BEDACH" in upper or "BRIDGE" in upper:
        return "bridge-general-review"
    return "unassigned"


def disposition(extension: str) -> str:
    if extension in {".xls", ".doc"}:
        return "retain-and-normalize"
    if extension in {".dwg", ".dxf"}:
        return "retain-and-map"
    if extension in {".pdf", ".xlsx", ".xlsm", ".docx"}:
        return "retain-and-extract"
    return "review"


def build_registry(root: Path) -> dict:
    files = []
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        suffix = path.suffix.lower()
        if suffix not in OFFICE_EXTENSIONS:
            continue
        stat = path.stat()
        files.append(
            {
                "relativePath": path.relative_to(root.parent).as_posix(),
                "fileName": path.name,
                "extension": suffix,
                "kind": OFFICE_EXTENSIONS[suffix],
                "sizeBytes": stat.st_size,
                "sha256": sha256(path),
                "projectHint": project_hint(path.name),
                "disposition": disposition(suffix),
                "reviewStatus": "review",
            }
        )

    return {
        "schemaVersion": "asset-register.v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceRoot": root.as_posix(),
        "sourceFilesAreImmutable": True,
        "reviewRequiredBeforeAssimilation": True,
        "files": files,
        "summary": {
            "fileCount": len(files),
            "byKind": {
                kind: sum(item["kind"] == kind for item in files)
                for kind in sorted(OFFICE_EXTENSIONS.values())
            },
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="Attached_Assets", type=Path)
    parser.add_argument("--out", default="evidence/asset-register.json", type=Path)
    args = parser.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        raise SystemExit(f"Asset root does not exist or is not a directory: {root}")

    registry = build_registry(root)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(registry, indent=2) + "\n", encoding="utf-8")
    print(f"Indexed {registry['summary']['fileCount']} Office assets")
    print(f"Register: {args.out}")


if __name__ == "__main__":
    main()
