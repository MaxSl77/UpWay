from fastapi import Query
from app.core.camel_router import CamelRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DB
from app.models.roadmap import RoadmapItem
from app.models.player import Player
from app.schemas.roadmap import RoadmapItemOut, RoadmapItemUpdate

router = CamelRouter()


@router.get("/", response_model=list[RoadmapItemOut])
async def get_roadmap(
    current_user: CurrentUser,
    db: DB,
    limit: int = Query(default=100, le=100),
    phase: int | None = None,
):
    player = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = player.scalar_one_or_none()
    if not player:
        return []

    q = select(RoadmapItem).where(RoadmapItem.player_id == player.id)
    if phase is not None:
        q = q.where(RoadmapItem.phase_number == phase)
    q = q.order_by(RoadmapItem.phase_number, RoadmapItem.sort_order).limit(limit)

    result = await db.execute(q)
    return result.scalars().all()


@router.patch("/{item_id}", response_model=RoadmapItemOut)
async def update_roadmap_item(
    item_id: str,
    payload: RoadmapItemUpdate,
    current_user: CurrentUser,
    db: DB,
):
    # TODO: validate ownership, apply update
    result = await db.execute(select(RoadmapItem).where(RoadmapItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        from fastapi import HTTPException, status
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Roadmap item not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    return item
