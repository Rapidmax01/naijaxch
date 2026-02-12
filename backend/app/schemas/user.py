from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user response."""
    id: UUID
    is_active: bool
    is_verified: bool
    telegram_chat_id: Optional[int] = None
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for JWT tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for token payload."""
    sub: str
    exp: datetime
    type: str


class PasswordChange(BaseModel):
    """Schema for changing password."""
    current_password: str
    new_password: str = Field(..., min_length=8)


class PasswordReset(BaseModel):
    """Schema for password reset."""
    token: str
    new_password: str = Field(..., min_length=8)


class PasswordResetRequest(BaseModel):
    """Schema for requesting password reset."""
    email: EmailStr


class GoogleAuthRequest(BaseModel):
    """Schema for Google OAuth sign-in."""
    token: str
