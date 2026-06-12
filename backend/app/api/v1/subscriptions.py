from app.core.camel_router import CamelRouter

from app.api.deps import CurrentUser, DB
from app.schemas.subscription import PlanOut, BillingInfoOut, UpgradeRequest

router = CamelRouter()

# Единственный источник правды по лимитам — app/api/deps.py (матрица фич).
# Здесь только маркетинговое описание; цифры должны совпадать с deps.py.
PLANS = [
    {"id": "free",    "name": "Free",    "price_monthly": 0,   "currency": "USD",
     "features": [
         "AI-чат: 10 сообщений/день (без базы знаний)",
         "Календарь: до 5 событий всего",
         "Дашборд с метриками",
     ]},
    {"id": "starter", "name": "Starter", "price_monthly": 9,   "currency": "USD",
     "features": [
         "AI-чат: 30 сообщений/день с базой знаний ФХР/ФХБ (RAG)",
         "Полный роадмап карьеры: 3 фазы × 3 этапа",
         "Календарь без ограничений (до 5 событий в день)",
         "Экспорт отчёта игрока в PDF",
     ]},
]


@router.get("/plans", response_model=list[PlanOut])
async def get_plans(current_user: CurrentUser):
    # Собираем ответ заново: мутировать общий PLANS нельзя
    # (shallow copy делил бы словари между конкурентными запросами)
    return [
        {**p, "is_current": p["id"] == current_user.plan}
        for p in PLANS
    ]


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
    from fastapi import HTTPException, status
    if payload.plan_id not in {p["id"] for p in PLANS}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown plan")
    # TODO: create payment intent, redirect to checkout
    return {"checkout_url": f"https://pay.upway.app/checkout?plan={payload.plan_id}"}
