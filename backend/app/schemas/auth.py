from uuid import UUID
from datetime import datetime
from typing import Annotated
from pydantic import EmailStr, Field, AfterValidator

from app.core.base_schema import Schema
from app.core.validators import human_name

HumanName = Annotated[str, AfterValidator(human_name)]


class LoginRequest(Schema):
    email: EmailStr
    password: str = Field(min_length=8)


class RegisterRequest(Schema):
    full_name: HumanName  # camelCase: fullName
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RefreshRequest(Schema):
    refresh_token: str  # camelCase: refreshToken


class LogoutRequest(Schema):
    refresh_token: str  # camelCase: refreshToken


class PasswordResetRequest(Schema):
    email: EmailStr


class PasswordResetConfirm(Schema):
    token: str
    new_password: str = Field(min_length=8, max_length=128)  # camelCase: newPassword


class EmailVerifyRequest(Schema):
    token: str


class UserOut(Schema):
    id: UUID
    email: str
    full_name: str           # camelCase: fullName
    plan: str
    is_email_verified: bool  # camelCase: isEmailVerified
    avatar_url: str | None   # camelCase: avatarUrl
    created_at: datetime     # camelCase: createdAt


class TokenResponse(Schema):
    access_token: str   # camelCase: accessToken
    refresh_token: str  # camelCase: refreshToken
    token_type: str = "bearer"
    user: UserOut
