#!/usr/bin/env python3
"""Scrape the Warner/Butler/Geary Mutsun dictionary PDF into local text assets.

This keeps the pipeline dependency-light: curl downloads the PDF, Poppler's
pdftotext/pdfinfo extract text and metadata, and this script creates page and
chunk JSON files for later review/RAG ingestion.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from datetime import date
from pathlib import Path


DEFAULT_URL = "https://www.santacruzmuseum.org/wp-content/uploads/2020/10/MutsunDictionary_WarnerButlerGeary.pdf"


def run(command: list[str]) -> str:
    completed = subprocess.run(
        command,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return completed.stdout


def parse_pdfinfo(text: str) -> dict[str, str]:
    metadata: dict[str, str] = {}
    for line in text.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        metadata[key.strip()] = value.strip()
    return metadata


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def normalize_text(text: str) -> str:
    lines = [line.rstrip() for line in text.replace("\u00a0", " ").splitlines()]
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return "\n".join(lines)


def chunk_page(page_number: int, text: str, max_chars: int) -> list[dict[str, object]]:
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    chunks: list[dict[str, object]] = []
    current: list[str] = []
    current_length = 0

    for paragraph in paragraphs:
        additional = len(paragraph) + (2 if current else 0)
        if current and current_length + additional > max_chars:
            chunks.append(
                {
                    "id": f"mutsun-dictionary-p{page_number:03d}-c{len(chunks) + 1:02d}",
                    "source_id": "mutsun-dictionary-warner-butler-geary-2016",
                    "page": page_number,
                    "text": "\n\n".join(current),
                    "review_status": "raw_pdf_extract",
                }
            )
            current = []
            current_length = 0

        if len(paragraph) > max_chars:
            for start in range(0, len(paragraph), max_chars):
                piece = paragraph[start : start + max_chars].strip()
                if piece:
                    chunks.append(
                        {
                            "id": f"mutsun-dictionary-p{page_number:03d}-c{len(chunks) + 1:02d}",
                            "source_id": "mutsun-dictionary-warner-butler-geary-2016",
                            "page": page_number,
                            "text": piece,
                            "review_status": "raw_pdf_extract",
                        }
                    )
            continue

        current.append(paragraph)
        current_length += additional

    if current:
        chunks.append(
            {
                "id": f"mutsun-dictionary-p{page_number:03d}-c{len(chunks) + 1:02d}",
                "source_id": "mutsun-dictionary-warner-butler-geary-2016",
                "page": page_number,
                "text": "\n\n".join(current),
                "review_status": "raw_pdf_extract",
            }
        )

    return chunks


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--out-dir", default="data/raw/mutsun_dictionary")
    parser.add_argument("--max-chars", type=int, default=1800)
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = out_dir / "MutsunDictionary_WarnerButlerGeary.pdf"
    layout_text_path = out_dir / "MutsunDictionary_WarnerButlerGeary.layout.txt"
    raw_text_path = out_dir / "MutsunDictionary_WarnerButlerGeary.raw.txt"
    pdfinfo_path = out_dir / "pdfinfo.txt"
    manifest_path = out_dir / "manifest.json"
    pages_path = out_dir / "pages.json"
    chunks_path = out_dir / "chunks.jsonl"

    run(["curl", "-L", "--fail", "--show-error", "--output", str(pdf_path), args.url])
    pdfinfo = run(["pdfinfo", str(pdf_path)])
    pdfinfo_path.write_text(pdfinfo, encoding="utf-8")
    run(["pdftotext", "-layout", "-enc", "UTF-8", str(pdf_path), str(layout_text_path)])
    run(["pdftotext", "-raw", "-enc", "UTF-8", str(pdf_path), str(raw_text_path)])

    layout_text = layout_text_path.read_text(encoding="utf-8")
    raw_pages = layout_text.split("\f")
    pages = [
        {
            "page": index + 1,
            "source_id": "mutsun-dictionary-warner-butler-geary-2016",
            "text": normalize_text(page),
        }
        for index, page in enumerate(raw_pages)
        if normalize_text(page)
    ]

    chunks = [
        chunk
        for page in pages
        for chunk in chunk_page(page["page"], str(page["text"]), args.max_chars)
    ]

    pages_path.write_text(json.dumps(pages, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with chunks_path.open("w", encoding="utf-8") as handle:
        for chunk in chunks:
            handle.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    metadata = parse_pdfinfo(pdfinfo)
    manifest = {
        "source_id": "mutsun-dictionary-warner-butler-geary-2016",
        "title": "Mutsun-English English-Mutsun Dictionary",
        "authors": ["Natasha Warner", "Lynnika Butler", "Quirina Geary"],
        "url": args.url,
        "canonical_handle": "http://hdl.handle.net/10125/24679",
        "license": "Creative Commons Attribution Non-Commercial 4.0 International",
        "license_short": "CC BY-NC 4.0",
        "scraped_date": date.today().isoformat(),
        "extraction_method": "curl + poppler pdfinfo + pdftotext layout/raw",
        "page_count": int(metadata.get("Pages", len(pages))),
        "text_pages_extracted": len(pages),
        "chunk_count": len(chunks),
        "pdf_sha256": sha256(pdf_path),
        "pdfinfo": metadata,
        "rights_note": "Dictionary text is CC BY-NC 4.0. Keep non-commercial use and community review constraints visible before model training or redistribution.",
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "pdf": str(pdf_path),
        "pages": len(pages),
        "chunks": len(chunks),
        "manifest": str(manifest_path),
    }, indent=2))


if __name__ == "__main__":
    main()
