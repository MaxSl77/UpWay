"""
Email templates + queueing.

Отправка выполняется ТОЛЬКО в Celery-воркере (app/tasks/email_tasks.py):
resend.Emails.send — синхронный HTTP-вызов, в event loop API он блокировал
бы воркер uvicorn. API-слой вызывает queue_*() — это быстрый .delay() в Redis.
"""
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def sender() -> str:
    return f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"


# ── Построение писем (subject, html) ─────────────────────────────────────────

def build_password_reset(full_name: str, reset_url: str) -> tuple[str, str]:
    return "Сброс пароля — UpWay", _reset_html(full_name, reset_url)


def build_verification(full_name: str, verify_url: str) -> tuple[str, str]:
    return "Подтвердите email — UpWay", _verify_html(full_name, verify_url)


def build_welcome(full_name: str) -> tuple[str, str]:
    return "Добро пожаловать в UpWay! 🏒", _welcome_html(full_name)


# ── Постановка в очередь (вызывается из API-эндпоинтов) ──────────────────────

def _queue(to: str, subject: str, html: str) -> None:
    """Enqueue в Celery. Сбой брокера не должен ронять запрос (логируем)."""
    try:
        from app.tasks.email_tasks import send_email_task
        send_email_task.delay(to, subject, html)
    except Exception:
        logger.exception("Failed to enqueue email to %s (%s)", to, subject)


def queue_password_reset(to: str, full_name: str, reset_url: str) -> None:
    subject, html = build_password_reset(full_name, reset_url)
    _queue(to, subject, html)


def queue_verification(to: str, full_name: str, verify_url: str) -> None:
    subject, html = build_verification(full_name, verify_url)
    _queue(to, subject, html)


def queue_welcome(to: str, full_name: str) -> None:
    subject, html = build_welcome(full_name)
    _queue(to, subject, html)


# ── HTML-шаблоны ──────────────────────────────────────────────────────────────

def _base_html(content: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>UpWay</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0d2818 0%,#064e2a 100%);padding:28px 36px;">
          <span style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
            Up<span style="color:#22c55e;">Way</span>
          </span>
          <p style="margin:4px 0 0;font-size:12px;color:#86efac;letter-spacing:1px;">
            AI-помощник для хоккейных семей
          </p>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:36px;">
          {content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 36px;border-top:1px solid #1f2937;">
          <p style="margin:0;font-size:11px;color:#4b5563;text-align:center;">
            Это автоматическое письмо — не отвечайте на него.<br/>
            © 2026 UpWay. Все права защищены.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _reset_html(full_name: str, reset_url: str) -> str:
    content = f"""
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f9fafb;">
        Сброс пароля
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
        Привет, <strong style="color:#e5e7eb;">{full_name}</strong>!<br/>
        Мы получили запрос на сброс пароля для вашего аккаунта UpWay.
        Нажмите кнопку ниже, чтобы задать новый пароль.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        <tr><td style="background:#22c55e;border-radius:10px;">
          <a href="{reset_url}"
             style="display:block;padding:14px 32px;font-size:15px;font-weight:700;
                    color:#0a1a11;text-decoration:none;letter-spacing:-0.2px;">
            Сбросить пароль →
          </a>
        </td></tr>
      </table>
      <p style="margin:0 0 8px;font-size:12px;color:#6b7280;line-height:1.6;">
        Если кнопка не работает, скопируйте эту ссылку в браузер:
      </p>
      <p style="margin:0 0 24px;font-size:11px;color:#4b5563;word-break:break-all;">
        {reset_url}
      </p>
      <div style="background:#1f2937;border-radius:8px;padding:14px 16px;border-left:3px solid #f59e0b;">
        <p style="margin:0;font-size:12px;color:#d1d5db;">
          ⏱ Ссылка действительна <strong>1 час</strong>.<br/>
          Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.
        </p>
      </div>"""
    return _base_html(content)


def _verify_html(full_name: str, verify_url: str) -> str:
    content = f"""
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f9fafb;">
        Подтвердите ваш email
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
        Привет, <strong style="color:#e5e7eb;">{full_name}</strong>!<br/>
        Нажмите кнопку ниже, чтобы подтвердить адрес электронной почты и активировать аккаунт UpWay.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        <tr><td style="background:#22c55e;border-radius:10px;">
          <a href="{verify_url}"
             style="display:block;padding:14px 32px;font-size:15px;font-weight:700;
                    color:#0a1a11;text-decoration:none;letter-spacing:-0.2px;">
            Подтвердить email →
          </a>
        </td></tr>
      </table>
      <p style="margin:0 0 8px;font-size:12px;color:#6b7280;line-height:1.6;">
        Если кнопка не работает, скопируйте эту ссылку в браузер:
      </p>
      <p style="margin:0 0 24px;font-size:11px;color:#4b5563;word-break:break-all;">
        {verify_url}
      </p>
      <div style="background:#1f2937;border-radius:8px;padding:14px 16px;border-left:3px solid #3b82f6;">
        <p style="margin:0;font-size:12px;color:#d1d5db;">
          ⏱ Ссылка действительна <strong>24 часа</strong>.<br/>
          Если вы не регистрировались в UpWay — просто проигнорируйте это письмо.
        </p>
      </div>"""
    return _base_html(content)


def _welcome_html(full_name: str) -> str:
    content = f"""
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f9fafb;">
        Добро пожаловать в UpWay! 🏒
      </h1>
      <p style="margin:0 0 20px;font-size:14px;color:#9ca3af;line-height:1.6;">
        Привет, <strong style="color:#e5e7eb;">{full_name}</strong>!<br/>
        Ваш аккаунт успешно создан. UpWay поможет выстроить хоккейный путь вашего игрока
        с персональным AI-консультантом.
      </p>
      <ul style="margin:0 0 24px;padding:0 0 0 0;list-style:none;">
        {"".join(f'<li style="display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:13px;color:#d1d5db;"><span style="color:#22c55e;font-size:16px;">✓</span>{item}</li>' for item in [
            'Персональный роадмап для вашего хоккеиста',
            'AI-консультант с базой регламентов ФХР и ФХБ',
            'Управление календарём тренировок и турниров',
        ])}
      </ul>"""
    return _base_html(content)
