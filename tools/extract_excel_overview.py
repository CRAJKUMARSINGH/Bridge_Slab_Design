import os
import sys
import json
from glob import glob

try:
    import xlrd  # supports legacy .xls (version 1.2.0 recommended)
except Exception as exc:
    print(json.dumps({"error": f"xlrd import failed: {exc}"}))
    sys.exit(1)


LABELS_OF_INTEREST = [
    "Discharge", "Q", "Manning", "n", "Slope", "Velocity", "Regime", "Effective Waterway",
    "Afflux", "HFL", "SBC", "L_eff", "L cc", "L_cc", "W_cap", "Deck Level", "Foundation Level",
    "Bed Level", "Eccentricity", "Moment", "Reaction", "Impact", "Stem", "Toe", "Heel", "Ka", "Active",
]


def cell_name(rowx: int, colx: int) -> str:
    # Convert zero-based indices to Excel-like A1
    name = ""
    col = colx
    while True:
        name = chr(col % 26 + ord('A')) + name
        col = col // 26 - 1
        if col < 0:
            break
    return f"{name}{rowx + 1}"


def scan_xls(path: str) -> dict:
    out = {
        "file": path,
        "sheets": [],
        "labels": [],
    }
    try:
        book = xlrd.open_workbook(path, formatting_info=False)
        for s in book.sheets():
            out["sheets"].append(s.name)
            # light label scan (first 200 rows x 15 cols)
            max_rows = min(200, s.nrows)
            max_cols = min(15, s.ncols)
            for r in range(max_rows):
                for c in range(max_cols):
                    val = s.cell_value(r, c)
                    if isinstance(val, str):
                        text = val.strip()
                        for L in LABELS_OF_INTEREST:
                            if L.lower() in text.lower():
                                out["labels"].append({
                                    "sheet": s.name,
                                    "label": text,
                                    "cell": cell_name(r, c)
                                })
                                break
    except Exception as exc:
        out["error"] = str(exc)
    return out


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    targets = [
        os.path.join(root, "UIT BRIDGES", "Bridge Nr Police Chowki", "*.xls"),
        os.path.join(root, "KHERWARA BRIDGE", "*.xls"),
        os.path.join(root, "PARASRAM BRIDGE", "Jethliya Sobhaniya Teendhari Chhatri Ch. 0850", "*.xls"),
    ]
    files = []
    for pattern in targets:
        files.extend(glob(pattern))

    summary = []
    for f in sorted(set(files)):
        if f.lower().endswith('.xls'):
            summary.append(scan_xls(f))

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()



