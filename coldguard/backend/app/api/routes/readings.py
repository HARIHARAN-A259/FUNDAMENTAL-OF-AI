"""
app/api/routes/readings.py
──────────────────────────
POST /api/readings/ingest  – for real ESP32 / MQTT sensors
GET  /api/units/{id}/readings – paginated temperature history
"""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.reading import Reading
from app.models.storage_unit import StorageUnit
from app.models.user import User
from app.schemas.reading import ReadingIngest, ReadingOut
from app.services.monitoring_engine import process_reading

router = APIRouter(tags=["readings"])


@router.post(
    "/api/readings/ingest",
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a sensor reading (ESP32 / MQTT)",
)
def ingest_reading(
    payload: ReadingIngest,
    db: Session = Depends(get_db),
    x_api_key: Optional[str] = Header(default=None),
):
    """
    Protected by X-API-Key header.
    A real sensor (ESP32 etc.) posts data here.
    The monitoring engine processes it the same way as the simulator.
    """
    if x_api_key != settings.SENSOR_API_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API key")

    unit = db.query(StorageUnit).filter(StorageUnit.sensor_id == payload.sensor_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail=f"No unit with sensor_id={payload.sensor_id}")

    ts = payload.timestamp or datetime.now(timezone.utc)
    process_reading(db, unit, payload.temperature, ts)
    return {"ok": True, "unit_id": unit.id, "temperature": payload.temperature}


@router.get(
    "/api/units/{unit_id}/readings",
    response_model=List[ReadingOut],
    summary="Get temperature history for a unit",
)
def get_readings(
    unit_id: int,
    hours: int = Query(default=24, ge=1, le=168),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from datetime import timedelta
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    offset = (page - 1) * page_size
    readings = (
        db.query(Reading)
        .filter(Reading.unit_id == unit_id, Reading.timestamp >= since)
        .order_by(Reading.timestamp.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return readings

