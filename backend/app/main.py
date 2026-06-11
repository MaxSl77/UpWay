import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import router as api_v1_router

# ── Sentry ────────────────────────────────────────────────────────────────────
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=0.2 if settings.ENVIRONMENT == "production" else 1.0,
    )



# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.ENVIRONMENT == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS rag_embeddings (
                    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    content  TEXT NOT NULL,
                    metadata JSONB DEFAULT '{}'::jsonb,
                    embedding vector(768)
                )
            """))
    yield


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="UpWay API",
    version="0.1.0",
    description="AI Assistant for Hockey Parents — Backend API",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/health", tags=["infra"])
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
