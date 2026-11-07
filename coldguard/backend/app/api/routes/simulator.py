"""
app/api/routes/simulator.py
────────────────────────────
Simulator control endpoints – for the demo UI and testing.
POST /api/simulator/inject   – inject a fault scenario
POST /api/simulator/speed    – change simulation speed
POST /api/simulator/reset    – reset all units to normal
GET  /api/simulator/state    – get current simulator state
POST /api/simulator/pause
POST /api/simulator/resume
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.simulator import simulator_manager

router = APIRouter(prefix="/api/simulator", tags=["simulator"])


class InjectRequest(BaseModel):
    unit_id: int
    scenario: str  # normal, door_open, power_failure, sensor_offline, freezer_warming, recover


class SpeedRequest(BaseModel):
    speed: int  # 1-20


VALID_SCENARIOS = {"normal", "door_open", "power_failure", "sensor_offline", "freezer_warming", "recover"}


@router.post("/inject", summary="Inject a fault scenario into a unit")
def inject(
    payload: InjectRequest,
    _: User = Depends(get_current_user),
):
    if payload.scenario not in VALID_SCENARIOS:
        raise HTTPException(status_code=400, detail=f"Unknown scenario. Valid: {VALID_SCENARIOS}")
    simulator_manager.inject(payload.unit_id, payload.scenario)
    return {"ok": True, "unit_id": payload.unit_id, "scenario": payload.scenario}


@router.post("/speed", summary="Change simulation speed (1-20 ticks/second)")
def set_speed(payload: SpeedRequest, _: User = Depends(get_current_user)):
    speed = max(1, min(20, payload.speed))
    simulator_manager.speed = speed
    return {"ok": True, "speed": speed}


@router.post("/reset", summary="Reset all units to normal and clear demo data")
def reset(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    simulator_manager.reset_all()
    # Optionally clear recent readings (keep it simple – just reset simulator state)
    return {"ok": True, "message": "All simulators reset to normal."}


@router.post("/pause", summary="Pause the simulation")
def pause(_: User = Depends(get_current_user)):
    simulator_manager.paused = True
    return {"ok": True, "paused": True}


@router.post("/resume", summary="Resume the simulation")
def resume(_: User = Depends(get_current_user)):
    simulator_manager.paused = False
    return {"ok": True, "paused": False}


@router.get("/state", summary="Get current simulator state")
def get_state(_: User = Depends(get_current_user)):
    return simulator_manager.get_state()

