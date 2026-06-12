from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, Query, status
from app.core.camel_router import CamelRouter
from sqlalchemy import select, func

from app.api.deps import CurrentUser, DB
from app.models.player import Player
from app.models.skill_history import SkillSnapshot
from app.schemas.player import (
    PlayerCreate, PlayerUpdate, PlayerOut,
    DashboardMetrics, NextStep, SkillSnapshotOut,
)
from app.tasks.ai_tasks import generate_roadmap_task

router = CamelRouter()

# Окно сравнения для дельт навыков на дашборде
SKILL_DELTA_WINDOW_DAYS = 30


@router.post("/", response_model=PlayerOut, status_code=201)
async def create_player(payload: PlayerCreate, current_user: CurrentUser, db: DB):
    existing = await db.execute(select(Player).where(Player.user_id == current_user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Player profile already exists")

    player = Player(**payload.model_dump(), user_id=current_user.id)
    db.add(player)
    await db.flush()

    # Стартовый снимок навыков — точка отсчёта для истории прогресса
    db.add(SkillSnapshot(player_id=player.id, skills=player.skills))

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

    data = payload.model_dump(exclude_unset=True)
    skills_changed = "skills" in data and data["skills"] != player.skills

    for field, value in data.items():
        setattr(player, field, value)

    if skills_changed:
        db.add(SkillSnapshot(player_id=player.id, skills=data["skills"]))

    return player


@router.get("/me/skills/history", response_model=list[SkillSnapshotOut])
async def get_skills_history(
    current_user: CurrentUser,
    db: DB,
    limit: int = Query(default=100, le=365),
):
    """История снимков навыков (для графиков прогресса), от старых к новым."""
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player profile not found")

    snapshots = await db.execute(
        select(SkillSnapshot)
        .where(SkillSnapshot.player_id == player.id)
        .order_by(SkillSnapshot.created_at.asc())
        .limit(limit)
    )
    return snapshots.scalars().all()


@router.get("/me/metrics", response_model=DashboardMetrics)
async def get_metrics(current_user: CurrentUser, db: DB):
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player profile not found")

    skills: dict = player.skills or {}
    avg_skill = sum(skills.values()) / len(skills) if skills else 5.0
    skating   = float(skills.get("skating", 5))

    # Дельта катания: сравниваем с базовым снимком из истории навыков —
    # ближайший снапшот старше окна (30 дней), иначе самый ранний.
    window_start = datetime.now(timezone.utc) - timedelta(days=SKILL_DELTA_WINDOW_DAYS)
    baseline_res = await db.execute(
        select(SkillSnapshot)
        .where(
            SkillSnapshot.player_id == player.id,
            SkillSnapshot.created_at <= window_start,
        )
        .order_by(SkillSnapshot.created_at.desc())
        .limit(1)
    )
    baseline = baseline_res.scalar_one_or_none()
    if baseline is None:
        earliest_res = await db.execute(
            select(SkillSnapshot)
            .where(SkillSnapshot.player_id == player.id)
            .order_by(SkillSnapshot.created_at.asc())
            .limit(1)
        )
        baseline = earliest_res.scalar_one_or_none()

    skating_delta = 0.0
    if baseline and baseline.skills:
        skating_delta = round(skating - float(baseline.skills.get("skating", skating)), 1)

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
        skating_delta=skating_delta,
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
