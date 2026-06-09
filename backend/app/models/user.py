import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str]         = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str]     = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    plan: Mapped[str]          = mapped_column(String(20), default="free", nullable=False)
    is_active: Mapped[bool]          = mapped_column(Boolean, default=True, nullable=False)
    is_email_verified: Mapped[bool]  = mapped_column(Boolean, default=False, nullable=False)
    avatar_url: Mapped[str | None]   = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    player   = relationship("Player",       back_populates="user",    uselist=False)
    sessions = relationship("ChatSession",  back_populates="user",    cascade="all, delete-orphan")
