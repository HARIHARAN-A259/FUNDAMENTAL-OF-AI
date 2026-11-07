"""app/schemas/setting.py"""
from typing import Optional
from pydantic import BaseModel


class SettingOut(BaseModel):
    id: int
    key: str
    value: str
    description: str

    model_config = {"from_attributes": True}


class SettingUpdate(BaseModel):
    value: str

