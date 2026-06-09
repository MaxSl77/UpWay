import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, func, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


class Player(Base):
    __tablename__ = "players"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True,
    )

    # Basic info
    name:       Mapped[str]   = mapped_column(String(255), nullable=False)
    age:        Mapped[int]   = mapped_column(Integer, nullable=False)
    height_cm:  Mapped[int]   = mapped_column(Integer, nullable=False)
    weight_kg:  Mapped[int]   = mapped_column(Integer, nullable=False)
    position:   Mapped[str]   = mapped_column(String(20), nullable=False)  # forward|defenseman|goaltender

    # Geography
    country:       Mapped[str]        = mapped_column(String(100), nullable=False)
    city:          Mapped[str | None] = mapped_column(String(100))
    team:          Mapped[str | None] = mapped_column(String(255))
    hockey_school: Mapped[str | None] = mapped_column(String(255))

    # Level & goals
    level: Mapped[str]      = mapped_column(String(50), nullable=False)
    goals: Mapped[list]     = mapped_column(ARRAY(String), default=list, nullable=False)

    # Skills (stored as JSONB for flexibility)
    skills: Mapped[dict] = mapped_column(
        JSONB, default=lambda: {
            "skating": 5, "shooting": 5, "passing": 5,
            "fitness": 5, "sense": 5,
        },
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user          = relationship("User",          back_populates="player")
    roadmap_items = relationship("RoadmapItem",   back_populates="player", cascade="all, delete-orphan")
    events        = relationship("CalendarEvent", back_populates="player", cascade="all, delete-orphan")
