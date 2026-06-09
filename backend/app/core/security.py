import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import jwt, JWTError
from fastapi import HTTPException, status

from app.core.config import settings

ALGORITHM = "HS256"

# TTL для одноразовых токенов
RESET_TOKEN_TTL_SEC    = 3600       # 1 час
VERIFY_TOKEN_TTL_SEC   = 86400      # 24 часа
REFRESH_TOKEN_TTL_SEC  = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400


# ── Passwords ─────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_access_token(subject: Any) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(
        {"sub": str(subject), "exp": expire, "type": "access"},
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )


def create_refresh_token(subject: Any) -> tuple[str, str]:
    """Returns (encoded_token, jti). Caller must store jti for revocation."""
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    token = jwt.encode(
        {"sub": str(subject), "exp": expire, "type": "refresh", "jti": jti},
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )
    return token, jti


def decode_token(token: str, token_type: str = "access") -> str:
    """Decode and validate a JWT; returns sub (user_id as str)."""
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            raise exc
        sub: str | None = payload.get("sub")
        if sub is None:
            raise exc
        return sub
    except JWTError:
        raise exc


def decode_refresh_token_full(token: str) -> tuple[str, str]:
    """Decode refresh token; returns (sub, jti). Raises 401 on invalid."""
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise exc
        sub: str | None = payload.get("sub")
        jti: str | None = payload.get("jti")
        if sub is None or jti is None:
            raise exc
        return sub, jti
    except JWTError:
        raise exc


# ── One-time tokens (password reset / email verify) ───────────────────────────

def generate_opaque_token() -> str:
    """Cryptographically secure URL-safe 256-bit token."""
    return secrets.token_urlsafe(32)
