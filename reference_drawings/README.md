# Reference Drawings Policy

This directory is the dedicated home for hand-drafted engineering drawings, reference designs, and other binary assets. To keep the repository lean and performant, we use a **two-layer policy** for managing these files.

## Layer 1: Representative Samples (Git LFS)
**What lives here:** A small set of representative sample drawings (e.g., one GAD per bridge type).
**How it's stored:** These files are tracked by **Git LFS (Large File Storage)**. They appear as normal files in your workspace but are stored efficiently in the background.

### Workflow:
1. **Initialize LFS** (one-time setup per machine):
   ```powershell
   git lfs install
   ```
2. **Add Files**:
   ```powershell
   cp ~/Desktop/new_drawing.dwg reference_drawings/
   git add reference_drawings/new_drawing.dwg
   git commit -m "ref: add new reference drawing"
   git push
   ```

## Layer 2: Historical Archive (Release Assets)
**What lives here:** The full multi-GB archive of historical drawings and large datasets.
**How it's stored:** These are zipped and attached as **Release Assets** on GitHub/Replit, rather than being committed to the repository history.
**Access:** Download the latest archive from the [Releases](https://github.com/CRAJKUMARSINGH/Bridge_Slab_Design/releases) page.

---

## Guidelines
- **Don't** commit large binaries (>2MB) outside of LFS-tracked patterns.
- **Don't** commit reproducible outputs (e.g., generated PDFs/DXFs).
- **Do** use descriptive folder names within this directory.
