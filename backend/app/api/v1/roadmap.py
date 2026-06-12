from uuid import UUID

from fastapi import HTTPException, Query, Request, status
from sqlalchemy import select, delete

from app.api.deps import CurrentUser, DB, PLAN_ROADMAP_ACCESS
from app.core.camel_router import CamelRouter
from app.core.i18n import tr
from app.models.player import Player
from app.models.roadmap import RoadmapItem
from app.schemas.roadmap import RoadmapItemOut, RoadmapItemUpdate

router = CamelRouter()


def _check_roadmap_access(request: Request, current_user) -> None:
    if not PLAN_ROADMAP_ACCESS.get(current_user.plan, False):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            tr("roadmap_plan_required", request),
        )


async def _get_player_or_404(current_user, db) -> Player:
    """Return the player owned by current_user, or raise 404."""
    result = await db.execute(
        select(Player).where(Player.user_id == current_user.id)
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player profile not found")
    return player


@router.get("/", response_model=list[RoadmapItemOut])
async def get_roadmap(
    request: Request,
    current_user: CurrentUser,
    db: DB,
    limit: int = Query(default=100, le=100),
    phase: int | None = None,
):
    _check_roadmap_access(request, current_user)
    result = await db.execute(
        select(Player).where(Player.user_id == current_user.id)
    )
    player = result.scalar_one_or_none()
    if not player:
        return []

    q = select(RoadmapItem).where(RoadmapItem.player_id == player.id)
    if phase is not None:
        q = q.where(RoadmapItem.phase_number == phase)
    q = q.order_by(RoadmapItem.phase_number, RoadmapItem.sort_order).limit(limit)

    result = await db.execute(q)
    return result.scalars().all()


@router.post("/regenerate", status_code=202)
async def regenerate_roadmap(request: Request, current_user: CurrentUser, db: DB):
    """
    Удаляет текущий роадмап и запускает фоновую генерацию заново через Celery.
    Безопасно: только для своего профиля игрока.
    """
    _check_roadmap_access(request, current_user)
    player = await _get_player_or_404(current_user, db)

    # Удалить существующий роадмап этого игрока
    await db.execute(
        delete(RoadmapItem).where(RoadmapItem.player_id == player.id)
    )
    await db.commit()

    from app.tasks.ai_tasks import generate_roadmap_task
    generate_roadmap_task.delay(str(player.id))

    return {"status": "queued", "player_id": str(player.id)}


@router.patch("/{item_id}", response_model=RoadmapItemOut)
async def update_roadmap_item(
    item_id: UUID,
    payload: RoadmapItemUpdate,
    current_user: CurrentUser,
    db: DB,
):
    # Ownership check: fetch only items that belong to current_user's player.
    # JOIN ensures an attacker cannot modify another user's roadmap items
    # even if they know the UUID.
    result = await db.execute(
        select(RoadmapItem)
        .join(Player, RoadmapItem.player_id == Player.id)
        .where(
            RoadmapItem.id == item_id,
            Player.user_id == current_user.id,   # ← ownership gate
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        # Return 404 (not 403) to avoid leaking whether the item exists
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Roadmap item not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    return item
