"""
app/models/alert.py
───────────────────
Alert and AlertEvent models.

Alert: one open problem (temperature excursion or sensor offline).
AlertEvent: audit trail – every status change is logged here.

State machine:
  OPEN → ESCALATED_L2 → ESCALATED_L3 → ACKNOWLEDGED / RESOLVED
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class AlertType(str, enum.Enum):
    TEMPERATURE = "TEMPERATURE"
    SENSOR_OFFLINE = "SENSOR_OFFLINE"


class AlertSeverity(str, enum.Enum):
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class AlertStatus(str, enum.Enum):
    OPEN = "OPEN"
    ESCALATED_L2 = "ESCALATED_L2"
    ESCALATED_L3 = "ESCALATED_L3"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    unit_id: Mapped[int] = mapped_column(Integer, ForeignKey("storage_units.id"), nullable=False, index=True)
    type: Mapped[AlertType] = mapped_column(Enum(AlertType), nullable=False)
    severity: Mapped[AlertSeverity] = mapped_column(Enum(AlertSeverity), default=AlertSeverity.WARNING)
    status: Mapped[AlertStatus] = mapped_column(Enum(AlertStatus), default=AlertStatus.OPEN, index=True)
    level: Mapped[int] = mapped_column(Integer, default=0)  # 0=new, 1=L1, 2=L2, 3=L3
    message: Mapped[str] = mapped_column(Text, nullable=False)
    probable_cause: Mapped[str] = mapped_column(String(200), default="")
    opened_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    acknowledged_by: Mapped[str] = mapped_column(String(200), nullable=True)
    acknowledged_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    last_notified_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Relationships
    unit = relationship("StorageUnit", back_populates="alerts")
    events = relationship("AlertEvent", back_populates="alert", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="alert", cascade="all, delete-orphan")


class AlertEventType(str, enum.Enum):
    OPENED = "OPENED"
    ESCALATED = "ESCALATED"
    REMINDER = "REMINDER"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class AlertEvent(Base):
    """One row per state change – this is the full audit trail."""
    __tablename__ = "alert_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    alert_id: Mapped[int] = mapped_column(Integer, ForeignKey("alerts.id"), nullable=False, index=True)
    event_type: Mapped[AlertEventType] = mapped_column(Enum(AlertEventType), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    details: Mapped[str] = mapped_column(Text, default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    alert = relationship("Alert", back_populates="events")
    user = relationship("User", back_populates="alert_events", foreign_keys=[user_id])

