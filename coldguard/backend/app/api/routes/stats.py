"""
app/api/routes/stats.py
───────────────────────
GET /api/stats/summary  – dashboard KPI numbers
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.alert import Alert, AlertStatus
from app.models.reading import Reading
from app.models.storage_unit import StorageUnit
from app.models.user import User
from app.services.simulator import simulator_manager

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/summary", summary="Dashboard summary / KPIs")
def get_summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total_units = db.query(StorageUnit).filter(StorageUnit.is_active == True).count()
    active_alerts = (
        db.query(Alert)
        .filter(Alert.status.notin_([AlertStatus.RESOLVED]))
        .count()
    )
    critical_alerts = (
        db.query(Alert)
        .filter(
            Alert.status.notin_([AlertStatus.RESOLVED]),
            Alert.severity == "CRITICAL",
        )
        .count()
    )
    sim_state = simulator_manager.get_state()

    # Units in excursion = units with an active non-resolved temperature alert
    from app.models.alert import AlertType
    units_in_excursion = (
        db.query(Alert.unit_id)
        .filter(Alert.type == AlertType.TEMPERATURE, Alert.status.notin_([AlertStatus.RESOLVED]))
        .distinct()
        .count()
    )

    return {
        "total_units": total_units,
        "active_alerts": active_alerts,
        "critical_alerts": critical_alerts,
        "units_in_excursion": units_in_excursion,
        "simulation_speed": sim_state["speed"],
        "simulation_paused": sim_state["paused"],
        "system_health": max(0, 100 - (active_alerts * 10)),
    }

