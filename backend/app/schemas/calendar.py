from uuid import UUID
from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import AfterValidator

from app.core.base_schema import Schema
from app.core.validators import short_text, free_text

EventType   = Literal["tournament", "camp", "tryout", "deadline", "other"]
EventStatus = Literal["upcoming", "completed", "registered", "submitted", "action_needed"]

EventTitle = Annotated[str, AfterValidator(short_text(120))]
EventNotes = Annotated[str | None, AfterValidator(free_text(1000, allow_empty=True))]


class CalendarEventOut(Schema):
    id:        UUID
    player_id: UUID   # camelCase: playerId
    title:     str
    type:      str
    status:    str
    date:      date
    notes:     str | None


class CalendarEventCreate(Schema):
    title:  EventTitle
    type:   EventType
    status: EventStatus = "upcoming"
    date:   date
    notes:  EventNotes = None
