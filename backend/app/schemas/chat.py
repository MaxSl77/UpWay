from uuid import UUID
from datetime import datetime
from typing import Annotated
from pydantic import AfterValidator

from app.core.base_schema import Schema
from app.core.validators import short_text, free_text


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
    content: Annotated[str, AfterValidator(free_text(4000))]


class RenameSessionRequest(Schema):
    title: Annotated[str, AfterValidator(short_text(120))]
