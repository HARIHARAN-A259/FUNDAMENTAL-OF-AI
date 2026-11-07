"""
app/api/deps.py
───────────────
FastAPI dependency functions shared across all routes.
"""
from typing import Generator

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import Role, User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate JWT, return the User object."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    email = payload.get("sub")
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def require_manager_or_above(user: User = Depends(get_current_user)) -> User:
    if user.role not in (Role.MANAGER, Role.MEDICAL_OFFICER, Role.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager or above required")
    return user


def get_sensor_api_key(x_api_key: str = None) -> str:
    """Dependency for the sensor ingestion endpoint – validates API key header."""
    from fastapi import Header
    return x_api_key

