"""app/schemas/notification.py"""
from datetime import datetime
from pydantic import BaseModel
from app.models.notification import NotifChannel, NotifStatus


class NotificationOut(BaseModel):
    id: int
    alert_id: int | None
    level: int
    recipient: str
    channel: NotifChannel
    status: NotifStatus
    message: str
    error: str
    timestamp: datetime

    model_config = {"from_attributes": True}

