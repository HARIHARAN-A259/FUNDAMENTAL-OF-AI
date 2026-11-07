"""
app/api/routes/alerts.py
────────────────────────
GET  /api/alerts           – list with filters + pagination
GET  /api/alerts/{id}      – detail with event timeline
POST /api/alerts/{id}/acknowledge
GET  /api/audit            – full audit log
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.alert import Alert, AlertEvent, AlertStatus, AlertType
from app.models.user import User
from app.schemas.alert import AcknowledgeRequest, AlertDetail, AlertEventOut, AlertOut
from app.services.escalation_agent import acknowledge_alert

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=List[AlertOut], summary="List alerts with optional filters")
def list_alerts(
    unit_id: Optional[int] = Query(default=None),
    alert_type: Optional[AlertType] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    severity: Optional[str] = Query(default=None),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Alert)
    if unit_id:
        q = q.filter(Alert.unit_id == unit_id)
    if alert_type:
        q = q.filter(Alert.type == alert_type)
    if status_filter:
        q = q.filter(Alert.status == status_filter)
    if severity:
        q = q.filter(Alert.severity == severity)
    if from_date:
        q = q.filter(Alert.opened_at >= from_date)
    if to_date:
        q = q.filter(Alert.opened_at <= to_date)
    offset = (page - 1) * page_size
    return q.order_by(Alert.opened_at.desc()).offset(offset).limit(page_size).all()


@router.get("/active", response_model=List[AlertOut], summary="Get all currently active alerts")
def list_active_alerts(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return (
        db.query(Alert)
        .filter(Alert.status.notin_([AlertStatus.RESOLVED]))
        .order_by(Alert.opened_at.desc())
        .all()
    )


@router.get("/{alert_id}", response_model=AlertDetail, summary="Get alert details with event timeline")
def get_alert(alert_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/{alert_id}/acknowledge", summary="Acknowledge an alert")
def ack_alert(
    alert_id: int,
    payload: AcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status in (AlertStatus.RESOLVED,):
        raise HTTPException(status_code=400, detail="Alert is already resolved")
    acknowledge_alert(db, alert, current_user.id, current_user.name, payload.note or "")
    return {"ok": True, "alert_id": alert_id, "acknowledged_by": current_user.name}


@router.get("/audit/log", response_model=List[AlertEventOut], summary="Audit log of all alert events")
def audit_log(
    user_id: Optional[int] = Query(default=None),
    event_type: Optional[str] = Query(default=None),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(AlertEvent)
    if user_id:
        q = q.filter(AlertEvent.user_id == user_id)
    if event_type:
        q = q.filter(AlertEvent.event_type == event_type)
    if from_date:
        q = q.filter(AlertEvent.timestamp >= from_date)
    if to_date:
        q = q.filter(AlertEvent.timestamp <= to_date)
    offset = (page - 1) * page_size
    return q.order_by(AlertEvent.timestamp.desc()).offset(offset).limit(page_size).all()

