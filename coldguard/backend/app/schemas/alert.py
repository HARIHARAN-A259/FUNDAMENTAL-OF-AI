"""app/schemas/alert.py"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.alert import AlertType, AlertSeverity, AlertStatus, AlertEventType


class AlertOut(BaseModel):
    id: int
    unit_id: int
    type: AlertType
    severity: AlertSeverity
    status: AlertStatus
    level: int
    message: str
    probable_cause: str
    opened_at: datetime
    resolved_at: Optional[datetime]
    acknowledged_by: Optional[str]
    acknowledged_at: Optional[datetime]
    last_notified_at: Optional[datetime]

    model_config = {"from_attributes": True}


class AlertEventOut(BaseModel):
    id: int
    alert_id: int
    event_type: AlertEventType
    user_id: Optional[int]
    details: str
    timestamp: datetime

    model_config = {"from_attributes": True}


class AlertDetail(AlertOut):
    events: List[AlertEventOut] = []


class AcknowledgeRequest(BaseModel):
    note: Optional[str] = ""

