from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "upway",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.ai_tasks", "app.tasks.email_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        # Refresh opportunities from external sources daily at 03:00 UTC
        "refresh-opportunities": {
            "task": "app.tasks.ai_tasks.refresh_opportunities",
            "schedule": 60 * 60 * 24,
        },
    },
)
