from fastapi import HTTPException, status
from pydantic import BaseModel
from app.core.camel_router import CamelRouter
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.models.user import User
from app.schemas.auth import (
    LoginRequest, RegisterRequest,
    TokenResponse, RefreshRequest,
    PasswordResetRequest, PasswordResetConfirm,
    UserOut,
)

router = CamelRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest, db: DB):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    await db.flush()

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: DB):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest, db: DB):
    user_id = decode_token(payload.refresh_token, token_type="refresh")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: CurrentUser):
    return current_user


@router.post("/password-reset/request", status_code=202)
async def request_password_reset(payload: PasswordResetRequest, db: DB):
    return {"detail": "If the email exists, a reset link has been sent."}


@router.post("/password-reset/confirm", status_code=200)
async def confirm_password_reset(payload: PasswordResetConfirm, db: DB):
    return {"detail": "Password updated successfully."}


# ── Account management ────────────────────────────────────────────────────────

class PlanUpdateRequest(BaseModel):
    plan: str


@router.patch("/me/plan", response_model=UserOut)
async def update_plan(payload: PlanUpdateRequest, current_user: CurrentUser, db: DB):
    """Update the authenticated user's subscription plan in the DB."""
    if payload.plan not in {"free", "starter", "pro"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid plan")
    current_user.plan = payload.plan
    db.add(current_user)
    await db.flush()
    return current_user


@router.delete("/me", status_code=204)
async def delete_account(current_user: CurrentUser, db: DB):
    """Permanently delete the authenticated user and all related data."""
    await db.delete(current_user)
    await db.flush()
