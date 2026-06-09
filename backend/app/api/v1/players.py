from datetime import date
from fastapi import HTTPException, status
from app.core.camel_router import CamelRouter
from sqlalchemy import select, func

from app.api.deps import CurrentUser, DB
from app.models.player import Player
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerOut, DashboardMetrics, NextStep
from app.tasks.ai_tasks import generate_roadmap_task

router = CamelRouter()


@router.post("/", response_model=PlayerOut, status_code=201)
async def create_player(payload: PlayerCreate, current_user: CurrentUser, db: DB):
    existing = await db.execute(select(Player).where(Player.user_id == current_user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Player profile already exists")

    player = Player(**payload.model_dump(), user_id=current_user.id)
    db.add(player)
    await db.flush()

    # Kick off async roadmap generation
    generate_roadmap_task.delay(str(player.id))

    return player


@router.get("/me", response_model=PlayerOut)
async def get_my_player(current_user: CurrentUser, db: DB):
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player profile not found")
    return player


@router.patch("/me", response_model=PlayerOut)
async def update_my_player(payload: PlayerUpdate, current_user: CurrentUser, db: DB):
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player profile not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(player, field, value)

    return player


@router.get("/me/metrics", response_model=DashboardMetrics)
async def get_metrics(current_user: CurrentUser, db: DB):
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player profile not found")

    skills: dict = player.skills or {}
    avg_skill = sum(skills.values()) / len(skills) if skills else 5.0
    skating   = float(skills.get("skating", 5))

    # Цель — первый элемент из goals, или дефолт
    goal_label = player.goals[0] if player.goals else "МХЛ"

    # TECH DEBT: Возраст дебюта задан статической таблицей.
    # В будущем заменить на данные из реальной статистики лиг
    # (например, средний возраст первого контракта по позиции и уровню).
    target_ages = {"МХЛ": 17, "ВХЛ": 20, "КХЛ": 21, "НХЛ": 22, "Экстралига": 18}
    target_age  = target_ages.get(goal_label, 18)
    months_left = max(0, (target_age - player.age) * 12)

    # TECH DEBT: Прогресс считается как доля навыков ≥ 6/10.
    # Упрощённая эвристика — не учитывает вес навыков по позиции игрока.
    # Заменить на взвешенную модель после накопления достаточной выборки данных.
    skills_above_6 = sum(1 for v in skills.values() if v >= 6)
    goal_progress  = round((skills_above_6 / 5) * 100) if skills else 0

    # TECH DEBT: Вероятность достижения цели — линейная интерполяция avg_skill → 30%..95%.
    # Это маркетинговая метрика, не статистическая модель.
    # Заменить на ML-модель (логистическая регрессия / градиентный бустинг)
    # после сбора данных о реальных карьерных траекториях игроков.
    probability = round(30 + (avg_skill - 1) / 9 * 65)

    return DashboardMetrics(
        goal_progress_pct=goal_progress,
        goal_label=goal_label,
        months_remaining=months_left,
        skating_score=round(skating, 1),
        skating_delta=0.0,  # TECH DEBT: delta за период пока не вычисляется (нет истории навыков)
        goal_probability_pct=probability,
        probability_updated_at=str(date.today()),
    )


@router.get("/me/next-step", response_model=NextStep)
async def get_next_step(current_user: CurrentUser, db: DB):
    from app.models.roadmap import RoadmapItem
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player profile not found")

    # Берём первый активный этап роадмапа
    roadmap_result = await db.execute(
        select(RoadmapItem)
        .where(RoadmapItem.player_id == player.id, RoadmapItem.status == "active")
        .order_by(RoadmapItem.sort_order)
        .limit(1)
    )
    active_item = roadmap_result.scalar_one_or_none()

    if active_item:
        return NextStep(
            title=active_item.title,
            description=active_item.description or "Следующий шаг в вашем плане развития.",
            cta_label="Открыть роадмап →",
        )

    # Роадмап ещё генерируется — умный дефолт на основе целей
    goal = player.goals[0] if player.goals else "цели"
    return NextStep(
        title=f"Роадмап генерируется для цели «{goal}»",
        description="AI составляет персональный план развития. Обычно это занимает менее минуты.",
        cta_label="Посмотреть роадмап →",
    )
