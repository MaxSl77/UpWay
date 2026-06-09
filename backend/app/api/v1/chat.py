from uuid import UUID
from fastapi import HTTPException, status
from app.core.camel_router import CamelRouter
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.api.deps import CurrentUser, DB, CheckMessageLimit
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import (
    ChatSessionOut, ChatMessageOut,
    SendMessageRequest, CreateSessionResponse,
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

    # Persist user message
    user_msg = ChatMessage(session_id=session_id, role="user", content=payload.content)
    db.add(user_msg)
    await db.flush()

    # Generate AI response (RAG + GPT-4o)
    service = ChatService(db=db, user=current_user)
    ai_content, context_card = await service.generate_response(
        session_id=session_id,
        user_message=payload.content,
    )

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


@router.get("/sessions/{session_id}/stream")
async def stream_message(
    session_id: UUID,
    content: str,
    current_user: CurrentUser,
    db: DB,
):
    """SSE endpoint for streaming AI responses token-by-token."""
    service = ChatService(db=db, user=current_user)

    async def event_generator():
        async for chunk in service.stream_response(session_id, content):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
