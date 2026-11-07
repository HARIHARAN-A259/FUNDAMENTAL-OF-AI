"""
app/models/user.py
──────────────────
User model: stores login credentials and role.
Roles: STAFF, MANAGER, MEDICAL_OFFICER, ADMIN
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Role(str, enum.Enum):
    STAFF = "STAFF"
    MANAGER = "MANAGER"
    MEDICAL_OFFICER = "MEDICAL_OFFICER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.STAFF, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    alert_events = relationship("AlertEvent", back_populates="user", foreign_keys="AlertEvent.user_id")

