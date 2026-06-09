from uuid import UUID
from typing import AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from openai import AsyncOpenAI

from app.core.config import settings
from app.models.chat import ChatMessage
from app.models.player import Player
from app.models.user import User
from app.services.ai.rag_service import RAGService

SYSTEM_PROMPT = """You are UpWay — an AI consultant for hockey parents.
You have deep knowledge of player development pathways, leagues (KHL, MHL, VHL, Extraliga),
training methods, nutrition, and psychology for young athletes.

Always respond concisely and practically. Ground your advice in the player's
specific profile, goals, and current roadmap when available.
Respond in the same language the user writes in (Russian or English)."""


class ChatService:
    def __init__(self, db: AsyncSession, user: User):
        self.db   = db
        self.user = user
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.rag  = RAGService(db=db)

    async def _build_messages(self, session_id: UUID, user_message: str) -> list[dict]:
        # 1. Get player context
        result = await self.db.execute(
            select(Player).where(Player.user_id == self.user.id)
        )
        player = result.scalar_one_or_none()
        player_context = ""
        if player:
            player_context = (
                f"\n\nPlayer context: {player.name}, age {player.age}, "
                f"{player.position}, level: {player.level}, "
                f"country: {player.country}, goals: {', '.join(player.goals)}. "
                f"Skills: {player.skills}"
            )

        # 2. RAG retrieval
        rag_context = await self.rag.retrieve(user_message, player=player)

        # 3. Chat history (last 10 messages)
        history = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(10)
        )
        history_msgs = list(reversed(history.scalars().all()))

        messages = [{"role": "system", "content": SYSTEM_PROMPT + player_context}]
        if rag_context:
            messages.append({"role": "system", "content": f"Relevant knowledge:\n{rag_context}"})
        for msg in history_msgs:
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": user_message})

        return messages, rag_context

    async def generate_response(self, session_id: UUID, user_message: str) -> tuple[str, str | None]:
        messages, rag_context = await self._build_messages(session_id, user_message)

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=1024,
                temperature=0.7,
            )
            content = response.choices[0].message.content
        except Exception:
            # Fallback to DeepSeek
            content = await self._deepseek_fallback(messages)

        context_card = rag_context[:200] if rag_context else None
        return content, context_card

    async def stream_response(
        self, session_id: UUID, user_message: str
    ) -> AsyncIterator[str]:
        messages, _ = await self._build_messages(session_id, user_message)

        stream = await self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    async def _deepseek_fallback(self, messages: list[dict]) -> str:
        """Use DeepSeek V3 as cost-optimised fallback."""
        client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com",
        )
        response = await client.chat.completions.create(
            model=settings.DEEPSEEK_MODEL,
            messages=messages,
            max_tokens=1024,
        )
        return response.choices[0].message.content
