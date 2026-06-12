"""
Лёгкий i18n для пользовательских сообщений API.

Язык определяется по заголовку Accept-Language (фронт шлёт его из настроек
пользователя). Новые сообщения добавляются в _MESSAGES; ключи, отсутствующие
в каталоге, возвращаются как есть — это сигнал, что перевод забыли добавить.
"""
from fastapi import Request

DEFAULT_LANG = "ru"
SUPPORTED_LANGS = ("ru", "en")

_MESSAGES: dict[str, dict[str, str]] = {
    "chat_daily_limit": {
        "ru": "Лимит сообщений исчерпан ({limit}/день на тарифе «{plan}»). Обновите тариф.",
        "en": "Daily message limit reached ({limit}/day on the “{plan}” plan). Upgrade your plan.",
    },
    "calendar_total_limit": {
        "ru": "Лимит событий исчерпан ({limit} событий на тарифе «{plan}»). Обновите тариф.",
        "en": "Event limit reached ({limit} events on the “{plan}” plan). Upgrade your plan.",
    },
    "calendar_daily_limit": {
        "ru": "Максимум {limit} событий в день на тарифе «{plan}».",
        "en": "Maximum {limit} events per day on the “{plan}” plan.",
    },
    "roadmap_plan_required": {
        "ru": "Роадмап доступен только на тарифе «Старт».",
        "en": "Roadmap is available on the “Starter” plan only.",
    },
}


def get_lang(request: Request) -> str:
    """Первый поддерживаемый язык из Accept-Language, иначе DEFAULT_LANG."""
    header = request.headers.get("accept-language", "")
    for part in header.split(","):
        code = part.split(";")[0].strip().lower()[:2]
        if code in SUPPORTED_LANGS:
            return code
    return DEFAULT_LANG


def t(key: str, lang: str, **params) -> str:
    variants = _MESSAGES.get(key)
    if not variants:
        return key
    template = variants.get(lang) or variants[DEFAULT_LANG]
    return template.format(**params)


def tr(key: str, request: Request, **params) -> str:
    """Шорткат: перевод сразу по Request."""
    return t(key, get_lang(request), **params)
