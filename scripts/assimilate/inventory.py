#!/usr/bin/env python3
"""Create a content-addressed register for the legacy Office corpus.

This is deliberately metadata-only: it never edits or deletes source files.
The output is the first step of the controlled assimilation pipeline:

    inventory -> normalize -> extract -> classify -> map

Names are only hints.  Every record remains ``review`` until a human confirms
the project, document role, and disposition.

``--report`` turns the inventory into the A1 coverage gate (Action 1.6): it
prints the bucket table, writes ``evidence/assimilation-coverage.md``, and
exits 1 while any indexed asset is still ``unclassified``.  A bucket is only
ever granted by a decision record in
``project/asset-catalog/asset-classification.json`` — never inferred from a
filename — so the gate can only go green when a human has classified the
corpus.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]

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

# Action 1.6 / COMPREHENSIVE_IMPLEMENTATION_PLAN 3.3. Anything not in a bucket is
# `unclassified`, and `unclassified` is what fails the gate.
BUCKETS = {
    "used:numbers": "feeds a variable, coefficient or constraint",
    "used:narrative": "contributed a template or clause",
    "used:drawing": "mapped into the layout manifest",
    "superseded": "duplicate of a higher-precedence source (hash logged)",
    "out-of-scope": "explicitly excluded, with a written reason",
    "unclassified": "no decision record — the gate fails on these",
}

LFS_POINTER_PREFIX = b"version https://git-lfs.github.com/spec/v1"


def printable(text: str) -> str:
    """Windows' cp1252 console turns em-dashes into '?' on stdout; the files keep UTF-8."""
    return text.replace("—", "-").replace("–", "-")


def digest_and_lfs_state(path: Path) -> tuple[str, bool]:
    """Hash a file and report whether it is still an unsmeared Git LFS pointer.

    A pointer hashes to something, so the register would otherwise present a
    132-byte stub and a 1.1 MB workbook as equally indexed assets.
    """
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        head = handle.read(len(LFS_POINTER_PREFIX))
        handle.seek(0)
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest(), head.startswith(LFS_POINTER_PREFIX)


def load_decisions(path: Path) -> tuple[dict[str, dict[str, Any]], str]:
    """Read the human classification file, returning (records-by-key, status note).

    A missing or malformed file is not an error for a plain inventory run — it
    simply means every asset stays unclassified, which is what ``--report`` then
    fails on.
    """
    if not path.is_file():
        try:
            label = path.resolve().relative_to(REPO_ROOT).as_posix()
        except ValueError:
            label = path.as_posix()
        return {}, f"no decision file at {label} - every asset is unclassified"
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        return {}, f"decision file {path.name} is not valid JSON ({error}) — every asset is unclassified"

    records: dict[str, dict[str, Any]] = {}
    for entry in raw.get("decisions", []):
        key = str(entry.get("sha256") or entry.get("relativePath") or "").replace("\\", "/")
        bucket = entry.get("bucket")
        if not key:
            continue
        if bucket not in BUCKETS or bucket == "unclassified":
            records[key] = {"bucket": "unclassified", "reason": f"unknown bucket {bucket!r} in decision file"}
            continue
        if not entry.get("reason") or not entry.get("decidedBy"):
            records[key] = {"bucket": "unclassified", "reason": f"bucket {bucket} recorded without a reason or decider"}
            continue
        records[key] = {"bucket": bucket, "reason": str(entry["reason"]), "decidedBy": str(entry["decidedBy"])}

    return records, f"{len(records)} decision record(s) loaded from {path.name}"


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


def relative_root(root: Path) -> str:
    """Record the source root the way it was passed, not as this machine's absolute path."""
    try:
        return root.resolve().relative_to(REPO_ROOT).as_posix() or "."
    except ValueError:
        return root.as_posix()


def build_registry(root: Path, decisions: dict[str, dict[str, Any]]) -> dict[str, Any]:
    files = []
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        suffix = path.suffix.lower()
        if suffix not in OFFICE_EXTENSIONS:
            continue
        stat = path.stat()
        sha256, is_pointer = digest_and_lfs_state(path)
        relative_path = path.relative_to(root.parent).as_posix()
        decision = decisions.get(sha256) or decisions.get(relative_path) or {"bucket": "unclassified"}
        files.append(
            {
                "relativePath": relative_path,
                "fileName": path.name,
                "extension": suffix,
                "kind": OFFICE_EXTENSIONS[suffix],
                "sizeBytes": stat.st_size,
                "sha256": sha256,
                "lfsPointer": is_pointer,
                "projectHint": project_hint(path.name),
                "disposition": disposition(suffix),
                "reviewStatus": "review",
                "bucket": decision["bucket"],
                "bucketReason": decision.get("reason", ""),
                "bucketDecidedBy": decision.get("decidedBy", ""),
                "bucketByHash": decision["bucket"] != "unclassified" and sha256 in decisions,
            }
        )

    by_bucket = {bucket: sum(item["bucket"] == bucket for item in files) for bucket in BUCKETS}
    return {
        "schemaVersion": "asset-register.v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceRoot": relative_root(root),
        "sourceFilesAreImmutable": True,
        "reviewRequiredBeforeAssimilation": True,
        "files": files,
        "summary": {
            "fileCount": len(files),
            "byKind": {
                kind: sum(item["kind"] == kind for item in files)
                for kind in sorted(OFFICE_EXTENSIONS.values())
            },
            "byBucket": by_bucket,
            "unclassifiedCount": by_bucket["unclassified"],
            "lfsPointerCount": sum(item["lfsPointer"] for item in files),
        },
    }


def coverage_markdown(registry: dict[str, Any], decision_status: str) -> str:
    summary = registry["summary"]
    lines = [
        "# Assimilation coverage report",
        "",
        f"Generated `{datetime.now(timezone.utc).isoformat()}` by `scripts/assimilate/inventory.py --report`.",
        f"Source root: `{registry['sourceRoot']}`. Indexed assets: **{summary['fileCount']}**.",
        "",
        f"Classification source: {decision_status}.",
        "",
        "| Bucket | Count | Meaning |",
        "| --- | --- | --- |",
    ]
    for bucket, meaning in BUCKETS.items():
        lines.append(f"| `{bucket}` | {summary['byBucket'][bucket]} | {meaning} |")
    lines += [
        "",
        f"**{summary['lfsPointerCount']} of {summary['fileCount']} indexed files are Git LFS pointer stubs** "
        "— their sha256 is the pointer's, not the asset's, so classifying them would be classifying a "
        "132-byte placeholder. Run `git lfs pull` before A2–A5 (august-due.md §O-4, §P-6).",
        "",
        "Buckets are granted only by decision records in "
        "`project/asset-catalog/asset-classification.json`; filenames never classify anything. This file "
        "is generated — edit the decision file, not this report.",
        "",
    ]
    unclassified = [item for item in registry["files"] if item["bucket"] == "unclassified"]
    if unclassified:
        lines += [f"## Unclassified assets ({len(unclassified)})", ""]
        for item in unclassified:
            lines.append(f"- `{item['relativePath']}` — {item['kind']}, {item['sizeBytes']} B" + (" (LFS pointer)" if item["lfsPointer"] else ""))
        lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="Attached_Assets", type=Path)
    parser.add_argument("--out", default="evidence/asset-register.json", type=Path)
    parser.add_argument("--decisions", default=REPO_ROOT / "project" / "asset-catalog" / "asset-classification.json", type=Path)
    parser.add_argument("--report", "--coverage-report", dest="report", action="store_true", help="print the coverage table and fail on unclassified assets")
    parser.add_argument("--report-out", default=REPO_ROOT / "evidence" / "assimilation-coverage.md", type=Path)
    # `pnpm run assimilate -- --report` reaches this process as the literal tokens "--" "--report";
    # the flag is already on the script line, so the separator is dropped rather than parsed.
    args = parser.parse_args([token for token in sys.argv[1:] if token != "--"])

    root = args.root.resolve()
    if not root.is_dir():
        raise SystemExit(f"Asset root does not exist or is not a directory: {root}")

    decisions, decision_status = load_decisions(args.decisions)
    registry = build_registry(root, decisions)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(registry, indent=2) + "\n", encoding="utf-8")
    summary = registry["summary"]
    print(f"Indexed {summary['fileCount']} Office assets")
    print(f"Register: {args.out}")

    if not args.report:
        return

    print()
    print(f"Assimilation coverage ({printable(decision_status)})")
    print("| Bucket | Count | Meaning |")
    print("| --- | --- | --- |")
    for bucket, meaning in BUCKETS.items():
        print(f"| {bucket} | {summary['byBucket'][bucket]} | {printable(meaning)} |")
    print()
    print(f"LFS pointer stubs among indexed assets: {summary['lfsPointerCount']} of {summary['fileCount']}")
    args.report_out.parent.mkdir(parents=True, exist_ok=True)
    args.report_out.write_text(coverage_markdown(registry, decision_status), encoding="utf-8")
    print(f"Coverage report: {args.report_out}")

    if summary["unclassifiedCount"]:
        print(
            f"FAIL: {summary['unclassifiedCount']} of {summary['fileCount']} assets are unclassified. "
            "A2-A5 must not run over an unclassified corpus (Action 1.6)."
        )
        raise SystemExit(1)
    print("OK: every indexed asset carries a classification decision.")


if __name__ == "__main__":
    main()
