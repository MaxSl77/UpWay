from uuid import UUID
from fastapi import HTTPException, status
from app.core.camel_router import CamelRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DB, CheckMessageLimit
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import (
    ChatSessionOut, ChatMessageOut,
    SendMessageRequest, CreateSessionResponse, RenameSessionRequest,
)
from app.services.ai.chat_service import ChatService

router = CamelRouter()


@router.get("/sessions", response_model=list[ChatSessionOut])
async def list_sessions(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
    )
    return result.scalars().all()


@router.post("/sessions", response_model=CreateSessionResponse, status_code=201)
async def create_session(current_user: CurrentUser, db: DB):
    session = ChatSession(user_id=current_user.id, title="New conversation")
    db.add(session)
    await db.flush()
    return session


@router.patch("/sessions/{session_id}", response_model=ChatSessionOut)
async def rename_session(
    session_id: UUID,
    payload: RenameSessionRequest,
    current_user: CurrentUser,
    db: DB,
):
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    session.title = payload.title.strip()[:255] or session.title
    await db.flush()
    return session


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: UUID, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    await db.delete(session)
    await db.flush()


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageOut])
async def get_messages(session_id: UUID, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")

    msgs = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    return msgs.scalars().all()


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageOut, status_code=201,
             dependencies=[CheckMessageLimit])
async def send_message(
    session_id: UUID,
    payload: SendMessageRequest,
    current_user: CurrentUser,
    db: DB,
):
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")

    # Persist user message and commit immediately so concurrent GET /messages
    # requests (e.g. user switches session and back) can see it right away.
    user_msg = ChatMessage(session_id=session_id, role="user", content=payload.content)
    db.add(user_msg)
    await db.commit()   # ← explicit early commit before slow AI call

    # Generate AI response
    service = ChatService(db=db, user=current_user)
    try:
        ai_content, context_card = await service.generate_response(
            session_id=session_id,
            user_message=payload.content,
        )
    except Exception as e:
        # Возврат квоты: user-сообщение уже закоммичено (чтобы его видели
        # конкурентные GET), но обмен не состоялся — удаляем его, чтобы
        # неудачная попытка не списывала дневной лимит.
        await db.delete(user_msg)
        await db.commit()

        err_str = str(e)
        if "401" in err_str or "Authentication" in err_str or "User not found" in err_str:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "AI service authentication error. Check OPENROUTER_API_KEY.")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"AI service error: {err_str[:200]}")

    ai_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=ai_content,
        context_card=context_card,
    )
    db.add(ai_msg)
    await db.flush()

    # Auto-title the session from first message
    if session.title == "New conversation":
        session.title = payload.content[:60]

    return ai_msg

# NOTE: SSE-стриминг удалён сознательно (MVP работает в нестриминговом режиме).
# Прежний /sessions/{id}/stream был нерабочим с фронта (EventSource не умеет
# Bearer-заголовки), обходил дневной лимит сообщений и не сохранял историю.
# Потоковую генерацию добавим после MVP через fetch-streaming или WebSocket —
# с CheckMessageLimit и персистенцией обоих сообщений.
