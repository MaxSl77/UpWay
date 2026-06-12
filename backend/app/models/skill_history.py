import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


class SkillSnapshot(Base):
    """
    Снимок навыков игрока в момент времени.

    Пишется при создании профиля и при каждом изменении skills —
    источник данных для дельт на дашборде и графиков прогресса.
    """
    __tablename__ = "skill_snapshots"
    __table_args__ = (
        Index("ix_skill_snapshots_player_created", "player_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    player_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    skills: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    player = relationship("Player", back_populates="skill_snapshots")
