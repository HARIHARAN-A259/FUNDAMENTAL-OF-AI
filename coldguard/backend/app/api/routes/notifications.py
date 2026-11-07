"""
app/api/routes/notifications.py
────────────────────────────────
GET /api/notifications  – list sent notifications
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationOut], summary="List notifications")
def list_notifications(
    alert_id: Optional[int] = Query(default=None),
    channel: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Notification)
    if alert_id:
        q = q.filter(Notification.alert_id == alert_id)
    if channel:
        q = q.filter(Notification.channel == channel)
    offset = (page - 1) * page_size
    return q.order_by(Notification.timestamp.desc()).offset(offset).limit(page_size).all()

