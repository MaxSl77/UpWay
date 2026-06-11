from typing import Annotated
from uuid import UUID
from datetime import date

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

bearer_scheme = HTTPBearer()

# ── Plan feature matrix ───────────────────────────────────────────────────────
# AI messages per day (only role='user' messages counted)
PLAN_DAILY_MSG_LIMITS: dict[str, int | None] = {
    "free":    10,
    "starter": 30,
}

# Calendar: max total events (free) / max events per day (starter)
PLAN_CALENDAR_TOTAL: dict[str, int | None] = {
    "free":    5,
    "starter": None,  # unlimited total
}
PLAN_CALENDAR_DAILY: dict[str, int | None] = {
    "free":    None,  # free is capped by total, not per-day
    "starter": 5,
}

# Roadmap: True = access allowed
PLAN_ROADMAP_ACCESS: dict[str, bool] = {
    "free":    False,
    "starter": True,
}

# RAG retrieval in chat
PLAN_RAG_ACCESS: dict[str, bool] = {
    "free":    False,
    "starter": True,
}


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    user_id = decode_token(credentials.credentials, token_type="access")
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


async def check_message_limit(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    from app.models.chat import ChatMessage, ChatSession

    limit = PLAN_DAILY_MSG_LIMITS.get(current_user.plan)
    if limit is None:
        return  # unlimited

    today_start = date.today()
    count_result = await db.execute(
        select(func.count(ChatMessage.id))
        .join(ChatSession, ChatMessage.session_id == ChatSession.id)
        .where(
            ChatSession.user_id == current_user.id,
            ChatMessage.role == "user",
            func.date(ChatMessage.created_at) == today_start,
        )
    )
    count = count_result.scalar_one()
    if count >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Лимит сообщений исчерпан ({limit}/день на тарифе '{current_user.plan}'). Обновите тариф.",
        )


async def check_calendar_limit(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Check calendar event creation limits based on plan."""
    from app.models.calendar import CalendarEvent
    from app.models.player import Player

    player_res = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = player_res.scalar_one_or_none()
    if not player:
        return  # no player = can't create event anyway (handled in endpoint)

    plan = current_user.plan

    # Free: max 5 events total
    total_limit = PLAN_CALENDAR_TOTAL.get(plan)
    if total_limit is not None:
        count_res = await db.execute(
            select(func.count(CalendarEvent.id)).where(CalendarEvent.player_id == player.id)
        )
        if count_res.scalar_one() >= total_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Лимит событий исчерпан ({total_limit} событий на тарифе '{plan}'). Обновите тариф.",
            )

    # Starter: max 5 events per day
    daily_limit = PLAN_CALENDAR_DAILY.get(plan)
    if daily_limit is not None:
        today = date.today()
        day_count = await db.execute(
            select(func.count(CalendarEvent.id)).where(
                CalendarEvent.player_id == player.id,
                func.date(CalendarEvent.date) == today,
            )
        )
        if day_count.scalar_one() >= daily_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Максимум {daily_limit} событий в день на тарифе '{plan}'.",
            )


CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]
CheckMessageLimit  = Depends(check_message_limit)
CheckCalendarLimit = Depends(check_calendar_limit)
