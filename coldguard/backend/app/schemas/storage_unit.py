"""app/schemas/storage_unit.py"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.storage_unit import UnitType


class StorageUnitCreate(BaseModel):
    name: str
    type: UnitType = UnitType.FRIDGE
    location: str = ""
    sensor_id: Optional[str] = None
    min_temp: float = 2.0
    max_temp: float = 8.0
    warn_low: float = 2.5
    warn_high: float = 7.5
    critical_min: float = 0.0
    critical_max: float = 10.0


class StorageUnitUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[UnitType] = None
    location: Optional[str] = None
    sensor_id: Optional[str] = None
    min_temp: Optional[float] = None
    max_temp: Optional[float] = None
    warn_low: Optional[float] = None
    warn_high: Optional[float] = None
    critical_min: Optional[float] = None
    critical_max: Optional[float] = None
    is_active: Optional[bool] = None


class StorageUnitOut(BaseModel):
    id: int
    name: str
    type: UnitType
    location: str
    sensor_id: Optional[str]
    is_active: bool
    min_temp: float
    max_temp: float
    warn_low: float
    warn_high: float
    critical_min: float
    critical_max: float
    created_at: datetime

    model_config = {"from_attributes": True}

