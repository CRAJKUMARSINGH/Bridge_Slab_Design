"""
Build a local FAISS knowledge base from bridge reference documents.

Default source folder:
  C:\\Users\\Rajkumar\\Bridge_Slab_Design\\Attached_Assets

Install once:
  pip install langchain-community "unstructured[all-docs]" openpyxl pypdf docx2txt faiss-cpu sentence-transformers

Run:
  python scripts/ingest_bridge_documents.py
  python scripts/ingest_bridge_documents.py --folder Attached_Assets --out bridge_knowledge_faiss
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    PyPDFLoader,
    UnstructuredExcelLoader,
    UnstructuredFileLoader,
    UnstructuredWordDocumentLoader,
)
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS


DEFAULT_FOLDER = Path(__file__).resolve().parents[1] / "Attached_Assets"
DEFAULT_DB = Path(__file__).resolve().parents[1] / "bridge_knowledge_faiss"
SUPPORTED_EXTENSIONS = {
    ".xlsx",
    ".xls",
    ".docx",
    ".doc",
    ".pdf",
    ".txt",
    ".htm",
    ".html",
    ".csv",
    ".dwg",
    ".dxf",
}


def iter_source_files(folder: Path) -> Iterable[Path]:
    for file_path in folder.rglob("*"):
        if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_EXTENSIONS:
            yield file_path


def load_document(file_path: Path):
    suffix = file_path.suffix.lower()
    try:
        if suffix in {".xlsx", ".xls"}:
            loader = UnstructuredExcelLoader(str(file_path), mode="elements")
        elif suffix in {".docx", ".doc"}:
            loader = UnstructuredWordDocumentLoader(str(file_path), mode="elements")
        elif suffix == ".pdf":
            loader = PyPDFLoader(str(file_path))
        else:
            loader = UnstructuredFileLoader(str(file_path))

        docs = loader.load()
        print(f"OK loaded: {file_path.name} ({len(docs)} chunks)")
        return docs
    except Exception as exc:  # noqa: BLE001 - ingestion should keep scanning other files.
        print(f"SKIP failed: {file_path.name}: {exc}")
        return []


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest bridge documents into a local FAISS store.")
    parser.add_argument("--folder", default=str(DEFAULT_FOLDER), help="Folder containing bridge source documents.")
    parser.add_argument("--out", default=str(DEFAULT_DB), help="Output FAISS database folder.")
    parser.add_argument("--model", default="sentence-transformers/all-MiniLM-L6-v2", help="Embedding model name.")
    args = parser.parse_args()

    folder = Path(args.folder).resolve()
    out = Path(args.out).resolve()
    if not folder.is_dir():
        raise SystemExit(f"Source folder not found: {folder}")

    print(f"Starting bridge document ingestion from: {folder}")
    all_documents = []
    processed_files = 0
    for file_path in iter_source_files(folder):
        docs = load_document(file_path)
        if docs:
            processed_files += 1
            all_documents.extend(docs)

    print(f"Total loaded document elements: {len(all_documents)}")
    if not all_documents:
        raise SystemExit("No supported documents were loaded.")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""],
    )
    split_docs = splitter.split_documents(all_documents)
    print(f"Split into chunks: {len(split_docs)}")

    embeddings = HuggingFaceEmbeddings(model_name=args.model)
    vectorstore = FAISS.from_documents(split_docs, embeddings)
    vectorstore.save_local(str(out))

    metadata = {
        "source_folder": str(folder),
        "output_db": str(out),
        "embedding_model": args.model,
        "processed_files": processed_files,
        "total_document_elements": len(all_documents),
        "total_chunks": len(split_docs),
    }
    metadata_path = out.with_name(f"{out.name}_metadata.json")
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"SUCCESS knowledge base saved to: {out}")
    print(f"Metadata saved to: {metadata_path}")


if __name__ == "__main__":
    main()
