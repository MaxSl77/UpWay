from uuid import UUID
from datetime import datetime
from pydantic import Field

from app.core.base_schema import Schema


class CreateSessionResponse(Schema):
    id:         UUID
    title:      str
    created_at: datetime   # camelCase: createdAt
    updated_at: datetime   # camelCase: updatedAt


class ChatSessionOut(Schema):
    id:            UUID
    title:         str
    created_at:    datetime  # camelCase: createdAt
    updated_at:    datetime  # camelCase: updatedAt
    message_count: int = 0  # camelCase: messageCount


class ChatMessageOut(Schema):
    id:           UUID
    session_id:   UUID       # camelCase: sessionId
    role:         str
    content:      str
    context_card: str | None # camelCase: contextCard
    created_at:   datetime   # camelCase: createdAt


class SendMessageRequest(Schema):
    content: str


class RenameSessionRequest(Schema):
    title: str
