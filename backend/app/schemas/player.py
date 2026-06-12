from uuid import UUID
from datetime import datetime
from typing import Annotated, Literal
from pydantic import Field, AfterValidator, field_validator

from app.core.base_schema import Schema
from app.core.validators import human_name, optional_place, short_text

Position    = Literal["forward", "defenseman", "goaltender"]
HockeyLevel = Literal["amateur", "dyussh", "sdyushor", "national", "professional", "academy"]

HumanName     = Annotated[str, AfterValidator(human_name)]
OptionalPlace = Annotated[str | None, AfterValidator(optional_place)]
_goal_text    = short_text(60)


def _validate_goals(goals: list[str]) -> list[str]:
    cleaned = [_goal_text(g) for g in goals if g and g.strip()]
    if len(cleaned) > 5:
        raise ValueError("Максимум 5 целей")
    return cleaned


class PlayerSkillsSchema(Schema):
    skating:  float = Field(ge=1, le=10)
    shooting: float = Field(ge=1, le=10)
    passing:  float = Field(ge=1, le=10)
    fitness:  float = Field(ge=1, le=10)
    sense:    float = Field(ge=1, le=10)


class PlayerCreate(Schema):
    name:          HumanName
    age:           int         = Field(ge=5, le=45)
    height_cm:     int         = Field(ge=100, le=220)   # camelCase: heightCm
    weight_kg:     int         = Field(ge=30, le=130)    # camelCase: weightKg
    position:      Position
    country:       str         = Field(min_length=2, max_length=100)
    city:          OptionalPlace = None
    team:          OptionalPlace = None
    hockey_school: OptionalPlace = None                  # camelCase: hockeySchool
    level:         HockeyLevel
    goals:         list[str]   = Field(default_factory=list)
    skills:        PlayerSkillsSchema

    _v_goals = field_validator("goals")(_validate_goals)


class PlayerUpdate(Schema):
    name:          HumanName | None     = None
    age:           int | None          = Field(default=None, ge=5, le=45)
    height_cm:     int | None          = Field(default=None, ge=100, le=220)
    weight_kg:     int | None          = Field(default=None, ge=30, le=130)
    position:      Position | None     = None
    country:       str | None          = Field(default=None, min_length=2, max_length=100)
    city:          OptionalPlace        = None
    team:          OptionalPlace        = None
    hockey_school: OptionalPlace        = None
    level:         HockeyLevel | None  = None
    goals:         list[str] | None    = None
    skills:        PlayerSkillsSchema | None = None

    @field_validator("goals")
    @classmethod
    def _v_goals(cls, v: list[str] | None) -> list[str] | None:
        return None if v is None else _validate_goals(v)


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


class SkillSnapshotOut(Schema):
    id:         UUID
    skills:     dict
    created_at: datetime   # camelCase: createdAt
