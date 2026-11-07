"""
app/api/routes/reports.py
─────────────────────────
GET /api/reports/daily.pdf
GET /api/reports/readings.csv
GET /api/reports/alerts.csv
"""
import csv
import io
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_manager_or_above
from app.models.alert import Alert
from app.models.reading import Reading
from app.models.user import User
from app.services.report_pdf import generate_daily_pdf

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/daily.pdf", summary="Download daily PDF report")
def download_pdf(
    report_date: Optional[date] = Query(default=None),
    unit_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    pdf_bytes = generate_daily_pdf(db, report_date, unit_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=coldguard-report-{report_date or date.today()}.pdf"},
    )


@router.get("/readings.csv", summary="Download temperature readings as CSV")
def download_readings_csv(
    unit_id: Optional[int] = Query(default=None),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    q = db.query(Reading)
    if unit_id:
        q = q.filter(Reading.unit_id == unit_id)
    if from_date:
        q = q.filter(Reading.timestamp >= from_date)
    if to_date:
        q = q.filter(Reading.timestamp <= to_date)
    readings = q.order_by(Reading.timestamp).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "unit_id", "temperature", "timestamp"])
    for r in readings:
        writer.writerow([r.id, r.unit_id, r.temperature, r.timestamp.isoformat()])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=readings.csv"},
    )


@router.get("/alerts.csv", summary="Download alerts as CSV")
def download_alerts_csv(
    unit_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    q = db.query(Alert)
    if unit_id:
        q = q.filter(Alert.unit_id == unit_id)
    alerts = q.order_by(Alert.opened_at).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "unit_id", "type", "severity", "status", "level", "message",
                     "probable_cause", "opened_at", "resolved_at", "acknowledged_by", "acknowledged_at"])
    for a in alerts:
        writer.writerow([
            a.id, a.unit_id, a.type.value, a.severity.value, a.status.value,
            a.level, a.message, a.probable_cause,
            a.opened_at, a.resolved_at, a.acknowledged_by, a.acknowledged_at
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=alerts.csv"},
    )

