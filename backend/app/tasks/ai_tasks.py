"""
Celery tasks for background AI processing.
"""
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def generate_roadmap_task(self, player_id: str):
    """
    Generate a personalized roadmap for a player using GPT-4o.
    Triggered after onboarding completes.
    """
    try:
        from app.core.database import AsyncSessionLocal
        from app.models.player import Player
        from app.models.roadmap import RoadmapItem
        import asyncio

        async def _run():
            async with AsyncSessionLocal() as db:
                from sqlalchemy import select
                result = await db.execute(select(Player).where(Player.id == player_id))
                player = result.scalar_one_or_none()
                if not player:
                    return

                # Idempotency guard: skip if roadmap already exists for this player
                existing = await db.execute(
                    select(RoadmapItem).where(RoadmapItem.player_id == player.id).limit(1)
                )
                if existing.scalar_one_or_none():
                    return

                # Build prompt
                prompt = (
                    f"Create a 3-phase hockey development roadmap for:\n"
                    f"Name: {player.name}, Age: {player.age}, Position: {player.position}\n"
                    f"Level: {player.level}, Goals: {', '.join(player.goals)}\n"
                    f"Skills: {player.skills}\n\n"
                    "Return 8-12 concrete milestones in JSON: "
                    "[{phase_number, phase, title, description, target_date, tags}]"
                )

                from openai import AsyncOpenAI
                from app.core.config import settings
                client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                response = await client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                )

                import json
                items_data = json.loads(response.choices[0].message.content).get("items", [])
                for i, item in enumerate(items_data):
                    db.add(RoadmapItem(
                        player_id=player.id,
                        sort_order=i,
                        status="active" if i == 0 else "todo",
                        **{k: v for k, v in item.items() if k != "id"},
                    ))
                await db.commit()

        # asyncio.run() can raise RuntimeError if an event loop is already
        # running in the current thread (e.g. some Celery pool configurations).
        # Creating an explicit new loop avoids the conflict entirely.
        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(_run())
        finally:
            loop.close()

    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task
def refresh_opportunities():
    """
    Scrape / sync opportunities from external sources into the DB.
    Runs daily via Celery Beat.
    """
    # TODO: implement scrapers for known hockey camp/tournament sites
    pass


@celery_app.task
def send_email(to: str, subject: str, html: str):
    """Generic email sender via SMTP / SendGrid."""
    # TODO: configure email backend
    pass
