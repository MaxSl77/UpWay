from fastapi import HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.core.camel_router import CamelRouter
from app.core.redis_client import get_redis
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token_full,
    generate_opaque_token,
    RESET_TOKEN_TTL_SEC,
    VERIFY_TOKEN_TTL_SEC,
    REFRESH_TOKEN_TTL_SEC,
)
from app.core.config import settings
from app.core.limiter import limiter
from app.models.user import User
from app.schemas.auth import (
    EmailVerifyRequest,
    LoginRequest,
    LogoutRequest,
    RegisterRequest,
    TokenResponse,
    RefreshRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    UserOut,
)

router = CamelRouter()

# Redis key helpers
def _reset_key(token: str)  -> str: return f"pw_reset:{token}"
def _verify_key(token: str) -> str: return f"email_verify:{token}"
def _jti_key(jti: str)      -> str: return f"refresh_jti_revoked:{jti}"


def _make_token_response(user: User) -> TokenResponse:
    refresh_token, jti = create_refresh_token(user.id)
    # NOTE: jti is embedded in the token itself; no server-side whitelist needed.
    # Revocation is done via blacklist on logout (see /logout endpoint).
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
    )


# ── Register (rate-limited: создаёт аккаунт и шлёт письмо) ───────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("10/minute;30/hour")
async def register(request: Request, payload: RegisterRequest, db: DB):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        is_email_verified=False,
    )
    db.add(user)
    await db.flush()

    # Generate email-verification token and store in Redis for 24 h
    verify_token = generate_opaque_token()
    redis = await get_redis()
    await redis.setex(_verify_key(verify_token), VERIFY_TOKEN_TTL_SEC, str(user.id))

    # Письмо уходит через Celery — API не ждёт HTTP-вызов к Resend
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verify_token}"
    from app.services.email import queue_verification
    queue_verification(user.email, user.full_name, verify_url)

    return _make_token_response(user)


# ── Login (rate-limited: 5 req/min per IP) ────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginRequest, db: DB):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    # Always run verify_password to prevent user-enumeration via timing
    dummy_hash = "$2b$12$KIXlBjHHKxYGmVxoTDwCdOzz.AzXMFqAIJR5KllRYa6tFVTwfcL9K"
    if not user:
        verify_password(payload.password, dummy_hash)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    return _make_token_response(user)


# ── Refresh ───────────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest, db: DB):
    sub, jti = decode_refresh_token_full(payload.refresh_token)

    # Reject if this jti was revoked (e.g. via logout)
    redis = await get_redis()
    if await redis.exists(_jti_key(jti)):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token has been revoked")

    result = await db.execute(select(User).where(User.id == sub))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    # Revoke the used refresh token (rotation — each token is single-use)
    await redis.setex(_jti_key(jti), REFRESH_TOKEN_TTL_SEC, "1")

    return _make_token_response(user)


# ── Logout ────────────────────────────────────────────────────────────────────

@router.post("/logout", status_code=204)
async def logout(payload: LogoutRequest):
    """Blacklist the refresh token's jti so it cannot be used again."""
    try:
        _, jti = decode_refresh_token_full(payload.refresh_token)
        redis = await get_redis()
        await redis.setex(_jti_key(jti), REFRESH_TOKEN_TTL_SEC, "1")
    except HTTPException:
        pass  # already invalid — treat as successful logout
    return None


# ── Email verification ────────────────────────────────────────────────────────

@router.post("/verify-email", status_code=200)
async def verify_email(payload: EmailVerifyRequest, db: DB):
    redis = await get_redis()
    key = _verify_key(payload.token)
    user_id = await redis.get(key)
    if not user_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired verification token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "User not found")

    user.is_email_verified = True
    db.add(user)
    await db.flush()
    await redis.delete(key)  # token is one-time use

    return {"detail": "Email verified successfully"}


@router.post("/resend-verification", status_code=202)
@limiter.limit("3/minute;10/hour")
async def resend_verification(request: Request, current_user: CurrentUser):
    """Re-send verification email for the currently authenticated user."""
    if current_user.is_email_verified:
        return {"detail": "Email already verified"}

    verify_token = generate_opaque_token()
    redis = await get_redis()
    await redis.setex(_verify_key(verify_token), VERIFY_TOKEN_TTL_SEC, str(current_user.id))

    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verify_token}"
    from app.services.email import queue_verification
    queue_verification(current_user.email, current_user.full_name, verify_url)

    return {"detail": "Verification email sent"}


# ── Me ────────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
async def get_me(current_user: CurrentUser):
    return current_user


# ── Password reset ────────────────────────────────────────────────────────────

@router.post("/password-reset/request", status_code=202)
@limiter.limit("5/minute;20/hour")
async def request_password_reset(request: Request, payload: PasswordResetRequest, db: DB):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    # Always return 202 regardless of whether email exists (prevents enumeration)
    if user and user.is_active:
        token = generate_opaque_token()
        redis = await get_redis()
        # One token per user: delete any existing token for this user first
        await redis.setex(_reset_key(token), RESET_TOKEN_TTL_SEC, str(user.id))

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        from app.services.email import queue_password_reset
        queue_password_reset(user.email, user.full_name, reset_url)

    return {"detail": "If the email exists, a reset link has been sent."}


@router.post("/password-reset/confirm", status_code=200)
async def confirm_password_reset(payload: PasswordResetConfirm, db: DB):
    redis = await get_redis()
    key = _reset_key(payload.token)
    user_id = await redis.get(key)
    if not user_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "User not found")

    user.hashed_password = hash_password(payload.new_password)
    db.add(user)
    await db.flush()
    await redis.delete(key)  # token is one-time use

    return {"detail": "Password updated successfully."}


# ── Change password (authenticated) ──────────────────────────────────────────

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password", status_code=200)
async def change_password(payload: ChangePasswordRequest, current_user: CurrentUser, db: DB):
    if len(payload.new_password) < 8:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Password must be at least 8 characters")
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    db.add(current_user)
    await db.flush()
    return {"detail": "Password changed successfully"}


# ── Account management ────────────────────────────────────────────────────────

class PlanUpdateRequest(BaseModel):
    plan: str


# TODO(SECURITY): This endpoint is intentionally open during local development
# (no payment provider connected yet).
# BEFORE PRODUCTION: Remove this endpoint and drive plan changes exclusively
# from a verified payment webhook (Stripe / YooKassa / etc.).
# Any authenticated user can currently self-upgrade to "starter" for free.
@router.patch("/me/plan", response_model=UserOut)
async def update_plan(payload: PlanUpdateRequest, current_user: CurrentUser, db: DB):
    from app.api.deps import KNOWN_PLANS
    if settings.ENVIRONMENT == "production":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Plan changes must go through the payment provider.",
        )
    if payload.plan not in KNOWN_PLANS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid plan")
    current_user.plan = payload.plan
    db.add(current_user)
    await db.flush()
    return current_user


@router.delete("/me", status_code=204)
async def delete_account(current_user: CurrentUser, db: DB):
    await db.delete(current_user)
    await db.flush()
