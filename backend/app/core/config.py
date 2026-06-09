from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── App ──────────────────────────────────────────────────────────────────
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://upway:upway@localhost:5432/upway"

    # ── Redis / Celery ────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # ── AI ────────────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    DEEPSEEK_API_KEY: str = ""           # fallback / cost-optimisation
    DEEPSEEK_MODEL: str = "deepseek-chat"
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # ── Storage (Yandex Object Storage — S3-compatible) ───────────────────────
    YOS_ENDPOINT_URL: str = "https://storage.yandexcloud.net"
    YOS_ACCESS_KEY_ID: str = ""
    YOS_SECRET_ACCESS_KEY: str = ""
    YOS_BUCKET_NAME: str = "upway-media"
    YOS_REGION: str = "ru-central1"

    # ── Monitoring ────────────────────────────────────────────────────────────
    SENTRY_DSN: str = ""


settings = Settings()
