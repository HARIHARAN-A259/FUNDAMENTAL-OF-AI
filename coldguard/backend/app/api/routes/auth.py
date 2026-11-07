"""
app/api/routes/auth.py
──────────────────────
Login and "who am I" endpoints.
POST /api/auth/login  → returns JWT
GET  /api/auth/me     → returns current user info
"""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.user import Token, UserOut
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login", response_model=Token, summary="Login and get JWT token")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Supply email + password.
    Returns a JWT access token and the user's details.
    """
    user = db.query(User).filter(User.email == payload.email, User.is_active == True).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token(
        data={"sub": user.email, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut, summary="Get current user info")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

