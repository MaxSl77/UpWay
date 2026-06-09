from fastapi import Query
from app.core.camel_router import CamelRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DB
from app.models.opportunity import Opportunity
from app.schemas.opportunity import OpportunityOut

router = CamelRouter()


@router.get("/", response_model=list[OpportunityOut])
async def list_opportunities(
    current_user: CurrentUser,
    db: DB,
    type: str | None = Query(default=None, description="camp | tryout | tournament"),
    country: str | None = None,
    limit: int = Query(default=30, le=100),
):
    q = select(Opportunity)
    if type:
        q = q.where(Opportunity.type == type)
    if country:
        q = q.where(Opportunity.country == country)
    q = q.order_by(Opportunity.deadline.asc().nullslast()).limit(limit)

    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{opp_id}", response_model=OpportunityOut)
async def get_opportunity(opp_id: str, current_user: CurrentUser, db: DB):
    from fastapi import HTTPException, status
    result = await db.execute(select(Opportunity).where(Opportunity.id == opp_id))
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opportunity not found")
    return opp
