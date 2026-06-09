from app.core.camel_router import CamelRouter

from app.api.deps import CurrentUser, DB
from app.schemas.subscription import PlanOut, BillingInfoOut, UpgradeRequest

router = CamelRouter()

PLANS = [
    {"id": "free",    "name": "Free",    "price_monthly": 0,   "currency": "USD",
     "features": ["5 AI messages/day", "Basic roadmap", "Calendar"],
     "is_current": False},
    {"id": "starter", "name": "Starter", "price_monthly": 12,  "currency": "USD",
     "features": ["50 AI messages/day", "Full roadmap", "Opportunities feed", "Email digest"],
     "is_current": True},
    {"id": "pro",     "name": "Pro",     "price_monthly": 29,  "currency": "USD",
     "features": ["Unlimited AI messages", "RAG knowledge base", "Scout reports", "Priority support"],
     "is_current": False},
]


@router.get("/plans", response_model=list[PlanOut])
async def get_plans(current_user: CurrentUser):
    plans = PLANS.copy()
    for p in plans:
        p["is_current"] = p["id"] == current_user.plan
    return plans


@router.get("/billing", response_model=BillingInfoOut)
async def get_billing(current_user: CurrentUser, db: DB):
    # TODO: integrate with payment provider (Stripe / YooKassa)
    return BillingInfoOut(
        next_billing_date="2026-07-05",
        payment_method="•••• 4242",
        last_invoice_amount=12,
    )


@router.post("/upgrade")
async def upgrade_plan(payload: UpgradeRequest, current_user: CurrentUser, db: DB):
    # TODO: create payment intent, redirect to checkout
    return {"checkout_url": f"https://pay.upway.app/checkout?plan={payload.plan_id}"}
