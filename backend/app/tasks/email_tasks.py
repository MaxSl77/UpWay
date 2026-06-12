"""
Celery tasks for transactional email (Resend).

Единственное место, где реально выполняется HTTP-вызов к Resend.
API-слой только ставит письма в очередь (см. app/services/email.py).
"""
import logging

import resend

from app.core.config import settings
from app.services.email import sender
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,   # 30s, 60s, 120s (exponential backoff)
    retry_backoff=True,
    name="app.tasks.email_tasks.send_email",
)
def send_email_task(self, to: str, subject: str, html: str):
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set — skipping email to %s (%s)", to, subject)
        return

    try:
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": sender(),
            "to": to,
            "subject": subject,
            "html": html,
        })
    except Exception as exc:
        logger.warning("Email send failed (to=%s, subject=%s): %s", to, subject, exc)
        raise self.retry(exc=exc)
