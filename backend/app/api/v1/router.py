from fastapi import APIRouter

from app.api.v1 import auth, players, chat, roadmap, calendar, opportunities, subscriptions

router = APIRouter()

router.include_router(auth.router,          prefix="/auth",          tags=["auth"])
router.include_router(players.router,       prefix="/players",       tags=["players"])
router.include_router(chat.router,          prefix="/chat",          tags=["chat"])
router.include_router(roadmap.router,       prefix="/roadmap",       tags=["roadmap"])
router.include_router(calendar.router,      prefix="/calendar",      tags=["calendar"])
router.include_router(opportunities.router, prefix="/opportunities",  tags=["opportunities"])
router.include_router(subscriptions.router, prefix="/subscriptions",  tags=["subscriptions"])
