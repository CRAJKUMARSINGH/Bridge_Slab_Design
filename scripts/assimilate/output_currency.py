"""Relocate stage records that no current register entry produces any more.

Why this exists: every assimilation stage names its output after the asset's content
hash (`<sha256[:12]>_<fileName>.json`). When a file's bytes change — the LFS pointer
stubs materialising being the case that forced this — the stage writes a NEW record and
leaves the OLD one beside it. Nothing deletes records, so the directory then counts 191
files for a 96-asset corpus, and "31 workbooks classified" is a number that includes 15
readings of 132-byte pointers.

The relocation is a move into `<stage>/pointer-era/`, never a delete, and stages glob
only the top level, so the ghosts stop being inputs while staying on disk.
"""
import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[2]
REGISTER = WORKSPACE / 'asset-register.json'
STALE_SUBDIR = 'pointer-era'


def register_assets():
    """The register's asset list, tolerating either schema the stages accept."""
    if not REGISTER.exists():
        return []
    reg = json.loads(REGISTER.read_text(encoding='utf-8'))
    return reg.get('files', reg if isinstance(reg, list) else reg.get('assets', []))


def relocate_stale(out_dir: Path, expected_names) -> list:
    """Move every top-level record in out_dir that no current input produces.

    Returns the relocated file names. A stage run before its input exists relocates
    everything it wrote, which is the truthful outcome, so this is not a failure.
    """
    expected = set(expected_names)
    moved = []
    for record in sorted(out_dir.glob('*.json')):
        if record.name in expected:
            continue
        (out_dir / STALE_SUBDIR).mkdir(parents=True, exist_ok=True)
        record.rename(out_dir / STALE_SUBDIR / record.name)
        moved.append(record.name)
    return moved
