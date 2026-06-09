import uuid
from datetime import date, datetime
from sqlalchemy import String, Text, Date, DateTime, Boolean, func, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Opportunity(Base):
    __tablename__ = "opportunities"

    id: Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[str]      = mapped_column(String(30), nullable=False, index=True)   # camp|tryout|tournament
    title: Mapped[str]     = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    location: Mapped[str]  = mapped_column(String(255), nullable=False)
    country: Mapped[str]   = mapped_column(String(100), nullable=False, index=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tags: Mapped[list]     = mapped_column(ARRAY(String), default=list, nullable=False)
    url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
