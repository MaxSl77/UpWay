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

# Лимиты AI-сообщений в день по плану (роль "user", не "assistant")
PLAN_DAILY_LIMITS: dict[str, int | None] = {
    "free":    5,
    "starter": 50,
    "pro":     None,  # None = безлимитный
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
    """
    Проверяет, не превышен ли дневной лимит AI-сообщений для плана пользователя.
    Считает только сообщения с role='user' за текущие сутки (UTC).
    Вызывается как Depends() перед обработкой нового сообщения.
    """
    from app.models.chat import ChatMessage, ChatSession

    limit = PLAN_DAILY_LIMITS.get(current_user.plan)
    if limit is None:
        # Безлимитный план — пропускаем проверку
        return

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
            detail=(
                f"Daily message limit reached ({limit} messages/day on the '{current_user.plan}' plan). "
                "Upgrade your plan to send more messages."
            ),
        )


CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]
CheckMessageLimit = Depends(check_message_limit)
