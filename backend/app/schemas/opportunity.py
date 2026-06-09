from uuid import UUID
from datetime import date

from app.core.base_schema import Schema


class OpportunityOut(Schema):
    id:          UUID
    type:        str
    title:       str
    description: str
    location:    str
    country:     str
    deadline:    date | None
    is_urgent:   bool       # camelCase: isUrgent
    tags:        list[str]
    url:         str | None
