"""
app/api/routes/units.py
───────────────────────
CRUD for storage units.
GET  /api/units
POST /api/units              (admin only)
GET  /api/units/{id}
PUT  /api/units/{id}         (admin only)
DELETE /api/units/{id}       (admin only)
GET  /api/units/{id}/analytics
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from app.api.deps import get_current_user, get_db, require_admin
from app.models.storage_unit import StorageUnit
from app.models.user import User
from app.models.reading import Reading
from app.models.alert import Alert, AlertStatus
from app.schemas.storage_unit import StorageUnitCreate, StorageUnitOut, StorageUnitUpdate
from app.services.mkt import calculate_mkt

router = APIRouter(prefix="/api/units", tags=["units"])


@router.get("", response_model=List[StorageUnitOut], summary="List all storage units")
def list_units(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(StorageUnit).filter(StorageUnit.is_active == True).all()


@router.post("", response_model=StorageUnitOut, status_code=status.HTTP_201_CREATED, summary="Create a new unit (Admin)")
def create_unit(payload: StorageUnitCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    unit = StorageUnit(**payload.model_dump())
    db.add(unit)
    db.commit()
    db.refresh(unit)
    # Register the new unit in the simulator
    from app.services.simulator import simulator_manager
    base = (unit.min_temp + unit.max_temp) / 2
    simulator_manager.register(unit.id, base_temp=base)
    return unit


@router.get("/{unit_id}", response_model=StorageUnitOut, summary="Get one unit by ID")
def get_unit(unit_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    unit = db.query(StorageUnit).filter(StorageUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit


@router.put("/{unit_id}", response_model=StorageUnitOut, summary="Update a unit (Admin)")
def update_unit(unit_id: int, payload: StorageUnitUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    unit = db.query(StorageUnit).filter(StorageUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(unit, field, value)
    db.commit()
    db.refresh(unit)
    return unit


@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a unit (Admin)")
def delete_unit(unit_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    unit = db.query(StorageUnit).filter(StorageUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    unit.is_active = False  # Soft delete
    db.commit()


@router.get("/{unit_id}/analytics", summary="Get analytics for one unit")
def get_analytics(unit_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Returns min, max, avg, MKT, rate-of-change, predictive warning for last 24h."""
    unit = db.query(StorageUnit).filter(StorageUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    since = datetime.now(timezone.utc) - timedelta(hours=24)
    readings = (
        db.query(Reading)
        .filter(Reading.unit_id == unit_id, Reading.timestamp >= since)
        .order_by(Reading.timestamp)
        .all()
    )
    temps = [r.temperature for r in readings]

    # Rate of change over last 5 readings
    cause = ""
    if len(temps) >= 5:
        delta = temps[-1] - temps[-5]
        if delta > 2.0:
            cause = "possible door open"
        elif delta > 0.5:
            cause = "possible power failure"

    # Linear trend: how many minutes until limit is crossed?
    minutes_to_limit: Optional[float] = None
    if len(temps) >= 2:
        slope = (temps[-1] - temps[-2])  # C per tick (1 tick = 1 simulated minute)
        current = temps[-1]
        if slope > 0 and current < unit.max_temp:
            minutes_to_limit = round((unit.max_temp - current) / slope, 1)
        elif slope < 0 and current > unit.min_temp:
            minutes_to_limit = round((unit.min_temp - current) / slope, 1)

    # Active alert for this unit
    active_alert = (
        db.query(Alert)
        .filter(Alert.unit_id == unit_id, Alert.status.notin_([AlertStatus.RESOLVED]))
        .first()
    )

    return {
        "unit_id": unit_id,
        "unit_name": unit.name,
        "readings_count": len(temps),
        "current_temp": temps[-1] if temps else None,
        "min_temp_24h": min(temps) if temps else None,
        "max_temp_24h": max(temps) if temps else None,
        "avg_temp_24h": round(sum(temps) / len(temps), 2) if temps else None,
        "mkt_24h": calculate_mkt(temps),
        "probable_cause": cause,
        "minutes_to_limit": minutes_to_limit,
        "active_alert": active_alert.id if active_alert else None,
        "health_score": _health_score(temps, unit),
    }


def _health_score(temps: list[float], unit: StorageUnit) -> int:
    """Simple 0-100 health score. 100 = all readings in safe range."""
    if not temps:
        return 100
    in_range = sum(1 for t in temps if unit.min_temp <= t <= unit.max_temp)
    return round((in_range / len(temps)) * 100)

