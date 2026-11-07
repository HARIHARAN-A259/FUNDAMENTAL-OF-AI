"""app/schemas/user.py – Pydantic models for user data."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import Role


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Role = Role.STAFF


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: Role
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    sub: Optional[str] = None  # user email
    role: Optional[str] = None

