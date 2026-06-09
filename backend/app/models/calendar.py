import uuid
from datetime import date, datetime
from sqlalchemy import String, Text, Date, DateTime, ForeignKey, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    title: Mapped[str]   = mapped_column(String(255), nullable=False)
    type: Mapped[str]    = mapped_column(String(30), nullable=False)    # tournament|camp|tryout|deadline|other
    status: Mapped[str]  = mapped_column(String(30), default="upcoming") # registered|submitted|action_needed|upcoming
    date: Mapped[date]   = mapped_column(Date, nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    player = relationship("Player", back_populates="events")
