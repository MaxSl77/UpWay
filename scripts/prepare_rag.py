"""
Prepare РегламентРБ24-27сИзмВ25.pdf for RAG ingestion.
Output: data/РегламентРБ24-27сИзмВ25_rag.json — array of {text, metadata} ready for embedding.

Usage:
    python scripts/prepare_rag.py
"""
import sys, io, re, json
from pathlib import Path
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import pdfplumber

DATA_DIR = Path(__file__).parent.parent / "data"
PDF_PATH = DATA_DIR / "РегламентРБ24-27сИзмВ25.pdf"
OUT_PATH = DATA_DIR / "РегламентРБ24-27сИзмВ25_rag.json"

CHUNK_TARGET = 600   # target tokens (~4 chars/token → ~2400 chars)
CHUNK_MAX    = 800   # hard max
OVERLAP_SENT = 2     # sentences carried over to next chunk


def extract_pages(path: Path) -> list[tuple[int, str]]:
    """Extract (page_num, text) for all pages, skipping cover/TOC pages."""
    pages = []
    with pdfplumber.open(path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            text = text.strip()
            if not text:
                continue
            dot_ratio = text.count("....") / max(len(text), 1)
            if dot_ratio > 0.05:
                continue
            pages.append((i + 1, text))
    return pages


def merge_pages(pages: list[tuple[int, str]]) -> str:
    parts = []
    for page_num, text in pages:
        parts.append(f"[PAGE:{page_num}]\n{text}")
    return "\n\n".join(parts)


CHAPTER_RE = re.compile(
    r'^(ГЛАВА\s+\d+[\.\s].+|ТЕРМИНЫ,\s+ОПРЕДЕЛЕНИЯ.+|ПРИЛОЖЕНИЕ\s+\d+.*)$',
    re.MULTILINE | re.IGNORECASE
)
ARTICLE_RE = re.compile(r'^Статья\s+\d+\.', re.MULTILINE)


def split_into_sections(text: str) -> list[dict]:
    splits = list(CHAPTER_RE.finditer(text))
    sections = []

    for idx, match in enumerate(splits):
        heading = match.group(0).strip()
        start = match.end()
        end = splits[idx + 1].start() if idx + 1 < len(splits) else len(text)
        body = text[start:end].strip()

        chapter_match  = re.search(r'ГЛАВА\s+(\d+)', heading, re.IGNORECASE)
        appendix_match = re.search(r'ПРИЛОЖЕНИЕ\s+(\d+)', heading, re.IGNORECASE)
        terms_match    = re.search(r'ТЕРМИНЫ', heading, re.IGNORECASE)

        if chapter_match:
            chapter_num  = int(chapter_match.group(1))
            section_type = "chapter"
        elif appendix_match:
            chapter_num  = int(appendix_match.group(1))
            section_type = "appendix"
        elif terms_match:
            chapter_num  = 0
            section_type = "terms"
        else:
            chapter_num  = -1
            section_type = "other"

        title = re.sub(r'ГЛАВА\s+\d+[\.\s]*', '', heading, flags=re.IGNORECASE).strip()
        title = re.sub(r'ПРИЛОЖЕНИЕ\s+\d+[\.\s]*', '', title, flags=re.IGNORECASE).strip()
        if not title:
            title = heading

        sections.append({
            "heading": heading,
            "title": title,
            "chapter_num": chapter_num,
            "section_type": section_type,
            "body": body,
        })

    return sections


def _split_by_sentences(text: str, target_chars: int, overlap_chars: int) -> list[str]:
    sentence_re = re.compile(r'(?<=[.!?])\s+(?=[А-ЯA-Z\d«])')
    sentences = [s.strip() for s in sentence_re.split(text) if s.strip()]
    if len(sentences) <= 1:
        result = []
        for i in range(0, len(text), target_chars - overlap_chars):
            result.append(text[i:i + target_chars])
        return result

    chunks = []
    current: list[str] = []
    current_len = 0
    for sent in sentences:
        if current_len + len(sent) > target_chars and current:
            chunks.append(" ".join(current))
            tail = []
            tail_len = 0
            for s in reversed(current):
                if tail_len + len(s) <= overlap_chars:
                    tail.insert(0, s)
                    tail_len += len(s)
                else:
                    break
            current = tail + [sent]
            current_len = sum(len(s) for s in current)
        else:
            current.append(sent)
            current_len += len(sent)
    if current:
        chunks.append(" ".join(current))
    return chunks


def split_into_chunks(body: str, target_chars: int = 2000, overlap_chars: int = 400) -> list[str]:
    body = re.sub(r'\[PAGE:\d+\]\n?', '', body)

    article_positions = [m.start() for m in re.finditer(r'Статья\s+\d+\.', body)]

    if len(article_positions) > 1:
        units = []
        for i, pos in enumerate(article_positions):
            end = article_positions[i + 1] if i + 1 < len(article_positions) else len(body)
            units.append(body[pos:end].strip())
    else:
        sentence_re = re.compile(r'(?<=[.!?])\s+(?=[А-ЯA-Z\d])')
        units = [s.strip() for s in sentence_re.split(body) if s.strip()]
        if not units:
            units = [body]

    chunks = []
    current_parts: list[str] = []
    current_len = 0
    overlap_tail = ""

    for unit in units:
        unit_len = len(unit)

        if unit_len >= target_chars and not current_parts:
            sub_chunks = _split_by_sentences(unit, target_chars, overlap_chars)
            if overlap_tail:
                sub_chunks[0] = overlap_tail + "\n\n" + sub_chunks[0]
            chunks.extend(sub_chunks)
            overlap_tail = sub_chunks[-1][-overlap_chars:] if sub_chunks else ""
            continue

        if current_len + unit_len > target_chars and current_parts:
            text = "\n\n".join(current_parts)
            if overlap_tail:
                text = overlap_tail + "\n\n" + text
            chunks.append(text.strip())
            overlap_tail = current_parts[-1][-overlap_chars:] if current_parts else ""
            current_parts = []
            current_len = 0
            if unit_len >= target_chars:
                sub_chunks = _split_by_sentences(unit, target_chars, overlap_chars)
                if overlap_tail and sub_chunks:
                    sub_chunks[0] = overlap_tail + "\n\n" + sub_chunks[0]
                chunks.extend(sub_chunks)
                overlap_tail = sub_chunks[-1][-overlap_chars:] if sub_chunks else ""
            else:
                current_parts = [unit]
                current_len = unit_len
        else:
            current_parts.append(unit)
            current_len += unit_len

    if current_parts:
        text = "\n\n".join(current_parts)
        if overlap_tail:
            text = overlap_tail + "\n\n" + text
        chunks.append(text.strip())

    return [c for c in chunks if c.strip()] or [body[:target_chars]]


def extract_article_number(text: str) -> str | None:
    m = re.search(r'Статья\s+(\d+)\.', text)
    return m.group(1) if m else None


def build_rag_documents(sections: list[dict]) -> list[dict]:
    docs = []
    for section in sections:
        chunks = split_into_chunks(section["body"])
        for i, chunk_text in enumerate(chunks):
            article = extract_article_number(chunk_text)
            metadata = {
                "source": "РегламентРБ",
                "document_title": "Регламент ФХБ 24-27",
                "section_type": section["section_type"],
                "chapter_num": section["chapter_num"],
                "chapter_title": section["title"],
                "chunk_index": i,
                "total_chunks": len(chunks),
            }
            if article:
                metadata["article_number"] = int(article)

            full_text = f"{section['heading']}\n\n{chunk_text}"
            docs.append({"text": full_text, "metadata": metadata})
    return docs


def main():
    print("Extracting pages...", flush=True)
    pages = extract_pages(PDF_PATH)
    print(f"  {len(pages)} content pages found")

    full_text = merge_pages(pages)
    print(f"  Total chars: {len(full_text):,}")

    print("Splitting into sections...")
    sections = split_into_sections(full_text)
    print(f"  {len(sections)} sections found:")
    for s in sections:
        print(f"    [{s['section_type']}] ch={s['chapter_num']} | {s['title'][:50]} | {len(s['body']):,} chars")

    print("Chunking sections...")
    docs = build_rag_documents(sections)
    print(f"  {len(docs)} chunks total")

    lengths = [len(d['text']) for d in docs]
    print(f"  Chunk sizes: min={min(lengths)}, avg={sum(lengths)//len(lengths)}, max={max(lengths)} chars")

    print(f"Writing {OUT_PATH}...")
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False, indent=2)

    print("Done.")
    print(f"\nSample chunk 0:")
    print(docs[0]['text'][:400])
    print("...")
    print(f"Metadata: {docs[0]['metadata']}")


if __name__ == "__main__":
    main()
