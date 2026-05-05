# Git LFS Setup Guide — Bridge_Slab_Design Repository

## What Is Git LFS and Why Does This Repo Need It?

All engineering source files in `Attached_Assets/` — `.doc`, `.xls`, `.docx`, `.xlsx`, `.dxf`, `.dwg`, `.pdf`,
and the STRUDS-style `.htm` files — are binary files that can be large (hundreds of kilobytes to several
megabytes). Storing them in plain Git bloats the repository and slows every `git clone`. Git LFS (Large File
Storage) replaces each binary with a small 130-byte text pointer in the Git history while storing the actual
content on an LFS server (GitHub's LFS backend in this case).

---

## Current LFS Coverage (`.gitattributes`)

The `.gitattributes` file at the root of the repository already configures Git LFS for the following patterns:

```
*.dxf *.dwg *.xls *.XLS *.pdf *.png *.jpg *.jpeg *.zip
*.xlsx *.XLSX *.doc *.DOC *.docx *.DOCX *.ppt *.pptx *.rar *.7z
Attached_Assets/**/*.htm   (STRUDS-style HTML — only under Attached_Assets)
Attached_Assets/**/*.HTM
```

> **Important:** `Attached_Assets/**/*.htm` uses the subfolder glob so that `client/index.html`
> and the main app's HTML files are NOT sent through LFS. Only the reference HTM files under
> Attached_Assets are tracked.

---

## Extended `.gitattributes` (apply these additions)

Add the lines below to the existing `.gitattributes` to cover additional file types found in this repo:

```gitattributes
# Additional binary types found in Attached_Assets
*.csv filter=lfs diff=lfs merge=lfs -text
Attached_Assets/**/*.txt filter=lfs diff=lfs merge=lfs -text
Attached_Assets/**/*.TXT filter=lfs diff=lfs merge=lfs -text

# Workbook assessment matrix (binary-equivalent large CSV)
Attached_Assets/workbook-assessment-matrix-template.csv filter=lfs diff=lfs merge=lfs -text

# DXF record keeper drawings
Dwg-Dxf-Record-Keeper/**/*.dxf filter=lfs diff=lfs merge=lfs -text
Dwg-Dxf-Record-Keeper/**/*.dwg filter=lfs diff=lfs merge=lfs -text

# Python CAD outputs
python_cad/**/*.dxf filter=lfs diff=lfs merge=lfs -text
python_cad/**/*.svg filter=lfs diff=lfs merge=lfs -text

# Generated sample outputs
sample/**/*.pdf filter=lfs diff=lfs merge=lfs -text
sample/**/*.xlsx filter=lfs diff=lfs merge=lfs -text
```

> **Do NOT add** `*.html` or `*.htm` as a global rule — the React app's
> `client/index.html` must stay in plain Git so the Vite build works.

---

## Step-by-Step: Clone and Pull LFS Files

```bash
# 1. Install Git LFS (one-time per machine)
git lfs install

# 2. Clone the repository
git clone https://github.com/CRAJKUMARSINGH/Bridge_Slab_Design.git
cd Bridge_Slab_Design

# 3. Pull the actual LFS file contents
git lfs pull

# 4. Verify LFS files are present (not just pointers)
git lfs ls-files | grep Attached_Assets
# Each line should show: <sha>  * Attached_Assets/<filename>
# If you see 130-byte placeholder text files, LFS pull did not complete.
```

---

## Step-by-Step: Push New or Modified LFS Files

```bash
# 1. Stage your changes normally
git add Attached_Assets/<new-or-modified-file>

# 2. Commit normally
git commit -m "feat(assets): add <description of file>"

# 3. Push commits AND LFS objects together
git push origin main
git lfs push origin main

# If collaborators see 130-byte pointers after pulling, the LFS push was skipped.
# Run: git lfs push --all origin main  to force-upload all objects.
```

---

## Verify LFS Coverage for All Attached_Assets Files

Run this command to confirm every binary in Attached_Assets is tracked by LFS:

```bash
# List all files in Attached_Assets not tracked by LFS
git ls-files Attached_Assets | while read f; do
  git check-attr filter "$f" | grep -v lfs && echo "NOT IN LFS: $f"
done

# On Windows (PowerShell):
git ls-files Attached_Assets | ForEach-Object {
  $attr = git check-attr filter $_
  if ($attr -notmatch "lfs") { Write-Host "NOT IN LFS: $_" }
}
```

Any file reported as `NOT IN LFS` should be added to `.gitattributes` and then migrated:

```bash
# Migrate an existing file to LFS (rewrites history — coordinate with team)
git lfs migrate import --include="Attached_Assets/*.xyz"
git push --force origin main
git lfs push origin main
```

---

## File Size Reference

| File Extension | Typical Size | LFS? |
|---|---|---|
| `.xls` / `.xlsx` | 50–500 KB | ✅ Yes |
| `.doc` / `.docx` | 30–200 KB | ✅ Yes |
| `.dxf` / `.dwg` | 100 KB–5 MB | ✅ Yes |
| `.pdf` | 200 KB–10 MB | ✅ Yes |
| `.htm` (STRUDS) | 50–200 KB | ✅ Yes (Attached_Assets only) |
| `.txt` (Attached_Assets) | 1–50 KB | ✅ Yes (explicit pattern) |
| `.csv` | 1–50 KB | ✅ Yes (Attached_Assets only) |
| `.ts` / `.tsx` / `.html` | &lt;50 KB | ❌ Plain Git |
| `.md` | &lt;10 KB | ❌ Plain Git |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| File opens as 3-line pointer text | LFS pull not run | `git lfs pull` |
| 403 error on push | LFS storage quota exceeded | Check GitHub LFS quota under Settings → Billing |
| File tracked but not in LFS after `git add` | `.gitattributes` pattern missing | Add pattern, then `git lfs migrate import --include="<pattern>"` |
| 130-byte files after clone | LFS not installed | `git lfs install` then `git lfs pull` |
| Case-sensitive path mismatch (Windows) | `Attached_Assets` vs `attached_assets` | Always use exact case `Attached_Assets` |

---

## Contact

Repository: `https://github.com/CRAJKUMARSINGH/Bridge_Slab_Design`
Branch: `main`
LFS backend: GitHub LFS (free tier: 1 GB storage, 1 GB bandwidth/month)
