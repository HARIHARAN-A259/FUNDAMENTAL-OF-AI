"""app/schemas/reading.py"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ReadingCreate(BaseModel):
    unit_id: int
    temperature: float
    timestamp: Optional[datetime] = None


class ReadingIngest(BaseModel):
    """Used by the ESP32 / MQTT sensor ingestion endpoint."""
    sensor_id: str
    temperature: float
    timestamp: Optional[datetime] = None


class ReadingOut(BaseModel):
    id: int
    unit_id: int
    temperature: float
    timestamp: datetime

    model_config = {"from_attributes": True}

