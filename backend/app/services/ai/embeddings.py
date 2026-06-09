from openai import AsyncOpenAI
from app.core.config import settings

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


async def get_embedding(text: str) -> list[float]:
    """Return a 1536-dim embedding vector for the given text."""
    response = await _get_client().embeddings.create(
        model=settings.EMBEDDING_MODEL,
        input=text,
    )
    return response.data[0].embedding
