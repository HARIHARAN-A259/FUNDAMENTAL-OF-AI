"""
app/models/storage_unit.py
──────────────────────────
A storage unit is a fridge or freezer with its own temperature thresholds.
Each unit has a sensor_id that an ESP32 / MQTT sensor can use to post data.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class UnitType(str, enum.Enum):
    FRIDGE = "FRIDGE"
    FREEZER = "FREEZER"


class StorageUnit(Base):
    __tablename__ = "storage_units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[UnitType] = mapped_column(Enum(UnitType), default=UnitType.FRIDGE)
    location: Mapped[str] = mapped_column(String(200), default="")
    sensor_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Temperature thresholds
    min_temp: Mapped[float] = mapped_column(Float, default=2.0)   # safe low
    max_temp: Mapped[float] = mapped_column(Float, default=8.0)   # safe high
    warn_low: Mapped[float] = mapped_column(Float, default=2.5)   # warning low
    warn_high: Mapped[float] = mapped_column(Float, default=7.5)  # warning high
    critical_min: Mapped[float] = mapped_column(Float, default=0.0)
    critical_max: Mapped[float] = mapped_column(Float, default=10.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    readings = relationship("Reading", back_populates="unit", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="unit", cascade="all, delete-orphan")

