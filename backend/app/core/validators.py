"""
Переиспользуемые валидаторы пользовательского ввода.

Это АВТОРИТЕТНЫЙ слой защиты: фронтенд-валидацию легко обойти (curl, devtools),
поэтому любое текстовое поле, попадающее в БД, проходит проверку здесь.

Принципы:
- имена людей/мест — строгий whitelist символов + запрет ссылок;
- свободный текст (заметки, сообщения чата) — charset не ограничиваем
  (пользователь пишет что угодно), но режем управляющие символы и длину;
- везде вырезаем control-символы и схлопываем пробелы.
"""
import re

# Управляющие символы (кроме \t \n \r) — потенциальный мусор/обфускация
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_MULTISPACE = re.compile(r"\s{2,}")

# Ссылки/домены — в именах недопустимы
_URL_RE = re.compile(
    r"(https?://|www\.|t\.me/|@[\w.]+\.|[\w-]+\.(?:com|net|org|ru|by|io|ai|app|info|xyz)\b)",
    re.IGNORECASE,
)

# Имя человека: буквы (лат/кир) + пробел, дефис, апостроф, точка (инициалы)
_HUMAN_NAME_RE = re.compile(r"^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё \-'’.]*$")
# Название места/команды/школы: то же + цифры и № (СКА-1946, Юность №2)
_PLACE_NAME_RE = re.compile(r"^[A-Za-zА-Яа-яЁё0-9][A-Za-zА-Яа-яЁё0-9 \-'’.,№/()]*$")


def _clean(v: str) -> str:
    """Срезает control-символы, тримит и схлопывает пробелы."""
    v = _CONTROL_CHARS.sub("", v)
    return _MULTISPACE.sub(" ", v.strip())


def human_name(v: str) -> str:
    """Имя человека (ФИО игрока/родителя). Обязательное непустое."""
    v = _clean(v)
    if len(v) < 2:
        raise ValueError("Имя должно содержать минимум 2 символа")
    if len(v) > 100:
        raise ValueError("Имя слишком длинное (максимум 100 символов)")
    if _URL_RE.search(v):
        raise ValueError("Имя не должно содержать ссылок")
    if not _HUMAN_NAME_RE.match(v):
        raise ValueError("Имя может содержать только буквы, пробел, дефис и апостроф")
    return v


def optional_place(v: str | None) -> str | None:
    """Город/команда/школа — необязательное. Пустое → None."""
    if v is None:
        return None
    v = _clean(v)
    if not v:
        return None
    if len(v) > 100:
        raise ValueError("Значение слишком длинное (максимум 100 символов)")
    if _URL_RE.search(v):
        raise ValueError("Поле не должно содержать ссылок")
    if not _PLACE_NAME_RE.match(v):
        raise ValueError("Недопустимые символы")
    return v


def short_text(max_len: int = 120):
    """Фабрика валидатора для коротких заголовков (название события/сессии)."""
    def _validate(v: str) -> str:
        v = _clean(v)
        if not v:
            raise ValueError("Поле не может быть пустым")
        if len(v) > max_len:
            raise ValueError(f"Максимум {max_len} символов")
        return v
    return _validate


def free_text(max_len: int = 4000, allow_empty: bool = False):
    """
    Фабрика валидатора для свободного текста (заметки, сообщения чата).
    Charset не ограничивает, но режет control-символы и длину.
    """
    def _validate(v: str | None) -> str | None:
        if v is None:
            return None
        # сохраняем переводы строк, убираем прочие control-символы
        v = _CONTROL_CHARS.sub("", v).strip()
        if not v:
            if allow_empty:
                return None
            raise ValueError("Сообщение не может быть пустым")
        if len(v) > max_len:
            raise ValueError(f"Слишком длинный текст (максимум {max_len} символов)")
        return v
    return _validate
