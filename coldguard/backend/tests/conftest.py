"""
backend/tests/conftest.py
Fixture setup for tests with isolated in-memory SQLite database.
"""
import os
os.environ["TESTING"] = "1"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.deps import get_db
from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.main import app
from app.models.contact import ContactPerson
from app.models.storage_unit import StorageUnit, UnitType
from app.models.user import Role, User

# Test Database Engine (in-memory SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()

    # Seed basic unit and users for test
    admin_user = User(
        name="Test Admin",
        email="admin@test.com",
        hashed_password=hash_password("Admin123!"),
        role=Role.ADMIN,
        is_active=True,
    )
    staff_user = User(
        name="Test Staff",
        email="staff@test.com",
        hashed_password=hash_password("Staff123!"),
        role=Role.STAFF,
        is_active=True,
    )
    manager_user = User(
        name="Test Manager",
        email="manager@test.com",
        hashed_password=hash_password("Manager123!"),
        role=Role.MANAGER,
        is_active=True,
    )
    unit1 = StorageUnit(
        name="Test Fridge A",
        type=UnitType.FRIDGE,
        location="Bay 1",
        sensor_id="TEST-FRIDGE-1",
        min_temp=2.0,
        max_temp=8.0,
        warn_low=2.5,
        warn_high=7.5,
        critical_min=0.0,
        critical_max=10.0,
    )
    session.add_all([admin_user, staff_user, manager_user, unit1])
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app, raise_server_exceptions=True)
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token():
    return create_access_token({"sub": "admin@test.com", "role": "ADMIN"})


@pytest.fixture
def staff_token():
    return create_access_token({"sub": "staff@test.com", "role": "STAFF"})
