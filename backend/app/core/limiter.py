from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

# Счётчики в Redis: лимиты общие для всех воркеров uvicorn
# (in-memory storage в проде с --workers 4 умножал бы лимиты на 4).
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL,
)
