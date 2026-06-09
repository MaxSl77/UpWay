from uuid import UUID
from datetime import date, datetime

from app.core.base_schema import Schema


class RoadmapItemOut(Schema):
    id:             UUID
    player_id:      UUID        # camelCase: playerId
    phase_number:   int         # camelCase: phaseNumber
    phase:          str
    sort_order:     int         # camelCase: sortOrder
    title:          str
    description:    str
    status:         str
    target_date:    date | None    # camelCase: targetDate
    completed_date: date | None    # camelCase: completedDate
    tags:           list[str]


class RoadmapItemUpdate(Schema):
    status:         str | None  = None
    completed_date: date | None = None
