from fastapi import HTTPException, status

from app.core.camel_router import CamelRouter

from app.api.deps import CurrentUser, DB
from app.schemas.auth import UserOut
from app.schemas.subscription import PlanOut, BillingInfoOut, UpgradeRequest

router = CamelRouter()

# Иерархия тарифов от младшего к старшему. Будущий "pro" просто добавится
# в конец списка — downgrade-логика ниже уже учитывает любой уровень.
PLAN_ORDER = ["free", "starter"]


def _plan_rank(plan: str) -> int:
    """Позиция тарифа в иерархии; неизвестный план трактуем как free."""
    return PLAN_ORDER.index(plan) if plan in PLAN_ORDER else 0

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
    if payload.plan_id not in {p["id"] for p in PLANS}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown plan")
    # TODO: create payment intent, redirect to checkout
    return {"checkout_url": f"https://pay.upway.app/checkout?plan={payload.plan_id}"}


@router.post("/cancel", response_model=UserOut)
async def cancel_subscription(current_user: CurrentUser, db: DB):
    """
    Отмена платной подписки — возврат на тариф ниже (сейчас всегда free).

    Работает и в production: отмена не требует платёжного провайдера —
    деньги не двигаются, пользователь только отказывается от продления.

    TODO(bePaid): после интеграции платежей —
      1) отменить рекуррентный платёж в bePaid;
      2) НЕ даунгрейдить сразу: выставить cancel_at_period_end и оставить
         доступ до конца оплаченного периода (стандарт SaaS, без возвратов);
      3) даунгрейд выполнит Celery-задача по истечении периода.
    До интеграции реальных оплат нет, поэтому даунгрейд немедленный.
    """
    if _plan_rank(current_user.plan) == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Нет активной платной подписки")

    # Отмена всегда ведёт на базовый тариф (free): и со Starter, и с будущего
    # Pro. Данные пользователя (роадмап, история, чаты) НЕ удаляются —
    # они лишь закрываются гейтами тарифа и вернутся при повторном апгрейде.
    current_user.plan = PLAN_ORDER[0]
    db.add(current_user)
    await db.flush()
    return current_user
