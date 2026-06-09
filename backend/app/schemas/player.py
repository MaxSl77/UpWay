from uuid import UUID
from datetime import datetime
from typing import Literal
from pydantic import Field

from app.core.base_schema import Schema

Position    = Literal["forward", "defenseman", "goaltender"]
HockeyLevel = Literal["amateur", "dyussh", "sdyushor", "national", "professional", "academy"]


class PlayerSkillsSchema(Schema):
    skating:  float = Field(ge=1, le=10)
    shooting: float = Field(ge=1, le=10)
    passing:  float = Field(ge=1, le=10)
    fitness:  float = Field(ge=1, le=10)
    sense:    float = Field(ge=1, le=10)


class PlayerCreate(Schema):
    name:          str         = Field(min_length=2, max_length=255)
    age:           int         = Field(ge=5, le=25)
    height_cm:     int         = Field(ge=100, le=220)   # camelCase: heightCm
    weight_kg:     int         = Field(ge=30, le=130)    # camelCase: weightKg
    position:      Position
    country:       str         = Field(min_length=2, max_length=100)
    city:          str | None  = None
    team:          str | None  = None
    hockey_school: str | None  = None                    # camelCase: hockeySchool
    level:         HockeyLevel
    goals:         list[str]   = Field(default_factory=list)
    skills:        PlayerSkillsSchema


class PlayerUpdate(Schema):
    name:          str | None          = None
    age:           int | None          = None
    height_cm:     int | None          = None
    weight_kg:     int | None          = None
    position:      Position | None     = None
    country:       str | None          = None
    city:          str | None          = None
    team:          str | None          = None
    hockey_school: str | None          = None
    level:         HockeyLevel | None  = None
    goals:         list[str] | None    = None
    skills:        PlayerSkillsSchema | None = None


class PlayerOut(Schema):
    id:            UUID
    user_id:       UUID        # camelCase: userId
    name:          str
    age:           int
    height_cm:     int         # camelCase: heightCm
    weight_kg:     int         # camelCase: weightKg
    position:      str
    country:       str
    city:          str | None
    team:          str | None
    hockey_school: str | None  # camelCase: hockeySchool
    level:         str
    goals:         list[str]
    skills:        dict
    created_at:    datetime    # camelCase: createdAt
    updated_at:    datetime    # camelCase: updatedAt


class DashboardMetrics(Schema):
    goal_progress_pct:      float   # camelCase: goalProgressPct
    goal_label:             str
    months_remaining:       int
    skating_score:          float
    skating_delta:          float
    goal_probability_pct:   float
    probability_updated_at: str


class NextStep(Schema):
    title:       str
    description: str
    cta_label:   str = "Take Action →"  # camelCase: ctaLabel
