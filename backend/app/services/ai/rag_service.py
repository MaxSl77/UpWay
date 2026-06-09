"""
RAG service — прямая реализация через pgvector + OpenAI Embeddings.
Без llama-index: чище, быстрее, нет конфликтов версий с Python 3.12.

Таблица rag_embeddings создаётся при старте приложения (main.py lifespan).
Схема:
    id        UUID
    content   TEXT           — текст документа / чанка
    metadata  JSONB          — произвольные метаданные (тег, источник, дата)
    embedding vector(1536)   — вектор OpenAI text-embedding-3-small
"""
import json
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ai.embeddings import get_embedding


class RAGService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def retrieve(self, query: str, player=None, top_k: int = 3) -> str:
        """
        Найти top_k ближайших чанков по косинусному расстоянию.
        Возвращает строку с объединёнными текстами или '' если база пуста / ошибка.
        """
        try:
            embedding = await get_embedding(query)
            # Строковое представление вектора для pgvector: '[0.1,0.2,...]'
            vec_str = "[" + ",".join(str(x) for x in embedding) + "]"

            result = await self.db.execute(
                text("""
                    SELECT content
                    FROM rag_embeddings
                    ORDER BY embedding <=> (:vec)::vector
                    LIMIT :top_k
                """),
                {"vec": vec_str, "top_k": top_k},
            )
            rows = result.fetchall()
            if not rows:
                return ""
            return "\n\n".join(row[0] for row in rows)

        except Exception:
            # RAG — best-effort, не ломаем чат при любой ошибке
            return ""

    async def ingest_document(self, content: str, metadata: dict) -> None:
        """Добавить документ в базу знаний."""
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
