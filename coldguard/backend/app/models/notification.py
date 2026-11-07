"""
app/models/notification.py
──────────────────────────
Every notification sent (or attempted) is stored here.
Channels: CONSOLE, TELEGRAM, EMAIL, SMS
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class NotifChannel(str, enum.Enum):
    CONSOLE = "CONSOLE"
    TELEGRAM = "TELEGRAM"
    EMAIL = "EMAIL"
    SMS = "SMS"


class NotifStatus(str, enum.Enum):
    SENT = "SENT"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    alert_id: Mapped[int] = mapped_column(Integer, ForeignKey("alerts.id"), nullable=True, index=True)
    level: Mapped[int] = mapped_column(Integer, default=1)
    recipient: Mapped[str] = mapped_column(String(200), nullable=False)
    channel: Mapped[NotifChannel] = mapped_column(Enum(NotifChannel), nullable=False)
    status: Mapped[NotifStatus] = mapped_column(Enum(NotifStatus), default=NotifStatus.SENT)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    error: Mapped[str] = mapped_column(Text, default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship
    alert = relationship("Alert", back_populates="notifications")

