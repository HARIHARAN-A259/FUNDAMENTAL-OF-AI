"""
app/core/security.py
────────────────────
Password hashing and JWT token creation / verification.
Uses bcrypt directly to avoid passlib 1.7.4 compatibility bugs with bcrypt >= 4.0.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(plain: str) -> str:
    """Return bcrypt hash of a plain-text password."""
    import os
    pwd_bytes = plain.encode("utf-8")[:72]
    rounds = 4 if os.getenv("TESTING") == "1" else 12
    salt = bcrypt.gensalt(rounds=rounds)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the stored hash."""
    try:
        pwd_bytes = plain.encode("utf-8")[:72]
        hash_bytes = hashed.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JWT.
    data – dict of claims (must include 'sub': user email)
    Returns the encoded token string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.APP_SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT.
    Returns the payload dict or None if invalid / expired.
    """
    try:
        return jwt.decode(token, settings.APP_SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
