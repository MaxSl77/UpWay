# Import all models so Alembic autogenerate picks them up
from app.models.user import User
from app.models.player import Player
from app.models.chat import ChatSession, ChatMessage
from app.models.roadmap import RoadmapItem
from app.models.calendar import CalendarEvent
from app.models.opportunity import Opportunity
from app.models.skill_history import SkillSnapshot

__all__ = [
    "User", "Player",
    "ChatSession", "ChatMessage",
    "RoadmapItem",
    "CalendarEvent",
    "Opportunity",
    "SkillSnapshot",
]
