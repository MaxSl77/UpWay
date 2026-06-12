from datetime import date

from fastapi import HTTPException, Query, status
from app.core.camel_router import CamelRouter
from sqlalchemy import select, extract

from app.api.deps import CurrentUser, DB, CheckCalendarLimit
from app.models.calendar import CalendarEvent
from app.models.player import Player
from app.schemas.calendar import CalendarEventOut, CalendarEventCreate

router = CamelRouter()


@router.get("/", response_model=list[CalendarEventOut])
async def get_events(
    current_user: CurrentUser,
    db: DB,
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
):
    # Без явных параметров отдаём текущий месяц (никаких хардкод-дат)
    today = date.today()
    year = year if year is not None else today.year
    month = month if month is not None else today.month

    player = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = player.scalar_one_or_none()
    if not player:
        return []

    result = await db.execute(
        select(CalendarEvent)
        .where(
            CalendarEvent.player_id == player.id,
            extract("year",  CalendarEvent.date) == year,
            extract("month", CalendarEvent.date) == month,
        )
        .order_by(CalendarEvent.date.asc())
    )
    return result.scalars().all()


@router.get("/upcoming", response_model=list[CalendarEventOut])
async def get_upcoming(
    current_user: CurrentUser,
    db: DB,
    limit: int = Query(default=10, le=50),
):
    player = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = player.scalar_one_or_none()
    if not player:
        return []

    result = await db.execute(
        select(CalendarEvent)
        .where(
            CalendarEvent.player_id == player.id,
            CalendarEvent.date >= date.today(),
        )
        .order_by(CalendarEvent.date.asc())
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/", response_model=CalendarEventOut, status_code=201,
             dependencies=[CheckCalendarLimit])
async def create_event(payload: CalendarEventCreate, current_user: CurrentUser, db: DB):
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player profile not found")
    event = CalendarEvent(**payload.model_dump(), player_id=player.id)
    db.add(event)
    await db.flush()
    return event


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: str, current_user: CurrentUser, db: DB):
    from uuid import UUID as PyUUID
    player = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = player.scalar_one_or_none()
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player profile not found")

    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.id == PyUUID(event_id),
            CalendarEvent.player_id == player.id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")

    await db.delete(event)
    await db.flush()
