"""
tests/test_auth_roles.py
Tests authentication, token generation, decoding, password hashing, and role checks.
"""
import pytest
from fastapi import HTTPException
from app.api.deps import require_admin
from app.api.routes.auth import login, LoginRequest
from app.core.security import create_access_token, decode_token, hash_password, verify_password
from app.models.user import Role, User


def test_password_hashing_and_verification():
    plain = "SecretPassword123!"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_generation_and_decoding():
    token = create_access_token({"sub": "admin@coldguard.local", "role": "ADMIN"})
    assert isinstance(token, str)
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "admin@coldguard.local"
    assert payload["role"] == "ADMIN"


def test_login_success(db_session):
    req = LoginRequest(email="admin@test.com", password="Admin123!")
    res = login(payload=req, db=db_session)
    assert res.access_token is not None
    assert res.user.email == "admin@test.com"
    assert res.user.role == Role.ADMIN


def test_login_failure_wrong_password(db_session):
    req = LoginRequest(email="admin@test.com", password="WrongPassword!")
    with pytest.raises(HTTPException) as exc:
        login(payload=req, db=db_session)
    assert exc.value.status_code == 401


def test_admin_permission_check():
    staff_user = User(id=1, name="Staff", email="staff@test.com", hashed_password="", role=Role.STAFF)
    admin_user = User(id=2, name="Admin", email="admin@test.com", hashed_password="", role=Role.ADMIN)

    # Staff fails admin check
    with pytest.raises(HTTPException) as exc:
        require_admin(user=staff_user)
    assert exc.value.status_code == 403

    # Admin passes admin check
    res = require_admin(user=admin_user)
    assert res.email == "admin@test.com"
