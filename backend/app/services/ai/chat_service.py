from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from openai import AsyncOpenAI

from app.core.config import settings
from app.models.chat import ChatMessage
from app.models.player import Player
from app.models.user import User
from app.services.ai.rag_service import RAGService

SYSTEM_PROMPT = """Ты — UpWay, специализированный AI-консультант исключительно по хоккею для родителей юных игроков.

## ВАЖНО: Твоя роль строго ограничена
Ты консультируешь ТОЛЬКО по темам, связанным с хоккеем и развитием юного спортсмена:
- Развитие игрока, технические навыки, тактика
- Лиги и пути в хоккее (КХЛ, МХЛ, ВХЛ, Экстралига, NCAA, USHL, BCHL, ВХЛ)
- Тренировки, ОФП, СФП, питание и восстановление для хоккеистов
- Психология спортсмена, мотивация, работа с тренером
- Регламенты ФХР и ФХБ, правила соревнований
- Экипировка, выбор клюшки, коньков для хоккеиста
- Финансовые вопросы хоккейного пути (контракты, бюджет)

Если пользователь спрашивает о чём-то НЕ связанном с хоккеем (автомобили, кулинария, IT, медицина общая и т.д.) — вежливо верни разговор в хоккейный контекст, например:
«Это не по моей специализации — я консультирую только по хоккею. Если есть вопросы по развитию игрока, тренировкам или лигам — готов помочь!»

## Стиль общения
- Говори живым хоккейным языком: шайба, клюшка, пятак, большинство, меньшинство, буллит, вбрасывание, раскатка, силовой приём, «читать игру», «войти в зону», «убрать шайбу».
- Тон: опытный тренер-наставник разговаривает с семьёй игрока. Прямо, конкретно, практично.
- Родители часто показывают советы детям — пиши так, чтобы это работало.
- Без длинных вступлений («Отличный вопрос!») и пустых заключений («Надеюсь это помогло»).
- Ссылайся на базу знаний когда возможно: «По регламенту ФХР...», «Согласно правилам ФХБ...».

## Форматирование (ОБЯЗАТЕЛЬНО)
- **жирный** — ключевые термины и главные советы
- `##` заголовки — если ответ делится на части
- `- ` списки — для советов, шагов, пунктов
- `1.` нумерация — для последовательных шагов
- `> текст` — для цитат из регламентов и правил
- Короткие абзацы, никогда не стена текста

## Язык
Отвечай на языке пользователя (русский или английский)."""


def _openrouter_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL,
        default_headers={
            "HTTP-Referer": "https://upway.app",
            "X-Title": "UpWay Hockey Assistant",
        },
    )


class ChatService:
    def __init__(self, db: AsyncSession, user: User):
        self.db   = db
        self.user = user
        self.rag  = RAGService(db=db)

    async def _build_messages(self, session_id: UUID, user_message: str) -> tuple[list[dict], str]:
        # 1. Player context
        result = await self.db.execute(
            select(Player).where(Player.user_id == self.user.id)
        )
        player = result.scalar_one_or_none()
        player_context = ""
        if player:
            player_context = (
                f"\n\nПрофиль игрока: {player.name}, возраст {player.age}, "
                f"позиция: {player.position}, уровень: {player.level}, "
                f"страна: {player.country}, цели: {', '.join(player.goals)}. "
                f"Навыки (1-10): {player.skills}"
            )

        # 2. Roadmap context (only if plan allows and user asks about roadmap)
        roadmap_context = ""
        from app.api.deps import PLAN_ROADMAP_ACCESS
        if player and PLAN_ROADMAP_ACCESS.get(self.user.plan, False):
            from app.models.roadmap import RoadmapItem
            from sqlalchemy import select as sa_select
            roadmap_res = await self.db.execute(
                sa_select(RoadmapItem)
                .where(RoadmapItem.player_id == player.id)
                .order_by(RoadmapItem.phase_number, RoadmapItem.sort_order)
            )
            roadmap_items = roadmap_res.scalars().all()
            if roadmap_items:
                lines = ["Текущий роадмап игрока:"]
                for item in roadmap_items:
                    status_label = {"done": "✅ Выполнено", "active": "🔄 В процессе", "todo": "⏳ Предстоит"}.get(item.status, item.status)
                    date_str = f", срок: {item.target_date}" if item.target_date else ""
                    lines.append(f"  [{status_label}] Фаза {item.phase_number} «{item.phase}» — {item.title}: {item.description}{date_str}")
                roadmap_context = "\n".join(lines)

        # 3. RAG retrieval (disabled on free plan)
        from app.api.deps import PLAN_RAG_ACCESS
        if PLAN_RAG_ACCESS.get(self.user.plan, False):
            rag_context = await self.rag.retrieve(user_message, player=player)
        else:
            rag_context = ""

        # 3. Chat history (last 10 messages)
        history = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(10)
        )
        history_msgs = list(reversed(history.scalars().all()))

        messages = [{"role": "system", "content": SYSTEM_PROMPT + player_context}]
        if roadmap_context:
            messages.append({"role": "system", "content": roadmap_context})
        if rag_context:
            messages.append({"role": "system", "content": f"Релевантный контекст из базы знаний:\n\n{rag_context}"})
        for msg in history_msgs:
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": user_message})

        return messages, rag_context

    async def generate_response(
        self, session_id: UUID, user_message: str
    ) -> tuple[str, str | None]:
        messages, rag_context = await self._build_messages(session_id, user_message)

        client = _openrouter_client()
        response = await client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )
        content = response.choices[0].message.content
        context_card = rag_context[:200] if rag_context else None
        return content, context_card
