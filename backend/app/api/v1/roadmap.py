from uuid import UUID

from fastapi import HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DB
from app.core.camel_router import CamelRouter
from app.models.player import Player
from app.models.roadmap import RoadmapItem
from app.schemas.roadmap import RoadmapItemOut, RoadmapItemUpdate

router = CamelRouter()


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
    current_user: CurrentUser,
    db: DB,
    limit: int = Query(default=100, le=100),
    phase: int | None = None,
):
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
