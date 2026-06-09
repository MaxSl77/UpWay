from uuid import UUID
from datetime import datetime
from pydantic import EmailStr, Field

from app.core.base_schema import Schema


class LoginRequest(Schema):
    email: EmailStr
    password: str = Field(min_length=8)


class RegisterRequest(Schema):
    full_name: str = Field(min_length=2, max_length=255)  # camelCase: fullName
    email: EmailStr
    password: str = Field(min_length=8)


class RefreshRequest(Schema):
    refresh_token: str  # camelCase: refreshToken


class PasswordResetRequest(Schema):
    email: EmailStr


class PasswordResetConfirm(Schema):
    token: str
    new_password: str = Field(min_length=8)  # camelCase: newPassword


class UserOut(Schema):
    id: UUID
    email: str
    full_name: str          # camelCase: fullName
    plan: str
    avatar_url: str | None  # camelCase: avatarUrl
    created_at: datetime    # camelCase: createdAt


class TokenResponse(Schema):
    access_token: str   # camelCase: accessToken
    refresh_token: str  # camelCase: refreshToken
    token_type: str = "bearer"
    user: UserOut
