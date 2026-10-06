# Archive: ingest_bridge_documents.py

**Archived:** 2026-10-06 — august-due.md §18b

## What it does

`ingest_bridge_documents.py` reads bridge reference documents (`.xlsx`, `.xls`, `.docx`, `.doc`,
`.pdf`, `.txt`, `.htm`, `.html`, `.csv`, `.dwg`, `.dxf`) from a source folder (default:
`Attached_Assets/`), splits them into overlapping text chunks, embeds them with
`sentence-transformers/all-MiniLM-L6-v2` via HuggingFace, and writes a local FAISS vector store
plus a metadata JSON file. The result is a Retrieval-Augmented Generation (RAG) knowledge base that
could answer questions about the bridge documents.

## Why it is archived

- **Zero wiring.** No `pnpm` script, gate, pipeline step, or CI job invokes this script. It was
  never connected to any deliverable in the current project.
- **RAG ingestion is not part of any current gate.** The assimilation pipeline (A1–A5) uses Python
  for inventory, normalization, and cell classification — not vector-store construction.
- **Heavy dependencies not installed.** The script requires `langchain`, `langchain-community`,
  `faiss-cpu`, and `sentence-transformers`. None of these is installed on this machine
  (`import langchain` → `ModuleNotFoundError`).

## Why langchain / faiss-node / HuggingFaceEmbeddings are NOT in requirements.txt

`requirements.txt` pins only the three packages that are verified installed on this host
(`ezdxf`, `openpyxl`, `pydantic`). Pinning a version for a package that has never been installed
would fabricate a version number. If this script is restored, add the langchain stack to
`requirements.txt` after verifying the installed versions with `pip list`.

## Restore path

1. Move this file back to `scripts/ingest_bridge_documents.py`.
2. Run: `pip install langchain-community "unstructured[all-docs]" openpyxl pypdf docx2txt faiss-cpu sentence-transformers`
3. Verify imports resolve, then record the versions in `requirements.txt`.
4. Wire the script to a gate or pipeline step (e.g., as a pre-step to the A2/A3 assimilation stages).
5. Materialise the asset corpus first (`git lfs pull`) — the script reads from `Attached_Assets/`,
   which currently holds 710 LFS pointer stubs out of 715 files (§P-6).
