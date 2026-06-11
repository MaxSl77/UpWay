"""
Local embeddings via fastembed (no API key required).
Model: sentence-transformers/paraphrase-multilingual-mpnet-base-v2
  — 768 dims, excellent Russian/multilingual support.
First call downloads ~420 MB model to ~/.cache/fastembed/.
"""
import asyncio
from functools import lru_cache
from typing import List

from fastembed import TextEmbedding


@lru_cache(maxsize=1)
def _get_model() -> TextEmbedding:
    from app.core.config import settings
    return TextEmbedding(model_name=settings.EMBEDDING_MODEL)


async def get_embedding(text: str) -> List[float]:
    """Return a 768-dim embedding vector. Runs CPU model in thread pool."""
    loop = asyncio.get_event_loop()
    model = _get_model()

    def _embed() -> List[float]:
        result = list(model.embed([text]))
        return result[0].tolist()

    return await loop.run_in_executor(None, _embed)


# For this model, query and passage embeddings are identical
get_query_embedding = get_embedding
