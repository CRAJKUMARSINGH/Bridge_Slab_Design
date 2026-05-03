# Attached_Assets

Legacy bridge-office reference material (Excel stability models, Word notes, sample STRUDS-style HTML, drawings metadata). The application code refers to paths here for layout and evidence (for example `DETAILED SLAB DESIGN.htm`).

## Git and Git LFS

Most office binaries under this folder are stored with **Git LFS** (`.xls`, `.doc`, `.docx`, `.pdf`, images, etc.). Plain text (`.txt`, `.md`, `.csv`) stays in normal Git.

### Clone with file contents

```bash
git lfs install
git clone <repo-url>
cd Bridge_Slab_Design
git lfs pull
```

### Push so remotes receive full assets

After committing LFS-tracked files, push **both** commits and LFS objects:

```bash
git push origin <branch>
git lfs push origin <branch>
```

If collaborators see tiny pointer files instead of real `.xls`/`.doc`, the LFS upload step was skipped or the remote does not have **Git LFS** enabled.

### Verify local LFS coverage

```bash
git lfs ls-files | findstr Attached_Assets
```

(On Linux/macOS use `grep Attached_Assets`.)

## Folder note

`0 commands only/` holds operator prompts and ecosystem links (`assets directory.txt`); keep it in Git so daemons and docs stay reproducible.
