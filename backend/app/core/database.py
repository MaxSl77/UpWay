from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """
    FastAPI dependency, предоставляющий сессию БД с автоматическим управлением транзакцией.

    Паттерн использования в хэндлерах:
        - Вызывайте `await db.flush()` после `db.add(...)` чтобы получить
          автосгенерированные значения (id, server_default) до конца запроса,
          не завершая транзакцию.
        - НЕ вызывайте `await db.commit()` внутри хэндлеров вручную —
          commit происходит здесь автоматически при успешном завершении запроса.
        - При любом исключении транзакция автоматически откатывается (rollback),
          что гарантирует атомарность всей операции запроса.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
