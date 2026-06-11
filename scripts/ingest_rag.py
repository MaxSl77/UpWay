"""
Standalone RAG ingestion script.
Reads 3 JSON files from data/ and loads them into PostgreSQL (pgvector).
Connects to localhost:5433 (Docker port mapping).

Usage:
    python scripts/ingest_rag.py
    python scripts/ingest_rag.py --clear   # clear existing data first
"""
import sys, io, json, argparse, time
from pathlib import Path
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import psycopg2
from fastembed import TextEmbedding

# ── Config ─────────────────────────────────────────────────────────────────
DB_URL = "postgresql://upway:upway@localhost:5433/upway"
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
EMBEDDING_DIM = 768

DATA_DIR = Path(__file__).parent.parent / "data"

RAG_FILES = [
    DATA_DIR / "PolozhenieRussia_rag.json",
    DATA_DIR / "РегламентРБ24-27сИзмВ25_rag.json",
    DATA_DIR / "UpWay_Tishkevich_rag.json",
]


def setup_db(conn) -> None:
    """Create pgvector extension and rag_embeddings table if not exist."""
    with conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS rag_embeddings (
                id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                content  TEXT NOT NULL,
                metadata JSONB DEFAULT '{{}}'::jsonb,
                embedding vector({EMBEDDING_DIM})
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS rag_emb_idx ON rag_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50)")
    conn.commit()
    print("DB schema ready.")


def clear_db(conn) -> None:
    with conn.cursor() as cur:
        cur.execute("TRUNCATE rag_embeddings")
    conn.commit()
    print("Cleared existing RAG data.")


def load_model() -> TextEmbedding:
    print(f"Loading embedding model '{EMBEDDING_MODEL}'...")
    print("(First run downloads ~120 MB — subsequent runs use cache)")
    model = TextEmbedding(model_name=EMBEDDING_MODEL)
    print("Model ready.")
    return model


def embed_batch(model: TextEmbedding, texts: list[str]) -> list[list[float]]:
    """Embed list of texts with passage prefix."""
    embeddings = list(model.embed(texts))
    return [e.tolist() for e in embeddings]


def ingest_file(conn, model: TextEmbedding, path: Path) -> int:
    with open(path, encoding="utf-8") as f:
        chunks = json.load(f)

    print(f"\n→ {path.name}: {len(chunks)} chunks")

    BATCH = 32
    inserted = 0

    for i in range(0, len(chunks), BATCH):
        batch = chunks[i:i + BATCH]
        texts = [c["text"] for c in batch]
        metas = [c.get("metadata", {}) for c in batch]

        vectors = embed_batch(model, texts)

        with conn.cursor() as cur:
            for text_val, meta, vec in zip(texts, metas, vectors):
                vec_str = "[" + ",".join(f"{x:.8f}" for x in vec) + "]"
                cur.execute(
                    """
                    INSERT INTO rag_embeddings (content, metadata, embedding)
                    VALUES (%s, %s::jsonb, %s::vector)
                    """,
                    (text_val, json.dumps(meta, ensure_ascii=False), vec_str),
                )
        conn.commit()
        inserted += len(batch)

        pct = min(100, int(inserted / len(chunks) * 100))
        print(f"  [{pct:3d}%] {inserted}/{len(chunks)} chunks", end="\r")

    print(f"  [100%] {inserted}/{len(chunks)} chunks — done")
    return inserted


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--clear", action="store_true", help="Clear existing RAG data before ingestion")
    args = parser.parse_args()

    print("=" * 60)
    print("UpWay RAG Ingestion")
    print("=" * 60)

    print(f"\nConnecting to {DB_URL}...")
    conn = psycopg2.connect(DB_URL)
    print("Connected.")

    setup_db(conn)

    if args.clear:
        clear_db(conn)

    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM rag_embeddings")
        existing = cur.fetchone()[0]
    print(f"Existing chunks in DB: {existing}")

    model = load_model()

    t0 = time.time()
    total = 0
    for path in RAG_FILES:
        try:
            n = ingest_file(conn, model, path)
            total += n
        except FileNotFoundError:
            print(f"  WARNING: file not found, skipping: {path}")

    elapsed = time.time() - t0

    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM rag_embeddings")
        final = cur.fetchone()[0]

    conn.close()

    print("\n" + "=" * 60)
    print(f"Ingestion complete in {elapsed:.1f}s")
    print(f"Chunks added this run : {total}")
    print(f"Total chunks in DB    : {final}")
    print("=" * 60)


if __name__ == "__main__":
    main()
