"""
RAG service — pgvector + fastembed (local, free, multilingual).
Table rag_embeddings is created at app startup (main.py lifespan).

Schema:
    id        UUID
    content   TEXT    — chunk text
    metadata  JSONB   — source, chapter, topic, etc.
    embedding vector(384) — intfloat/multilingual-e5-small
"""
import json
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ai.embeddings import get_embedding, get_query_embedding


class RAGService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def retrieve(self, query: str, player=None, top_k: int = 5) -> str:
        """
        Find top_k nearest chunks by cosine distance.
        Returns joined texts or '' if DB empty / error.
        Uses query-prefixed embedding for better multilingual retrieval.
        """
        try:
            embedding = await get_query_embedding(query)
            vec_str = "[" + ",".join(str(x) for x in embedding) + "]"

            result = await self.db.execute(
                text("""
                    SELECT content, metadata,
                           1 - (embedding <=> (:vec)::vector) AS score
                    FROM rag_embeddings
                    ORDER BY embedding <=> (:vec)::vector
                    LIMIT :top_k
                """),
                {"vec": vec_str, "top_k": top_k},
            )
            rows = result.fetchall()
            if not rows:
                return ""

            # Only include chunks with similarity > 0.3 (avoid noise)
            relevant = [row for row in rows if row[2] > 0.30]
            if not relevant:
                relevant = rows[:2]  # fallback: at least top-2

            return "\n\n---\n\n".join(row[0] for row in relevant)

        except Exception:
            return ""

    async def ingest_document(self, content: str, metadata: dict) -> None:
        """Add a document chunk to the knowledge base."""
        embedding = await get_embedding(content)
        vec_str = "[" + ",".join(str(x) for x in embedding) + "]"

        await self.db.execute(
            text("""
                INSERT INTO rag_embeddings (content, metadata, embedding)
                VALUES (:content, :metadata::jsonb, (:vec)::vector)
            """),
            {
                "content": content,
                "metadata": json.dumps(metadata, ensure_ascii=False),
                "vec": vec_str,
            },
        )
        await self.db.commit()

    async def count(self) -> int:
        """Return total number of chunks in the knowledge base."""
        result = await self.db.execute(text("SELECT COUNT(*) FROM rag_embeddings"))
        return result.scalar()
