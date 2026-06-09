from uuid import UUID
from datetime import date, datetime

from app.core.base_schema import Schema


class CalendarEventOut(Schema):
    id:        UUID
    player_id: UUID   # camelCase: playerId
    title:     str
    type:      str
    status:    str
    date:      date
    notes:     str | None


class CalendarEventCreate(Schema):
    title:  str
    type:   str
    status: str = "upcoming"
    date:   date
    notes:  str | None = None
