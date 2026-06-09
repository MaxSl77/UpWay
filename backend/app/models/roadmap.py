import uuid
from datetime import date, datetime
from sqlalchemy import String, Text, Date, DateTime, ForeignKey, func, Integer, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )

    phase_number: Mapped[int] = mapped_column(Integer, nullable=False)
    phase: Mapped[str]        = mapped_column(String(100), nullable=False)
    sort_order: Mapped[int]   = mapped_column(Integer, default=0, nullable=False)
    title: Mapped[str]        = mapped_column(String(255), nullable=False)
    description: Mapped[str]  = mapped_column(Text, default="")
    status: Mapped[str]       = mapped_column(String(20), default="todo")   # done|active|todo
    target_date: Mapped[date | None]     = mapped_column(Date, nullable=True)
    completed_date: Mapped[date | None]  = mapped_column(Date, nullable=True)
    tags: Mapped[list]        = mapped_column(ARRAY(String), default=list, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    player = relationship("Player", back_populates="roadmap_items")
