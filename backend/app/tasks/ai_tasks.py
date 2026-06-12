"""
Celery tasks for background AI processing.
"""
import asyncio
import json
import re
from app.tasks.celery_app import celery_app


def _extract_json_array(text: str) -> list:
    """Extract JSON array from LLM response even if wrapped in markdown fences."""
    # Try direct parse first
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
        # {"items": [...]} pattern
        for key in ("items", "milestones", "roadmap", "phases"):
            if key in parsed and isinstance(parsed[key], list):
                return parsed[key]
        # Flatten any list value
        for v in parsed.values():
            if isinstance(v, list):
                return v
    except json.JSONDecodeError:
        pass

    # Try to find a JSON array in the text
    match = re.search(r'\[[\s\S]+\]', text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return []


ROADMAP_PROMPT_TEMPLATE = """Ты — AI-тренер по хоккею. Составь персональный план развития для хоккеиста.

Сегодняшняя дата: {today}. Все даты в роадмапе должны быть СТРОГО позже {today}.

Игрок:
- Имя: {name}
- Возраст: {age} лет
- Позиция: {position}
- Текущий уровень: {level}
- Цели: {goals}
- Навыки (1-10): {skills}

Составь роадмап из 9 конкретных шагов, разбитых на 3 фазы:
- Фаза 1 «Фундамент» (3 шага, phase_number=1): базовые навыки и физическая подготовка
- Фаза 2 «Развитие» (3 шага, phase_number=2): тактика, игровое мышление, турниры
- Фаза 3 «Прорыв» (3 шага, phase_number=3): выход на следующий уровень, просмотры, карьера

Верни ТОЛЬКО JSON-массив без markdown-обёрток, без комментариев, строго в формате:
[
  {{
    "phase_number": 1,
    "phase": "Фундамент",
    "title": "Название шага",
    "description": "Конкретное описание что делать (2-3 предложения)",
    "target_date": "YYYY-MM-DD",
    "tags": ["тег1", "тег2"]
  }}
]

Ровно 9 объектов. Описания конкретные, практичные, на русском языке."""


@celery_app.task(bind=True, max_retries=2, default_retry_delay=15)
def generate_roadmap_task(self, player_id: str):
    """
    Generate a personalized roadmap for a player using DeepSeek via OpenRouter.
    Triggered after onboarding completes.
    """
    try:
        async def _run():
            from app.core.database import AsyncSessionLocal
            from app.models.player import Player
            from app.models.roadmap import RoadmapItem
            from sqlalchemy import select
            from openai import AsyncOpenAI
            from app.core.config import settings
            from datetime import date, timedelta

            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Player).where(Player.id == player_id)
                )
                player = result.scalar_one_or_none()
                if not player:
                    return

                # Idempotency guard
                existing = await db.execute(
                    select(RoadmapItem).where(RoadmapItem.player_id == player.id).limit(1)
                )
                if existing.scalar_one_or_none():
                    return

                # Build prompt
                today = date.today()
                prompt = ROADMAP_PROMPT_TEMPLATE.format(
                    today=today.isoformat(),
                    name=player.name,
                    age=player.age,
                    position=player.position,
                    level=player.level,
                    goals=', '.join(player.goals) if player.goals else 'развитие',
                    skills=player.skills or {},
                )

                # Use OpenRouter / DeepSeek
                client = AsyncOpenAI(
                    api_key=settings.OPENROUTER_API_KEY,
                    base_url=settings.OPENROUTER_BASE_URL,
                    default_headers={
                        "HTTP-Referer": "https://upway.app",
                        "X-Title": "UpWay Hockey Assistant",
                    },
                )

                response = await client.chat.completions.create(
                    model=settings.OPENROUTER_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1400,
                    temperature=0.2,
                )

                raw = response.choices[0].message.content or ""
                items_data = _extract_json_array(raw)

                if not items_data:
                    # Fallback: generate a basic roadmap without AI
                    items_data = _default_roadmap(player)

                today = date.today()
                for i, item in enumerate(items_data[:12]):  # max 12 items
                    # Parse target_date safely
                    target_date = None
                    td_str = item.get("target_date", "")
                    if td_str:
                        try:
                            target_date = date.fromisoformat(td_str)
                        except (ValueError, TypeError):
                            target_date = today + timedelta(days=30 * (i + 1))

                    phase_num = int(item.get("phase_number", (i // 3) + 1))

                    db.add(RoadmapItem(
                        player_id=player.id,
                        sort_order=i,
                        phase_number=phase_num,
                        phase=item.get("phase", f"Фаза {phase_num}"),
                        title=item.get("title", f"Шаг {i + 1}"),
                        description=item.get("description", ""),
                        status="active" if i == 0 else "todo",
                        target_date=target_date,
                        tags=item.get("tags", []),
                    ))

                await db.commit()

        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(_run())
        finally:
            loop.close()

    except Exception as exc:
        raise self.retry(exc=exc)


def _default_roadmap(player) -> list:
    """Fallback roadmap when AI generation fails."""
    from datetime import date, timedelta
    today = date.today()

    def d(months: int) -> str:
        return (today + __import__('datetime').timedelta(days=30 * months)).isoformat()

    pos = player.position or "forward"
    goal = player.goals[0] if player.goals else "МХЛ"

    return [
        # Фаза 1
        {"phase_number": 1, "phase": "Фундамент", "title": "Техника катания", "description": f"Ежедневные упражнения на катание: старты, торможения, повороты. Основа для {pos}.", "target_date": d(2), "tags": ["катание", "техника"]},
        {"phase_number": 1, "phase": "Фундамент", "title": "Работа с клюшкой", "description": "Обводка, прострелы, броски — 30 минут ежедневно вне льда.", "target_date": d(3), "tags": ["клюшка", "броски"]},
        {"phase_number": 1, "phase": "Фундамент", "title": "Физическая подготовка", "description": "ОФП: силовые упражнения, выносливость, координация. 3 раза в неделю.", "target_date": d(4), "tags": ["ОФП", "физподготовка"]},
        # Фаза 2
        {"phase_number": 2, "phase": "Развитие", "title": "Игровое мышление", "description": "Анализ игры, позиционирование, чтение ситуаций. Просмотр матчей с разбором.", "target_date": d(6), "tags": ["тактика", "IQ"]},
        {"phase_number": 2, "phase": "Развитие", "title": "Турнирная практика", "description": "Участие в региональных турнирах. Выход из зоны комфорта, игра против сильных соперников.", "target_date": d(8), "tags": ["турниры", "соревнования"]},
        {"phase_number": 2, "phase": "Развитие", "title": "Командная химия", "description": "Работа в звеньях, взаимодействие с партнёрами, смена позиций по схеме.", "target_date": d(10), "tags": ["команда", "взаимодействие"]},
        # Фаза 3
        {"phase_number": 3, "phase": "Прорыв", "title": "Просмотр в лиге", "description": f"Подготовка к просмотровым сборам. Цель — попасть на радар скаутов {goal}.", "target_date": d(14), "tags": ["просмотр", "скауты"]},
        {"phase_number": 3, "phase": "Прорыв", "title": "Сборы и лагеря", "description": "Участие в хоккейных лагерях с тренерами из целевой лиги. Нетворкинг.", "target_date": d(16), "tags": ["лагеря", "сборы"]},
        {"phase_number": 3, "phase": "Прорыв", "title": f"Выход на уровень {goal}", "description": f"Финальный шаг — контракт или соглашение с командой уровня {goal}.", "target_date": d(24), "tags": [goal, "карьера"]},
    ]


@celery_app.task
def refresh_opportunities():
    """Scrape / sync opportunities from external sources into the DB."""
    pass
